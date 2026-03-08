# TripAI
vibe coding项目，旅行规划与路线生成的 Web 应用 

## 项目展示

### 首页
<img width="2540" height="1172" alt="image" src="https://github.com/user-attachments/assets/8ceba74c-f869-4226-b106-016bcddc9e06" />

### 登录与注册
<img width="2551" height="1320" alt="image" src="https://github.com/user-attachments/assets/e9e5ab28-ef7f-4954-a2ad-b6064e3781d2" />

### 填写与选择行程要求
<img width="2536" height="1387" alt="image" src="https://github.com/user-attachments/assets/b618029e-f161-4186-856c-2be1e621fb02" />

### AI规划行程中
上海-杭州之旅：
<img width="2547" height="1332" alt="image" src="https://github.com/user-attachments/assets/c68abf8a-b446-472e-b84c-57c0d7bf4b3b" />
北京-天津之旅：
<img width="2546" height="1287" alt="image" src="https://github.com/user-attachments/assets/1258877b-3e9c-4d39-8b74-34af9176c3bd" />

### 行程规划与路线展示
<img width="2544" height="1392" alt="image" src="https://github.com/user-attachments/assets/9bb485c7-3ed4-4909-a60b-bbe542928a36" />

<img width="2549" height="1393" alt="image" src="https://github.com/user-attachments/assets/f5b27467-8e58-4c96-a27d-698f13d8db30" />

<img width="2547" height="1395" alt="image" src="https://github.com/user-attachments/assets/c2009845-b2ed-4e4c-a52e-7c285226f4c1" />


### 我的行程页，可保存行程或分享给好友
<img width="2546" height="793" alt="image" src="https://github.com/user-attachments/assets/2a04aa84-2068-4c47-b74d-b285c0ec4a9e" />


# 旅行规划与路线生成 Web 应用 - 实现计划

## 项目概述

从零构建一个旅行规划与路线生成的全栈 Web 应用，用户输入旅行需求后，AI 自动生成个性化行程攻略并在地图上可视化展示路线。支持行程编辑、保存和分享。

## 技术栈

| 层级     | 技术选型                       |
| -------- | ------------------------------ |
| 前端框架 | Vue 3 + TypeScript + Vite      |
| UI组件库 | Element Plus (Morandi主题定制) |
| 状态管理 | Pinia                          |
| 路由     | Vue Router 4                   |
| 地图     | 高德地图 JS API 2.0            |
| 后端     | Node.js + Express + TypeScript |
| 数据库   | SQLite (via Prisma ORM)        |
| AI       | DeepSeek API (流式SSE)         |
| 认证     | JWT                            |

## 密钥配置

- **DeepSeek API:** `https://api.deepseek.com`, key: `。`
- **高德 Web Key:** `c82a690e2e8341163e4de82c44c44335`, 安全密钥: `。`
- **高德 Service Key:** `。`

> 以上密钥存储在后端 `.env` 和前端 `.env` 文件中，不提交到版本控制。

---

## 整体架构

```
用户浏览器 (Vue 3 + AMap)
       │ HTTP REST + SSE
后端服务 (Express + TypeScript)
       ├── SQLite (数据持久化)
       ├── DeepSeek API (AI生成)
       └── AMap REST API (路线规划/地理编码)
```

---

## 项目目录结构

```
travel/
├── frontend/                     # Vue 3 前端
│   ├── public/
│   ├── src/
│   │   ├── api/                  # API调用层
│   │   │   ├── client.ts         # Axios实例+拦截器
│   │   │   ├── auth.ts
│   │   │   ├── itinerary.ts
│   │   │   └── ai.ts             # SSE连接
│   │   ├── assets/
│   │   │   ├── icons/            # 手绘风格SVG图标
│   │   │   └── styles/
│   │   │       ├── main.css
│   │   │       └── morandi.css   # Morandi色系变量
│   │   ├── components/
│   │   │   ├── common/           # AppHeader, ShareModal, LoadingSpinner
│   │   │   ├── planning/         # PlanningForm, DestinationSearch, TravelerConfig
│   │   │   ├── itinerary/        # DayTimeline, SpotItem, ItineraryEditor
│   │   │   ├── map/              # TravelMap, SpotMarker, MapLegend
│   │   │   └── user/             # LoginForm, RegisterForm
│   │   ├── composables/
│   │   │   ├── useAMap.ts        # 地图初始化与操作
│   │   │   ├── useAIStream.ts    # SSE流式接收
│   │   │   └── useItineraryDrag.ts
│   │   ├── stores/               # Pinia stores
│   │   │   ├── auth.ts
│   │   │   ├── itinerary.ts      # 核心行程状态
│   │   │   └── map.ts
│   │   ├── types/                # TypeScript类型
│   │   ├── utils/
│   │   │   ├── colors.ts         # Morandi颜色+多日配色
│   │   │   └── date.ts
│   │   ├── views/                # 页面组件
│   │   │   ├── HomeView.vue
│   │   │   ├── PlanningView.vue
│   │   │   ├── GeneratingView.vue
│   │   │   ├── ItineraryView.vue # 主工作区(行程+地图)
│   │   │   ├── MyTripsView.vue
│   │   │   ├── SharedView.vue
│   │   │   └── AuthView.vue
│   │   ├── router/index.ts
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                      # Express后端
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── itinerary.routes.ts
│   │   │   ├── ai.routes.ts      # SSE端点
│   │   │   └── share.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── deepseek.service.ts  # AI调用核心
│   │   │   ├── amap.service.ts      # 路线规划
│   │   │   └── share.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   ├── promptBuilder.ts     # Prompt构建器
│   │   │   └── responseParser.ts    # AI响应解析
│   │   ├── types/index.ts
│   │   └── app.ts
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
```

---

## 数据库设计 (Prisma Schema)

```prisma
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  username     String
  passwordHash String
  createdAt    DateTime    @default(now())
  itineraries  Itinerary[]
}

model Itinerary {
  id              String          @id @default(uuid())
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  title           String
  destinations    String          // JSON array string
  startDate       String
  endDate         String
  totalDays       Int
  adults          Int             @default(1)
  children        Int             @default(0)
  preferences     String          @default("")
  status          String          @default("draft") // draft | saved
  aiSummary       String          @default("")
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  days            ItineraryDay[]
  shareLinks      ShareLink[]
}

model ItineraryDay {
  id            String      @id @default(uuid())
  itineraryId   String
  itinerary     Itinerary   @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  dayNumber     Int
  date          String
  theme         String      @default("")
  hotelName     String      @default("")
  hotelAddress  String      @default("")
  hotelLat      Float?
  hotelLng      Float?
  notes         String      @default("")
  orderIndex    Int
  items         DayItem[]
}

model DayItem {
  id               String       @id @default(uuid())
  dayId            String
  day              ItineraryDay @relation(fields: [dayId], references: [id], onDelete: Cascade)
  type             String       // spot | restaurant | shopping | entertainment
  name             String
  address          String       @default("")
  lat              Float?
  lng              Float?
  description      String       @default("")
  estimatedMinutes Int          @default(60)
  orderIndex       Int
}

model ShareLink {
  id           String    @id @default(uuid())
  token        String    @unique
  itineraryId  String
  itinerary    Itinerary @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())
}
```

---

## API 端点设计

### 认证

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录(返回JWT)
- `GET /api/auth/me` - 当前用户信息

### 行程

- `GET /api/itineraries` - 我的行程列表
- `GET /api/itineraries/:id` - 行程详情(含days+items)
- `PUT /api/itineraries/:id` - 更新行程
- `DELETE /api/itineraries/:id` - 删除行程
- `PUT /api/itineraries/:id/days/:dayId/items` - 批量更新某天条目(含排序)
- `POST /api/itineraries/:id/days/:dayId/items` - 添加条目
- `DELETE /api/itineraries/:id/items/:itemId` - 删除条目

### AI

- `POST /api/ai/generate` - **SSE端点**: 流式生成行程
- `POST /api/ai/optimize` - 优化某天行程

### 分享

- `POST /api/itineraries/:id/share` - 生成分享链接
- `GET /api/share/:token` - 获取分享行程(无需登录)

### 地点

- `GET /api/places/search?keyword=&city=` - POI搜索(代理高德)

---

## SSE 流式生成设计

**事件类型:**

- `event: status` - 状态提示("正在分析偏好...")
- `event: day` - 某天行程完整JSON
- `event: complete` - 生成完毕，返回行程ID
- `event: error` - 错误

**DeepSeek Prompt 策略:**

- System Prompt 要求逐日输出严格 JSON
- 每天一个完整 JSON 对象，包含: theme, hotel, spots[], restaurants[], notes
- 后端逐段解析，每完成一天即推送 SSE event
- AI 返回的地点名称通过高德地理编码补全坐标

---

## 前端页面与核心交互

### 路由

```
/              → 首页(落地页+快速开始)
/auth          → 登录/注册
/plan          → 规划输入页
/generating    → AI生成中(流式展示)
/itinerary/:id → 主工作区(左:行程编辑 右:地图)
/my-trips      → 我的行程列表
/share/:token  → 只读分享页
```

### 主工作区布局 (ItineraryView)

```
┌──────────────────────────────────────────┐
│              AppHeader                    │
├────────────────────┬─────────────────────┤
│  行程编辑面板(40%)  │   高德地图(60%)      │
│  - 日期Tab切换      │   - 路线Polyline     │
│  - DayTimeline      │   - 自定义Marker     │
│  - 可拖拽SpotItem   │   - 多日颜色区分     │
│  - 添加/删除按钮    │   - MapLegend图例    │
├────────────────────┴─────────────────────┤
│     操作栏: 保存 | 分享 | 导出            │
└──────────────────────────────────────────┘
```

### Morandi 色系

```css
--morandi-primary: #B5A99A;     /* 温暖灰棕 */
--morandi-secondary: #C4B8A8;
--morandi-bg: #F5F1EC;          /* 米白背景 */
--morandi-text: #6B5E52;
--morandi-accent: #9B8B7A;
--morandi-error: #C47B6A;
/* 多日路线颜色 */
--day-1: #A8B5C4; /* 灰蓝 */
--day-2: #B5C4A8; /* 灰绿 */
--day-3: #C4B8A8; /* 灰棕 */
--day-4: #C4A8B5; /* 灰紫 */
--day-5: #C4C4A8; /* 灰黄 */
```

---

## 实现步骤

### 阶段1: 项目初始化

1. 创建 `frontend/` - Vite + Vue 3 + TS 项目
2. 创建 `backend/` - Express + TS + Prisma 项目
3. 安装依赖: Element Plus, Pinia, Vue Router, Axios, @amap/amap-jsapi-loader, vue-draggable-plus
4. 后端依赖: express, prisma, @prisma/client, jsonwebtoken, bcryptjs, zod, cors, dotenv
5. 配置 Morandi 主题 CSS 变量，覆盖 Element Plus 默认样式
6. 配置 Prisma schema + SQLite，执行 migrate

### 阶段2: 用户认证

7. 后端: auth routes + controller + service (register/login/me)
8. 前端: AuthView (登录/注册), auth store, Axios JWT 拦截器, 路由守卫

### 阶段3: 规划输入页

9. 前端: PlanningView + PlanningForm (目的地搜索/日期/人数/偏好)
10. 后端: /api/places/search 代理高德 POI 搜索
11. 前端: HomeView 落地页

### 阶段4: AI生成核心 (最关键)

12. 后端: promptBuilder.ts - 构建高质量 prompt
13. 后端: deepseek.service.ts - 调用 DeepSeek streaming API
14. 后端: responseParser.ts - 解析 AI JSON 输出
15. 后端: /api/ai/generate SSE 端点 - 转发流式响应
16. 后端: amap.service.ts - 地理编码(地名→坐标)
17. 前端: useAIStream.ts composable - SSE 接收
18. 前端: GeneratingView - 流式展示动画

### 阶段5: 地图与行程展示

19. 前端: useAMap.ts - 高德地图初始化
20. 前端: TravelMap + SpotMarker + DayRouteLayer
21. 前端: DayTimeline + SpotItem + ItineraryEditor
22. 前端: ItineraryView 主工作区 (左右布局)
23. 后端: 路线规划 API (调用高德驾车/步行路线)

### 阶段6: 行程编辑

24. 前端: 集成 vue-draggable-plus 拖拽排序
25. 前端/后端: 添加/删除景点, 批量更新条目
26. 前端: 编辑后自动重算路线

### 阶段7: 保存与分享

27. 后端: 行程 CRUD 完善 + share service
28. 前端: MyTripsView 行程列表
29. 前端: ShareModal + SharedView 只读分享页

### 阶段8: 完善与优化

30. 手绘风格图标设计
31. 加载动画、空状态、错误处理
32. 响应式布局
33. 端到端测试

---

## 高德地图集成要点

- 使用 `@amap/amap-jsapi-loader` 加载 JS API 2.0
- Web端Key用于前端地图展示，需配置安全密钥(SecurityJsCode)
- Service Key用于后端路线规划和地理编码REST API
- 路线: 距离<5km用步行规划，>5km用驾车规划
- 多日颜色: 不同天的Polyline使用不同Morandi色
- 自定义Marker: 手绘风格SVG图标区分景点/餐厅/酒店

---

## 验证方案

1. **前端启动:** `cd frontend && npm run dev` - 访问 localhost:5173 验证页面渲染
2. **后端启动:** `cd backend && npm run dev` - 验证 API 响应
3. **数据库:** `npx prisma studio` - 检查数据结构
4. **用户流程测试:**
   - 注册/登录 → 输入旅行需求 → AI生成行程(流式) → 地图展示路线 → 拖拽编辑 → 保存 → 分享链接访问
5. **关键检查点:**
   - SSE 流式响应是否正常接收并渲染
   - 高德地图路线是否正确绘制
   - 拖拽排序后路线是否实时更新
   - 分享链接能否正常访问只读行程
