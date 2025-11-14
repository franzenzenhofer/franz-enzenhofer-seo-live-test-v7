import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { rulesInventory } from '../src/rules/inventory'

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), '../rules.inventory.json')

await writeFile(outPath, JSON.stringify(rulesInventory, null, 2) + '\n', 'utf8')
console.log(`rules.inventory.json updated (${rulesInventory.length} rules)`)
