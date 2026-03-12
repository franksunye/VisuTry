import { runMailCli } from '../../../../scripts/mail';

runMailCli(['list', '--limit', '20', ...process.argv.slice(2)]).catch((error) => {
  console.error('❌ Failed to fetch emails:', error instanceof Error ? error.message : error);
  process.exit(1);
});
