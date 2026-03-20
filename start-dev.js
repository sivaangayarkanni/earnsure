#!/usr/bin/env node
/**
 * EarnSure Development Server
 * Starts backend + frontend for local development
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;

function startBackend() {
  console.log('🚀 Starting Backend...');
  const backend = spawn('npm', ['start'], {
    cwd: path.join(ROOT, 'backend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });
  backend.on('error', (e) => console.error('Backend error:', e));
  return backend;
}

function startFrontend() {
  console.log('🎨 Starting Frontend...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(ROOT, 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_API_BASE_URL: 'http://localhost:3000' }
  });
  frontend.on('error', (e) => console.error('Frontend error:', e));
  return frontend;
}

// Start both
console.log(`
╔═══════════════════════════════════════════════════════════╗
║          EarnSure Development Server                       ║
║                                                           ║
║  Backend: http://localhost:3000                         ║
║  Frontend: http://localhost:5173                         ║
║                                                           ║
║  Press Ctrl+C to stop                                    ║
╚═══════════════════════════════════════════════════════════╝
`);

const backendProc = startBackend();
const frontendProc = startFrontend();

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backendProc.kill();
  frontendProc.kill();
  process.exit(0);
});
