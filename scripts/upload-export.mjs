#!/usr/bin/env node
/**
 * 将 exports/layer_box_13_export.csv 上传到 Storage bucket SL_text_biaoge
 * 使用 .env.prod 中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnvProd() {
  const envPath = join(root, '.env.prod')
  const content = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const env = loadEnvProd()
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.prod')
  process.exit(1)
}

const supabase = createClient(url, key)
const csvPath = join(root, 'exports', 'layer_box_13_export.csv')
const csv = readFileSync(csvPath)

const { data, error } = await supabase.storage
  .from('SL_text_biaoge')
  .upload('layer_box_13_export.csv', csv, { contentType: 'text/csv', upsert: true })

if (error) {
  console.error('Upload failed:', error)
  process.exit(1)
}
console.log('Upload OK:', data?.path)
console.log('在 Supabase Dashboard → Storage → SL_text_biaoge 可查看或下载该文件')
