# Vercel 部署指南

## 方式一：通过 Vercel CLI 部署

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

在项目根目录运行：

```bash
vercel
```

首次部署会提示：
- 设置项目名称
- 是否链接到现有项目
- 是否覆盖设置

### 4. 生产环境部署

```bash
vercel --prod
```

## 方式二：通过 Vercel 网站部署（推荐）

### 1. 准备 GitHub 仓库

确保项目已推送到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. 在 Vercel 导入项目

1. 访问 [Vercel](https://vercel.com)
2. 点击 **"Add New..."** → **"Project"**
3. 从 GitHub 导入你的仓库
4. Vercel 会自动检测项目类型（Vite）

### 3. 配置环境变量

在项目设置中添加环境变量：

**环境变量：**
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk 的 Publishable Key

**配置步骤：**
1. 在项目设置中找到 **"Environment Variables"**
2. 添加 `VITE_CLERK_PUBLISHABLE_KEY`
3. 填入你的 Clerk Publishable Key
4. 选择环境（Production, Preview, Development）
5. 点击 **"Save"**

### 4. 部署设置

Vercel 会自动检测以下配置：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

如果使用 pnpm，可以在项目设置中修改：
- **Install Command**: `pnpm install`

### 5. 部署

点击 **"Deploy"** 按钮，Vercel 会自动：
1. 安装依赖
2. 运行构建命令
3. 部署到 CDN

## 配置说明

### vercel.json

项目已包含 `vercel.json` 配置文件，包含以下设置：

- **路由重写**: 所有路由重定向到 `index.html`（支持 React Router）
- **缓存策略**: 静态资源（图片、字体、JS/CSS）设置长期缓存
- **构建配置**: 指定构建命令和输出目录

### 环境变量

在 Vercel 项目设置中配置以下环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk 认证的 Publishable Key | 是 |

### Clerk 回调 URL 配置

部署到 Vercel 后，需要在 Clerk Dashboard 中配置回调 URL：

1. 访问 [Clerk Dashboard](https://dashboard.clerk.com)
2. 选择你的应用
3. 进入 **"Settings"** → **"Paths"**
4. 添加以下 URL：
   - **Sign-in URL**: `https://your-domain.vercel.app`
   - **Sign-up URL**: `https://your-domain.vercel.app`
   - **After sign-in URL**: `https://your-domain.vercel.app`
   - **After sign-up URL**: `https://your-domain.vercel.app`

## 自定义域名

### 1. 在 Vercel 添加域名

1. 进入项目设置
2. 点击 **"Domains"**
3. 输入你的域名
4. 按照提示配置 DNS 记录

### 2. 配置 DNS

根据 Vercel 的提示，在你的域名服务商添加 DNS 记录：

- **类型**: CNAME
- **名称**: @ 或 www
- **值**: cname.vercel-dns.com

## 部署检查清单

- [ ] 项目已推送到 GitHub
- [ ] 在 Vercel 导入项目
- [ ] 配置环境变量 `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] 在 Clerk Dashboard 配置回调 URL
- [ ] 验证部署成功
- [ ] 测试登录功能
- [ ] 测试所有页面路由
- [ ] 配置自定义域名（可选）

## 常见问题

### 1. 构建失败

**问题**: 构建时出现错误

**解决方案**:
- 检查 `package.json` 中的构建脚本
- 确保所有依赖已正确安装
- 查看 Vercel 构建日志中的错误信息

### 2. 路由 404 错误

**问题**: 刷新页面或直接访问路由时出现 404

**解决方案**:
- 确保 `vercel.json` 中包含路由重写规则
- 检查 React Router 配置

### 3. 环境变量未生效

**问题**: 环境变量在部署后未生效

**解决方案**:
- 确保环境变量名称以 `VITE_` 开头
- 在 Vercel 项目设置中重新添加环境变量
- 重新部署项目

### 4. Clerk 登录不工作

**问题**: 点击登录按钮没有反应

**解决方案**:
- 检查环境变量 `VITE_CLERK_PUBLISHABLE_KEY` 是否正确配置
- 在 Clerk Dashboard 中配置正确的回调 URL
- 检查浏览器控制台是否有错误信息

## 自动部署

Vercel 支持自动部署：

- **推送到 main 分支**: 自动部署到生产环境
- **创建 Pull Request**: 自动创建预览部署
- **推送其他分支**: 创建预览部署

## 性能优化

Vercel 自动提供：
- ✅ CDN 加速
- ✅ 自动 HTTPS
- ✅ 边缘网络
- ✅ 自动压缩
- ✅ 图片优化（需要 Vercel Pro）

## 监控和分析

Vercel 提供：
- 部署日志
- 性能分析
- 错误监控
- 访问统计（需要 Vercel Pro）

## 联系支持

如果遇到问题，可以：
1. 查看 [Vercel 文档](https://vercel.com/docs)
2. 访问 [Vercel 社区](https://github.com/vercel/vercel/discussions)
3. 联系 Vercel 支持

