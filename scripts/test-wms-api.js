/**
 * WMS API Test Script
 * Tests the Social Commerce Orders API endpoint
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.WMS_API_KEY;
const BASE_URL = 'https://wms-api.sinergisuperapp.com';
const ENDPOINT = '/v1/open/social-commerce/orders';

function makeRequest(params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      length: params.length || 3,
      ...params
    });

    const url = `${BASE_URL}${ENDPOINT}?${queryParams}`;
    console.log(`\n📡 REQUEST: GET ${url}\n`);

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('WMS Social Commerce Orders API - Test Suite');
  console.log('='.repeat(80));
  console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);

  // Test 1: Basic request (page=1, length=3)
  console.log('\n' + '─'.repeat(80));
  console.log('TEST 1: Basic request (page=1, length=3)');
  console.log('─'.repeat(80));
  try {
    const res = await makeRequest({ page: 1, length: 3 });
    console.log(`✅ Status: ${res.status}`);
    console.log(`📊 Metadata:`, JSON.stringify(res.body.metadata, null, 2));
    console.log(`📦 Records returned: ${res.body.data?.length || 0}`);
    if (res.body.data && res.body.data.length > 0) {
      console.log(`\n📋 First record fields:`, Object.keys(res.body.data[0]).join(', '));
      console.log(`\n📋 First record (full):`);
      console.log(JSON.stringify(res.body.data[0], null, 2));
    }
    // Save full response
    fs.writeFileSync(
      'scripts/test-wms-response-basic.json',
      JSON.stringify(res.body, null, 2)
    );
    console.log('\n💾 Full response saved to scripts/test-wms-response-basic.json');
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }

  // Test 2: With status filter
  console.log('\n' + '─'.repeat(80));
  console.log('TEST 2: With status filter (status=process)');
  console.log('─'.repeat(80));
  try {
    const res = await makeRequest({ page: 1, length: 2, status: 'process' });
    console.log(`✅ Status: ${res.status}`);
    console.log(`📊 Metadata:`, JSON.stringify(res.body.metadata, null, 2));
    console.log(`📦 Records returned: ${res.body.data?.length || 0}`);
    if (res.body.data && res.body.data.length > 0) {
      console.log(`\n📋 Sample record statuses:`, res.body.data.map(d => d.status));
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }

  // Test 3: With date filter
  console.log('\n' + '─'.repeat(80));
  console.log('TEST 3: With date filter (start_date=2026-02-20 00:00:00)');
  console.log('─'.repeat(80));
  try {
    const res = await makeRequest({ page: 1, length: 2, start_date: '2026-02-20 00:00:00' });
    console.log(`✅ Status: ${res.status}`);
    console.log(`📊 Metadata:`, JSON.stringify(res.body.metadata, null, 2));
    console.log(`📦 Records returned: ${res.body.data?.length || 0}`);
    if (res.body.data && res.body.data.length > 0) {
      console.log(`📅 Order dates:`, res.body.data.map(d => d.order_at));
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }

  // Test 4: With search filter
  console.log('\n' + '─'.repeat(80));
  console.log('TEST 4: With search filter (search=Amura)');
  console.log('─'.repeat(80));
  try {
    const res = await makeRequest({ page: 1, length: 2, search: 'Amura' });
    console.log(`✅ Status: ${res.status}`);
    console.log(`📊 Metadata:`, JSON.stringify(res.body.metadata, null, 2));
    console.log(`📦 Records returned: ${res.body.data?.length || 0}`);
    if (res.body.data && res.body.data.length > 0) {
      console.log(`🏷️ Client names:`, res.body.data.map(d => d.client_name));
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }

  // Test 5: Invalid API key
  console.log('\n' + '─'.repeat(80));
  console.log('TEST 5: Invalid API key');
  console.log('─'.repeat(80));
  try {
    const urlObj = new URL(`${BASE_URL}${ENDPOINT}?page=1&length=1`);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'x-api-key': 'invalid-key' },
    };
    const res = await new Promise((resolve, reject) => {
      const req = https.request(options, (r) => {
        let data = '';
        r.on('data', (chunk) => (data += chunk));
        r.on('end', () => {
          try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: r.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      req.end();
    });
    console.log(`✅ Status: ${res.status}`);
    console.log(`📋 Response:`, JSON.stringify(res.body, null, 2));
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }

  // Test 6: No API key
  console.log('\n' + '─'.repeat(80));
  console.log('TEST 6: No API key header');
  console.log('─'.repeat(80));
  try {
    const urlObj = new URL(`${BASE_URL}${ENDPOINT}?page=1&length=1`);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {},
    };
    const res = await new Promise((resolve, reject) => {
      const req = https.request(options, (r) => {
        let data = '';
        r.on('data', (chunk) => (data += chunk));
        r.on('end', () => {
          try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: r.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      req.end();
    });
    console.log(`✅ Status: ${res.status}`);
    console.log(`📋 Response:`, JSON.stringify(res.body, null, 2));
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('All tests completed!');
  console.log('='.repeat(80));
}

main().catch(console.error);
