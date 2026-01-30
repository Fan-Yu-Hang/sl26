# Seelayer Website - 现代化设计

这是一个基于 React + TypeScript + Tailwind CSS + Vite 构建的现代化网站项目

## ✨ 功能特性

- **现代化 UI**：使用 Tailwind CSS 构建，具有流畅动画和3D效果
- **完全响应式**：完美适配移动端和桌面端
- **GSAP 动画**：丰富的滚动动画和交互效果
- **3D 背景**：使用 OGL 实现的 3D 球体背景效果
- **用户认证**：集成 Clerk 登录系统
- **流畅交互**：hover 效果、平滑滚动、动画过渡
- **清晰布局**：卡片式设计，层次分明

## 🛠️ 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **SASS/SCSS** - 样式预处理
- **GSAP** - 动画库
- **OGL** - WebGL 3D 库
- **Clerk** - 用户认证
- **React Router** - 路由管理

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
# 或
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

获取 Clerk API Key：
1. 访问 [Clerk Dashboard](https://dashboard.clerk.com)
2. 创建应用或选择现有应用
3. 在 API Keys 页面获取 Publishable Key
4. 将 key 填入 `.env` 文件

详细配置说明请查看 [CLERK_SETUP.md](./CLERK_SETUP.md)

### 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

项目将在 `http://localhost:5555` 运行。

### 构建生产版本

```bash
pnpm build
# 或
npm run build
```

## 🚀 部署到 Vercel

项目已配置好 Vercel 部署，可以一键部署。

### 快速部署

1. **通过 Vercel 网站部署（推荐）**：
   - 将项目推送到 GitHub
   - 访问 [Vercel](https://vercel.com)
   - 导入 GitHub 仓库
   - 配置环境变量 `VITE_CLERK_PUBLISHABLE_KEY`
   - 点击部署

2. **通过 Vercel CLI 部署**：
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

详细的部署说明请查看 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

## 📁 项目结构

```
├── src/
│   ├── components/          # React 组件
│   │   ├── Header.tsx       # 头部组件（Hero 区域）
│   │   ├── Nav.tsx          # 导航栏（固定顶部）
│   │   ├── Footer.tsx       # 页脚
│   │   ├── Carousel.tsx     # 轮播图
│   │   └── OrbBackground.tsx # 3D 背景球
│   ├── pages/               # 页面组件
│   │   └── Home.tsx         # 首页
│   ├── styles/              # 样式文件
│   │   ├── main.scss        # 主样式文件
│   │   ├── custom.scss      # 自定义样式
│   │   └── libs/            # 样式库
│   ├── utils/               # 工具函数
│   │   └── animations.ts    # GSAP 动画
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式（Tailwind）
├── public/                  # 静态资源
│   ├── images/              # 图片资源
│   ├── css/                 # CSS 资源
│   └── fontawesome-all.min.css
├── vercel.json              # Vercel 部署配置
├── package.json
├── tailwind.config.js       # Tailwind 配置
└── vite.config.ts           # Vite 配置
```

## 🎯 主要功能

### 1. 现代化导航栏
- 固定顶部导航
- 滚动时背景变化
- 移动端响应式菜单
- Clerk 用户认证集成
- 平滑滚动到锚点

### 2. Hero 区域
- 3D 球体背景效果
- 旋转文字动画
- 现代化按钮设计
- 响应式布局

### 3. 功能卡片
- 卡片式布局
- GSAP 滚动动画
- 3D 倾斜悬停效果
- 图片缩放效果
- 响应式网格

### 4. 轮播图
- 横向滚动
- 桌面端导航按钮
- 移动端滚动指示器
- 平滑滚动动画

### 5. 现代化页脚
- 下载链接
- 文档链接
- 社交媒体链接
- 清晰的版权信息

## 📱 响应式设计

- **移动端**：< 768px
- **平板**：768px - 1024px
- **桌面**：> 1024px

## 🎨 设计系统

### 颜色
- 主色：蓝色 (`blue-600`)
- 背景：米色 (`#EFEFE9`)
- 文字：深灰 (`gray-900`)

### 字体
- 主字体：Inter (Google Fonts)
- 系统字体：系统默认 sans-serif

### 动画
- GSAP 滚动触发动画
- 3D 倾斜效果
- 淡入淡出动画
- 平滑过渡

## 📝 路由

- `/` - 首页

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `src/App.tsx` 添加路由
3. 使用 Tailwind CSS 类名添加样式

### 自定义样式

1. 在 `tailwind.config.js` 扩展主题
2. 在 `src/index.css` 添加自定义 CSS
3. 使用 Tailwind 工具类

### 添加动画

1. 在 `src/utils/animations.ts` 添加新动画函数
2. 在组件中使用 `useEffect` 调用动画
3. 使用 GSAP ScrollTrigger 创建滚动动画

## 🐛 常见问题

### 样式不生效？
- 检查浏览器控制台是否有错误
- 确认 Tailwind CSS 已正确配置
- 清除浏览器缓存

### 图片不显示？
- 确认图片路径使用 `/images/` 绝对路径
- 检查 `public/images/` 目录是否有图片

### Clerk 登录不工作？
- 检查环境变量 `VITE_CLERK_PUBLISHABLE_KEY` 是否正确配置
- 在 Clerk Dashboard 中配置回调 URL
- 查看浏览器控制台错误信息

### 构建失败？
- 检查 TypeScript 类型错误
- 确认所有依赖已正确安装
- 查看构建日志中的错误信息

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！
