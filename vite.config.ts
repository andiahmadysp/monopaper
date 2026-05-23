import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        target: 'baseline-widely-available',
        chunkSizeWarningLimit: 800,
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    // React core — present on every page, tiny, cache forever
                    if (
                        id.includes('/node_modules/react/') ||
                        id.includes('/node_modules/react-dom/')
                    ) {
                        return 'vendor-react';
                    }

                    // ProseMirror primitives — foundation layer used by TipTap
                    if (id.includes('/node_modules/prosemirror-')) {
                        return 'vendor-prosemirror';
                    }

                    // TipTap extensions + Novel + syntax highlighting
                    if (
                        id.includes('/node_modules/novel') ||
                        id.includes('/node_modules/@tiptap/') ||
                        id.includes('/node_modules/lowlight') ||
                        id.includes('/node_modules/highlight.js') ||
                        id.includes('/node_modules/linkifyjs')
                    ) {
                        return 'vendor-tiptap';
                    }

                    // FullCalendar — only loaded on Dashboard
                    if (id.includes('/node_modules/@fullcalendar/')) {
                        return 'vendor-calendar';
                    }

                    // Drag-and-drop — only loaded on Dashboard
                    if (id.includes('/node_modules/@dnd-kit/')) {
                        return 'vendor-dnd';
                    }

                    // Lucide icons — shared across pages
                    if (id.includes('/node_modules/lucide-react')) {
                        return 'vendor-icons';
                    }

                    // Misc UI primitives
                    if (
                        id.includes('/node_modules/react-select') ||
                        id.includes('/node_modules/@headlessui/') ||
                        id.includes('/node_modules/@floating-ui/')
                    ) {
                        return 'vendor-ui';
                    }

                    // Inertia + axios — shared routing/HTTP layer
                    if (
                        id.includes('/node_modules/@inertiajs/') ||
                        id.includes('/node_modules/axios')
                    ) {
                        return 'vendor-inertia';
                    }
                },
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
});