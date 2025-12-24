# 修复 "Forbidden use of secret API key in browser" 错误

## 错误原因

这个错误表示你在浏览器中使用了 **service_role key**（服务角色密钥），这是不允许的。

## 🔴 问题

你当前在 `.env.local` 文件中使用的是 `service_role` 密钥，而不是 `anon public` 密钥。

## ✅ 解决方案

### 步骤 1：找到正确的密钥

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 在 "Project API keys" 部分，找到：
   - ✅ **anon public** 密钥（标签显示 `[anon] [public]`）
   - ❌ **不要使用** service_role 密钥（标签显示 `[service_role] [secret]`）

### 步骤 2：更新环境变量

打开项目根目录的 `.env.local` 文件，确保使用的是 `anon public` 密钥：

```bash
# ✅ 正确 - 使用 anon public key
VITE_SUPABASE_URL=https://你的项目id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon public key

# ❌ 错误 - 不要使用 service_role key
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key (错误！)
```

### 步骤 3：检查密钥类型

如何区分两种密钥：

- **anon public key**：
  - 标签：`[anon] [public]`
  - 位置：通常在 API keys 列表的第一个
  - 可以安全地在前端使用

- **service_role key**：
  - 标签：`[service_role] [secret]`
  - 位置：在 API keys 列表的下方
  - ⚠️ 绝对不能在前端使用

### 步骤 4：重启开发服务器

更新 `.env.local` 后，重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
pnpm dev
```

### 步骤 5：验证修复

1. 刷新浏览器页面
2. 打开浏览器控制台（F12）
3. 应该看到：`✅ Supabase 连接成功！`
4. 不应该再看到 `Forbidden use of secret API key` 错误

## 🔒 如果已经暴露了 service_role key

如果你已经在代码中使用了 `service_role` key，建议：

1. **立即删除并重新生成**：
   - 在 Supabase Dashboard → Settings → API
   - 找到 `service_role` 密钥
   - 点击删除并重新生成（如果需要服务器端使用）

2. **检查代码仓库**：
   - 确保 `.env.local` 文件在 `.gitignore` 中
   - 如果误提交了密钥，立即从 Git 历史中删除

3. **使用正确的密钥**：
   - 在 `.env.local` 中使用 `anon public` 密钥

## 常见问题

### Q: 为什么不能使用 service_role key？

A: `service_role` key 拥有完全的管理权限，可以绕过所有安全规则。如果在前端使用，任何人都可以在浏览器中看到这个密钥，从而完全控制你的数据库。

### Q: anon key 安全吗？

A: 是的，`anon public` key 是设计用于前端的。它受到 Row Level Security (RLS) 策略的保护，只能执行你明确允许的操作。

### Q: 如何确认我使用的是正确的密钥？

A: 在 Supabase Dashboard → Settings → API 中，确认你复制的密钥标签是 `[anon] [public]`，而不是 `[service_role] [secret]`。

## 参考

- [Supabase API Keys 文档](https://supabase.com/docs/guides/api/api-keys)
- [Supabase 安全最佳实践](https://supabase.com/docs/guides/api/security)

