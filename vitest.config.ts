import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    globals: true,
  },
});

export default config;
