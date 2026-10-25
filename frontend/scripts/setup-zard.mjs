import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(args) {
  const result = spawnSync('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const configured = existsSync('components.json')
  && existsSync('src/app/shared/components/button/button.component.ts')
  && existsSync('src/app/shared/components/badge/badge.component.ts')
  && existsSync('src/app/shared/components/input/input.component.ts')
  && existsSync('src/app/shared/components/card/card.imports.ts');

if (configured) {
  console.log('zard/ui components are already configured.');
} else {
  console.log('Initializing zard/ui and generating the components used by Neo4flix…');
  run(['zard-cli@latest', 'init', '--yes', '--type', 'angular', '--app-config', 'src/app/app.config.ts', '--css', 'src/styles.css', '--base-color', 'neutral']);
  run(['zard-cli@latest', 'add', 'button', 'badge', 'input', 'card', '--yes']);
}
