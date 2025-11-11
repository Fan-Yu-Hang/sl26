# Clerk 登录配置指南

## 1. 获取 Clerk API Keys

1. 访问 [Clerk Dashboard](https://dashboard.clerk.com)
2. 注册/登录账户
3. 创建新应用或选择现有应用
4. 在 API Keys 页面获取 **Publishable Key**

## 2. 配置环境变量

在项目根目录创建 `.env` 文件（如果不存在），添加以下内容：

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

**注意**: 
- 将 `your_clerk_publishable_key_here` 替换为你从 Clerk Dashboard 获取的实际 key
- `.env` 文件已在 `.gitignore` 中，不会被提交到 Git

## 3. 配置 Clerk 应用设置

在 Clerk Dashboard 中：

1. **配置允许的回调 URL**:
   - 开发环境: `http://localhost:5555`
   - 生产环境: 你的域名（例如: `https://yourdomain.com`）

2. **选择登录方式**:
   - Email/Password
   - Social providers (Google, GitHub, etc.)
   - 或其他你需要的登录方式

## 4. 重启开发服务器

配置完成后，重启开发服务器：

```bash
pnpm dev
```

## 5. 测试登录功能

1. 点击导航栏中的 "虎符校验 / 注册登录" 按钮
2. 应该会弹出 Clerk 的登录模态框
3. 注册新用户或登录现有用户
4. 登录后，会显示用户头像和菜单

## 故障排查

如果遇到问题：

1. 检查 `.env` 文件中的 key 是否正确
2. 确认环境变量名称是 `VITE_CLERK_PUBLISHABLE_KEY`（Vite 要求 `VITE_` 前缀）
3. 检查浏览器控制台是否有错误信息
4. 确认 Clerk Dashboard 中的回调 URL 配置正确

## 更多信息

- [Clerk React 文档](https://clerk.com/docs/references/react/overview)
- [Clerk 快速开始](https://clerk.com/docs/quickstarts/react)

