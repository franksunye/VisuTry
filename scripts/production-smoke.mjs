const baseUrl = (process.env.SMOKE_BASE_URL || 'https://www.visutry.com').replace(/\/$/, '');
const routes = [
  { path: '/', expectedPath: '/en' },
  { path: '/en/face-shape-detector', bodyMarker: /Face Shape/i },
  { path: '/en/face-analysis', bodyMarker: /AI Glasses Advisor/i },
  { path: '/en/try-on/glasses' },
  { path: '/en/try-on/glasses/compare' },
  { path: '/en/store' },
];
const protectedApiChecks = [
  {
    path: '/api/face-analysis/submit',
    init: { method: 'POST', body: new FormData() },
    expectedStatus: 401,
    label: 'Face Analysis submit auth guard',
  },
  {
    path: '/api/payment/create-session',
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    },
    expectedStatus: 401,
    label: 'payment checkout auth guard',
  },
];
const attempts = Number(process.env.SMOKE_ATTEMPTS || 6);
const delayMs = Number(process.env.SMOKE_DELAY_MS || 15000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkRoute({ path, expectedPath = path, bodyMarker }) {
  const url = `${baseUrl}${path}`;
  const expectedUrl = new URL(`${baseUrl}${expectedPath}`);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'VisuTry-Production-Smoke/1.1',
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

  if (bodyMarker && !bodyMarker.test(body)) {
    throw new Error(`${url} did not contain its expected product marker`);
  }

  return { status: response.status, finalUrl: response.url };
}

async function checkProtectedApi({ path, init, expectedStatus, label }) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
    headers: {
      'user-agent': 'VisuTry-Production-Smoke/1.1',
      ...(init.headers || {}),
    },
  });

  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `${label} expected HTTP ${expectedStatus}, got ${response.status}: ${body.slice(0, 200)}`,
    );
  }

  return { status: response.status };
}

async function retry(label, check) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await check();
      console.log(`✓ ${label} -> ${result.status}${result.finalUrl ? ` (${result.finalUrl})` : ''}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${attempts} failed for ${label}: ${error.message}`);
      if (attempt < attempts) await sleep(delayMs);
    }
  }

  throw lastError;
}

async function run() {
  console.log(`Production smoke target: ${baseUrl}`);

  for (const route of routes) {
    await retry(route.path, () => checkRoute(route));
  }

  for (const check of protectedApiChecks) {
    await retry(check.label, () => checkProtectedApi(check));
  }

  console.log(
    'Production smoke passed. Critical unauthenticated guards were verified; no authenticated AI generation, credit deduction, or Stripe checkout was invoked.',
  );
}

run().catch((error) => {
  console.error('Production smoke failed:', error);
  process.exit(1);
});
