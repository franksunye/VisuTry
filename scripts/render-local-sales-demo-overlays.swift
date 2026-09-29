import AppKit
import Foundation

struct Segment: Decodable {
    let id: String
    let type: String
    let source: String
    let title: String?
    let subtitle: String?
    let disclosure: String?
}

struct EditManifest: Decodable {
    let segments: [Segment]
}

guard CommandLine.arguments.count == 4 else {
    fputs("usage: swift render-local-sales-demo-overlays.swift <source-dir> <edit-manifest.json> <output-dir>\n", stderr)
    exit(2)
}

let sourceRoot = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let editURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputRoot = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
let edit = try JSONDecoder().decode(EditManifest.self, from: Data(contentsOf: editURL))
let canvasSize = NSSize(width: 1920, height: 1080)

func color(_ hex: UInt32, alpha: CGFloat = 1) -> NSColor {
    NSColor(
        calibratedRed: CGFloat((hex >> 16) & 0xff) / 255,
        green: CGFloat((hex >> 8) & 0xff) / 255,
        blue: CGFloat(hex & 0xff) / 255,
        alpha: alpha
    )
}

func font(_ size: CGFloat, weight: NSFont.Weight = .regular) -> NSFont {
    NSFont.systemFont(ofSize: size, weight: weight)
}

func drawText(
    _ value: String,
    in rect: NSRect,
    size: CGFloat,
    weight: NSFont.Weight = .regular,
    tint: NSColor = color(0x101828),
    alignment: NSTextAlignment = .left
) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    paragraph.lineBreakMode = .byWordWrapping
    let attributes: [NSAttributedString.Key: Any] = [
        .font: font(size, weight: weight),
        .foregroundColor: tint,
        .paragraphStyle: paragraph,
    ]
    (value as NSString).draw(in: rect, withAttributes: attributes)
}

func fill(_ rect: NSRect, tint: NSColor, radius: CGFloat = 0) {
    tint.setFill()
    let path = radius > 0
        ? NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
        : NSBezierPath(rect: rect)
    path.fill()
}

func drawImage(_ path: URL, in rect: NSRect) throws {
    guard let image = NSImage(contentsOf: path) else {
        throw NSError(domain: "VisuTryRoughCut", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot load image: \(path.path)"])
    }
    image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: false, hints: [.interpolation: NSImageInterpolation.high])
}

func aspectFit(_ imageURL: URL, in bounds: NSRect) throws -> NSRect {
    guard let image = NSImage(contentsOf: imageURL) else {
        throw NSError(domain: "VisuTryRoughCut", code: 2, userInfo: [NSLocalizedDescriptionKey: "Cannot load image: \(imageURL.path)"])
    }
    let scale = min(bounds.width / image.size.width, bounds.height / image.size.height)
    let size = NSSize(width: image.size.width * scale, height: image.size.height * scale)
    return NSRect(x: bounds.midX - size.width / 2, y: bounds.midY - size.height / 2, width: size.width, height: size.height)
}

func writeCanvas(named name: String, drawContent: () throws -> Void) throws {
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: Int(canvasSize.width),
        pixelsHigh: Int(canvasSize.height),
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ), let graphics = NSGraphicsContext(bitmapImageRep: bitmap) else {
        throw NSError(domain: "VisuTryRoughCut", code: 3, userInfo: [NSLocalizedDescriptionKey: "Cannot allocate overlay bitmap."])
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    graphics.imageInterpolation = .high
    NSColor.clear.setFill()
    NSRect(origin: .zero, size: canvasSize).fill()
    try drawContent()
    graphics.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()

    guard let png = bitmap.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "VisuTryRoughCut", code: 4, userInfo: [NSLocalizedDescriptionKey: "Cannot encode overlay PNG."])
    }
    try png.write(to: outputRoot.appendingPathComponent(name), options: .atomic)
}

func drawBrandKicker() {
    drawText("VISUTRY  /  IN-STORE", in: NSRect(x: 112, y: 784, width: 500, height: 26), size: 17, weight: .semibold, tint: color(0x3156d9))
}

func drawEvidenceText(_ segment: Segment) {
    drawBrandKicker()
    fill(NSRect(x: 112, y: 738, width: 62, height: 5), tint: color(0x3156d9), radius: 2)
    if let title = segment.title {
        drawText(title, in: NSRect(x: 112, y: 540, width: 500, height: 174), size: 48, weight: .semibold, tint: color(0x0b1020))
    }
    if let subtitle = segment.subtitle {
        drawText(subtitle, in: NSRect(x: 112, y: 382, width: 486, height: 126), size: 26, tint: color(0x49566b))
    }
    if let disclosure = segment.disclosure {
        drawText(disclosure, in: NSRect(x: 112, y: 236, width: 500, height: 66), size: 17, weight: .medium, tint: color(0x667085))
    }
}

for segment in edit.segments {
    let source = sourceRoot.appendingPathComponent(segment.source)
    try writeCanvas(named: "\(segment.id).png") {
        switch segment.type {
        case "video":
            // This transparent title strip sits entirely in the letterbox band above the captured viewport.
            fill(NSRect(x: 160, y: 998, width: 780, height: 70), tint: color(0xffffff, alpha: 0.92), radius: 15)
            fill(NSRect(x: 180, y: 1014, width: 5, height: 38), tint: color(0x3156d9), radius: 2)
            if let title = segment.title {
                drawText(title, in: NSRect(x: 202, y: 1030, width: 710, height: 31), size: 24, weight: .semibold, tint: color(0x101828))
            }
            if let subtitle = segment.subtitle {
                drawText(subtitle, in: NSRect(x: 202, y: 1007, width: 710, height: 24), size: 16, tint: color(0x475467))
            }
        case "cover":
            fill(NSRect(origin: .zero, size: canvasSize), tint: color(0xf4f6fa))
            try drawImage(source, in: try aspectFit(source, in: NSRect(x: 180, y: 0, width: 1560, height: 1080)))
            fill(NSRect(x: 72, y: 80, width: 812, height: 338), tint: color(0xffffff, alpha: 0.94), radius: 22)
            drawText("VISUTRY", in: NSRect(x: 112, y: 365, width: 260, height: 28), size: 18, weight: .bold, tint: color(0x3156d9))
            if let title = segment.title {
                drawText(title, in: NSRect(x: 112, y: 174, width: 720, height: 164), size: 45, weight: .semibold, tint: color(0x0b1020))
            }
            if let disclosure = segment.disclosure {
                drawText(disclosure, in: NSRect(x: 112, y: 112, width: 650, height: 30), size: 17, weight: .medium, tint: color(0x667085))
            }
        case "evidence":
            fill(NSRect(origin: .zero, size: canvasSize), tint: color(0xf4f6fa))
            try drawImage(source, in: NSRect(x: 690, y: 96, width: 1180, height: 885))
            drawEvidenceText(segment)
        case "mobile":
            fill(NSRect(origin: .zero, size: canvasSize), tint: color(0xf4f6fa))
            // Keep the validated 390×844 mobile capture at its native pixel dimensions; no device shell is added.
            try drawImage(source, in: NSRect(x: 1110, y: 118, width: 390, height: 844))
            drawEvidenceText(segment)
        case "concept":
            fill(NSRect(origin: .zero, size: canvasSize), tint: color(0xf4f6fa))
            try drawImage(source, in: try aspectFit(source, in: NSRect(x: 160, y: 30, width: 1600, height: 1020)))
            if let disclosure = segment.disclosure {
                fill(NSRect(x: 1300, y: 44, width: 530, height: 48), tint: color(0xffffff, alpha: 0.92), radius: 14)
                drawText(disclosure, in: NSRect(x: 1320, y: 56, width: 495, height: 24), size: 17, weight: .medium, tint: color(0x475467))
            }
        case "close":
            fill(NSRect(origin: .zero, size: canvasSize), tint: color(0xffffff))
            try drawImage(source, in: NSRect(x: 270, y: 472, width: 132, height: 132))
            drawText("VisuTry", in: NSRect(x: 432, y: 500, width: 650, height: 92), size: 58, weight: .semibold, tint: color(0x0b1020))
            fill(NSRect(x: 270, y: 430, width: 82, height: 5), tint: color(0x3156d9), radius: 2)
            if let title = segment.title {
                drawText(title, in: NSRect(x: 270, y: 250, width: 1370, height: 155), size: 48, weight: .semibold, tint: color(0x0b1020))
            }
            if let subtitle = segment.subtitle {
                drawText(subtitle, in: NSRect(x: 270, y: 174, width: 1180, height: 50), size: 28, tint: color(0x475467))
            }
        default:
            throw NSError(domain: "VisuTryRoughCut", code: 5, userInfo: [NSLocalizedDescriptionKey: "Unsupported segment type: \(segment.type)"])
        }
    }
}

print("Rendered \(edit.segments.count) local rough-cut overlays at \(outputRoot.path)")
