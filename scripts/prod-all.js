const { spawnSync } = require('child_process')
const path = require('path')
const concurrently = require('concurrently')

function killPort(port) {
  spawnSync('powershell', ['-ExecutionPolicy','Bypass','-File', path.join(__dirname, 'kill-port.ps1'), '-Port', String(port)], { stdio: 'inherit' })
}

function main() {
  // Build all first
  spawnSync('npm', ['run', 'build:all'], { stdio: 'inherit' })

  // Pre-clean fixed ports
  [3000, 4000, 5000, 6000].forEach(killPort)

  // Start all previews and API
  concurrently([
    { command: 'npm run start', name: 'API', prefixColor: 'blue' },
    { command: 'npm run admin:preview', name: 'ADMIN', prefixColor: 'magenta' },
    { command: 'npm run buyer:preview', name: 'BUYER', prefixColor: 'green' },
    { command: 'npm run seller:preview', name: 'SELLER', prefixColor: 'yellow' },
    { command: 'set AI_PREPARE_SOFT=1 && npm run prepare:ai', name: 'AI', prefixColor: 'cyan' },
    { command: 'node scripts/summary.js', name: 'SUMMARY', prefixColor: 'white' }
  ], {
    killOthers: ['failure'],
    prefix: '{name} '
  }).result.then(() => {
    // Done
  }).catch(() => {
    // Ignore
  })
}

main()