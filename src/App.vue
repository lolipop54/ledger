<template>
  <div class="app-root">
    <router-view />
    <div class="tabbar-container">
      <van-tabbar class="van-tabbar-items" route :active-color="'#FFD84D'" inactive-color="#999">
        <van-tabbar-item replace to="/" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item replace to="/add" icon="add-o">
          <div class="add-icon-container">
            <div class="add-icon">记一笔</div>
          </div>
        </van-tabbar-item>
        <van-tabbar-item replace to="/stats" icon="chart-trending-o">统计</van-tabbar-item>
      </van-tabbar>
    </div>
  </div>
  
</template>

<script setup>
import { ref, provide } from 'vue';

// 创建共享的月份状态
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

// 提供给子组件使用
provide('sharedCurrentYM', sharedCurrentYM);
</script>

<style>
:root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
        --safe-area-inset-right: env(safe-area-inset-right);
    }

/* 全局样式重置 */
* {
  box-sizing: border-box;
}

.app-root { 
  min-height: 100vh; 
  background: linear-gradient(135deg, #f7f8fa 0%, #f0f2f5 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 底部导航栏美化 */
/* .tabbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  height: 80px;
  display: flex;
  align-items: center;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border-radius: 20px 20px 0 0;
} */

.van-tabbar-items {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-top: 10px;
  padding-bottom: 45px;
  width: 100%;
  border: none !important;
  outline: none !important;
  z-index: 100 !important;
}

/* 美化中间的"记一笔"按钮 */
.add-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.add-icon {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  color: #6b4e00;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 216, 77, 0.3);
  transition: all 0.3s ease;
}

.add-icon:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(255, 216, 77, 0.3);
}

/* 全局滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 全局按钮样式 */
:root {
  --primary-color: #FFD84D;
  --primary-text: #6b4e00;
  --expense-color: #FF6B6B;
  --income-color: #4ECDC4;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --background-light: #f7f8fa;
  --border-radius: 12px;
}

/* 增强的过渡动画 */
.van-button,
.van-tabbar-item,
.van-cell {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 增强的阴影效果 */
.shadow-light {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.shadow-medium {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
</style>


