import { runCli } from './cli.js';

runCli(process.argv.slice(2)).then((output) => process.stdout.write(output)).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
