# layer_box → layers + iframes 迁移计划

> **当前策略**：不做历史数据迁移，layer_box 表暂保留；仅前端应用逻辑切换为读写 layers + iframes。

## 一、目标与现状理解

### 1.1 当前模型（layer_box）

- **表**：`layer_box`，一行 = 一个「项目」。
- **字段**：`id`, `clerk_id`, `layer_title`, `image_url`, `marks`, `text_store`, `user_scale`, `tx`, `ty`, `audio_url`, `created_at`, `updated_at`。
- **前端**：
  - **Dashboard**：按 `clerk_id` 查 `layer_box`，列表展示，点击进入 `/imagebox/:id`。
  - **ImageBoxPage**：`id` 有值则按 id 拉取一条 `layer_box`，否则新建；页面只处理**单张图片**（一个 ImageBox），保存时整行 update 或 insert。
  - **ImageBox**：接收/回写 `layer_title`, `image_url`, `marks`, `text_store`, `user_scale`, `tx`, `ty`, `audio_url`；`marks` 为 `{ id, x, y }[]`，`text_store` 为 `Record<number, string>`（mark id → 文案）。

### 1.2 目标模型（layers + iframes）

- **layers**：一行 = 一个「图层/项目」，可对应**多张图片**（多个 iframe）。
  - 字段：`id`, `clerk_id`, `layer_title`, `iframe_ids` (bigint[]), `audio_url`, `created_at`, `updated_at`。
- **iframes**：一行 = 一张图及其在该图上的标注。
  - 字段：`id`, `layer_id`, `image_scale`, `tx`, `ty`, `image_url`, `marks`, `created_at`, `updated_at`。
  - `marks` 格式：`[{ "tx": number, "ty": number, "text": string }, ...]`（与当前 ImageBox 的 `marks + text_store` 语义一致，但结构不同）。

### 1.3 语义对应

| layer_box（当前）     | layers + iframes（目标） |
|-----------------------|--------------------------|
| 1 行 = 1 个项目       | 1 个 layer = 1 个项目    |
| 1 张图 + 1 组 marks   | 1 个 iframe = 1 张图 + 1 组 marks |
| marks: `{id,x,y}[]` + text_store | iframes.marks: `{tx,ty,text}[]` |
| user_scale, tx, ty   | iframes.image_scale, tx, ty     |
| layer_title, audio_url, clerk_id | layers.layer_title, audio_url, clerk_id |

---

## 二、数据迁移（DB）

### 2.1 映射规则

- 每条 **layer_box** 生成：
  - 1 条 **layer**：`clerk_id`, `layer_title`, `audio_url`, `created_at`, `updated_at`；`iframe_ids` 先不填。
  - 1 条 **iframe**：`layer_id` = 刚插入的 layer.id，`image_url`, `user_scale`→`image_scale`, `tx`, `ty` 照抄；`marks` 由下方转换。
- **marks 转换**：  
  `layer_box.marks` 为 `[{ id, x, y }, ...]`，`text_store` 为 `{ [id]: text }`。  
  生成 iframe 的 `marks`：  
  `(marks || []).map(m => ({ tx: m.x, ty: m.y, text: (text_store && text_store[m.id]) || '' }))`。

### 2.2 迁移 SQL（供 Review，不自动执行）

```sql
-- 1. 插入 layers（来自 layer_box）
INSERT INTO public.layers (clerk_id, layer_title, audio_url, created_at, updated_at)
SELECT clerk_id, layer_title, audio_url, created_at, updated_at
FROM public.layer_box
ORDER BY id;

-- 2. 插入 iframes（来自 layer_box），并关联到刚插入的 layer
-- 依赖：layers 与 layer_box 能按顺序对应（例如用 created_at 或临时映射表）
-- 推荐：用 PL/pgSQL 或应用脚本逐行处理，保证 layer_id 正确

-- 示例（需在应用层或 DO 块中建立 layer_box.id → new layer.id 的映射）：
-- 若保留 layer_box.id 与 新 layer.id 一致（例如先 insert layers 时指定 id），则可：
/*
INSERT INTO public.iframes (layer_id, image_scale, tx, ty, image_url, marks, created_at, updated_at)
SELECT
  lb.id AS layer_id,  -- 若 layers.id 与 layer_box.id 一致
  COALESCE(lb.user_scale, 1),
  COALESCE(lb.tx, 0),
  COALESCE(lb.ty, 0),
  lb.image_url,
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'tx', (m->>'x')::float,
          'ty', (m->>'y')::float,
          'text', COALESCE(lb.text_store->>(m->>'id'), '')
        )
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(COALESCE(lb.marks, '[]'::jsonb)) AS m
  ),
  lb.created_at,
  lb.updated_at
FROM public.layer_box lb;
*/
```

更稳妥做法：**应用层脚本**（TypeScript/Node）或 **Supabase Edge Function** 中：

1. 查询所有 `layer_box`。
2. 对每行：insert into `layers` 取回 `layer.id`；构造 `marks` JSON；insert into `iframes` 设 `layer_id = layer.id`。
3. 再 update `layers`  set `iframe_ids = ARRAY[iframe.id]`  where `id = layer.id`。

（若你希望用纯 SQL 一次完成，可先做「临时表存 layer_box.id → new layer.id」，再按上述逻辑写 INSERT/UPDATE。）

### 2.3 建议执行顺序

1. 备份 `layer_box`（或先只读迁移，不删表）。
2. 执行数据迁移（layers + iframes），并维护 `layers.iframe_ids`。
3. 校验：条数一致、抽样对比 marks/text 与 image 字段。
4. 再切换前端到新表；**不**在未切换前删除或清空 `layer_box`，便于回滚。

---

## 三、前端迁移（应用层）

### 3.1 路由与数据加载

- **路由**：保持 `/imagebox`（新建）、`/imagebox/:id`（编辑）。  
  - 约定：`:id` 为 **layer 的 id**（不再表示 layer_box.id）。
- **ImageBoxPage 加载**：
  - 有 `id`：  
    - 查 `layers` 一条（by id），得到 `layer_title`, `audio_url`, `clerk_id`, `iframe_ids`。  
    - 用 `iframe_ids` 或 `layer_id` 查 `iframes`（按顺序），得到多张图的 `image_url`, `image_scale`, `tx`, `ty`, `marks`。
  - 无 `id`：新建 layer，暂无 iframe 或先建一个空 iframe，再进入编辑。

### 3.2 页面结构（一个 layer 对应多张图）

- **Layer 级**（当前页头/插槽已有）：  
  - 标题、音频、Save、Back。  
  - 保存时写 **layers**：`layer_title`, `audio_url`, `clerk_id`，以及当前的 `iframe_ids`（顺序与 UI 一致）。
- **多图**：  
  - 用「当前选中的 iframe」驱动一个 ImageBox（或每个 iframe 一个 ImageBox，按需）。  
  - UI 上可：**Tab / 下拉 / 左侧列表** 切换「当前 iframe」；支持**新增一张图、删除当前图、调整顺序**。  
  - 每张图的编辑状态（image_url, marks, scale, tx, ty）对应一个 iframe；保存时写 **iframes**（按 iframe id update，或新图 insert 后把新 id 加入 `layers.iframe_ids`）。

### 3.3 ImageBox 与 iframes 的对接

- **入参**：  
  - 从 iframe 来：`initialImageSrc`=iframe.image_url，`initialMarks`/`initialTextStore` 由 iframes.marks 转换（见下），`initialUserScale`=image_scale，`initialTx`/`initialTy`=tx/ty。  
  - 不再传 `layer_title` 进 ImageBox（标题只在页面层写 layers）；可保留 `audioUrl` 在页面层写 layers。
- **出参**：  
  - 保存时：当前 iframe 的 `image_url`, `marks`, `image_scale`, `tx`, `ty`。  
  - 将 ImageBox 的 `marks` + `text_store` 转成 iframes 的 `marks`：  
    `marks.map(m => ({ tx: m.x, ty: m.y, text: text_store[m.id] ?? '' }))`。
- **表**：ImageBox 内部或页面层调用 Supabase 时，**写 iframes 表**（update by iframe.id 或 insert 新 iframe），不再写 layer_box。

### 3.4 marks 格式转换（前后端一致）

- **DB → 组件**（iframes.marks → ImageBox）：  
  `iframe.marks` 为 `[{ tx, ty, text }, ...]`  
  → `marks = data.marks.map((m, i) => ({ id: i + 1, x: m.tx, y: m.ty }))`  
  → `text_store = data.marks.reduce((acc, m, i) => ({ ...acc, [i + 1]: m.text }), {})`  
  （id 用 1-based 与现有 ImageBox 习惯一致。）
- **组件 → DB**（ImageBox 输出 → iframes.marks）：  
  `marks.map(m => ({ tx: m.x, ty: m.y, text: textStore.get(m.id) ?? '' }))`。

### 3.5 Dashboard

- 列表数据源改为 **layers**：  
  `supabase.from('layers').select('id, layer_title, created_at, iframe_ids').eq('clerk_id', user.id).order('created_at', { ascending: false })`。
- 列表项展示：  
  - 标题：`layer_title`。  
  - 缩略图：用 `iframe_ids[0]` 查一条 iframe 取 `image_url`，或后续在 layers 加冗余字段 `cover_image_url`（可选）。  
- 点击进入：`navigate('/imagebox/' + layer.id)`。  
- 删除：改为对 **layers** 表 delete（若需级联删 iframes，DB 已用 `ON DELETE CASCADE` 则自动）。

### 3.6 新建流程（无 id）

- 用户点「New Project」→ 进入 `/imagebox`。  
- 可选 A：先不插 layer，仅前端状态「新建」，点 Save 时：insert layer（+ 当前用户 clerk_id）→ insert 一个 iframe（当前 ImageBox 数据）→ update layer.iframe_ids = [新 iframe.id]。  
- 可选 B：进入时即 insert layer + 一个空 iframe，再带 layer.id 重定向到 `/imagebox/:id`（与编辑同一套加载逻辑）。  
- 多图：在编辑页提供「添加一张图」，即 insert 新 iframe 并 append 到 `layers.iframe_ids`，再在 UI 切到新 iframe 编辑。

---

## 四、实施顺序建议（供 Review）

| 阶段 | 内容 | 风险/回滚 |
|------|------|------------|
| 1. 数据迁移 | 写脚本/SQL：layer_box → layers + iframes，校验一致 | 不删 layer_box，可回滚前端 |
| 2. 类型与 API | 生成/更新 Supabase 类型；封装「读 layer+iframes」「写 layer」「写 iframe」 | 低 |
| 3. ImageBox 适配 | ImageBox 支持「只写 iframe 字段」+ marks 双格式转换；或由页面做转换、ImageBox 接口不变 | 中，可保留旧接口做兼容 |
| 4. ImageBoxPage 改造 | 按 layer id 加载 layer + iframes；多 iframe UI（Tab/列表）；保存写 layers + 当前/全部 iframes | 中 |
| 5. Dashboard 改造 | 列表改 layers，缩略图用首 iframe 或 cover_image_url，删除改 layers | 低 |
| 6. 路由与新建 | 统一 /imagebox/:layerId；新建流程二选一（A 或 B） | 低 |
| 7. 下线 layer_box | 确认无引用后，可归档或删除 layer_box 表 | 最后一步 |

---

## 五、小结

- **数据**：每行 layer_box → 1 layer + 1 iframe；marks/text_store 合并为 iframes.marks 的 `{tx, ty, text}[]`；layers.iframe_ids 维护该 layer 下 iframe id 列表。  
- **前端**：一个 layer 页面对应一个 layer、多张图（多个 iframe）；ImageBox 只负责单图编辑，写 iframes；页头/音频/标题写 layers；Dashboard 读 layers，入口为 layer id。  
- **迁移**：先做数据迁移与校验，再改前端；不先删 layer_box，便于回滚。

如需，我可以下一步写出「数据迁移用的一条条 SQL」或「TypeScript 迁移脚本」的具体版本供你直接执行/跑。
