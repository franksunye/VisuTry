import { runMailCli } from '../../../../scripts/mail';

const args = process.argv.slice(2);
const normalizedArgs = args.length > 0 && !args[0].startsWith('--')
  ? ['thread', '--from', args[0], ...args.slice(1)]
  : ['thread', ...args];

runMailCli(normalizedArgs).catch((error) => {
  console.error('❌ Failed to fetch thread:', error instanceof Error ? error.message : error);
  process.exit(1);
});
