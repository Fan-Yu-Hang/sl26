# Clerk 与 Supabase 集成指南

## 功能说明

当用户通过 Clerk 登录时，系统会自动：
- ✅ 检查 Supabase 中是否存在该用户
- ✅ 如果不存在，自动创建新用户记录
- ✅ 如果已存在，自动更新用户信息

## 设置步骤

### 1. 在 Supabase 中创建 users 表

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**（SQL 编辑器）
4. 打开项目中的 `supabase_schema.sql` 文件
5. 复制整个 SQL 脚本内容
6. 粘贴到 Supabase SQL Editor 中
7. 点击 **Run**（运行）执行脚本

**如果遇到 RLS 策略错误**：
- 如果执行 `supabase_schema.sql` 后仍然出现 `new row violates row-level security policy` 错误
- 请执行项目中的 `fix_rls_policy.sql` 脚本来修复 RLS 策略

### 2. 验证表是否创建成功

1. 在 Supabase Dashboard 中，进入 **Table Editor**
2. 你应该能看到 `users` 表
3. 表结构应该包含以下字段：
   - `id` (UUID, 主键)
   - `clerk_id` (TEXT, 唯一, Clerk 用户 ID)
   - `email` (TEXT)
   - `first_name` (TEXT)
   - `last_name` (TEXT)
   - `image_url` (TEXT)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### 3. 测试集成

1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 在浏览器中打开应用
3. 点击登录按钮，使用 Clerk 登录
4. 登录成功后，打开浏览器控制台（F12）
5. 你应该能看到：
   - `✅ 新用户已同步到 Supabase`（首次登录）
   - 或 `✅ Supabase 用户信息已更新`（已存在用户）

6. 在 Supabase Dashboard 的 Table Editor 中查看 `users` 表
7. 应该能看到新创建的用户记录

## 工作原理

### 自动同步流程

1. **用户登录 Clerk** → Clerk 认证成功
2. **useClerkSupabaseSync Hook 触发** → 检测到用户状态变化
3. **查询 Supabase** → 根据 `clerk_id` 查找用户
4. **创建或更新**：
   - 如果用户不存在 → 插入新记录
   - 如果用户已存在 → 更新用户信息

### 数据映射

| Clerk 字段 | Supabase 字段 | 说明 |
|-----------|--------------|------|
| `user.id` | `clerk_id` | Clerk 用户唯一标识 |
| `user.primaryEmailAddress.emailAddress` | `email` | 用户邮箱 |
| `user.firstName` | `first_name` | 名字 |
| `user.lastName` | `last_name` | 姓氏 |
| `user.imageUrl` | `image_url` | 头像 URL |

## 代码说明

### useClerkSupabaseSync Hook

位置：`src/hooks/useClerkSupabaseSync.ts`

这个 Hook 会：
- 监听 Clerk 用户状态变化
- 当用户登录时，自动同步到 Supabase
- 处理创建和更新逻辑

### App.tsx 集成

在 `App.tsx` 中，`useClerkSupabaseSync` Hook 被调用，确保：
- 在 ClerkProvider 内部使用（可以访问 Clerk 用户信息）
- 应用启动时自动开始监听

## 自定义和扩展

### 添加更多字段

如果你想在 Supabase 中存储更多用户信息：

1. **修改 SQL 表结构**：
   ```sql
   ALTER TABLE users ADD COLUMN phone TEXT;
   ALTER TABLE users ADD COLUMN bio TEXT;
   ```

2. **更新 useClerkSupabaseSync.ts**：
   ```typescript
   const userData = {
     clerk_id: user.id,
     email: user.primaryEmailAddress?.emailAddress || '',
     first_name: user.firstName || '',
     last_name: user.lastName || '',
     image_url: user.imageUrl || '',
     phone: user.phoneNumbers[0]?.phoneNumber || '', // 新增
     bio: user.publicMetadata?.bio || '', // 新增
     updated_at: new Date().toISOString(),
   }
   ```

### 修改 RLS 策略

默认情况下，所有用户都可以读取和更新数据。你可以根据需要修改 Row Level Security (RLS) 策略：

1. 在 Supabase Dashboard 中进入 **Authentication** → **Policies**
2. 选择 `users` 表
3. 修改策略规则，例如：
   - 只允许用户读取自己的数据
   - 只允许用户更新自己的数据

## 故障排查

### 问题：用户没有同步到 Supabase

**检查清单**：
1. ✅ 确认 `users` 表已创建
2. ✅ 检查浏览器控制台是否有错误信息
3. ✅ 确认 Supabase 环境变量已正确配置
4. ✅ 确认 Clerk 登录成功

### 问题：控制台显示错误

**常见错误**：
- `relation "users" does not exist` → 需要先执行 SQL 脚本创建表
- `permission denied` → 检查 RLS 策略设置
- `duplicate key value` → `clerk_id` 已存在，这是正常的更新流程

### 问题：数据没有更新

检查 `updated_at` 字段是否自动更新。如果 SQL 脚本中的触发器没有创建，可以手动执行：

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 下一步

现在你可以：
- ✅ 在 Supabase 中查询用户数据
- ✅ 将用户数据与其他表关联
- ✅ 创建用户相关的功能（如用户设置、个人资料等）
- ✅ 使用 Supabase 的实时功能监听用户数据变化

## 相关文件

- `src/hooks/useClerkSupabaseSync.ts` - 同步逻辑
- `src/App.tsx` - 应用入口，集成 Hook
- `supabase_schema.sql` - 数据库表结构
- `src/lib/supabase.ts` - Supabase 客户端配置

