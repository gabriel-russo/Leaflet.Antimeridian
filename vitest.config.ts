import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';

export default mergeConfig(
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  }),
  {
    build: {
      lib: {
        entry: './src/Leaflet.Antimeridian.ts',
        formats: ['es','umd'],
      },
    },
  }
);
