import mediaPipeAssets from './lib/mediapipe-assets.cjs'

const checkOnly = process.argv.includes('--check')
const unexpectedArgs = process.argv.slice(2).filter((arg) => arg !== '--check')
if (unexpectedArgs.length > 0) {
  console.error(`Unknown argument: ${unexpectedArgs[0]}`)
  process.exit(2)
}

try {
  const result = checkOnly
    ? await mediaPipeAssets.verifyPinnedMediaPipeAssets()
    : await mediaPipeAssets.ensurePinnedMediaPipeAssets()

  console.log(`MediaPipe ${mediaPipeAssets.MEDIAPIPE_VERSION} cache: ${result.root}`)
  for (const file of result.files) {
    if (file.ok) {
      console.log(`${file.action || 'verified'}\t${file.relativePath}\t${file.bytes} bytes\tsha256=${file.sha256}`)
    } else {
      console.error(`invalid\t${file.relativePath}\t${file.reason}`)
    }
  }

  if (!result.ok && checkOnly) {
    console.error('Run: npm run demo:local:bootstrap')
    process.exitCode = 1
  } else if (!checkOnly) {
    console.log('Pinned MediaPipe assets are ready.')
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
