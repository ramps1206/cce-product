import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'CCE Software',
                short_name: 'CCE',
                description: 'सतत सर्वंकष मूल्यमापन',
                lang: 'mr',
                theme_color: '#0F3554',
                background_color: '#F7F5EF',
                display: 'standalone',
                icons: [],
            },
            workbox: {
                // App shell works offline; API calls are handled by our own sync layer.
                navigateFallback: '/index.html',
            },
        }),
    ],
    server: {
        port: 5173,
        proxy: {
            // Dev: forward API calls to the Spring Boot backend.
            '/api': 'http://localhost:8080',
        },
    },
});
