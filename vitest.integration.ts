import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    globals: true,
    globalSetup: ['./test/setup.integration.ts'],
    include: ['./src/**/*.integration.ts'],
  },
});

export default config;
