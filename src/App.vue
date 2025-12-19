<template>
  <div class="app-root">
    <!-- 页面内容容器 -->
    <div class="content-wrapper">
      <!-- 移除了 transition 动画包裹 -->
      <router-view />
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
import { ref, provide, onMounted, onUnmounted } from 'vue';
import { App as CapacitorApp } from '@capacitor/app';
import { showToast } from 'vant';

// 简单的日期处理逻辑保留
const nowYM = new Date().toLocaleString('zh-CN', { 
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
}).replace(/\//g, '-').slice(0,7);

const sharedCurrentYM = ref(nowYM);
provide('sharedCurrentYM', sharedCurrentYM);

// 双击返回退出逻辑
const lastBackTime = ref(0);
const BACK_EXIT_THRESHOLD = 2000; // 2秒内双击有效

const handleBackButton = async () => {
  const now = Date.now();
  if (now - lastBackTime.value < BACK_EXIT_THRESHOLD) {
    // 退出应用
    await CapacitorApp.exitApp();
  } else {
    // 提示再按一次
    lastBackTime.value = now;
    showToast('再按一次退出应用');
  }
};

onMounted(() => {
  // 监听 Android 物理返回键
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      handleBackButton();
    } else {
      window.history.back();
    }
  });
});

onUnmounted(() => {
  CapacitorApp.removeAllListeners();
});
</script>

<style>
:root {
  /* --- 基础变量 --- */
  --clash-bg: #F0F2F5;
  --clash-black: #2D3436;
  --clash-purple: #6C5CE7;
  --clash-green: #00B894;
  --clash-orange: #FF7675;
  --clash-white: #FFFFFF;
  
  --border-width: 2px;
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
  /* 保留波点背景，增加质感 */
  background-image: radial-gradient(var(--clash-black) 1px, transparent 1px);
  background-size: 20px 20px;
  
  padding-bottom: calc(60px + var(--safe-area-bottom)); 
}

/* --- 底部导航栏容器 --- */
.tabbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

/* --- 自定义 Vant Tabbar --- */
.custom-tabbar {
  box-sizing: border-box !important;
  height: 70px !important;
  padding-top: 15px;
  padding-bottom: 10px;
  background: var(--clash-white) !important;
  border-top: var(--border-width) solid var(--clash-black) !important;
  
  /* 布局修正 */
  display: flex !important;
  justify-content: space-around !important;
  align-items: center !important;
  
  /* 禁止选中，防止点击时变蓝 */
  user-select: none; 
}

/* --- Tab Item --- */
.van-tabbar-item {
  background: transparent !important;
  flex: 1;
  height: 100%;
  display: flex !important;
  flex-direction: column !important; 
  justify-content: center !important;
  align-items: center !important;
  padding: 0 !important;
}

/* --- 图标外层容器 --- */
.van-tabbar-item__icon {
  margin-bottom: 4px !important; 
  width: auto !important;
  /* 关键：锁定高度防止抖动 */
  height: 32px !important; 
  min-height: 32px !important;
  display: flex !important;
  justify-content: center;
  align-items: center;
  overflow: visible !important; 
}

/* --- 图标背景块 (负责选中时的凸起特效) --- */
.tab-icon-bg {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 20px;
  
  /* 只有此处保留简单的过渡动画 */
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), 
              background-color 0.2s, 
              box-shadow 0.2s;
  
  border: 2px solid transparent;
}

/* 激活状态：上移 + 边框 + 硬阴影 */
.tab-icon-bg.active {
  background-color: var(--clash-white);
  border: 2px solid var(--clash-black);
  transform: translateY(-6px); 
  box-shadow: 2px 2px 0px var(--clash-black);
}

.bg-purple.active { color: var(--clash-purple); }
.bg-green.active { color: var(--clash-green); }

/* --- 文字样式 --- */
.van-tabbar-item__text {
  font-weight: 700;
  font-size: 11px;
  color: #A0A0A0;
  /* 锁定行高防止抖动 */
  height: 12px;
  line-height: 12px;
}

.van-tabbar-item--active .van-tabbar-item__text {
  color: var(--clash-black) !important;
}

/* --- 中间“记一笔”大按钮 --- */
.add-tab-item {
  overflow: visible !important; /* 允许凸出 */
  z-index: 1000;
  background: transparent !important;
}

/* 也要确保 item 内部的 icon 容器不裁剪 */
.add-tab-item .van-tabbar-item__icon {
  margin-bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: visible !important; /* 关键 */
}

.add-icon-wrapper {
  /* 
     使用 flex 布局居中，
     但通过 transform 或 margin 强行向上提 
  */
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 这里是用 transform 替代 top，位移更稳定，不会受文档流影响 */
  transform: translateY(-20px); 
  
  /* 保证层级最高，遮住 Tabbar 的上边框 */
  z-index: 1001; 
  pointer-events: auto;
}

.add-icon-inner {
  height: 44px; /* 稍微加高一点点，手感更好 */
  padding: 0 20px;
  min-width: 110px;
  
  display: flex;
  flex-direction: row; 
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  background: var(--clash-orange);
  border: var(--border-width) solid var(--clash-black);
  border-radius: 22px; /* 圆角随高度调整 */
  color: var(--clash-black);
  
  /* 阴影加深，增加悬浮高度感 */
  box-shadow: 3px 3px 0px var(--clash-black);
  
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.add-text {
  font-size: 14px;
  font-weight: 900;
  color: var(--clash-white);
  text-shadow: 1px 1px 0px var(--clash-black);
}

.add-icon-inner .van-icon {
  font-weight: 900;
  color: var(--clash-white);
  text-shadow: 1px 1px 0px var(--clash-black);
}

/* 点击时的按压效果 */
.add-icon-inner:active {
  transform: scale(0.96) translateY(2px); /* 按下去的时候稍微往下沉一点 */
  box-shadow: 0px 0px 0px var(--clash-black);
}
</style>