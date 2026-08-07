const baseUrl = (process.env.SMOKE_BASE_URL || 'https://www.visutry.com').replace(/\/$/, '');
const routes = ['/', '/en/face-analysis', '/en/try-on', '/en/store'];
const attempts = Number(process.env.SMOKE_ATTEMPTS || 6);
const delayMs = Number(process.env.SMOKE_DELAY_MS || 15000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRoute(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'VisuTry-Production-Smoke/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const body = await response.text();
  if (!body || body.length < 100) {
    throw new Error(`${url} returned an unexpectedly small response body`);
  }

  return response.status;
}

async function run() {
  console.log(`Production smoke target: ${baseUrl}`);

  for (const path of routes) {
    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const status = await checkRoute(path);
        console.log(`✓ ${path} -> ${status}`);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${attempts} failed for ${path}: ${error.message}`);
        if (attempt < attempts) await sleep(delayMs);
      }
    }

    if (lastError) throw lastError;
  }

  console.log('Production smoke passed. No AI generation endpoints were invoked.');
}

run().catch((error) => {
  console.error('Production smoke failed:', error);
  process.exit(1);
});
