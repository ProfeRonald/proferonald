const origin = process.env.HEALTH_ORIGIN || 'https://proferonald.com';
const failures = [];
for (const [route, expected] of [['/', 200], ['/archivos/', 200], ['/assets/this-file-must-not-exist.js', 404], ['/robots.txt', 200], ['/sitemap.xml', 200]]) {
  try {
    const result = await fetch(new URL(route, origin), { signal: AbortSignal.timeout(15000) });
    if (result.status !== expected || (expected === 200 && !result.headers.get('x-content-type-options'))) failures.push(route);
  } catch { failures.push(route); }
}
if (failures.length) { console.error('Health check failed:', failures.join(', ')); process.exitCode = 1; }
else console.log('Hosting health checks passed.');
