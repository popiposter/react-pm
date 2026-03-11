import { spawn } from 'node:child_process';

const [, , portArg = '4174', modeArg = 'prod'] = process.argv;

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(
  `${npmCommand} run dev -- --host 127.0.0.1 --port ${portArg}`,
  [],
  {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_APP_MODE: modeArg,
    },
  }
);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
