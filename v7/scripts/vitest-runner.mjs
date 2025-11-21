import { spawnSync } from 'node:child_process'

const rawArgs = process.argv.slice(2)
const translatedArgs = []
let filterPattern = ''
let runInBand = false

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i]
  if (arg === '--filter' || arg === '-f') {
    filterPattern = rawArgs[i + 1] || ''
    i += 1
    continue
  }
  if (arg === '--runInBand' || arg === '-i') {
    runInBand = true
    continue
  }
  translatedArgs.push(arg)
}

if (filterPattern) {
  translatedArgs.push('--testNamePattern', filterPattern)
}

if (runInBand) {
  translatedArgs.push('--maxWorkers=1', '--minWorkers=1', '--fileParallelism=false')
}

const result = spawnSync('npx', ['vitest', 'run', ...translatedArgs], { stdio: 'inherit', env: process.env })

if (result.error) {
  console.error('[vitest-runner] failed to start vitest:', result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
