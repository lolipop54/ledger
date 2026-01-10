<template>
  <div class="home-page">
    <!-- Hero 区域 (贴顶通栏) -->
    <div class="hero" ref="heroRef">
      <div class="hero-inner">
        <!-- 月份选择 -->
        <div class="ym-wrapper" @click="showMonth = true">
          <div class="ym-badge">
            <span class="y">{{ currentYM.slice(0,4) }}</span>
            <span class="m">{{ currentYM.slice(5,7) }}月</span>
            <van-icon name="arrow-down" size="14" class="arrow-icon" />
          </div>
        </div>

        <!-- 收入支出卡片 -->
        <div class="totals">
          <div class="total-card income-card">
            <div class="card-icon">
              <van-icon name="arrow-down" />
            </div>
            <div class="card-info">
              <div class="label">收入</div>
              <div class="value">{{ format(monthSummary.income) }}</div>
            </div>
          </div>
          
          <div class="total-card expense-card">
            <div class="card-icon">
              <van-icon name="arrow-up" />
            </div>
            <div class="card-info">
              <div class="label">支出</div>
              <div class="value">{{ format(monthSummary.expense) }}</div>
            </div>
          </div>
        </div>
        
        <!-- 装饰性背景元素 -->
        <div class="hero-deco-circle"></div>
      </div>
    </div>

    <!-- 月份选择弹窗 -->
    <van-popup 
      v-model:show="showMonth" 
      position="bottom" 
      class="custom-popup"
      :overlay-style="{ background: 'rgba(0,0,0,0.5)' }"
    >
      <van-date-picker
        :columns-type="['year','month']"
        :min-date="minMonth"
        :max-date="maxMonth"
        v-model="ym"
        title="切换月份"
        @confirm="onPickMonth"
        @cancel="showMonth = false"
        class="custom-picker"
      />
    </van-popup>

    <!-- 占位块 -->
    <div class="blank" :style="{ height: contentMarginTop }"></div>

    <!-- 内容列表 -->
    <div class="content">
      <!-- 空状态 -->
      <div v-if="monthGroups.length === 0 && !isInit" class="empty-state-box">
        <div class="empty-illustration">
          <div class="empty-circle"></div>
          <span class="empty-emoji">🌵</span>
        </div>
        <div class="empty-title">空空如也</div>
        <div class="empty-desc">这个月还没有记账哦</div>
        <div class="empty-btn">去记一笔 →</div>
      </div>

      <!-- 记账列表 -->
      <div v-else> 
        <div v-for="g in monthGroups" :key="g.date" class="group-card">
          <!-- 日期头 -->
          <div class="group-header">
            <div class="date-badge">{{ g.date }}</div>
            <div class="daily-summary">
              <span v-if="g.total.income > 0" class="tag tag-income">收 {{ format(g.total.income) }}</span>
              <span v-if="g.total.expense > 0" class="tag tag-expense">支 {{ format(g.total.expense) }}</span>
            </div>
          </div>
          
          <!-- 列表项 -->
          <div class="records-list">
            <TransactionItem
              v-for="r in g.list"
              :key="r.id"
              :record="r"
              @remove="onRemove(r.id)"
              @update="onUpdate"
              class="record-item-wrapper"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { showSuccessToast, showConfirmDialog  } from 'vant';
import TransactionItem from '../components/TransactionItem.vue';
import { useLedger, formatAmount } from '../composables/useLedger';
import { ref, computed, inject, onMounted, onUnmounted, nextTick, watch } from 'vue';

const { monthSummaryOf, groupsByDateOf, removeRecord, updateRecord, initData } = useLedger();

const heroRef = ref(null);
const contentMarginTop = ref('0px');
const isInit = ref(false)

function updateContentMarginTop() {
  nextTick(() => {
    if (heroRef.value) {
      // 计算高度时，因为现在是贴顶布局，不需要额外的间距
      contentMarginTop.value = `${heroRef.value.offsetHeight + 16}px`;
    }
  });
}

onMounted(async () => {
  try {
    isInit.value = true;
    await initData();
    updateContentMarginTop();
    isInit.value = false;
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
  window.addEventListener('resize', updateContentMarginTop);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContentMarginTop);
});

const sharedCurrentYM = inject('sharedCurrentYM');
const nowYM = new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').slice(0,7);
      
const currentYM = computed({
  get: () => sharedCurrentYM.value,
  set: (val) => { sharedCurrentYM.value = val; }
});

const monthSummary = computed(() => monthSummaryOf(currentYM.value));
const monthGroups = computed(() => groupsByDateOf(currentYM.value));

watch(currentYM, () => {
  updateContentMarginTop();
});

const showMonth = ref(false);
const minMonth = new Date(new Date().getFullYear() - 3, 0, 1);
const maxMonth = new Date(new Date().getFullYear() + 1, 11, 1);
const ym = ref([nowYM.slice(0,4), nowYM.slice(5,7)]);

const onPickMonth = (val) => {
  const selected = Array.isArray(val) ? val : val?.selectedValues || ym.value;
  const [y, m] = selected;
  currentYM.value = `${String(y)}-${String(m).padStart(2,'0')}`;
  ym.value = [String(y), String(m).padStart(2,'0')];
  showMonth.value = false;
};

const format = (n) => formatAmount(n);

// 撞色风格的删除确认
const onRemove = (id) => {
  showConfirmDialog({
    title: '删除记录',
    message: '确定要删掉这一笔吗？',
    confirmButtonText: '删掉它',
    cancelButtonText: '再想想',
    className: 'clash-dialog', // 自定义类名
  }).then(() => {
    removeRecord(id);
    showSuccessToast({
      message: '👋 已删除',
      icon: 'delete-o',
    });
  }).catch(() => {});
};

const onUpdate = (id, updates) => {
  updateRecord(id, updates);
  showSuccessToast('已更新');
  updateContentMarginTop();
};
</script>

<style scoped>
/* 引入全局变量 (假设 App.vue 已定义) */
/* 
  --clash-bg: #F0F2F5;
  --clash-black: #2D3436;
  --clash-purple: #6C5CE7;
  --clash-green: #00B894;
  --clash-orange: #FF7675;
  --clash-yellow: #FDCB6E;
  --clash-white: #FFFFFF;
  --border-width: 2px;
  --hard-shadow: 4px 4px 0px #2D3436;
*/

.home-page {
  min-height: 100vh;
  background-color: var(--clash-bg, #F0F2F5);
  /* 波点背景 */
  background-image: radial-gradient(var(--clash-black, #2D3436) 1px, transparent 1px);
  background-size: 20px 20px;
  background-attachment: fixed; /* 背景固定 */
}

/* --- Hero 区域 (贴顶通栏修改版) --- */
.hero {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
  /* 背景色不透明 */
  background-color: var(--clash-purple, #6C5CE7);
  
  /* 底部圆角和边框 */
  border-bottom: 2px solid var(--clash-black, #2D3436);
  border-radius: 0 0 24px 24px;
  box-shadow: 0 6px 0 var(--clash-black, #2D3436);
  
  /* 去除原来的外边距，改为内填充 */
  padding: 0;
  padding-top: 0px; /* 适配状态栏高度，可根据需要调整或用 env */
}

.hero-inner {
  /* 去掉内部容器的边框和背景，因为它现在直接在 hero 上了 */
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 32px 20px 20px 20px; /* 内部留白 */
  position: relative;
  overflow: hidden;
  border-radius: 0 0 24px 24px; /* 确保内容不溢出 */
}

/* 装饰圆 */
.hero-deco-circle {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.05);
  pointer-events: none;
}

/* 年月选择徽章 */
.ym-wrapper {
  display: inline-block;
  margin-bottom: 20px;
  cursor: pointer;
}

.ym-badge {
  background: var(--clash-white, #fff);
  border: 2px solid var(--clash-black, #2D3436);
  padding: 6px 16px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.2); /* 加深阴影 */
  transition: transform 0.1s;
}

.ym-badge:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
}

.ym-badge .y {
  font-size: 12px;
  color: #666;
  margin-right: 4px;
  font-weight: 700;
}

.ym-badge .m {
  font-size: 18px;
  font-weight: 900;
  color: var(--clash-black, #2D3436);
  margin-right: 4px;
}

/* 统计卡片容器 */
.totals {
  display: flex;
  gap: 12px;
}

.total-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  backdrop-filter: blur(5px);
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 18px;
  border: 2px solid var(--clash-black, #2D3436);
  color: var(--clash-black, #2D3436);
}

.income-card .card-icon {
  background: var(--clash-green, #00B894);
}

.expense-card .card-icon {
  background: var(--clash-orange, #FF7675);
}

.card-info .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
  margin-bottom: 2px;
}

.card-info .value {
  font-size: 18px;
  font-weight: 900;
  color: var(--clash-white, #fff);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.2);
}

/* --- 内容列表 --- */
.content {
  padding: 0 16px 120px; /* 底部留白给tabbar */
}

.group-card {
  background: var(--clash-white, #fff);
  border: 2px solid var(--clash-black, #2D3436);
  border-radius: 16px;
  padding-bottom: 16px;
  box-shadow: 4px 4px 2px var(--clash-black, #2D3436);
  margin-bottom: 20px;
  overflow: hidden;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 组头部 */
.group-header {
  background: #F9F9F9;
  padding: 12px 16px;
  border-bottom: 2px solid var(--clash-black, #2D3436);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-badge {
  font-weight: 900;
  font-size: 14px;
  color: var(--clash-black, #2D3436);
}

.daily-summary {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid var(--clash-black, #2D3436);
}

.tag-income {
  background: var(--clash-green, #00B894);
  color: var(--clash-black, #2D3436);
}

.tag-expense {
  background: var(--clash-orange, #FF7675);
  color: var(--clash-black, #2D3436);
}

/* 列表项容器 */
.records-list {
  padding: 0;
}

/* --- 空状态 --- */
.empty-state-box {
  background: var(--clash-white, #fff);
  border: 2px solid var(--clash-black, #2D3436);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 4px 4px 0px var(--clash-black, #2D3436);
  margin-top: 20px;
}

.empty-illustration {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--clash-yellow, #FDCB6E);
  border: 2px solid var(--clash-black, #2D3436);
  border-radius: 50%;
}

.empty-emoji {
  position: relative;
  font-size: 40px;
  z-index: 1;
}

.empty-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--clash-black, #2D3436);
  margin-bottom: 8px;
}

.empty-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 24px;
}

.empty-btn {
  display: inline-block;
  background: var(--clash-black, #2D3436);
  color: #fff;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

/* --- 弹窗样式覆盖 --- */
:deep(.custom-popup) {
  background: transparent !important;
  padding: 16px;
  padding-bottom: 30px; 
}

:deep(.custom-picker) {
  background: var(--clash-white, #fff) !important;
  border: 2px solid var(--clash-black, #2D3436) !important;
  border-radius: 16px !important;
  box-shadow: 4px 4px 0px var(--clash-black, #2D3436) !important;
  overflow: hidden;
}

:deep(.van-picker__confirm) {
  color: var(--clash-purple, #6C5CE7) !important;
  font-weight: 900 !important;
}

:deep(.van-picker__cancel) {
  color: #999 !important;
  font-weight: 700 !important;
}

/* --- Dialog 样式 --- */
</style>

<style>
/* 全局 Dialog 样式 (放在 scoped 外面以确保生效) */
.clash-dialog {
  background: #fff !important;
  border: 2px solid #2D3436 !important;
  border-radius: 16px !important;
  box-shadow: 6px 6px 0px rgba(0,0,0,0.2) !important;
  overflow: hidden !important;
}

.clash-dialog .van-dialog__header {
  font-weight: 900 !important;
  padding-top: 24px !important;
  font-size: 18px !important;
}

/* 修改点：给内容增加 padding */
.clash-dialog .van-dialog__content {
  color: #666 !important;
  font-weight: 500 !important;
  padding: 24px 24px !important; /* 增加内容内边距，防止贴边 */
}

.clash-dialog .van-dialog__footer {
  border-top: 2px solid #2D3436 !important;
}

.clash-dialog .van-button {
  height: 50px !important;
  border: none !important;
}

.clash-dialog .van-dialog__cancel-button {
  color: #666 !important;
  font-weight: 700 !important;
  border-right: 2px solid #2D3436 !important;
}

.clash-dialog .van-dialog__confirm-button {
  background: #FF7675 !important; /* 红色确认按钮 */
  color: #2D3436 !important;
  font-weight: 900 !important;
}
</style>