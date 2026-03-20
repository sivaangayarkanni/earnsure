#!/usr/bin/env node
/**
 * EarnSure API Test Script
 * Tests all endpoints to verify the system works
 */

const BASE = process.env.API_URL || 'http://localhost:3001';

async function testEndpoint(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const res = await fetch(`${BASE}${path}`, options);
    const data = await res.json();
    console.log(`✅ ${method} ${path}:`, res.status === 200 || res.status === 201 ? 'OK' : res.status);
    return { ok: res.ok, data };
  } catch (e) {
    console.log(`❌ ${method} ${path}:`, e.message);
    return { ok: false, error: e.message };
  }
}

async function runTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          EarnSure API Test Suite                        ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Test health
  await testEndpoint('GET', '/health');
  
  // Test weather
  await testEndpoint('POST', '/mcp/weather', { city: 'Mumbai' });
  
  // Test risk prediction
  await testEndpoint('POST', '/mcp/risk', { 
    city: 'Mumbai', 
    rain_probability: 0.5, 
    AQI: 120, 
    temperature: 32 
  });

  // Test zones
  await testEndpoint('POST', '/mcp/zones', { city: 'Bengaluru', limit: 3 });

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          Test Complete                                   ║
╚═══════════════════════════════════════════════════════════╝
`);

  console.log(`
To test the full flow:
1. Register a worker: POST /auth/register
2. Login with OTP: POST /auth/otp/send then /auth/otp/verify
3. Create claim: POST /claims/trigger
4. Run orchestration: POST /mcp/orchestrate
`);
}

runTests();
