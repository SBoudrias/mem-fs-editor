import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      lines: 99,
      statements: 99,
      branches: 95,
      provider: 'v8',
    },
  },
});
