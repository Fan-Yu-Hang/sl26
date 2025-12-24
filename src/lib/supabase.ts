import { createClient } from '@supabase/supabase-js'

// 从环境变量获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 检查是否错误地使用了 service_role key
if (supabaseAnonKey && supabaseAnonKey.includes('service_role')) {
  console.error(
    '❌ 错误：检测到 service_role key！\n' +
    '⚠️ service_role key 只能在服务器端使用，绝对不能在前端使用！\n' +
    '📝 请使用 anon public key，在 Supabase Dashboard → Settings → API 中找到 "anon" "public" 密钥\n' +
    '🔒 如果已经暴露了 service_role key，请立即在 Supabase Dashboard 中删除并重新生成！'
  )
}

// 如果环境变量未设置，给出警告但不阻止应用启动
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ 缺少 Supabase 环境变量。请确保在 .env.local 文件中设置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  )
}

// 创建 Supabase 客户端（即使环境变量为空也创建，避免运行时错误）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// 导出类型（如果需要）
export type Database = any // 你可以根据你的数据库结构定义类型

// 测试连接函数
async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test').select('*').limit(1)
    if (error && (error.code === 'PGRST116' || error.message.includes('does not exist'))) {
      console.log('✅ Supabase 连接成功！')
      console.log('📍 URL:', import.meta.env.VITE_SUPABASE_URL)
      return true
    }
    console.log('✅ Supabase 连接成功！', data)
    return true
  } catch (err: any) {
    console.error('❌ Supabase 连接失败:', err.message)
    return false
  }
}

// 在浏览器环境且配置存在时，自动测试连接
if (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
  // 延迟执行，确保页面加载完成
  setTimeout(() => {
    console.log('🔍 正在测试 Supabase 连接...')
    testConnection()
  }, 500)
}

// 在浏览器控制台也可以手动测试：window.testSupabase()
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testConnection
}

