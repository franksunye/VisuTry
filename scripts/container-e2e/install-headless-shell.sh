#!/usr/bin/env bash
set -euo pipefail

# The upstream Playwright CDN sometimes returns an HTML placeholder for the
# Chromium ZIP in constrained execution environments. Use the version recorded
# by the repository's own Playwright installation, from Google's official
# Chrome for Testing artifact source.
[[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || {
  echo 'Container headless-shell bootstrap currently supports Linux x86_64 only.' >&2
  exit 1
}

read -r browser_revision browser_version < <(node -e '
  const browsers = require("./node_modules/playwright-core/browsers.json").browsers;
  const browser = browsers.find((entry) => entry.name === "chromium-headless-shell");
  if (!browser) process.exit(1);
  console.log(browser.revision, browser.browserVersion);
')

: "${PLAYWRIGHT_BROWSERS_PATH:?Set an isolated Playwright browser cache directory}"
binary="$PLAYWRIGHT_BROWSERS_PATH/chromium_headless_shell-$browser_revision/chrome-headless-shell-linux64/chrome-headless-shell"

# A persisted container cache may lose the executable bit; repair it before
# downloading the same browser archive again.
if [[ -f "$binary" && ! -x "$binary" ]]; then
  chmod u+x "$binary"
fi

if [[ ! -x "$binary" ]]; then
  install_dir="$(dirname "$(dirname "$binary")")"
  mkdir -p "$install_dir"
  archive="$install_dir/headless-shell-$browser_version.zip"
  url="https://storage.googleapis.com/chrome-for-testing-public/$browser_version/linux64/chrome-headless-shell-linux64.zip"
  echo "Downloading Chrome Headless Shell $browser_version from the official Chrome for Testing source"
  curl --fail --location --retry 2 --connect-timeout 20 --max-time 240 --output "$archive" "$url"
  unzip -t "$archive" >/dev/null
  unzip -oq "$archive" -d "$install_dir"
  chmod u+x "$binary"
  rm -- "$archive"
fi

# Assert the actual browser can launch, not merely that its binary exists.
node -e '
  const { chromium } = require("playwright");
  (async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("data:text/html,<title>Ready</title><h1>Browser ready</h1>");
    if (await page.title() !== "Ready") throw new Error("Headless DOM smoke failed");
    console.log("CONTAINER_E2E_HEADLESS_READY=" + browser.version());
    await browser.close();
  })().catch((error) => { console.error(error); process.exitCode = 1 });
'
