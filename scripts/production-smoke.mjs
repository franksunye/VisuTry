const baseUrl = (process.env.SMOKE_BASE_URL || 'https://www.visutry.com').replace(/\/$/, '');

// Next frontend pages that MUST be served by Vercel (the sole Next frontend owner).
// Each page's referenced /_next/static/*.{js,css} assets must all return 200 from the
// same origin — never a Cloudflare Worker (which would serve a peer client graph).
const nextHtmlRoutes = [
  { path: '/', expectedPath: '/en' },
  { path: '/en' },
  { path: '/en/glasses-guide' },
  { path: '/en/glasses-guide/best-rectangle-glasses-for-round-face' },
  { path: '/en/face-analysis', bodyMarker: /AI Glasses Advisor/i },
  { path: '/en/store' },
];

// RSC / Flight navigation is part of the Next client graph and must also be Vercel-owned.
const rscRoutes = [
  '/en',
  '/en/glasses-guide/best-rectangle-glasses-for-round-face',
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
const userAgent = 'VisuTry-Production-Smoke/2.0';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The Cloudflare Worker annotates responses it owns. Vercel-owned responses must
// NOT carry a Cloudflare Worker ownership header. Vercel origin evidence
// (x-vercel-id / x-vercel-cache) confirms the Next frontend owner.
function assertVercelOwnership(headers, label) {
  const routerBackend = headers.get('x-visutry-router-backend');
  if (routerBackend === 'cloudflare') {
    throw new Error(`${label}: Cloudflare Worker ownership header present (x-visutry-router-backend: cloudflare)`);
  }
  const routerLayer = headers.get('x-visutry-router-layer');
  if (routerLayer === 'layer1-static-asset') {
    throw new Error(`${label}: Cloudflare static-asset ownership header present (x-visutry-router-layer: layer1-static-asset)`);
  }
  const hasVercelEvidence =
    routerBackend === 'vercel' ||
    headers.get('x-vercel-id') != null ||
    headers.get('x-vercel-cache') != null ||
    /vercel/i.test(headers.get('server') || '');
  if (!hasVercelEvidence) {
    throw new Error(`${label}: no Vercel origin evidence (expected x-vercel-id / x-vercel-cache or x-visutry-router-backend: vercel)`);
  }
}

function extractNextStaticAssets(text) {
  const matches = text.match(/\/_next\/static\/[^"'`)\s\\]+\.(?:js|css)/g) || [];
  return [...new Set(matches)];
}

async function verifyAsset(assetPath, label) {
  const url = `${baseUrl}${assetPath}`;
  const response = await fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': userAgent },
  });
  if (response.status !== 200) {
    throw new Error(`${label}: asset ${assetPath} returned ${response.status} (expected 200)`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (/text\/html/i.test(contentType)) {
    throw new Error(`${label}: asset ${assetPath} returned HTML content-type "${contentType}" (soft 404 / wrong owner)`);
  }
  assertVercelOwnership(response.headers, `${label} asset ${assetPath}`);
}

async function checkNextHtmlAndAssets({ path, expectedPath = path, bodyMarker }) {
  const url = `${baseUrl}${path}`;
  const expectedUrl = new URL(`${baseUrl}${expectedPath}`);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': userAgent },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const finalUrl = new URL(response.url);
  if (finalUrl.origin !== expectedUrl.origin || finalUrl.pathname !== expectedUrl.pathname) {
    throw new Error(`${url} resolved to unexpected URL ${response.url}; expected ${expectedUrl.href}`);
  }

  // 1) Next HTML must be Vercel-owned.
  assertVercelOwnership(response.headers, `HTML ${path}`);

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

  // 2) Every referenced /_next/static asset must be 200 + non-HTML + Vercel-owned.
  const assets = extractNextStaticAssets(body);
  if (assets.length === 0) {
    throw new Error(`${url} referenced no /_next/static assets; Next HTML is expected to load a client graph`);
  }
  for (const assetPath of assets) {
    await verifyAsset(assetPath, `HTML ${path}`);
  }

  return { status: response.status, finalUrl: response.url, assetCount: assets.length };
}

async function checkRscOwnership(path) {
  const url = `${baseUrl}${path}?_rsc=smoke`;
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': userAgent,
      RSC: '1',
      'Next-Router-Prefetch': '1',
      accept: 'text/x-component',
    },
  });

  if (!response.ok) {
    throw new Error(`RSC ${url} returned ${response.status}`);
  }
  // RSC / Flight must be Vercel-owned.
  assertVercelOwnership(response.headers, `RSC ${path}`);

  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  // Flight payloads use text/x-component; be lenient but reject an HTML error page.
  if (/application error|internal server error/i.test(body)) {
    throw new Error(`RSC ${url} rendered an application/server error marker`);
  }

  // Any /_next/static assets referenced by the flight payload must resolve.
  for (const assetPath of extractNextStaticAssets(body)) {
    await verifyAsset(assetPath, `RSC ${path}`);
  }

  return { status: response.status, finalUrl: url, contentType };
}

async function checkProtectedApi({ path, init, expectedStatus, label }) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
    headers: {
      'user-agent': userAgent,
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
      const extra = result.assetCount != null ? ` (${result.assetCount} assets 200)` : result.finalUrl ? ` (${result.finalUrl})` : '';
      console.log(`✓ ${label} -> ${result.status}${extra}`);
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
  console.log('Next frontend owner: Vercel. Asset 404 or Cloudflare ownership of Next HTML/static/RSC fails the release.');

  for (const route of nextHtmlRoutes) {
    await retry(`HTML+assets ${route.path}`, () => checkNextHtmlAndAssets(route));
  }

  for (const path of rscRoutes) {
    await retry(`RSC ${path}`, () => checkRscOwnership(path));
  }

  for (const check of protectedApiChecks) {
    await retry(check.label, () => checkProtectedApi(check));
  }

  console.log(
    'Production smoke passed. All Next HTML + /_next/static + RSC are Vercel-owned with 200 assets; unauthenticated guards verified; no authenticated AI generation, credit deduction, or Stripe checkout was invoked.',
  );
}

run().catch((error) => {
  console.error('Production smoke failed:', error);
  process.exit(1);
});
