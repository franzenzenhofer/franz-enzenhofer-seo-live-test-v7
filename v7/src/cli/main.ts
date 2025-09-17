import sade from 'sade'

import { execUrl, execFile } from './exec'

const program = sade('livetest').option('-f, --format', 'json|html', 'json').option('-o, --out', 'Output file')

program.command('url <url>').describe('Run rules for URL').action(async (url: string, opts) => execUrl(url, opts))

program.command('file <path>').describe('Run rules for HTML file').action(async (p: string, opts) => execFile(p, opts))

program.parse(typeof process !== 'undefined' ? process.argv : [])

// env helper moved to ./env
