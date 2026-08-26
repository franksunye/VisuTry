#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const docsRoot = resolve(repoRoot, "docs");
const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const strict = args.has("--strict");

const canonicalDocuments = [
  "docs/README.md",
  "docs/document-inventory.md",
  "docs/product/README.md",
  "docs/product/product-plan.md",
  "docs/product/product-system.md",
  "docs/strategy/commercial-strategy.md",
  "docs/strategy/analytics/gtm.md",
  "docs/project/architecture.md",
  "docs/operations/README.md",
  "docs/operations/hosting-strategy-vercel-cloudflare.md",
  "docs/decisions/README.md",
];

const metadataExemptPatterns = [
  /^docs\/archive\//,
  /^docs\/strategy\/archive\//,
  /^docs\/operations\/evidence\//,
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function repoPath(path) {
  return relative(repoRoot, path).split("\\").join("/");
}

function isMetadataExempt(path) {
  return metadataExemptPatterns.some((pattern) => pattern.test(path));
}

function extractMetadata(source) {
  const metadata = {};
  const pattern = /^\*\*(Status|Owner|Last updated|Last reviewed):\*\*\s*(.+?)\s*$/gim;
  for (const match of source.matchAll(pattern)) {
    metadata[match[1].toLowerCase()] = match[2].trim();
  }
  return metadata;
}

function localMarkdownLinks(source, sourcePath) {
  const links = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of source.matchAll(pattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    }
    if (
      !target ||
      target.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:)/i.test(target)
    ) {
      continue;
    }
    target = decodeURIComponent(target.split("#")[0].split("?")[0]);
    const absoluteTarget = target.startsWith("/")
      ? existsSync(target)
        ? target
        : resolve(repoRoot, `.${target}`)
      : resolve(dirname(sourcePath), target);
    links.push({ target: match[1], valid: existsSync(absoluteTarget) });
  }
  return links;
}

const files = walk(docsRoot);
const markdownFiles = files.filter((path) => extname(path).toLowerCase() === ".md");
const totalBytes = files.reduce((sum, path) => sum + statSync(path).size, 0);
const countsByArea = {};
const missingMetadata = [];
const largeMarkdownFiles = [];
const brokenLinks = [];

for (const path of files) {
  const [docs, area = "(root)"] = repoPath(path).split("/");
  const key = docs === "docs" ? area : "(other)";
  countsByArea[key] = (countsByArea[key] ?? 0) + 1;
}

for (const path of markdownFiles) {
  const pathFromRepo = repoPath(path);
  const source = readFileSync(path, "utf8");
  const metadata = extractMetadata(source);

  if (!isMetadataExempt(pathFromRepo)) {
    const missing = ["status", "owner"].filter((field) => !metadata[field]);
    if (missing.length > 0) {
      missingMetadata.push({ path: pathFromRepo, missing });
    }
  }

  const bytes = statSync(path).size;
  if (bytes > 30_000) {
    largeMarkdownFiles.push({ path: pathFromRepo, bytes });
  }

  for (const link of localMarkdownLinks(source, path)) {
    if (!link.valid) {
      brokenLinks.push({
        path: pathFromRepo,
        target: link.target,
        historical: isMetadataExempt(pathFromRepo),
      });
    }
  }
}

const canonicalIssues = [];
for (const pathFromRepo of canonicalDocuments) {
  const path = resolve(repoRoot, pathFromRepo);
  if (!existsSync(path)) {
    canonicalIssues.push({ path: pathFromRepo, issue: "missing file" });
    continue;
  }
  const metadata = extractMetadata(readFileSync(path, "utf8"));
  for (const field of ["status", "owner"]) {
    if (!metadata[field]) {
      canonicalIssues.push({ path: pathFromRepo, issue: `missing ${field}` });
    }
  }
  if (!metadata["last updated"] && !metadata["last reviewed"]) {
    canonicalIssues.push({ path: pathFromRepo, issue: "missing review date" });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    files: files.length,
    markdown: markdownFiles.length,
    bytes: totalBytes,
  },
  countsByArea: Object.fromEntries(
    Object.entries(countsByArea).sort(([, a], [, b]) => b - a),
  ),
  canonicalIssues,
  missingMetadata,
  largeMarkdownFiles: largeMarkdownFiles.sort((a, b) => b.bytes - a.bytes),
  brokenLinks,
};

const actionableBrokenLinks = brokenLinks.filter((link) => !link.historical);

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("VisuTry documentation audit");
  console.log(`Files: ${files.length} (${markdownFiles.length} Markdown)`);
  console.log(`Size: ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`);
  console.log(`Canonical issues: ${canonicalIssues.length}`);
  console.log(`Missing status/owner outside archives and evidence: ${missingMetadata.length}`);
  console.log(`Markdown files over 30 KB: ${largeMarkdownFiles.length}`);
  console.log(
    `Broken local Markdown links: ${actionableBrokenLinks.length} actionable, ${brokenLinks.length - actionableBrokenLinks.length} historical`,
  );

  const sections = [
    ["Canonical issues", canonicalIssues, (item) => `${item.path}: ${item.issue}`],
    [
      "Missing metadata (first 25)",
      missingMetadata.slice(0, 25),
      (item) => `${item.path}: ${item.missing.join(", ")}`,
    ],
    [
      "Large Markdown files",
      largeMarkdownFiles,
      (item) => `${item.path}: ${(item.bytes / 1024).toFixed(1)} KB`,
    ],
    [
      "Broken local links",
      actionableBrokenLinks,
      (item) => `${item.path} -> ${item.target}`,
    ],
  ];

  for (const [title, items, format] of sections) {
    if (items.length === 0) continue;
    console.log(`\n${title}:`);
    for (const item of items) console.log(`- ${format(item)}`);
  }
}

if (strict && (canonicalIssues.length > 0 || actionableBrokenLinks.length > 0)) {
  process.exitCode = 1;
}
