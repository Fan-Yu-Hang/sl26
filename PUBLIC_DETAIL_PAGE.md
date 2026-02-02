# 详情页公开访问说明

## 已实现（前端）

- **路由**：`/imagebox/:id` 为详情页。
- **数据**：从 Table Editor 的 `image_boxes` 表**仅按 `id` 查询**（不再按 `user_id` 过滤），所有人（含未登录）都能请求到同一条数据。
- **展示**：未登录或非项目所有者也能看到**图片和文字**（`image_url`、`title`、`marks`、`text_store` 预填图层）。
- **编辑**：仅当当前用户为项目所有者时显示「Publish Changes」；未登录或非所有者仅显示 “View only · Sign in as owner to edit”。

## 若未登录仍看不到数据（RLS）

若未登录访问详情页仍报错或空白，多半是 Supabase 的 **Row Level Security (RLS)** 只允许已登录用户读 `image_boxes`。

在 **Supabase Dashboard → SQL Editor** 中执行下面语句，为 `image_boxes` 增加一条「允许所有人（含 anon）读取」的 SELECT 策略：

```sql
-- 允许所有人（含未登录）读取 image_boxes，用于详情页公开查看
CREATE POLICY "Allow anyone to read image_boxes"
  ON public.image_boxes
  FOR SELECT
  USING (true);
```

执行后，未登录用户即可正常打开详情页并看到图片和文字。
