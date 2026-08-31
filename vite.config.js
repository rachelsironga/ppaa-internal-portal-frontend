import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    port: 3000,
    host: true,
    // Allow opening via http://portal.ppaa.go.tz (local nginx on :80 → :3000)
    allowedHosts: ['portal.ppaa.go.tz', 'localhost', '192.168.1.4'],
    open: '/',
  },
})
