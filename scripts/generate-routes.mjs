import { Generator, getConfig } from '@tanstack/router-generator';

const root = process.cwd();
const config = getConfig(
  {
    target: 'react',
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts',
  },
  root
);

const generator = new Generator({
  config,
  root,
});

await generator.run();
