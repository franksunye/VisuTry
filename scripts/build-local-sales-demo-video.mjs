#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const editPath = path.join(root, 'scripts/lib/local-sales-demo-rough-cut-v1.json')
const outputDirectory = path.join(root, '.local/sales-demo/final')
const sourceDirectory = path.join(root, '.local/sales-demo/final/sources')
const videoPath = path.join(outputDirectory, 'VisuTry_InStore_Retail_Demo_RoughCut_v1.mp4')
const contactSheetPath = path.join(outputDirectory, 'rough-cut-contact-sheet.jpg')
const reportPath = path.join(outputDirectory, 'rough-cut-manifest.json')
const edit = JSON.parse(fs.readFileSync(editPath, 'utf8'))
const force = process.argv.slice(2).includes('--force')

function fail(message) {
  console.error(`Local sales-demo video build refused: ${message}`)
  process.exit(1)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
    throw new Error(`${command} failed${result.status === null ? '' : ` (${result.status})`}${output ? `:\n${output}` : '.'}`)
  }
  return result.stdout || ''
}

function safeSource(relativePath) {
  const resolved = path.resolve(sourceDirectory, relativePath)
  if (!resolved.startsWith(`${sourceDirectory}${path.sep}`)) fail(`source escaped the staged Local media directory: ${relativePath}`)
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) fail(`required source is missing: ${relativePath}`)
  return resolved
}

function probe(filePath) {
  const value = run('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration,size,format_name',
    '-show_entries', 'stream=codec_name,codec_type,width,height,avg_frame_rate',
    '-of', 'json', filePath,
  ])
  return JSON.parse(value)
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

if (process.env.CI || process.env.VERCEL || process.env.VERCEL_ENV) fail('CI/Vercel execution is not allowed; this is a Local artifact build.')
if (process.env.APP_ENV && process.env.APP_ENV !== 'local') fail('APP_ENV must be unset or local.')
if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) fail('a Stripe LIVE key is present in the build environment.')
if (!fs.existsSync(sourceDirectory)) fail('staged sources are missing; place the completed Local capture, approved evidence, and D01/D03/D06 under .local/sales-demo/final/sources/.')
if (!force && [videoPath, contactSheetPath, reportPath].some((filePath) => fs.existsSync(filePath))) {
  fail('an output already exists; inspect it first or pass --force to replace only the three named output files.')
}

const captureManifestPath = safeSource('scenes/scene-manifest.json')
const captureManifest = JSON.parse(fs.readFileSync(captureManifestPath, 'utf8'))
if (captureManifest.environment !== 'LOCAL' || captureManifest.safety?.providerMode !== 'blocked') fail('captured scene manifest is not a Local, Provider-blocked run.')
for (const key of ['grsaiCalls', 'geminiCalls', 'productionDatabase', 'productionAnalytics', 'liveStripeWrites']) {
  if (Number(captureManifest.safety?.[key] ?? 0) !== 0) fail(`captured scene manifest reports non-zero ${key}.`)
}
const providerRunSummary = fs.readFileSync(safeSource('evidence/run-summary.txt'), 'utf8')
if (!providerRunSummary.includes('LOCAL DEMO REAL-PROVIDER SMOKE: PASS')
  || !providerRunSummary.includes('grsai_submissions=2')
  || !providerRunSummary.includes('gemini_submissions=0')
  || !providerRunSummary.includes('final_reset=PASS')) {
  fail('the approved real-provider evidence summary is missing or does not pass the bounded 2/0/reset contract.')
}

if (edit.target.width !== 1920 || edit.target.height !== 1080 || edit.target.videoCodec !== 'h264' || edit.target.audio !== false) {
  fail('the rough-cut edit definition must remain 1920×1080 H.264 with no audio.')
}
if (!Array.isArray(edit.segments) || edit.segments.length < 8 || edit.segments.length > 20) fail('the edit definition has an unexpected segment count.')
const expectedSeconds = edit.segments.reduce((sum, segment) => sum + segment.durationSeconds, 0)
if (expectedSeconds < edit.target.minimumSeconds || expectedSeconds > edit.target.maximumSeconds) fail(`edit duration ${expectedSeconds}s is outside the required 75–100 second range.`)

for (const segment of edit.segments) {
  const source = safeSource(segment.source)
  if (!Number.isFinite(segment.durationSeconds) || segment.durationSeconds <= 0) fail(`invalid duration for ${segment.id}.`)
  if (segment.type === 'video') {
    const media = probe(source)
    const duration = Number(media.format?.duration)
    if (!Number.isFinite(duration) || Number(segment.trimInSeconds || 0) + segment.durationSeconds > duration + 0.08) {
      fail(`video trim exceeds source duration for ${segment.id}.`)
    }
  }
  if (['cover', 'concept'].includes(segment.type) && !segment.disclosure?.toLowerCase().includes('illustrative')) {
    fail(`concept footage ${segment.id} must carry an illustrative disclosure.`)
  }
}

fs.mkdirSync(outputDirectory, { recursive: true })
const scratchDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'visutry-sales-demo-roughcut-'))
let buildSucceeded = false

try {
  const overlayDirectory = path.join(scratchDirectory, 'overlays')
  const segmentDirectory = path.join(scratchDirectory, 'segments')
  fs.mkdirSync(overlayDirectory)
  fs.mkdirSync(segmentDirectory)

  run('swift', [
    path.join(root, 'scripts/render-local-sales-demo-overlays.swift'),
    sourceDirectory,
    editPath,
    overlayDirectory,
  ])

  const segmentOutputs = []
  for (const [index, segment] of edit.segments.entries()) {
    const stagedSource = safeSource(segment.source)
    const compositionPath = path.join(overlayDirectory, `${segment.id}.png`)
    const partPath = path.join(segmentDirectory, `${String(index + 1).padStart(2, '0')}-${segment.id}.mp4`)
    const commonOutput = [
      '-t', String(segment.durationSeconds),
      '-an', '-r', String(edit.target.frameRate),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25',
      '-maxrate', '1800k', '-bufsize', '3600k', '-pix_fmt', 'yuv420p',
      '-profile:v', 'high', '-level:v', '4.1', '-movflags', '+faststart',
      '-y', partPath,
    ]

    if (segment.type === 'video') {
      const filter = '[0:v]setpts=PTS-STARTPTS,scale=1600:900:flags=lanczos,setsar=1,fps=30,format=rgba[clip];'
        + '[2:v][clip]overlay=160:90:shortest=1[plate];'
        + '[plate][1:v]overlay=0:0:shortest=1,format=yuv420p[outv]'
      run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error',
        '-ss', String(segment.trimInSeconds || 0), '-i', stagedSource,
        '-loop', '1', '-framerate', '30', '-i', compositionPath,
        '-f', 'lavfi', '-i', `color=c=0xf4f6fa:s=1920x1080:r=30:d=${segment.durationSeconds}`,
        '-filter_complex', filter, '-map', '[outv]', ...commonOutput,
      ])
    } else {
      run('ffmpeg', [
        '-hide_banner', '-loglevel', 'error',
        '-loop', '1', '-framerate', '30', '-i', compositionPath,
        '-vf', 'fps=30,format=yuv420p', ...commonOutput,
      ])
    }
    segmentOutputs.push(partPath)
    console.log(`Rendered ${segment.id} (${segment.durationSeconds}s)`)
  }

  const concatPath = path.join(scratchDirectory, 'concat.txt')
  fs.writeFileSync(concatPath, `${segmentOutputs.map((filePath) => `file '${filePath.replaceAll("'", "'\\''")}'`).join('\n')}\n`)
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath,
    '-map', '0:v:0', '-c', 'copy', '-an', '-movflags', '+faststart', '-y', videoPath,
  ])

  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', videoPath,
    '-vf', "select='eq(n,0)+eq(n,240)+eq(n,540)+eq(n,900)+eq(n,1200)+eq(n,1500)+eq(n,1860)+eq(n,2190)+eq(n,2400)+eq(n,2580)',setpts=N/FRAME_RATE/TB,scale=640:360:force_original_aspect_ratio=decrease:flags=lanczos,pad=640:360:(ow-iw)/2:(oh-ih)/2,setsar=1,tile=5x2:margin=16:padding=8:color=0xf4f6fa",
    '-frames:v', '1', '-q:v', '3', '-y', contactSheetPath,
  ])

  const metadata = probe(videoPath)
  const stream = metadata.streams?.find((candidate) => candidate.codec_type === 'video')
  const durationSeconds = Number(metadata.format?.duration)
  const outputSizeBytes = fs.statSync(videoPath).size
  if (stream?.codec_name !== 'h264' || stream.width !== 1920 || stream.height !== 1080) fail('encoded output does not meet H.264 1920×1080 requirements.')
  if (metadata.streams?.some((candidate) => candidate.codec_type === 'audio')) fail('unexpected audio track found in output.')
  if (!Number.isFinite(durationSeconds) || durationSeconds < edit.target.minimumSeconds || durationSeconds > edit.target.maximumSeconds) {
    fail(`encoded duration ${durationSeconds}s is outside the required 75–100 second range.`)
  }

  const blackCheck = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'info', '-i', videoPath,
    '-vf', 'blackdetect=d=0.18:pix_th=0.10:pic_th=0.98', '-an', '-f', 'null', '-',
  ], { cwd: root, encoding: 'utf8' })
  const blackOutput = `${blackCheck.stdout || ''}${blackCheck.stderr || ''}`
  if (blackCheck.status !== 0) throw new Error(`ffmpeg black-frame QA failed:\n${blackOutput}`)
  const detectedBlackIntervals = [...blackOutput.matchAll(/black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/g)]
    .map((match) => ({ startSeconds: Number(match[1]), endSeconds: Number(match[2]), durationSeconds: Number(match[3]) }))
  if (detectedBlackIntervals.some((interval) => interval.durationSeconds >= 0.18)) {
    throw new Error(`unexpected black interval(s) detected: ${JSON.stringify(detectedBlackIntervals)}`)
  }

  let cursor = 0
  const timeline = edit.segments.map((segment) => {
    const source = safeSource(segment.source)
    const sourceProbe = probe(source)
    const item = {
      ...segment,
      startSeconds: Number(cursor.toFixed(3)),
      endSeconds: Number((cursor + segment.durationSeconds).toFixed(3)),
      sourceSha256: sha256(source),
      sourceBytes: fs.statSync(source).size,
      sourceDimensions: sourceProbe.streams?.find((candidate) => candidate.width && candidate.height)
        ? `${sourceProbe.streams.find((candidate) => candidate.width && candidate.height).width}x${sourceProbe.streams.find((candidate) => candidate.width && candidate.height).height}`
        : null,
    }
    cursor += segment.durationSeconds
    return item
  })

  const report = {
    title: edit.title,
    createdAt: new Date().toISOString(),
    environment: 'LOCAL',
    sourceDirectory: path.relative(root, sourceDirectory),
    capturedSceneRunId: captureManifest.runId,
    realProviderEvidence: {
      sourceRunId: '20260928-233715-10265',
      sourceRunSummary: 'evidence/run-summary.txt',
      providerCalls: { grsai: 2, gemini: 0 },
      productionOrPreviewAccess: 0,
      finalReset: 'PASS',
      additionalProviderCallsDuringEditing: 0,
    },
    target: edit.target,
    final: {
      file: path.relative(root, videoPath),
      durationSeconds: Number(durationSeconds.toFixed(3)),
      width: stream.width,
      height: stream.height,
      videoCodec: stream.codec_name,
      frameRate: stream.avg_frame_rate,
      audioTrack: false,
      outputSizeBytes,
      underPreferred20Mb: outputSizeBytes < edit.target.preferredMaximumBytes,
      faststart: true,
      sha256: sha256(videoPath),
    },
    contactSheet: path.relative(root, contactSheetPath),
    qa: {
      decodedByFfprobe: true,
      blackIntervalsOverThreshold: detectedBlackIntervals,
      sourceCaptureBrowserErrors: captureManifest.verification?.browser?.errors ?? null,
      sourceCapture404s: captureManifest.verification?.browser?.notFound ?? null,
      sourceCaptureServerErrors: captureManifest.verification?.browser?.serverErrors ?? null,
      visualReview: 'See contact sheet and inspect the delivered MP4; no new application/browser run was performed.',
    },
    visualCompromises: [
      'The validated Compare evidence is retained as its original 1024×768 viewport; the comparison panel begins near the lower edge, so the capture shows its real context rather than a fabricated or recomposed UI.',
      'The validated mobile continuation remains at its native 390×844 pixel dimensions in a phone-scale inset, as required.',
    ],
    timeline,
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: force ? 'w' : 'wx' })
  buildSucceeded = true

  console.log('\nROUGH CUT BUILD: PASS')
  console.log(`video: ${path.relative(root, videoPath)}`)
  console.log(`duration: ${report.final.durationSeconds}s`)
  console.log(`size: ${(outputSizeBytes / 1024 / 1024).toFixed(2)} MiB${report.final.underPreferred20Mb ? '' : ' (above preferred 20 MiB)'}`)
  console.log(`codec: ${stream.codec_name} ${stream.width}x${stream.height} ${stream.avg_frame_rate}, silent`)
  console.log(`contact sheet: ${path.relative(root, contactSheetPath)}`)
  console.log(`manifest: ${path.relative(root, reportPath)}`)
} finally {
  fs.rmSync(scratchDirectory, { recursive: true, force: true })
  if (!buildSucceeded) {
    // Preserve partial named review outputs for diagnosis rather than deleting unexpectedly.
    console.error(`Build did not complete. Inspect scratch was cleaned; partial final outputs, if any, were preserved at ${path.relative(root, outputDirectory)}.`)
  }
}
