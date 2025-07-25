#!/usr/bin/env node

const https = require('https');
const http = require('http');

const systems = [
  { name: 'Platto（旧）', url: 'https://delaxplatto.com' },
  { name: 'Liberary（旧）', url: 'https://program-management-pm.netlify.app' },
  { name: '統合版（新）', url: 'https://delaxpm.netlify.app' },
  { name: 'ローカル開発', url: 'http://localhost:3000' }
];

async function checkSystem(system) {
  return new Promise((resolve) => {
    const protocol = system.url.startsWith('https') ? https : http;
    
    const request = protocol.get(system.url, (res) => {
      resolve({
        ...system,
        status: res.statusCode === 200 ? 'OK' : `Error: ${res.statusCode}`,
        online: res.statusCode === 200
      });
    });

    request.on('error', (err) => {
      resolve({
        ...system,
        status: 'Offline',
        online: false
      });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        ...system,
        status: 'Timeout',
        online: false
      });
    });
  });
}

async function main() {
  console.log('\n🔍 DELA×PM システム状態チェック\n');
  
  const results = await Promise.all(systems.map(checkSystem));
  
  results.forEach(result => {
    const status = result.online 
      ? '\x1b[32m● オンライン\x1b[0m' 
      : '\x1b[31m● オフライン\x1b[0m';
    
    console.log(`${status} \x1b[1m${result.name}\x1b[0m`);
    console.log(`  URL: \x1b[90m${result.url}\x1b[0m`);
    console.log('');
  });
}

main().catch(console.error);