# Supabase 设置指南

## 1. 获取 Supabase 凭证

### 详细步骤：

1. **访问 Supabase 控制台**
   - 打开 [https://app.supabase.com](https://app.supabase.com)
   - 使用你的账号登录（如果没有账号，需要先注册）

2. **创建或选择项目**
   - 如果是新用户，点击 "New Project" 创建新项目
   - 如果已有项目，从项目列表中选择你的项目

3. **进入 API 设置页面**
   - 在左侧边栏，点击 **Settings**（设置）图标（齿轮图标）
   - 在设置菜单中，点击 **API**

4. **找到并复制凭证**
   在 API 设置页面，你会看到以下信息：
   
   - **Project URL**（项目 URL）
     - 位置：在 "Project URL" 标题下方
     - 格式类似：`https://xxxxxxxxxxxxx.supabase.co`
     - 复制这个 URL → 这就是 `VITE_SUPABASE_URL`
   
   - **anon public key**（匿名公共密钥）⚠️ **重要：必须使用这个！**
     - 位置：在 "Project API keys" 部分
     - 找到标有 **"anon" "public"** 的密钥（通常在第一个）
     - 标签显示：`[anon] [public]` 或 `anon public`
     - 点击右侧的 "Copy" 按钮或直接复制
     - 格式类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - 复制这个密钥 → 这就是 `VITE_SUPABASE_ANON_KEY`

   - **service_role key**（服务角色密钥）❌ **绝对不要使用！**
     - 位置：在 "Project API keys" 部分的下方
     - 标签显示：`[service_role] [secret]` 或 `service_role secret`
     - ⚠️ **警告**：这个密钥绝对不能在前端使用！
     - 如果误用了这个密钥，会收到错误：`Forbidden use of secret API key in browser`

### ⚠️ 重要区别：

| 密钥类型 | 标签 | 使用场景 | 安全性 |
|---------|------|---------|--------|
| **anon public** | `[anon] [public]` | ✅ 前端浏览器 | 公开，安全 |
| **service_role** | `[service_role] [secret]` | ❌ 只能服务器端 | 私密，危险 |

### 🔒 安全提示：
- ✅ **必须使用** `anon public` 密钥（标签显示 `[anon] [public]`）
- ❌ **绝对不要使用** `service_role` 密钥（标签显示 `[service_role] [secret]`）
- 如果误用了 `service_role` 密钥：
  1. 立即在 Supabase Dashboard 中删除该密钥
  2. 重新生成新的 `service_role` 密钥（如果需要服务器端使用）
  3. 在 `.env.local` 中使用正确的 `anon public` 密钥

## 2. 配置环境变量

在项目根目录创建 `.env.local` 文件（如果不存在）：

```bash
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**重要**：`.env.local` 文件不会被提交到 Git，请妥善保管你的密钥。

## 3. 使用 Supabase

### 基本用法示例

```typescript
import { supabase } from '@/lib/supabase'

// 查询数据
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// 插入数据
const { data, error } = await supabase
  .from('your_table')
  .insert([{ column: 'value' }])

// 更新数据
const { data, error } = await supabase
  .from('your_table')
  .update({ column: 'new_value' })
  .eq('id', 1)

// 删除数据
const { error } = await supabase
  .from('your_table')
  .delete()
  .eq('id', 1)

// 用户认证
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// 用户登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// 用户登出
await supabase.auth.signOut()

// 获取当前用户
const { data: { user } } = await supabase.auth.getUser()
```

### 在 React 组件中使用

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function MyComponent() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('your_table')
        .select('*')
      
      if (error) {
        console.error('Error:', error)
      } else {
        setData(data)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

## 4. 实时订阅

```typescript
// 订阅表变化
const subscription = supabase
  .channel('your_channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'your_table' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// 取消订阅
subscription.unsubscribe()
```

## 5. 存储文件

```typescript
// 上传文件
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload('path/to/file.jpg', file)

// 下载文件
const { data, error } = await supabase.storage
  .from('bucket_name')
  .download('path/to/file.jpg')

// 获取公共 URL
const { data } = supabase.storage
  .from('bucket_name')
  .getPublicUrl('path/to/file.jpg')
```

## 6. 更多资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端文档](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase React 示例](https://github.com/supabase/supabase/tree/master/examples)

