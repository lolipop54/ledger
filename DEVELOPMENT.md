# Vant Vue Ledger 项目开发文档

## 1. 项目概述

### 1.1 项目简介

**Vant Vue Ledger** 是一款基于现代 Web 技术栈构建的移动端记账应用。它旨在提供轻量、流畅且美观的记账体验，帮助用户轻松管理个人财务。该项目采用 **Vue 3** 作为核心框架，结合 **Vite** 进行极速构建，并使用 **Vant 4** 组件库打造原生应用级的 UI 交互。为了满足移动端跨平台的需求，项目集成了 **Capacitor**，能够将 Web 应用无缝打包为 Android 原生应用。

本项目不仅是一个功能完备的记账工具，也是一个优秀的 Vue 3 移动端开发实战案例，涵盖了状态管理、数据持久化、图表可视化、移动端适配等多个核心技术点。

### 1.2 核心功能特性

*   **极速记账**：优化的交互流程，支持收入/支出快速切换，内置计算器键盘，三步即可完成一笔交易记录。
*   **数据持久化**：采用 **IndexedDB** 作为本地存储方案，相比 LocalStorage 具有更大的存储空间和更好的性能，支持海量数据的流畅读写。
*   **多维度统计**：
    *   **首页概览**：实时显示当月收入、支出及结余，按日期分组展示交易明细。
    *   **统计看板**：集成 **ECharts 6**，提供直观的饼图分析，清晰展示各类目消费占比。支持查看各分类下的 Top 10 交易排行。
*   **分类管理**：
    *   预置丰富的消费和收入分类（如餐饮、交通、购物、工资等）。
    *   支持自定义分类管理，用户可以进入编辑模式删除不常用的分类或新增个性化分类。
    *   分类图标支持大量自定义的图片资源。
*   **离线可用**：所有数据存储在本地，无需网络即可完整使用所有功能，保护用户隐私。

### 1.3 设计理念

*   **Mobile First**：所有交互设计均优先考虑移动端操作习惯，如底部导航、底部弹窗、大按钮点击区域等。
*   **Less is More**：界面保持简洁，去除冗余信息，聚焦核心记账需求。
*   **Component Driven**：高度组件化开发，保证代码的可维护性和复用性。

---

## 2. 技术架构与选型

### 2.1 技术栈概览

| 技术/库 | 版本 | 说明 |
| :--- | :--- | :--- |
| **Vue.js** | ^3.4.0 | 核心前端框架，使用 组合式 API 进行逻辑复用。 |
| **Vite** | ^5.0.0 | 下一代前端构建工具，提供极速的冷启动和热更新 (HMR)。 |
| **Vant** | ^4.9.21 | 有赞开源的轻量、可靠的移动端 Vue 组件库。 |
| **Vue Router** | ^4.3.0 | 官方路由管理器，使用 Hash 模式以适配 WebView 环境。 |
| **ECharts** | ^6.0.0 | 强大的数据可视化库，用于生成统计图表。 |
| **Capacitor** | ^6.1.2 | 跨平台移动应用运行时，将 Web App 封装为 Android APK。 |
| **IndexedDB** | Native | 浏览器原生数据库，用于本地大数据量存储。 |

### 2.3 目录结构说明

项目的目录结构遵循 Vue 3 最佳实践，清晰分层：

```
f:\CODE\myapp\
├── android/                 # Android 原生工程目录 (由 Capacitor 生成)
├── dist/                    # 构建产出目录 (Web 静态资源)
├── public/                  # 静态资源目录 (不经过 Vite 编译)
├── src/                     # 源代码目录
│   ├── assets/              # 静态资源
│   │   ├── 个人/            # 分类图标资源
│   │   ├── 交通/
│   │   └── ...
│   ├── components/          # 公共组件
│   │   └── TransactionItem.vue # 交易记录列表项组件
│   ├── composables/         # 组合式 API (业务逻辑层)
│   │   └── useLedger.js     # 核心：账单数据管理、IndexedDB 封装
│   ├── router/              # 路由配置
│   │   └── index.js
│   ├── views/               # 页面视图
│   │   ├── Add.vue          # 记账页面
│   │   ├── Home.vue         # 首页
│   │   └── Stats.vue        # 统计页面
│   ├── App.vue              # 根组件 (包含全局 Layout 和 Tabbar)
│   └── main.js              # 入口文件 (应用挂载、全局插件注册)
├── capacitor.config.json    # Capacitor 配置文件
├── package.json             # 项目依赖与脚本配置
├── vite.config.js           # Vite 构建配置
└── README.md                # 项目说明文档
```

---

## 3. 快速开始 (Quick Start)

### 3.1 环境准备
在开始之前，请确保您的开发环境满足以下要求：
*   **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
*   **包管理器**: npm 或 yarn
*   **Android Studio**: 如果需要进行 Android 打包，需安装 Android Studio 及相应的 Android SDK。

### 3.2 安装依赖

打开终端，进入项目根目录，执行以下命令安装项目依赖：

```bash
npm install
```

### 3.3 启动开发服务器

依赖安装完成后，启动本地开发服务器：

```bash
npm run dev
```

终端将输出访问地址（通常是 `http://localhost:5173`）。在浏览器中打开该地址，即可看到应用运行效果。Vite 支持热模块替换 (HMR)，修改代码后浏览器会自动刷新。

### 3.4 构建生产版本

当开发完成准备发布时，执行构建命令：

```bash
pnpm build
```

该命令会调用 Vite 进行打包，编译后的静态文件将生成在 `dist/` 目录下。

### 3.5 移动端打包 (Android)

本项目已经集成了 Capacitor。如果您是首次打包，需要初始化环境：

```bash
# 1. 初始化 Capacitor (仅首次)
# 注意：这将创建 android 目录，如果已存在则无需执行
# npm run cap:init

# 2. 添加 Android 平台 (仅首次)
npm run cap:add:android
```

日常打包流程：

```bash
# 1. 构建 Web 资源
pnpm build

# 2. 将 dist 目录同步到 android/app/src/main/assets/public
npm run cap:copy
npm run cap:sync

# 3. 打开 Android Studio 进行编译和运行
npm run cap:open:android
```

在 Android Studio 中，连接真机或启动模拟器，点击 "Run" 按钮即可安装 App。如需生成 Release 包，可在 Android Studio 菜单栏选择 `Build > Generate Signed Bundle / APK`。

---

## 4. 核心模块详解

### 4.1 数据存储层：IndexedDB 封装与版本迁移

数据存储是本项目的基石。为了屏蔽 `IndexedDB` 复杂的原生 API，我们在 `src/composables/useLedger.js` 中实现了一个 `StorageManager` 类。

#### 4.1.1 StorageManager 类设计

`StorageManager` 负责所有的底层数据库交互。它采用了单例模式的思想，在模块加载时即被实例化。

**初始化 (init 方法)**：
`init` 方法是异步的，它承担了至关重要的“数据清洗与迁移”工作。
1.  **LocalStorage 迁移检查**：为了兼容旧版本，它首先检查 LocalStorage 中是否存在 `ledger_records_v1`。如果存在，将其读取出来并保存到 IndexedDB，然后清除 LocalStorage。这保证了用户从旧版本升级上来时数据不丢失。
2.  **加载数据**：并行加载交易记录 (`records`) 和分类配置 (`categories`) 到内存缓存 (`this.recordsCache`, `this.categoriesCache`)。
3.  **默认数据注入**：如果数据库是空的（首次安装），它会将 `DEFAULT_CATEGORIES` 写入数据库，确保用户打开应用就有可用的分类。

**数据库连接与升级 (loadFromIndexedDB 方法)**：
这是整个存储层最复杂也是最精彩的部分。我们利用 `IndexedDB` 的版本控制机制 (`DB_VERSION = 3`) 来处理数据结构的变更。

```javascript
// src/composables/useLedger.js 核心代码片段

async loadFromIndexedDB(key) {
  return new Promise((resolve) => {
    // 打开数据库，指定版本号 DB_VERSION
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // [关键] 数据库升级事件：当本地数据库版本低于 DB_VERSION 时触发
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const transaction = request.transaction;
      
      // 1. 建表：如果不存在 records 表，则创建
      if (!db.objectStoreNames.contains('records')) {
        db.createObjectStore('records');
      }

      // 2. 数据迁移逻辑：处理 v2 到 v3 的变更
      // 场景：在 v3 版本中，我们更新了“通讯”分类的图标路径
      if (event.oldVersion < 3) {
        console.log('正在执行数据库迁移: v2 -> v3');
        const store = transaction.objectStore('records');
        
        // 读取现有分类配置
        const getReq = store.get(CATEGORIES_KEY);
        
        getReq.onsuccess = (e) => {
          const data = e.target.result;
          if (data && data.expense) {
            // 找到“通讯”分类
            const targetCat = data.expense.find(c => c.value === '通讯');
            if (targetCat) {
              // 修正图标路径
              targetCat.icon = '个人/通讯.png'; 
              // 写回数据库
              store.put(data, CATEGORIES_KEY);
            }
          }
        };
      }
    };
    // ... 省略 success 和 error 处理
  });
}
```

**解析**：
*   `onupgradeneeded` 是 IndexedDB 唯一可以修改数据库结构（创建/删除 ObjectStore）或执行大规模数据迁移的地方。
*   我们在这里检查 `event.oldVersion`。如果用户之前的版本是 2，升级到 3 时，代码会自动修正“通讯”分类的图标路径。这种机制保证了应用可以平滑迭代，无需强制用户清除数据。

#### 4.1.2 响应式状态管理 (useLedger)

`StorageManager` 只是底层工具，`useLedger` 才是面向组件的接口。它利用 Vue 的 Reactivity 系统实现了数据的“自动保存”。

```javascript
// src/composables/useLedger.js

// 全局状态（单例模式，保证不同组件访问的是同一份数据）
const records = ref([]);
const categoriesState = ref(JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)));

export function useLedger() {
  // ...

  // [核心] 监听器：一旦 records 发生变化（增删改），立即同步到 IndexedDB
  watch(records, (val) => {
    storageManager.saveRecords(val).catch(e => console.error(e));
  }, { deep: true });

  // 同理，监听分类配置的变化
  watch(categoriesState, (val) => {
    storageManager.saveCategories(val).catch(e => console.error(e));
  }, { deep: true });

  // ...
}
```

**设计优势**：
*   **解耦**：UI 组件（如 `Add.vue`）只需要修改 `records.value`，无需关心数据何时、如何被保存到数据库。
*   **实时性**：`watch` 的 `deep: true` 选项确保了即使是对象内部属性的变化也能被捕获。

### 4.2 业务逻辑实现

#### 4.2.1 交易记录的分组展示 (Home.vue)

首页的一个核心需求是将扁平的交易记录数组按日期分组展示。我们在 `useLedger.js` 中实现了 `groupsByDateOf` 计算属性。

**算法逻辑**：
1.  **输入**：当前月份 `ym` (例如 "2023-10") 和所有记录 `records`。
2.  **过滤**：筛选出 `date` 字段匹配当前月份的记录。
3.  **分组**：遍历筛选后的记录，以日期（"2023-10-01"）为 Key，存入 Map。
4.  **汇总**：遍历 Map，计算每一天的收入总和与支出总和。
5.  **排序**：将分组后的数组按日期倒序排列（最近的日期在最前）。

```javascript
// 伪代码示例
const groupsByDateOf = (ym) => {
  const map = new Map();
  // 1. 分组
  for (const r of records.value) {
    if (monthOf(r) !== ym) continue;
    const dateKey = dayOf(r);
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey).push(r);
  }
  // 2. 格式化输出
  return Array.from(map.entries()).map(([date, list]) => ({
    date,
    list, // 当天的记录列表
    total: summarize(list) // 当天的收支汇总 { expense: 100, income: 0 }
  })).sort((a, b) => b.date.localeCompare(a.date));
};
```

#### 4.2.2 统计图表数据处理 (Stats.vue)

ECharts 需要特定格式的数据（`{ name: '餐饮', value: 100 }`）。`Stats.vue` 负责将 `records` 转换为这种格式，并计算百分比和分配颜色。

**颜色分配策略**：
为了让图表更美观，我们定义了一个颜色池 `VIBRANT_COLORS`。在生成图表数据时，根据分类在数组中的索引取模来分配颜色，保证相邻或不同分类有区分度。

```javascript
// Stats.vue
const VIBRANT_COLORS = [
  '#FF7675', '#74b9ff', '#55efc4', '#a29bfe', // ... 更多颜色
];

// 数据转换逻辑
const expensePieData = computed(() => {
  const map = {};
  // 1. 聚合计算
  currentMonthRecords.value.filter(r => r.type === 'expense').forEach(r => {
    if (!map[r.category]) map[r.category] = 0;
    map[r.category] += r.amount;
  });
  
  // 2. 转换为数组并排序
  return Object.entries(map)
    .map(([cat, amount], index) => ({
      category: cat,
      total: amount,
      color: VIBRANT_COLORS[index % VIBRANT_COLORS.length], // 循环分配颜色
      // ...
    }))
    .sort((a, b) => b.total - a.total); // 按金额降序
});
```

---

## 5. 页面与组件开发详解

### 5.1 首页 (Home.vue)

首页是用户进入应用的第一屏，承担着展示概览和明细的任务。

**布局结构**：
*   **Hero 区域**：采用深色或渐变背景，突出显示“本月收入”和“本月支出”。这里放置了月份选择器。
    *   **月份选择**：点击月份触发 `van-popup`，内部嵌套 `van-date-picker`。这里使用了 `columns-type=['year', 'month']` 来限制只能选择年月。
*   **列表区域**：
    *   **空状态 (Empty State)**：当 `monthGroups` 为空时，展示一个带有插画（Emoji）和引导按钮的区域。
    *   **分组列表**：使用 `v-for` 遍历 `monthGroups`。外层渲染日期头，内层渲染 `TransactionItem`。

**交互细节**：
*   **下拉刷新**：虽然数据是本地的，但为了防备数据不同步（极端情况），保留了重新加载数据的接口。
*   **左滑操作**：`TransactionItem` 内部封装了 `van-swipe-cell`。在首页，用户左滑某条记录可以看到“编辑”和“删除”按钮。这里通过 `@update` 和 `@remove` 事件将操作冒泡给父组件处理。

### 5.2 记账页 (Add.vue)

这是应用最高频使用的页面，交互设计至关重要。

**模式切换**：
页面顶部有两个 Tab：支出、收入。点击切换时，不仅改变 `currentType` 状态，还会触发分类列表的切换（`expenseCategories` vs `incomeCategories`）。

**分类网格 (Grid)**：
*   使用 Flex 布局实现自适应网格。
*   **编辑模式**：点击右上角的“编辑”按钮进入编辑模式。
    *   **视觉反馈**：进入编辑模式后，所有分类图标会添加 `shaking` 类，通过 CSS `@keyframes` 实现类似于 iOS 桌面图标删除时的抖动效果。
    *   **删除功能**：图标右上角出现红色的 `x` 号。点击触发 `removeCategory`。注意：系统预置的“其他”分类被硬编码保护，不可删除。
    *   **新增功能**：列表末尾会出现一个“新增”按钮，点击弹出对话框输入新分类名称。

**数字键盘**：
为了提供更好的输入体验，我们没有使用原生软键盘，而是自定义了一个数字键盘区域（虽然 Vant 提供了 `NumberKeyboard`，但为了更深度的定制 UI，本项目结合使用了 Vant 组件和自定义样式）。
*   **折叠/展开**：键盘上方有一个 `collapse-bar`，允许用户收起键盘查看底部内容。
*   **备注输入**：键盘上方集成了备注输入框和日期选择入口，保证用户在一个视口内完成所有信息的录入。

### 5.3 统计页 (Stats.vue)

**ECharts 集成**：
在 Vue 3 中集成 ECharts 需要注意 DOM 的生命周期。
1.  **引用**：使用 `ref="expenseChartRef"` 获取 DOM 节点。
2.  **初始化**：在 `onMounted` 钩子中调用 `echarts.init`。
3.  **响应式更新**：使用 `watch` 监听 `expensePieData`。一旦数据变化，调用 `chartInstance.setOption` 更新图表。
4.  **防内存泄漏**：在 `onUnmounted` 中调用 `chartInstance.dispose()` 销毁实例。

**展开详情 (Drill Down)**：
用户点击下方的分类列表项，会触发展开动画。
*   **实现原理**：维护一个 `expandedCategories` 对象（Map）。点击时切换对应 Key 的布尔值。
*   **数据获取**：展开区域显示该分类下的 Top 10 记录。这是通过 `getCategoryRecords` 方法实时过滤计算得出的。

### 5.4 列表项组件 (TransactionItem.vue)

这是一个高度复用的“哑组件” (Dumb Component)，只负责展示和抛出事件。

**Props**:
*   `record`: 必须，包含 `id`, `amount`, `type`, `category`, `date`, `note` 等字段的对象。

**图标动态加载**：
组件内部定义了 `getImageUrl` 函数。由于构建工具（Vite）处理静态资源路径的方式，我们需要使用 `new URL(path, import.meta.url).href` 来确保打包后图片路径依然正确。

```javascript
const getImageUrl = (type, categoryName) => {
  // ... 查找分类配置，获取 icon 路径
  // 假设 iconPath 为 '饮食/餐饮.png'
  return new URL(`../assets/${iconPath}`, import.meta.url).href;
};
```

---

## 6. 样式与适配

### 6.1 全局样式系统

项目使用了 CSS Variables (CSS 变量) 来管理主题色，定义在 `App.vue` 的 `:root` 中：

```css
:root {
  --clash-bg: #F0F2F5;       /* 背景灰 */
  --clash-black: #2D3436;    /* 主要文字色 */
  --clash-purple: #6C5CE7;   /* 主题紫 */
  --clash-green: #00B894;    /* 收入绿 */
  --clash-orange: #FF7675;   /* 支出红 */
  --safe-area-bottom: env(safe-area-inset-bottom, 0px); /* 底部安全区 */
}
```

### 6.2 移动端适配细节

1.  **Viewport 设置**：在 `index.html` 中设置了 `user-scalable=no`，防止用户误触缩放。
2.  **刘海屏与安全区**：
    *   底部导航栏 (`Tabbar`) 使用了 `padding-bottom: var(--safe-area-bottom)`，确保在 iPhone X 及后续机型上，按钮不会被底部横条遮挡。
    *   页面容器设置了 `min-height: 100vh`，保证在内容较少时也能撑满屏幕。
3.  **点击高亮去除**：设置 `-webkit-tap-highlight-color: transparent`，去除 iOS 上点击按钮时的灰色背景块。

---

## 7. 部署与发布

### 7.1 构建优化

Vite 默认的构建配置已经足够优秀。本项目在 `vite.config.js` 中没有进行过多的魔改，保持了配置的简洁。
*   **代码分割 (Code Splitting)**：Vite 会自动将第三方库（如 ECharts, Vant）拆分成单独的 Chunk，利用浏览器缓存。
*   **Tree Shaking**：Vant 使用 ES Module 引入，构建时会自动剔除未使用的组件代码。

### 7.2 Android 打包注意事项

1.  **图标与启动图**：
    Capacitor 默认使用标准图标。如需替换，可以使用 `capacitor-assets` 工具自动生成各种分辨率的图标：
    ```bash
    npx @capacitor/assets generate --iconAssetsDir assets/icon --splashAssetsDir assets/splash
    ```

2.  **权限配置**：
    本项目不需要特殊权限（如相机、定位），因此 `AndroidManifest.xml` 保持默认即可。如果未来增加拍照记账功能，需添加 `CAMERA` 权限。

3.  **签名发布**：
    生成的 APK 默认为 Debug 版。发布到应用商店前，必须使用 Keystore 进行签名。
    *   在 Android Studio 中：`Build` -> `Generate Signed Bundle / APK` -> `APK` -> `Create new...` (创建密钥库) -> 填写信息 -> `Release`。

---

## 8. 常见问题 (FAQ)

**Q: 数据存储在哪里？卸载 App 会丢失数据吗？**
A: 数据存储在手机系统的 WebView 容器对应的 IndexedDB 中。
*   如果是 **Web 版**：清除浏览器缓存或卸载浏览器会导致数据丢失。
*   如果是 **Android App 版**：卸载 App 会导致数据连同 App 数据沙箱一起被删除。
*   **建议**：未来版本计划增加“导出数据”为 JSON/Excel 的功能，以便用户备份。

**Q: 为什么部分分类图标显示为 Emoji？**
A: 项目支持两种图标格式：PNG 图片和 Emoji 字符。如果 `categories` 配置中 `icon` 字段不包含 `.png` 后缀，渲染层会将其作为文本（Emoji）直接显示。这为用户自定义分类提供了极大的便利，因为输入 Emoji 比上传图片要容易得多。

**Q: 如何修改默认分类？**
A: 默认分类定义在 `src/composables/useLedger.js` 的 `DEFAULT_CATEGORIES` 常量中。修改该常量只会影响新安装的用户。对于已安装用户，由于数据已写入 IndexedDB，需要通过代码逻辑（如 `onupgradeneeded` 中的迁移脚本）来更新。

---

## 9. 贡献指南

欢迎提交 Issue 和 Pull Request！

1.  Fork 本仓库。
2.  新建分支 `feat/xxx` 或 `fix/xxx`。
3.  提交代码并确保无 ESLint 错误。
4.  提交 PR。

---

*文档生成时间：2025-12-19*
*生成工具：Trae AI Assistant*
