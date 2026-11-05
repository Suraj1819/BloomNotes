// server/src/utils/diagnostics.js
// Run once on startup to verify Supabase connectivity.
// Usage: node src/utils/diagnostics.js
import { env } from '../config/env.js';
import { logger } from './logger.js';

async function main() {
  console.log('======================================================');
  console.log(' BloomNotes Supabase Diagnostics');
  console.log('======================================================\n');

  // 1. Check env vars
  console.log('1. Environment variables:');
  console.log('   SUPABASE_URL           :', env.SUPABASE_URL);
  console.log('   SUPABASE_ANON_KEY      :', env.SUPABASE_ANON_KEY ? `${env.SUPABASE_ANON_KEY.slice(0, 12)}…` : 'MISSING');
  console.log('   SUPABASE_SERVICE_ROLE  :', env.SUPABASE_SERVICE_ROLE_KEY ? `${env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 12)}…` : 'MISSING');
  console.log('   SUPABASE_JWT_SECRET    :', process.env.SUPABASE_JWT_SECRET ? `${process.env.SUPABASE_JWT_SECRET.slice(0, 8)}… (${process.env.SUPABASE_JWT_SECRET.length} chars)` : 'NOT SET (will use slow network auth)');
  if (!process.env.SUPABASE_JWT_SECRET) {
    console.log('   ⚠️  For ~100x faster auth, set SUPABASE_JWT_SECRET (Dashboard > Settings > API > JWT Secret)');
  }

  const isPlaceholder = env.SUPABASE_URL.includes('your-project') || env.SUPABASE_URL.includes('placeholder');
  if (isPlaceholder) {
    console.log('\n❌ SUPABASE_URL is still a placeholder. Edit server/.env first.\n');
    process.exit(1);
  }

  // 2. DNS check
  console.log('\n2. DNS resolution:');
  const hostname = new URL(env.SUPABASE_URL).hostname;
  console.log('   Hostname:', hostname);
  try {
    const dns = await import('node:dns/promises');
    const addrs = await dns.lookup(hostname, { all: true });
    console.log('   Resolved addresses:', addrs.map((a) => a.address).join(', '));
  } catch (e) {
    console.log('❌ DNS lookup failed:', e.message);
    console.log('   → Check your DNS / VPN / firewall settings.');
  }

  // 3. HTTPS reachability
  console.log('\n3. HTTPS reachability:');
  const restUrl = `${env.SUPABASE_URL}/rest/v1/`;
  const authUrl = `${env.SUPABASE_URL}/auth/v1/health`;

  for (const [label, url] of [['REST', restUrl], ['Auth', authUrl]]) {
    try {
      const start = Date.now();
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      const ms = Date.now() - start;
      console.log(`   ${label} ${url} → HTTP ${res.status} in ${ms}ms`);
    } catch (e) {
      const cause = e?.cause?.code || e?.cause?.hostname || e.message;
      console.log(`❌ ${label} ${url} → fetch failed: ${cause}`);
    }
  }

  // 4. Auth health (should be { name: '...', version: '...' })
  console.log('\n4. Auth service health:');
  try {
    const res = await fetch(authUrl, { signal: AbortSignal.timeout(8000) });
    const body = await res.json();
    console.log('   ', JSON.stringify(body));
  } catch (e) {
    console.log('❌ Could not fetch auth health:', e.message);
  }

  // 5. REST with anon key
  console.log('\n5. REST API (with anon key, expect 401 from supabase internals or empty array):');
  try {
    const res = await fetch(restUrl, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    console.log('   HTTP', res.status);
    const text = await res.text();
    console.log('   Body:', text.slice(0, 200));
  } catch (e) {
    console.log('❌ REST call failed:', e.message);
  }

  console.log('\n======================================================');
  console.log(' Diagnostics complete.');
  console.log('======================================================');
}

main().catch((e) => { console.error('diagnostics crashed:', e); process.exit(1); });


  // 6. Latency benchmark — 5 sequential REST calls to measure typical RTT.
  console.log('\n6. Latency benchmark (5 sequential auth/health calls):');
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    try {
      await fetch(authUrl, { signal: AbortSignal.timeout(8000) });
      samples.push(Date.now() - start);
    } catch { /* ignore */ }
  }
  if (samples.length) {
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    console.log(`   samples: [${samples.join(', ')}] ms`);
    console.log(`   min=${min}ms  avg=${avg}ms  max=${max}ms`);
    if (avg > 250) {
      console.log('   ⚠️  Supabase latency is high (>250ms).');
      console.log('      → Your project region is probably far from this server.');
      console.log('      → For India users, create a new Supabase project in "Mumbai" or "Singapore".');
      console.log('      → Or deploy this backend to the same region as your Supabase project.');
    } else if (avg > 100) {
      console.log('   ⚠️  Moderate latency (100-250ms). Acceptable but not ideal.');
    } else {
      console.log('   ✅ Latency looks good (<100ms).');
    }
  }
