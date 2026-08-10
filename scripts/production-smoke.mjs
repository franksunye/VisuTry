const baseUrl = (process.env.SMOKE_BASE_URL || 'https://www.visutry.com').replace(/\/$/, '');
const routes = [
  { path: '/', expectedPath: '/en' },
  { path: '/en/face-shape-detector' },
  { path: '/en/face-analysis' },
  { path: '/en/try-on/glasses' },
  { path: '/en/try-on/glasses/compare' },
  { path: '/en/store' },
];
const attempts = Number(process.env.SMOKE_ATTEMPTS || 6);
const delayMs = Number(process.env.SMOKE_DELAY_MS || 15000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRoute({ path, expectedPath = path }) {
  const url = `${baseUrl}${path}`;
  const expectedUrl = new URL(`${baseUrl}${expectedPath}`);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'VisuTry-Production-Smoke/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const finalUrl = new URL(response.url);
  if (finalUrl.origin !== expectedUrl.origin || finalUrl.pathname !== expectedUrl.pathname) {
    throw new Error(`${url} resolved to unexpected URL ${response.url}; expected ${expectedUrl.href}`);
  }

  const body = await response.text();
  if (!body || body.length < 100) {
    throw new Error(`${url} returned an unexpectedly small response body`);
  }

  if (/application error|internal server error/i.test(body)) {
    throw new Error(`${url} rendered an application/server error marker`);
  }

  return { status: response.status, finalUrl: response.url };
}

async function run() {
  console.log(`Production smoke target: ${baseUrl}`);

  for (const route of routes) {
    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const result = await checkRoute(route);
        console.log(`✓ ${route.path} -> ${result.status} (${result.finalUrl})`);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${attempts} failed for ${route.path}: ${error.message}`);
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
