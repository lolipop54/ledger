<template>
  <div class="stats-page">
    <!-- 导航栏 -->
    <div class="clash-nav">
      <div class="nav-title">统计看板</div>
    </div>

    <!-- 顶部控制区 (固定在导航栏下方) -->
    <div class="control-bar">
      <!-- 模式切换 -->
      <div class="view-switch">
        <div 
          class="switch-item" 
          :class="{ active: currentView === 'month' }"
          @click="currentView = 'month'"
        >月统计</div>
        <div 
          class="switch-item" 
          :class="{ active: currentView === 'year' }"
          @click="currentView = 'year'"
        >年统计</div>
      </div>

      <!-- 日期选择器 -->
      <div class="date-selector">
        <div class="date-arrow" @click="changeDate(-1)">◀</div>
        <div class="date-display">{{ dateDisplayText }}</div>
        <div class="date-arrow" @click="changeDate(1)">▶</div>
      </div>
    </div>

    <div class="content">
      <!-- 月统计视图 -->
      <div v-if="currentView === 'month'" class="month-view">
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
                :class="{ 'active': expandedCategories[`${currentView}_expense_${item.category}`] }"
              >
                <div class="list-item-main">
                  <div class="category-color-dot" :style="{ backgroundColor: item.color }"></div>
                  <div class="category-name">{{ item.category }}</div>
                  <div class="category-right">
                    <div class="amount">¥ {{ format(item.total) }}</div>
                    <div class="percentage">{{ item.percentage }}%</div>
                  </div>
                  <div class="expand-arrow">
                    {{ expandedCategories[`${currentView}_expense_${item.category}`] ? '▼' : '▶' }}
                  </div>
                </div>
                
                <!-- 进度条作为背景装饰 -->
                <div class="progress-bg" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
              </div>
              
              <!-- 排行榜 (展开内容) -->
              <div class="ranking-panel" v-if="expandedCategories[`${currentView}_expense_${item.category}`]">
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
                :class="{ 'active': expandedCategories[`${currentView}_income_${item.category}`] }"
              >
                <div class="list-item-main">
                  <div class="category-color-dot" :style="{ backgroundColor: item.color }"></div>
                  <div class="category-name">{{ item.category }}</div>
                  <div class="category-right">
                    <div class="amount">¥ {{ format(item.total) }}</div>
                    <div class="percentage">{{ item.percentage }}%</div>
                  </div>
                  <div class="expand-arrow">
                    {{ expandedCategories[`${currentView}_income_${item.category}`] ? '▼' : '▶' }}
                  </div>
                </div>
                <div class="progress-bg" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
              </div>
              
              <div class="ranking-panel" v-if="expandedCategories[`${currentView}_income_${item.category}`]">
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

      <!-- 年统计视图 -->
      <div v-else class="year-view">
        <!-- 汇总卡片 -->
        <div class="summary-cards">
          <div class="summary-card income-card">
            <div class="card-inner">
              <div class="card-icon-box">📈</div>
              <div class="card-info">
                <div class="card-label">年度收入</div>
                <div class="card-value">¥ {{ format(yearStats.totalIncome) }}</div>
              </div>
            </div>
          </div>
          
          <div class="summary-card expense-card">
            <div class="card-inner">
              <div class="card-icon-box">📉</div>
              <div class="card-info">
                <div class="card-label">年度支出</div>
                <div class="card-value">¥ {{ format(yearStats.totalExpense) }}</div>
              </div>
            </div>
          </div>

          <div class="summary-card balance-card">
            <div class="card-inner">
              <div class="card-icon-box">💰</div>
              <div class="card-info">
                <div class="card-label">年度结余</div>
                <div class="card-value" :class="{ 'negative': yearStats.totalIncome - yearStats.totalExpense < 0 }">
                  ¥ {{ format(yearStats.totalIncome - yearStats.totalExpense) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年度趋势图 -->
        <div class="chart-section">
          <div class="section-header">
            <span class="header-icon">📉</span>
            <span class="header-title">年度收支趋势</span>
          </div>
          <div class="line-chart-container">
             <div ref="yearTrendChartRef" class="echarts-line-chart"></div>
          </div>
        </div>

        <!-- 年度支出排行榜 -->
        <div class="chart-section">
           <div class="section-header">
            <span class="header-icon">💸</span>
            <span class="header-title">年度支出排行</span>
          </div>
          
          <div v-if="yearStats.expenseRanking.length > 0" class="detail-list">
             <div
              v-for="item in yearStats.expenseRanking"
              :key="item.category"
              class="list-item-wrapper"
            >
              <div class="list-item"
                @click="toggleCategoryExpand($event, item.category, 'expense')"
                :class="{ 'active': expandedCategories[`${currentView}_expense_${item.category}`] }"
              >
                <div class="list-item-main">
                  <div class="category-color-dot" :style="{ backgroundColor: item.color }"></div>
                  <div class="category-name">{{ item.category }}</div>
                  <div class="category-right">
                    <div class="amount">¥ {{ format(item.total) }}</div>
                    <div class="percentage">{{ item.percentage }}%</div>
                  </div>
                  <div class="expand-arrow">
                    {{ expandedCategories[`${currentView}_expense_${item.category}`] ? '▼' : '▶' }}
                  </div>
                </div>
                <div class="progress-bg" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
              </div>

              <!-- 排行榜 (展开内容) -->
              <div class="ranking-panel" v-if="expandedCategories[`${currentView}_expense_${item.category}`]">
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
          <div v-else class="no-data">
             <div class="empty-icon">🌵</div>
             <div class="empty-text">暂无年度支出</div>
          </div>
        </div>

         <!-- 年度收入排行榜 -->
        <div class="chart-section">
           <div class="section-header">
            <span class="header-icon">💰</span>
            <span class="header-title">年度收入排行</span>
          </div>
          
          <div v-if="yearStats.incomeRanking.length > 0" class="detail-list">
             <div
              v-for="item in yearStats.incomeRanking"
              :key="item.category"
              class="list-item-wrapper"
            >
              <div class="list-item"
                @click="toggleCategoryExpand($event, item.category, 'income')"
                :class="{ 'active': expandedCategories[`${currentView}_income_${item.category}`] }"
              >
                <div class="list-item-main">
                  <div class="category-color-dot" :style="{ backgroundColor: item.color }"></div>
                  <div class="category-name">{{ item.category }}</div>
                  <div class="category-right">
                    <div class="amount">¥ {{ format(item.total) }}</div>
                    <div class="percentage">{{ item.percentage }}%</div>
                  </div>
                  <div class="expand-arrow">
                    {{ expandedCategories[`${currentView}_income_${item.category}`] ? '▼' : '▶' }}
                  </div>
                </div>
                <div class="progress-bg" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
              </div>

              <!-- 排行榜 (展开内容) -->
              <div class="ranking-panel" v-if="expandedCategories[`${currentView}_income_${item.category}`]">
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
          <div v-else class="no-data">
             <div class="empty-icon">🍃</div>
             <div class="empty-text">暂无年度收入</div>
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

// 状态管理
const currentView = ref('month'); // 'month' | 'year'
const currentDate = ref(new Date());

// 高亮显示的分类
const highlightedCategory = ref([]);
// 展开的分类
const expandedCategories = ref({});

// 初始化数据
onMounted(async () => {
  await initData();
  refreshCharts();
});

// 监听视图和日期变化，刷新图表
watch([currentView, currentDate], () => {
  refreshCharts();
}, { deep: true });

const refreshCharts = () => {
  nextTick(() => {
    if (currentView.value === 'month') {
      if (expenseChartRef.value && expensePieData.value.length > 0) {
        initChart(expenseChartRef, expensePieData.value, 'expense');
      }
      if (incomeChartRef.value && incomePieData.value.length > 0) {
        initChart(incomeChartRef, incomePieData.value, 'income');
      }
    } else {
      if (yearTrendChartRef.value) {
        initYearTrendChart();
      }
    }
  });
};

// ECharts实例引用
const expenseChartRef = ref(null);
const incomeChartRef = ref(null);
const yearTrendChartRef = ref(null);

let expenseChartInstance = null;
let incomeChartInstance = null;
let yearTrendChartInstance = null;

// --- 日期处理逻辑 ---

const dateDisplayText = computed(() => {
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth() + 1;
  if (currentView.value === 'month') {
    return `${y}年${m.toString().padStart(2, '0')}月`;
  } else {
    return `${y}年`;
  }
});

const changeDate = (step) => {
  const d = new Date(currentDate.value);
  if (currentView.value === 'month') {
    d.setMonth(d.getMonth() + step);
  } else {
    d.setFullYear(d.getFullYear() + step);
  }
  currentDate.value = d;
};

// 计算当前月份字符串 YYYY-MM
const localCurrentYM = computed(() => {
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
});

// 计算当前年份字符串 YYYY
const localCurrentYear = computed(() => {
  return currentDate.value.getFullYear().toString();
});

// --- 月度数据逻辑 (基于 localCurrentYM) ---

const monthList = computed(() => records.value.filter(r => (r.date || '').slice(0,7) === localCurrentYM.value));

const monthTotal = computed(() => {
  const income = monthList.value
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const expense = monthList.value
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  return {
    income,
    expense,
    balance: income - expense
  };
});

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

const expensePieData = computed(() => {
  const expenseItems = byCategory.value.filter(item => item.type === 'expense');
  const total = expenseItems.reduce((sum, item) => sum + item.total, 0);
  return expenseItems.map(item => ({
    ...item,
    percentage: total > 0 ? (item.total / total * 100).toFixed(1) : 0,
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

// --- 年度数据逻辑 (基于 localCurrentYear) ---

const yearList = computed(() => records.value.filter(r => (r.date || '').slice(0,4) === localCurrentYear.value));

const yearStats = computed(() => {
  const list = yearList.value;
  
  // 1. 月度趋势数据
  const monthlyTrend = Array(12).fill(0).map(() => ({ income: 0, expense: 0 }));
  list.forEach(r => {
    const m = parseInt((r.date || '').slice(5, 7)) - 1; // 0-11
    if (m >= 0 && m < 12) {
      if (r.type === 'income') monthlyTrend[m].income += Number(r.amount || 0);
      else if (r.type === 'expense') monthlyTrend[m].expense += Number(r.amount || 0);
    }
  });

  // 2. 分类排行榜数据
  const catMap = new Map();
  list.forEach(r => {
    const key = `${r.type}|${r.category}`;
    catMap.set(key, (catMap.get(key) || 0) + Number(r.amount || 0));
  });

  const allCats = Array.from(catMap.entries()).map(([k, total]) => {
    const [type, category] = k.split('|');
    return { type, category, total };
  });

  // 计算年度总收支用于计算百分比
  const totalExpense = allCats.filter(c => c.type === 'expense').reduce((s, c) => s + c.total, 0);
  const totalIncome = allCats.filter(c => c.type === 'income').reduce((s, c) => s + c.total, 0);

  const expenseRanking = allCats
    .filter(c => c.type === 'expense')
    .sort((a, b) => b.total - a.total)
    .map(c => ({
      ...c,
      percentage: totalExpense > 0 ? (c.total / totalExpense * 100).toFixed(1) : 0,
      color: generateColor(c.category)
    }));

  const incomeRanking = allCats
    .filter(c => c.type === 'income')
    .sort((a, b) => b.total - a.total)
    .map(c => ({
      ...c,
      percentage: totalIncome > 0 ? (c.total / totalIncome * 100).toFixed(1) : 0,
      color: generateColor(c.category)
    }));

  return {
    monthlyTrend,
    expenseRanking,
    incomeRanking,
    totalIncome,
    totalExpense
  };
});


// --- 公共函数 ---

const highlightCategory = (category) => {
  if(highlightedCategory.value.includes(category)){
    highlightedCategory.value.splice(highlightedCategory.value.indexOf(category), 1);
  }else{
    highlightedCategory.value.push(category);
  }
};

const toggleCategoryExpand = (event, category, type) => {
  event.stopPropagation();
  const key = `${currentView.value}_${type}_${category}`;
  expandedCategories.value[key] = !expandedCategories.value[key];
  highlightCategory(category);
};

const getCategoryRecords = (type, category) => {
  // 根据当前视图决定数据源
  const sourceList = currentView.value === 'month' ? monthList.value : yearList.value;
  
  // 根据当前视图决定分类汇总数据源，用于计算占比
  let categoryTotal = 0;
  if (currentView.value === 'month') {
    categoryTotal = byCategory.value.find(c => c.type === type && c.category === category)?.total || 0;
  } else {
    // 从 yearStats 中查找
    const list = type === 'expense' ? yearStats.value.expenseRanking : yearStats.value.incomeRanking;
    categoryTotal = list.find(c => c.category === category)?.total || 0;
  }

  return sourceList
    .filter(r => r.type === type && r.category === category)
    .map(r => ({
      ...r,
      amountNum: Number(r.amount || 0),
      percentage: categoryTotal > 0 ? (Number(r.amount || 0) / categoryTotal * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.amountNum - a.amountNum)
    .slice(0, 10);
};

const calculateItemPercentage = (record, type, category) => {
  // 注意：此辅助函数目前仅在 getCategoryRecords 内部逻辑被替代使用，
  // 如果模板或其他地方没有直接调用它，其实可以删除或保留作为兼容。
  // 为了保险起见，这里保留原逻辑，但实际上 getCategoryRecords 已经内联了计算逻辑。
  const categoryTotal = byCategory.value.find(
    item => item.type === type && item.category === category
  )?.total || 0;
  return categoryTotal > 0 
    ? (Number(record.amount || 0) / categoryTotal * 100).toFixed(1)
    : '0';
};

const getCategoryColor = (category) => {
  const expenseItem = expensePieData.value.find(item => item.category === category);
  if (expenseItem) return expenseItem.color;
  const incomeItem = incomePieData.value.find(item => item.category === category);
  if (incomeItem) return incomeItem.color;
  return '#999';
};

function generateColor(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const hue = hash % 360;
  const saturation = 65 + ((hash % 30) - 15);
  const lightness = 55 + ((hash % 20) - 10);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// --- 图表初始化 ---

function initChart(chartRef, data, type) {
  if (!chartRef.value) return;
  
  if (type === 'expense' && expenseChartInstance) {
    expenseChartInstance.dispose();
  } else if (type === 'income' && incomeChartInstance) {
    incomeChartInstance.dispose();
  }
  
  const instance = echarts.init(chartRef.value);
  if (type === 'expense') expenseChartInstance = instance;
  else incomeChartInstance = instance;
  
  const seriesData = data.map(item => ({
    name: item.category,
    value: item.total,
    itemStyle: { color: item.color }
  }));
  const total = seriesData.reduce((sum, item) => sum + item.value, 0);
  
  const option = {
    tooltip: {
      trigger: 'item',
      position:'inside',
      formatter: function(params) {
        return `${params.name}<br/>金额: ¥${formatAmount(params.value)}<br/>占比: ${params.percent}%`;
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: { color: '#fff', fontSize: 12 },
      padding: 10,
      hideDelay: 0
    },
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
      label: { show: false },
      emphasis: {
        label: { show: false },
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
  instance.setOption(option);
  window.addEventListener('resize', () => { instance.resize(); });
}

function initYearTrendChart() {
  if (!yearTrendChartRef.value) return;
  if (yearTrendChartInstance) yearTrendChartInstance.dispose();

  const instance = echarts.init(yearTrendChartRef.value);
  yearTrendChartInstance = instance;

  const months = Array.from({length: 12}, (_, i) => `${i + 1}月`);
  const expenseData = yearStats.value.monthlyTrend.map(m => m.expense);
  const incomeData = yearStats.value.monthlyTrend.map(m => m.income);

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      textStyle: { color: '#333' },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ¥${formatAmount(item.value)}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['收入', '支出'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months,
      axisLine: { lineStyle: { color: '#999' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: incomeData,
        itemStyle: { color: '#55EFC4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(85, 239, 196, 0.3)' },
            { offset: 1, color: 'rgba(85, 239, 196, 0.05)' }
          ])
        }
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: expenseData,
        itemStyle: { color: '#FF7675' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 118, 117, 0.3)' },
            { offset: 1, color: 'rgba(255, 118, 117, 0.05)' }
          ])
        }
      }
    ]
  };
  
  instance.setOption(option);
  window.addEventListener('resize', () => { instance.resize(); });
}

// 监听数据变化 (如从别的页面添加记录回来)
watch(records, () => {
  refreshCharts();
}, { deep: true });

onUnmounted(() => {
  if (expenseChartInstance) expenseChartInstance.dispose();
  if (incomeChartInstance) incomeChartInstance.dispose();
  if (yearTrendChartInstance) yearTrendChartInstance.dispose();
});

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

/* 控制栏 (切换和日期) */
.control-bar {
  position: fixed;
  top: 60px; left: 0; right: 0;
  background: #fff;
  border-bottom: 2px solid #2D3436;
  padding: 12px 16px;
  z-index: 99;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-switch {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 4px;
  border: 2px solid #2D3436;
}

.switch-item {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  font-size: 14px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.switch-item.active {
  background: #2D3436;
  color: #FDCB6E;
}

.date-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFF8E1;
  border: 2px solid #2D3436;
  border-radius: 8px;
  padding: 8px 12px;
}

.date-arrow {
  font-size: 16px;
  color: #2D3436;
  cursor: pointer;
  padding: 0 8px;
  user-select: none;
}

.date-display {
  font-size: 16px;
  font-weight: 900;
  color: #2D3436;
}


.content {
  padding: 200px 16px 100px; /* 增加顶部 padding 以避开固定头部 */
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

.pie-chart-container, .line-chart-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  background: #fff;
}

.echarts-pie-chart {
  width: 240px;
  height: 240px;
}

.echarts-line-chart {
  width: 100%;
  height: 250px;
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
