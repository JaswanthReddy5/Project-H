import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Export async config so we can optionally include Tailwind's Vite plugin if available
export default defineConfig(async () => {
  let tailwindVite;
  try {
    // Optional: only load if installed (prevents Netlify build failures when cache misses)
    const mod = await import('@tailwindcss/vite');
    tailwindVite = mod.default ? mod.default() : mod();
  } catch (_) {
    tailwindVite = null;
  }

  return {
    plugins: [react(), ...(tailwindVite ? [tailwindVite] : [])],
    server: {
      host: true,
    },
  };
})
