<template>
  <div class="app-root">
    <!-- 页面内容容器 -->
    <div class="content-wrapper">
      <router-view v-slot="{ Component }">
        <transition name="fade-scale" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 底部导航容器 -->
    <div class="tabbar-container">
      <van-tabbar 
        class="custom-tabbar" 
        route 
        :border="false"
        active-color="#000000" 
        inactive-color="#A0A0A0"
        :fixed="false" 
      >
        <van-tabbar-item replace to="/" icon="home-o">
          <span>首页</span>
          <template #icon="props">
            <div :class="['tab-icon-bg', { active: props.active }, 'bg-purple']">
              <van-icon :name="props.active ? 'home-o' : 'home-o'" />
            </div>
          </template>
        </van-tabbar-item>

        <!-- 中间的大按钮 -->
        <van-tabbar-item replace to="/add" class="add-tab-item">
          <div class="add-icon-wrapper">
            <div class="add-icon-inner">
              <van-icon name="plus" size="24" />
              <span class="add-text">记一笔</span>
            </div>
          </div>
        </van-tabbar-item>

        <van-tabbar-item replace to="/stats" icon="chart-trending-o">
          <span>统计</span>
          <template #icon="props">
            <div :class="['tab-icon-bg', { active: props.active }, 'bg-green']">
              <van-icon :name="props.active ? 'chart-trending-o' : 'chart-trending-o'" />
            </div>
          </template>
        </van-tabbar-item>
      </van-tabbar>
    </div>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';

const nowYM = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').slice(0,7);
const sharedCurrentYM = ref(nowYM);

provide('sharedCurrentYM', sharedCurrentYM);
</script>

<style>
:root {
  /* 颜色变量 (保持不变) */
  --clash-bg: #F0F2F5;
  --clash-black: #2D3436;
  --clash-purple: #6C5CE7;
  --clash-green: #00B894;
  --clash-orange: #FF7675;
  --clash-yellow: #FDCB6E;
  --clash-white: #FFFFFF;

  --border-width: 2px;
  --hard-shadow: 4px 4px 0px var(--clash-black);
  --card-radius: 16px;
  
  /* 安全区域 (恢复 env，或根据需要调整) */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  background-color: var(--clash-bg);
}

.app-root { 
  min-height: 100vh; 
  background-color: var(--clash-bg);
  background-image: radial-gradient(var(--clash-black) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  font-family: 'Outfit', 'PingFang SC', sans-serif;
  /* 底部留白 = Tabbar高度(64) + 安全区 */
  padding-bottom: calc(64px + var(--safe-area-bottom)); 
  padding-top: var(--safe-area-top);
}

/* --- 底部导航栏容器 (贴底版) --- */
.tabbar-container {
  position: fixed;
  bottom: 0; /* 贴底 */
  left: 0;
  right: 0;
  z-index: 999;
  /* 不需要额外的 padding-bottom，由 custom-tabbar 内部处理 */
}

/* --- 自定义 Vant Tabbar 样式 --- */
.custom-tabbar {
  height: 64px !important;
  background: var(--clash-white) !important;
  /* 只有上边框 */
  border-top: var(--border-width) solid var(--clash-black) !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  padding: 10px 16px !important;
  /* 去掉四周圆角 */
  border-radius: 0 !important;
  
  /* 阴影改为向上投影，或者干脆去掉阴影只留黑边 */
  /* box-shadow: 0 -4px 0 rgba(45, 52, 54, 0.1) !important; */
  box-shadow: none !important;
  
  overflow: visible !important; /* 允许中间按钮突出来 */
  padding-bottom: var(--safe-area-bottom) !important; /* 适配小黑条 */
  box-sizing: content-box !important; /* 确保 height 不包含 padding */
}

.van-tabbar-item {
  background: transparent !important;
  z-index: 1;
}

/* 去掉之前的圆角修复代码 */
.van-tabbar-item:first-child,
.van-tabbar-item:last-child {
  border-radius: 0;
}

.van-tabbar::after {
  display: none;
}

/* --- Tab 图标背景块 --- */
.tab-icon-bg {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 22px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid transparent;
}

.tab-icon-bg.active {
  background-color: var(--clash-white);
  border: 2px solid var(--clash-black);
  transform: translateY(-4px);
  box-shadow: 2px 2px 0px var(--clash-black);
  z-index: 2;
}

.bg-purple.active { color: var(--clash-purple); }
.bg-green.active { color: var(--clash-green); }

.van-tabbar-item__text {
  font-weight: 700;
  font-size: 12px;
  margin-top: 4px;
  transition: all 0.2s;
}

/* --- 中间“记一笔”大按钮 --- */
/* --- 中间“记一笔”大按钮 (胶囊风格 - 嵌入式) --- */
.add-tab-item {
  overflow: visible;
  z-index: 1000;
  background: transparent !important;
}

.add-icon-wrapper {
  position: relative;
  top: -15px; /* 1. 归位：不再向上突起 */
  height: 100%; /* 2. 占满父容器高度 */
  display: flex;
  align-items: center; /* 3. 垂直居中 */
  justify-content: center;
  pointer-events: auto;
}

.add-icon-inner {
  /* 4. 胶囊形状尺寸 */
  height: 44px; /* 比如 Tabbar 高度 64px 小，留出上下间距 */
  padding: 0 20px; /* 左右加宽 */
  min-width: 100px;
  
  /* 5. 布局改为横向 */
  display: flex;
  flex-direction: row; 
  align-items: center;
  justify-content: center;
  gap: 6px; /* 图标和文字间距 */
  
  /* 6. 风格保持 Neo-Brutalism */
  background: var(--clash-orange);
  border: var(--border-width) solid var(--clash-black);
  border-radius: 22px; /* 半圆角 (高度的一半) */
  color: var(--clash-black);
  box-shadow: 2px 2px 0px var(--clash-black); /* 稍微收敛一点阴影 */
  
  /* 7. 移除旋转，改为点击缩放 */
  transform: none; 
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-icon-inner .van-icon {
  font-weight: 900;
  color: var(--clash-white);
  font-size: 20px !important; /* 图标稍微调小适配胶囊 */
  text-shadow: 1px 1px 0px var(--clash-black);
}

.add-text {
  font-size: 14px;
  font-weight: 900;
  color: var(--clash-white);
  margin-top: 0; /* 移除顶部间距 */
  text-shadow: 1px 1px 0px var(--clash-black);
  letter-spacing: 1px;
}

/* 点击效果 */
.add-icon-inner:active {
  transform: scale(0.95);
  box-shadow: 0px 0px 0px var(--clash-black);
}

/* --- 页面切换动画 --- */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* --- 滚动条 --- */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: var(--clash-black); border-radius: 3px; }
::-webkit-scrollbar-track { background: transparent; }
</style>