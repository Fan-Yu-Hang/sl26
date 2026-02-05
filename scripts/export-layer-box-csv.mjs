#!/usr/bin/env node
/**
 * 将 layer_box 导出为 CSV，上传到 Storage bucket SL_text_biaoge
 * 文件名：SL_{users.email 前6位}.csv
 * 12列：author, layer_name, iFrame, layer_date, text1..text8
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnvProd() {
  const content = readFileSync(join(root, '.env.prod'), 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = loadEnvProd()
if (!url || !key) throw new Error('Missing .env.prod Supabase vars')
const supabase = createClient(url, key)

// 转义 CSV 单元格（含逗号或引号时用双引号包裹，内部双引号加倍）
function csvEscape(s) {
  if (s == null) return ''
  const t = String(s)
  if (/[",\n\r]/.test(t)) return '"' + t.replace(/"/g, '""') + '"'
  return t
}

// 将 text_store 与 marks 合并为 text1..text8 的格式："id": 1, "text": xxx, "x": 207.5, "y": 148
function buildTextCells(textStore, marks, count = 8) {
  const ts = textStore && typeof textStore === 'object' ? textStore : {}
  const mk = Array.isArray(marks) ? marks : []
  const byId = {}
  mk.forEach((m) => { byId[m.id] = m })
  const cells = []
  for (let i = 1; i <= count; i++) {
    const m = byId[i]
    if (!m) {
      cells.push('')
      continue
    }
    const text = ts[String(i)] != null ? ts[String(i)] : ''
    cells.push(`"id": ${m.id}, "text": ${JSON.stringify(text)}, "x": ${m.x}, "y": ${m.y}`)
  }
  return cells
}

async function main() {
  const { data: lbRows, error: e1 } = await supabase
    .from('layer_box')
    .select('id, clerk_id, layer_title, created_at, text_store, marks')
    .order('id', { ascending: true })

  if (e1) throw new Error('layer_box: ' + e1.message)

  const { data: users } = await supabase.from('users').select('clerk_id, email')
  const emailByClerk = {}
  ;(users || []).forEach((u) => { if (u.clerk_id) emailByClerk[u.clerk_id] = u.email || '' })

  const byClerk = {}
  for (const row of lbRows || []) {
    const cid = row.clerk_id || ''
    if (!byClerk[cid]) byClerk[cid] = []
    byClerk[cid].push(row)
  }

  const header = ['author', 'layer_name', 'iFrame', 'layer_date', 'text1', 'text2', 'text3', 'text4', 'text5', 'text6', 'text7', 'text8']

  for (const [clerkId, rows] of Object.entries(byClerk)) {
    const email = emailByClerk[clerkId] || ''
    const email6 = (email || 'noname').slice(0, 6)
    const filename = `SL_${email6}.csv`

    const lines = [header.join(',')]
    for (const r of rows) {
      const author = (r.clerk_id || '').slice(0, 11)
      const layerName = r.layer_title ?? ''
      const layerDate = r.created_at ?? ''
      const textCells = buildTextCells(r.text_store, r.marks, 8)
      const row = [
        csvEscape(author),
        csvEscape(layerName),
        '1',
        csvEscape(layerDate),
        ...textCells.map((c) => csvEscape(c)),
      ]
      lines.push(row.join(','))
    }

    const csv = lines.join('\n')
    const buf = Buffer.from(csv, 'utf8')

    const { data: up, error: e2 } = await supabase.storage
      .from('SL_text_biaoge')
      .upload(filename, buf, { contentType: 'text/csv', upsert: true })

    if (e2) {
      console.error('Upload', filename, e2)
      continue
    }
    console.log('OK', filename, rows.length, 'rows')
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
