/**
 * Non-destructive inspection of proposed B4.2B Worker Routes.
 * Does not deploy, does not call wrangler, does not change DNS.
 *
 *   npx tsx cloudflare-router/print-b4-production-routes.ts
 *   npx tsx cloudflare-router/print-b4-production-routes.ts --priority P0
 *   npx tsx cloudflare-router/print-b4-production-routes.ts --write-json
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  assertSafeB4ProductionRoutes,
  generateB4ProductionWorkerRoutes,
  proposedWranglerProductionRoutes,
  routesForPriority,
  type B4RoutePriority,
} from './b4-production-routes'

const priorityArg = process.argv.includes('--priority')
  ? process.argv[process.argv.indexOf('--priority') + 1]
  : 'P2'
const priority = (['P0', 'P1', 'P2'].includes(priorityArg || '') ? priorityArg : 'P2') as B4RoutePriority

const all = generateB4ProductionWorkerRoutes()
const selected = routesForPriority(priority, all)
const errors = assertSafeB4ProductionRoutes(all)

const summary = {
  activated: false,
  customDomain: false,
  catchAllWww: false,
  wranglerProductionRoutesWired: false,
  priority,
  totalAllPriorities: all.length,
  selected: selected.length,
  byLayer: {
    'layer1-static-asset': selected.filter((row) => row.layer === 'layer1-static-asset').length,
    'layer2-worker': selected.filter((row) => row.layer === 'layer2-worker').length,
  },
  byPriority: {
    P0: all.filter((row) => row.priority === 'P0').length,
    P1: all.filter((row) => row.priority === 'P1').length,
    P2: all.filter((row) => row.priority === 'P2').length,
  },
  safetyErrors: errors,
  wranglerSnippetPreview: proposedWranglerProductionRoutes(priority).slice(0, 3),
  note: 'Do not paste routes into wrangler.jsonc until B4.2C. deploy:cloudflare uses --env staging only.',
}

const payload = { summary, routes: selected }
if (process.argv.includes('--write-json')) {
  const out = path.join(__dirname, 'b4-production-routes.json')
  fs.writeFileSync(
    out,
    `${JSON.stringify(
      {
        activated: false,
        customDomain: false,
        wranglerProductionRoutesWired: false,
        host: 'www.visutry.com',
        zone: 'visutry.com',
        generatedFrom: 'cloudflare-router/b4-production-routes.ts',
        note: 'Do not paste into wrangler.jsonc. Do not deploy. Review only.',
        summary: {
          total: all.length,
          byLayer: {
            'layer1-static-asset': all.filter((row) => row.layer === 'layer1-static-asset').length,
            'layer2-worker': all.filter((row) => row.layer === 'layer2-worker').length,
          },
          byPriority: summary.byPriority,
          safetyErrors: errors,
        },
        routes: all,
      },
      null,
      2,
    )}\n`,
  )
  process.stderr.write(`wrote ${out}\n`)
}

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
if (errors.length > 0) process.exit(1)
