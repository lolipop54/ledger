<template>
  <div class="stats-page">
    <!-- 导航栏 -->
    <div class="clash-nav">
      <div class="nav-title">统计看板</div>
    </div>

    <div class="content">
      <!-- 汇总卡片 -->
      <div class="summary-cards">
        <div class="summary-card income-card">
          <div class="card-inner">
            <div class="card-icon-box">📈</div>
            <div class="card-info">
              <div class="card-label">本月收入</div>
              <div class="card-value">¥ {{ format(monthTotal.income) }}</div>
            </div>
          </div>
        </div>
        
        <div class="summary-card expense-card">
          <div class="card-inner">
            <div class="card-icon-box">📉</div>
            <div class="card-info">
              <div class="card-label">本月支出</div>
              <div class="card-value">¥ {{ format(monthTotal.expense) }}</div>
            </div>
          </div>
        </div>

        <div class="summary-card balance-card">
          <div class="card-inner">
            <div class="card-icon-box">💰</div>
            <div class="card-info">
              <div class="card-label">结余</div>
              <div class="card-value" :class="{ 'negative': monthTotal.balance < 0 }">
                ¥ {{ format(monthTotal.balance) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 支出统计 -->
      <div class="chart-section expense-section">
        <div class="section-header">
          <span class="header-icon">💸</span>
          <span class="header-title">支出构成</span>
        </div>
        
        <div class="pie-chart-container">
          <div v-if="expensePieData.length > 0">
            <div ref="expenseChartRef" class="echarts-pie-chart"></div>
          </div>
          <div v-else class="no-data">
            <div class="empty-icon">🌵</div>
            <div class="empty-text">暂无支出</div>
          </div>
        </div>
      
        <!-- 支出明细列表 -->
        <div class="detail-list" v-if="expensePieData.length > 0">
          <div
            v-for="item in expensePieData"
            :key="item.category"
            class="list-item-wrapper"
          >
            <div class="list-item"
              @click="toggleCategoryExpand($event, item.category, 'expense')"
              :class="{ 'active': expandedCategories[`expense_${item.category}`] }"
            >
              <div class="list-item-main">
                <div class="category-color-dot" :style="{ backgroundColor: item.color }"></div>
                <div class="category-name">{{ item.category }}</div>
                <div class="category-right">
                  <div class="amount">¥ {{ format(item.total) }}</div>
                  <div class="percentage">{{ item.percentage }}%</div>
                </div>
                <div class="expand-arrow">
                  {{ expandedCategories[`expense_${item.category}`] ? '▼' : '▶' }}
                </div>
              </div>
              
              <!-- 进度条作为背景装饰 -->
              <div class="progress-bg" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
            </div>
            
            <!-- 排行榜 (展开内容) -->
            <div class="ranking-panel" v-if="expandedCategories[`expense_${item.category}`]">
              <div class="ranking-header">🏆 TOP 10</div>
              <div class="ranking-list">
                <div class="ranking-row"
                  v-for="(record, index) in getCategoryRecords('expense', item.category)"
                  :key="record.id || index"
                >
                  <div class="rank-badge">{{ index + 1 }}</div>
                  <div class="rank-info">
                    <div class="rank-note">{{ record.note || '无备注' }}</div>
                    <div class="rank-date">{{ record.date.slice(5, 10) }}</div>
                  </div>
                  <div class="rank-amount">¥ {{ format(record.amount) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 收入统计 -->
      <div class="chart-section income-section">
        <div class="section-header">
          <span class="header-icon">💰</span>
          <span class="header-title">收入构成</span>
        </div>

        <div class="pie-chart-container">
          <div v-if="incomePieData.length > 0">
            <div ref="incomeChartRef" class="echarts-pie-chart"></div>
          </div>
          <div v-else class="no-data">
            <div class="empty-icon">🍃</div>
            <div class="empty-text">暂无收入</div>
          </div>
        </div>
      
        <div class="detail-list" v-if="incomePieData.length > 0">
          <div
            v-for="item in incomePieData"
            :key="item.category"
            class="list-item-wrapper"
          >
            <div class="list-item"
              @click="toggleCategoryExpand($event, item.category, 'income')"
              :class="{ 'active': expandedCategories[`income_${item.category}`] }"
            >
              <div class="list-item-main">
                <div class="category-color-dot" :style="{ backgroundColor: item.color }"></div>
                <div class="category-name">{{ item.category }}</div>
                <div class="category-right">
                  <div class="amount">¥ {{ format(item.total) }}</div>
                  <div class="percentage">{{ item.percentage }}%</div>
                </div>
                <div class="expand-arrow">
                  {{ expandedCategories[`income_${item.category}`] ? '▼' : '▶' }}
                </div>
              </div>
              <div class="progress-bg" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
            </div>
            
            <div class="ranking-panel" v-if="expandedCategories[`income_${item.category}`]">
              <div class="ranking-header">🏆 TOP 10</div>
              <div class="ranking-list">
                <div class="ranking-row"
                  v-for="(record, index) in getCategoryRecords('income', item.category)"
                  :key="record.id || index"
                >
                  <div class="rank-badge">{{ index + 1 }}</div>
                  <div class="rank-info">
                    <div class="rank-note">{{ record.note || '无备注' }}</div>
                    <div class="rank-date">{{ record.date.slice(5, 10) }}</div>
                  </div>
                  <div class="rank-amount">¥ {{ format(record.amount) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { NavBar as VanNavBar, Cell as VanCell, CellGroup as VanCellGroup } from 'vant';
import { useLedger, formatAmount } from '../composables/useLedger';
import * as echarts from 'echarts';

const { records, initData } = useLedger();

// 高亮显示的分类
const highlightedCategory = ref([]);
// 展开的分类
const expandedCategories = ref({});

// 初始化数据
onMounted(async () => {
  await initData();
  // 数据加载完成后初始化图表
  nextTick(() => {
    if (expenseChartRef.value && expensePieData.value.length > 0) {
      initChart(expenseChartRef, expensePieData.value, 'expense');
    }
    if (incomeChartRef.value && incomePieData.value.length > 0) {
      initChart(incomeChartRef, incomePieData.value, 'income');
    }
  });
});

// ECharts实例引用
const expenseChartRef = ref(null);
const incomeChartRef = ref(null);
let expenseChartInstance = null;
let incomeChartInstance = null;

// 高亮分类函数
const highlightCategory = (category) => {
  if(highlightedCategory.value.includes(category)){
    highlightedCategory.value.splice(highlightedCategory.value.indexOf(category), 1);
  }else{
    highlightedCategory.value.push(category);
  }
};

// 切换分类展开状态
// 修改：增加 type 参数，使用组合 key 防止同名冲突
const toggleCategoryExpand = (event, category, type) => {
  // 阻止冒泡，避免触发highlightCategory
  event.stopPropagation();
  const key = `${type}_${category}`;
  expandedCategories.value[key] = !expandedCategories.value[key];
  // 同时处理高亮状态
  highlightCategory(category);
};

// 获取分类下的详细记录，按金额排序
const getCategoryRecords = (type, category) => {
  return monthList.value
    .filter(r => r.type === type && r.category === category)
    .map(r => ({
      ...r,
      amountNum: Number(r.amount || 0),
      // 计算占该分类总额的百分比
      percentage: calculateItemPercentage(r, type, category)
    }))
    .sort((a, b) => b.amountNum - a.amountNum)
    .slice(0, 10); // 只显示前10条
};

// 计算单条记录占分类总额的百分比
const calculateItemPercentage = (record, type, category) => {
  const categoryTotal = byCategory.value.find(
    item => item.type === type && item.category === category
  )?.total || 0;
  return categoryTotal > 0 
    ? (Number(record.amount || 0) / categoryTotal * 100).toFixed(1)
    : '0';
};

// 获取指定分类的颜色
const getCategoryColor = (category) => {
  // 查找支出分类颜色
  const expenseItem = expensePieData.value.find(item => item.category === category);
  if (expenseItem) return expenseItem.color;
  
  // 查找收入分类颜色
  const incomeItem = incomePieData.value.find(item => item.category === category);
  if (incomeItem) return incomeItem.color;
  
  return '#999';
};

// 基于共享月份状态计算当月收支统计
const monthTotal = computed(() => {
  const monthRecords = records.value.filter(r => (r.date || '').slice(0,7) === sharedCurrentYM.value);
  const income = monthRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const expense = monthRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  return {
    income,
    expense,
    balance: income - expense
  };
});

// 注入共享的月份状态
const sharedCurrentYM = inject('sharedCurrentYM');
const monthList = computed(() => records.value.filter(r => (r.date || '').slice(0,7) === sharedCurrentYM.value));

const byCategory = computed(() => {
  const map = new Map();
  for (const r of monthList.value) {
    const key = `${r.type}|${r.category}`;
    map.set(key, (map.get(key) || 0) + Number(r.amount || 0));
  }
  return Array.from(map.entries()).map(([k, total]) => {
    const [type, category] = k.split('|');
    return { type, category, total };
  }).sort((a, b) => b.total - a.total);
});

// 为饼图准备数据
const expensePieData = computed(() => {
  const expenseItems = byCategory.value.filter(item => item.type === 'expense');
  const total = expenseItems.reduce((sum, item) => sum + item.total, 0);
  return expenseItems.map(item => ({
    ...item,
    percentage: total > 0 ? (item.total / total * 100).toFixed(1) : 0,
    // 为饼图扇区生成颜色
    color: generateColor(item.category)
  }));
});

const incomePieData = computed(() => {
  const incomeItems = byCategory.value.filter(item => item.type === 'income');
  const total = incomeItems.reduce((sum, item) => sum + item.total, 0);
  return incomeItems.map(item => ({
    ...item,
    percentage: total > 0 ? (item.total / total * 100).toFixed(1) : 0,
    color: generateColor(item.category)
  }));
});

// 增强的颜色生成函数，使用HSL颜色模式生成唯一且可区分的颜色
function generateColor(text) {
  // 计算文本的哈希值
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  // 使用哈希值生成色相，确保不同分类有不同的基本颜色
  // 色相范围在0-360之间
  const hue = hash % 360;
  
  // 饱和度使用固定值，但根据哈希值略微调整，避免过于鲜艳或暗淡
  const saturation = 65 + ((hash % 30) - 15); // 50-80%之间
  
  // 亮度使用固定值，确保颜色既不刺眼也不难以区分
  const lightness = 55 + ((hash % 20) - 10); // 45-65%之间
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// 初始化饼图
function initChart(chartRef, data, type) {
  if (!chartRef.value) return;
  
  // 销毁旧实例
  if (type === 'expense' && expenseChartInstance) {
    expenseChartInstance.dispose();
  } else if (type === 'income' && incomeChartInstance) {
    incomeChartInstance.dispose();
  }
  
  // 创建新实例
  const instance = echarts.init(chartRef.value);
  
  // 更新实例引用
  if (type === 'expense') {
    expenseChartInstance = instance;
  } else {
    incomeChartInstance = instance;
  }
  
  // 准备数据
  const seriesData = data.map(item => ({
    name: item.category,
    value: item.total,
    itemStyle: {
      color: item.color
    }
  }));
  // 计算总金额
  const total = seriesData.reduce((sum, item) => sum + item.value, 0);
  
  // 配置项
  const option = {
    tooltip: {
      trigger: 'item',
      position:'inside',
      formatter: function(params) {
        return `${params.name}<br/>金额: ¥${formatAmount(params.value)}<br/>占比: ${params.percent}%`;
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      padding: 10,
      hideDelay: 0 // 可选：立即隐藏
    },
    // 添加中心固定文字
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: type === 'expense' ? `总支出\n¥${formatAmount(total)}` : `总收入\n¥${formatAmount(total)}`,
          fontSize: 12,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#333'
        },
        z: 100
      },
    ],
    series: [{
      name: type === 'expense' ? '支出' : '收入',
      type: 'pie',
      radius: ['30%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
          show: false,
      },
      emphasis: {
        label: {
          
          show: false,
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      center: ['50%', '50%'],
      data: seriesData
    }]
  };
  
  // 设置配置项
  instance.setOption(option);
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    instance.resize();
  });
}

// 监听数据变化
watch([expensePieData, incomePieData], () => {
  nextTick(() => {
    if (expenseChartRef.value && expensePieData.value.length > 0) {
      initChart(expenseChartRef, expensePieData.value, 'expense');
    }
    if (incomeChartRef.value && incomePieData.value.length > 0) {
      initChart(incomeChartRef, incomePieData.value, 'income');
    }
  });
}, { deep: true });

// 组件卸载时清理
onUnmounted(() => {
  if (expenseChartInstance) {
    expenseChartInstance.dispose();
  }
  if (incomeChartInstance) {
    incomeChartInstance.dispose();
  }
});

// 格式化函数别名
const format = (n) => formatAmount(n);
</script>

<style scoped>
/* 全局变量 (假设 App.vue 已定义) */
/* :root { --clash-black: #2D3436; --clash-purple: #6C5CE7; --clash-yellow: #FDCB6E; --clash-bg: #F0F2F5; } */

.stats-page {
  min-height: 100vh;
  background: var(--clash-bg, #F0F2F5);
  /* 波点背景 */
  background-image: radial-gradient(#2D3436 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 导航栏 */
.clash-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: #FDCB6E;
  border-bottom: 2px solid #2D3436;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  box-shadow: 0 4px 0 rgba(0,0,0,0.1);
}

.nav-title {
  font-size: 18px;
  font-weight: 900;
  color: #2D3436;
  letter-spacing: 1px;
}

.content {
  padding: 80px 16px 100px;
}

/* 汇总卡片 */
.summary-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: #fff;
  border: 2px solid #2D3436;
  border-radius: 12px;
  box-shadow: 4px 4px 0 #2D3436;
  overflow: hidden;
  transition: transform 0.1s;
}

.summary-card:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #2D3436;
}

.card-inner {
  display: flex;
  align-items: center;
  padding: 16px;
}

.card-icon-box {
  width: 48px;
  height: 48px;
  background: #F0F0F0;
  border: 2px solid #2D3436;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.income-card .card-icon-box { background: #55EFC4; }
.expense-card .card-icon-box { background: #FF7675; }
.balance-card .card-icon-box { background: #6C5CE7; color: #fff; }

.card-info {
  flex: 1;
}

.card-label {
  font-size: 12px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
}

.card-value {
  font-size: 24px;
  font-weight: 900;
  color: #2D3436;
  font-family: 'Outfit', sans-serif;
}

.card-value.negative {
  color: #FF7675;
}

/* 图表区块 */
.chart-section {
  background: #fff;
  border: 2px solid #2D3436;
  border-radius: 16px;
  box-shadow: 4px 4px 0 #2D3436;
  margin-bottom: 24px;
  overflow: hidden;
}

.section-header {
  background: #2D3436;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon { font-size: 20px; }
.header-title { font-weight: 900; font-size: 16px; }

.pie-chart-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  background: #fff;
}

.echarts-pie-chart {
  width: 240px;
  height: 240px;
}

/* 空状态 */
.no-data {
  padding: 40px;
  text-align: center;
  color: #999;
}
.empty-icon { font-size: 40px; margin-bottom: 8px; }

/* 详情列表 */
.detail-list {
  border-top: 2px solid #2D3436;
}

.list-item-wrapper {
  border-bottom: 2px solid #2D3436;
}
.list-item-wrapper:last-child { border-bottom: none; }

.list-item {
  position: relative;
  padding: 16px;
  cursor: pointer;
  background: #fff;
  transition: background 0.2s;
}

.list-item.active {
  background: #FFF8E1; /* 展开时微黄背景 */
}

.list-item-main {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
}

/* 进度条背景 */
.progress-bg {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  opacity: 0.15;
  z-index: 1;
  transition: width 0.5s;
}

.category-color-dot {
  width: 12px;
  height: 12px;
  border: 2px solid #2D3436;
  border-radius: 50%;
  margin-right: 12px;
}

.category-name {
  font-weight: 700;
  color: #2D3436;
  flex: 1;
}

.category-right {
  text-align: right;
  margin-right: 12px;
}

.amount { font-weight: 900; font-size: 15px; }
.percentage { font-size: 11px; color: #666; font-weight: 600; }

.expand-arrow {
  font-size: 10px;
  color: #2D3436;
  width: 16px;
  text-align: center;
}

/* 排行榜面板 */
.ranking-panel {
  background: #f9f9f9;
  border-top: 2px solid #2D3436;
  padding: 12px 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ranking-header {
  font-size: 12px;
  font-weight: 900;
  color: #666;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.ranking-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: #fff;
  border: 1px solid #2D3436;
  border-radius: 8px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.05);
}

.rank-badge {
  width: 20px;
  height: 20px;
  background: #2D3436;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-right: 10px;
}

.rank-info { flex: 1; overflow: hidden; }
.rank-note { font-size: 13px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-date { font-size: 10px; color: #999; }
.rank-amount { font-weight: 700; color: #2D3436; }

</style>