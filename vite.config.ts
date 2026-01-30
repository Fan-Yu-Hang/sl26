import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
// 本地 dev 时 Vite 只加载 .env / .env.local / .env.development，项目只有 .env.prod，
// 所以合并 .env.prod 作为回退，与 Vercel 官网行为一致
export default defineConfig(({ mode }) => {
    const root = path.resolve(__dirname)
    const prodEnv = loadEnv('prod', root)
    const modeEnv = loadEnv(mode, root)
    const fromFiles = { ...prodEnv, ...modeEnv }
    // 优先 process.env（Vercel 构建时注入），否则用 .env.prod / .env.development 等
    const env = {
        VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY ?? fromFiles.VITE_CLERK_PUBLISHABLE_KEY ?? '',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? fromFiles.VITE_SUPABASE_URL ?? '',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? fromFiles.VITE_SUPABASE_ANON_KEY ?? '',
    }

    return {
        server: {
            port: 5555,
            open: true,
        },
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    // additionalData can be used to import variables globally
                }
            }
        },
        define: {
            'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY),
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        },
    }
})

