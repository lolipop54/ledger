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
  /* --- 现代撞色风格变量定义 --- */
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
  
  /* 安全区域适配 */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
}

/* 全局重置 */
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
  /* 波点背景纹理 */
  background-image: radial-gradient(var(--clash-black) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  font-family: 'Outfit', 'PingFang SC', sans-serif;
  
  /* 底部留白 = Tabbar内容高度(60px) + 底部安全区 */
  padding-bottom: calc(60px + var(--safe-area-bottom)); 
  padding-top: var(--safe-area-top);
}

/* --- 底部导航栏容器 (贴底版) --- */
.tabbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  /* 移除 padding-bottom，交给 custom-tabbar 内部处理 */
}

/* --- 自定义 Vant Tabbar 样式 --- */
.custom-tabbar {
  /* 1. 关键：使用 border-box 锁死高度计算 */
  box-sizing: border-box !important;
  
  /* 2. 总高度包含内容和安全区 */
  height: 70px  !important;
  padding-top: 15px;
  padding-bottom: 10px;
  background: var(--clash-white) !important;
  /* 只有上边框 */
  border-top: var(--border-width) solid var(--clash-black) !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
  
  /* 3. Flex 布局均匀分布 */
  display: flex !important;
  justify-content: space-around !important;
  align-items: center !important;
}

/* --- Tab Item 样式 --- */
.van-tabbar-item {
  background: transparent !important;
  z-index: 1;
  flex: 1; /* 均分宽度 */
  height: 100%; /* 充满高度 */
  
  /* 4. 关键：强制垂直排列，修复图标偏左问题 */
  display: flex !important;
  flex-direction: column !important; 
  justify-content: center !important;
  align-items: center !important;
  
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}

/* 防止点击时整个 Item 变色或变形 */
.van-tabbar-item:active {
  background-color: transparent !important; 
}

/* --- 图标容器 --- */
.van-tabbar-item__icon {
  /* 给文字留出一点间距 */
  margin-bottom: 4px !important; 
  width: auto !important;
  display: flex !important;
  justify-content: center;
  align-items: center;
  /* 关键：图标容器本身不动，防止父容器高度抖动 */
  transform: none !important; 
}

/* --- 只有这个背景块会动 (选中动画) --- */
.tab-icon-bg {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 20px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid transparent;
  position: relative;
}

/* 激活状态：方块上移 + 变色 + 阴影 */
.tab-icon-bg.active {
  background-color: var(--clash-white);
  border: 2px solid var(--clash-black);
  transform: translateY(-6px); 
  box-shadow: 2px 2px 0px var(--clash-black);
  z-index: 2;
}

.bg-purple.active { color: var(--clash-purple); }
.bg-green.active { color: var(--clash-green); }

/* --- 文字样式 --- */
.van-tabbar-item__text {
  width: 100%;
  text-align: center;
  display: flex;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  line-height: 1;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
  color: #A0A0A0; /* 默认颜色 */
}

.van-tabbar-item--active .van-tabbar-item__text {
  color: var(--clash-black) !important; /* 选中颜色 */
}

/* --- 中间“记一笔”大按钮 (胶囊风格 - 嵌入式) --- */
.add-tab-item {
  overflow: visible;
  z-index: 1000;
  background: transparent !important;
}

/* 针对中间按钮，不需要 tabbar 的默认布局 */
.add-tab-item .van-tabbar-item__icon {
  margin-bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.add-icon-wrapper {
  position: relative;
  top: -10px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.add-icon-inner {
  /* 胶囊形状 */
  height: 40px; /* 比 Tabbar 矮一点 */
  padding: 0 20px;
  min-width: 110px;
  
  /* 横向布局 */
  display: flex;
  flex-direction: row; 
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  /* 风格 */
  background: var(--clash-orange);
  border: var(--border-width) solid var(--clash-black);
  border-radius: 20px;
  color: var(--clash-black);
  box-shadow: 2px 2px 0px var(--clash-black);
  
  transform: none; 
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-icon-inner .van-icon {
  font-weight: 900;
  color: var(--clash-white);
  font-size: 18px !important;
  text-shadow: 1px 1px 0px var(--clash-black);
}

.add-text {
  font-size: 14px;
  font-weight: 900;
  color: var(--clash-white);
  margin-top: 0;
  text-shadow: 1px 1px 0px var(--clash-black);
  letter-spacing: 1px;
}

/* 点击缩放效果 */
.add-icon-inner:active {
  transform: scale(0.95);
  box-shadow: 0px 0px 0px var(--clash-black);
}

/* --- 页面切换动画 (Fade Scale) --- */
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

/* --- 滚动条美化 --- */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: var(--clash-black);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>