# 记账本（Vue3 + Vite + Vant）

## 开发环境
- Node.js >= 18

## 安装依赖
```bash
pnpm i
# 或者
npm i
# 或者
yarn
```

## 启动开发服务
```bash
pnpm dev
# 或者
npm run dev
# 或者
yarn dev
```

打开浏览器访问：http://localhost:5173

## 构建
```bash
pnpm build
npm run build
```

## 打包为移动 App（Capacitor）

### 准备
- 已安装 Android Studio、Android SDK（Windows 需安装 Java/Gradle 由 Studio 自动安装）

### 常用脚本
```bash
# 初始化（仅首次）
npm run cap:init

# 添加 Android 平台（仅首次）
npm run cap:add:android

# 构建前端并同步到原生工程
npm run build && npm run cap:copy && npm run cap:sync

# 打开 Android 工程
npm run cap:open:android

# 生成 release APK（也可在 Android Studio 内操作）
npm run android:release
```

说明：`capacitor.config.json` 已配置 `webDir: dist`；本项目使用 Hash 路由，适合 WebView 环境，无需额外服务器。

### 发布签名（Android Studio）
- Build → Generate Signed Bundle / APK…
- 新建或选择 keystore，填写 alias 和密码
- 选择 release 构建，完成后在 `android/app/build/outputs/` 下获取产物

## 说明
- 使用 localStorage 持久化账单数据（键：`ledger_records_v1`）。
- 首页展示今日与本月汇总、按日期分组的列表，可左滑删除。
- 记一笔：支持收入/支出、金额、分类、日期时间与备注。
- 统计：按分类汇总当前月份收入/支出。

## 目录结构
```
src/
  main.js
  App.vue
  router/
    index.js
  composables/
    useLedger.js
  components/
    TransactionItem.vue
  views/
    Home.vue
    Add.vue
    Stats.vue
```

