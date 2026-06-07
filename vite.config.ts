import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/Leaflet.Antimeridian.ts',
      name: 'L',
      fileName: 'leaflet.antimeridian-src',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        paths: {
          // Ensure leaflet is imported correctly in the final bundle
          'leaflet': 'leaflet.js'
        }
      },
    }
  }
});
