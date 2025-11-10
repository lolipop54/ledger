<template>
  <div class="stats-page">
    <van-nav-bar 
      class="summary-nav" 
      title="统计"
      fixed
      text-color="#6b4e00"
      :title-style="{ fontWeight: '600', fontSize: '18px' }"
    />
    <div class="content">

      <div class="summary-cards">
        <div class="summary-card income-card">
          <div class="card-icon">📈</div>
          <div class="card-title">本月收入</div>
          <div class="card-value income">¥ {{ format(monthTotal.income) }}</div>
        </div>
        <div class="summary-card expense-card">
          <div class="card-icon">📉</div>
          <div class="card-title">本月支出</div>
          <div class="card-value expense">¥ {{ format(monthTotal.expense) }}</div>
        </div>
        <div class="summary-card balance-card">
          <div class="card-icon">💰</div>
          <div class="card-title">本月结余</div>
          <div class="card-value" :class="{ 'positive': monthTotal.balance >= 0, 'negative': monthTotal.balance < 0 }">¥ {{ format(monthTotal.balance) }}</div>
        </div>
      </div>

      <!-- 支出饼图 -->
      <div class="section-title">支出分类统计</div>
      <div class="chart-section">
        <div class="pie-chart-container">
          <div v-if="expensePieData.length > 0">
            <div 
              ref="expenseChartRef" 
              class="echarts-pie-chart"
            ></div>
          </div>
          <div v-else class="no-data">
            <div class="empty-icon">📊</div>
            <div class="empty-text">暂无支出数据</div>
          </div>
        </div>
      
      <!-- 支出明细 -->
      <div class="detail-list" v-if="expensePieData.length > 0">
        <div
          v-for="item in expensePieData"
          :key="item.category"
          class="list-item-container"
        >
          <div class="list-item"
            @click="toggleCategoryExpand($event, item.category)"
            :class="{ 'highlighted': highlightedCategory.includes(item.category) }"
          >
          <div class="list-item-content">
              <div class="category-info">
                <div class="category-color" :style="{ backgroundColor: item.color }"></div>
                <div class="category-name">{{ item.category }}</div>
              </div>
              <div class="category-amount">
                <div class="amount">¥ {{ format(item.total) }}</div>
                <div class="percentage">{{ item.percentage }}%</div>
              </div>
              <div class="expand-icon">
                {{ expandedCategories[item.category] ? '▼' : '▶' }}
              </div>
            </div>
            <div class="progress-bar" :class="expandedCategories[item.category] ? 'show' : ''">
              <div class="progress-fill" :style="{ '--width': item.percentage + '%', backgroundColor: item.color }" :class="expandedCategories[item.category] ? 'show' : ''"></div>
              <!-- <div class="progress-percentage">{{ item.percentage }}%</div> -->
            </div>
          </div>
          
          <!-- 分类排行榜 -->
          <div class="category-ranking" v-if="expandedCategories[item.category]">
            <div class="ranking-title" style="font-size: 10px;">排行榜(前10名)</div>
            <div class="ranking-item"
              v-for="(record, index) in getCategoryRecords('expense', item.category)"
              :key="record.id || index"
            >
              <div class="ranking-index">{{ index + 1 }}</div>
              <div class="ranking-info">
                <div class="ranking-note">{{ record.note || '无备注' }}</div>
                <div class="ranking-date">{{ record.date.slice(0, 10) || '-' }}</div>
              </div>
              <div class="ranking-amount">
                <div class="amount">¥ {{ format(record.amount) }}</div>
                <div class="percentage">{{ record.percentage }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <!-- 收入饼图 -->
      <div class="chart-section">
        <div class="section-title">收入分类统计</div>
        <div class="pie-chart-container">
          <div v-if="incomePieData.length > 0">
            <div 
              ref="incomeChartRef" 
              class="echarts-pie-chart"
            ></div>
          </div>
          <div v-else class="no-data">
            <div class="empty-icon">📈</div>
            <div class="empty-text">暂无收入数据</div>
          </div>
        </div>
      
      <!-- 收入明细 -->
      <div class="detail-list" v-if="incomePieData.length > 0">
        <div
          v-for="item in incomePieData"
          :key="item.category"
          class="list-item-container"
        >
          <div class="list-item"
            @click="toggleCategoryExpand($event, item.category)"
            :class="{ 'highlighted': highlightedCategory.includes(item.category) }"
          >
          <div class="list-item-content">
              <div class="category-info">
                <div class="category-color" :style="{ backgroundColor: item.color }"></div>
                <div class="category-name">{{ item.category }}</div>
              </div>
              <div class="category-amount">
                <div class="amount">¥ {{ format(item.total) }}</div>
                <div class="percentage">{{ item.percentage }}%</div>
              </div>
              <div class="expand-icon">
                {{ expandedCategories[item.category] ? '▼' : '▶' }}
              </div>
            </div>
            <div class="progress-bar" :class="expandedCategories[item.category] ? 'show' : ''">
              <div class="progress-fill" :style="{ '--width': item.percentage + '%', backgroundColor: item.color }" :class="expandedCategories[item.category] ? 'show' : ''"></div>
              <!-- <div class="progress-percentage">{{ item.percentage }}%</div> -->
            </div>
          </div>
          
          <!-- 分类排行榜 -->
          <div class="category-ranking" v-if="expandedCategories[item.category]">
            <div class="ranking-title" style="font-size: 10px;">排行榜(前10名)</div>
            <div class="ranking-item"
              v-for="(record, index) in getCategoryRecords('income', item.category)"
              :key="record.id || index"
            >
              <div class="ranking-index">{{ index + 1 }}</div>
              <div class="ranking-info">
                <div class="ranking-note">{{ record.note || '无备注' }}</div>
                <div class="ranking-date">{{ record.date.slice(0, 10) || '-' }}</div>
              </div>
              <div class="ranking-amount">
                <div class="amount">¥ {{ format(record.amount) }}</div>
                <div class="percentage">{{ record.percentage }}%</div>
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
const toggleCategoryExpand = (event, category) => {
  // 阻止冒泡，避免触发highlightCategory
  event.stopPropagation();
  expandedCategories.value[category] = !expandedCategories.value[category];
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
/* 全局样式 */
.stats-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f8fa 0%, #f0f2f5 100%);
}

.summary-nav {
  background-color: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  padding-top: 40px;
  padding-bottom: 16px;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 2px 10px rgba(255, 216, 77, 0.2);
}

.content {
  padding-top: 110px;
  padding-bottom: 120px;
  padding-left: 16px;
  padding-right: 16px;
}

/* 汇总卡片样式 */
.summary-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 30px;
}

.summary-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #FFD84D 0%, #FFC75F 100%);
}

.summary-card.income-card::before {
  background: linear-gradient(90deg, #2aa515 0%, #36cf27 100%);
}

.summary-card.expense-card::before {
  background: linear-gradient(90deg, #e84d3d 0%, #f56c6c 100%);
}

.summary-card.balance-card::before {
  background: linear-gradient(90deg, #6C63FF 0%, #8E86FF 100%);
}

.summary-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7f8fa 0%, #e8e8e8 100%);
  border-radius: 50%;
  flex-shrink: 0;
}

.card-title {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  flex: 1;
}

.card-value.income {
  color: #2aa515;
}

.card-value.expense {
  color: #e84d3d;
}

.card-value.positive {
  color: #2aa515;
}

.card-value.negative {
  color: #e84d3d;
}

/* 图表区域样式 */
.chart-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.section-title {
  color: #666;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-left: 8px;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #FFD84D 0%, #FFC75F 100%);
  border-radius: 4px;
}

/* 饼图样式 */
.pie-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  min-height: 240px;
}

/* ECharts饼图容器样式 */
.echarts-pie-chart {
  width: 256px;
  height: 256px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 饼图中心 */
.pie-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.center-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.center-label {
  font-size: 14px;
  font-weight: 600;
  color: #666;
}

/* 空状态 */
.no-data {
  color: #999;
  font-size: 14px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

/* 详情列表 */
.detail-list {
  margin-top: 20px;
}

.list-item-container {
  margin-bottom: 8px;
  border-radius: 12px;
  overflow: hidden;
}

.list-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 12px;
  /* padding: 16px 12px;
  border-bottom: 1px solid #f5f5f5;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
  overflow: hidden; */
}
.list-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 12px;
  border-bottom: 1px solid #f5f5f5;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

/* 展开图标样式 */
.expand-icon {
  font-size: 14px;
  color: #999;
  margin-left: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  width: 20px;
  text-align: center;
}

.expand-icon:active {
  background: rgba(0, 0, 0, 0.05);
  color: #666;
}

/* 分类排行榜样式 */
.category-ranking {
  padding: 5px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 12px 12px;
  animation: slideup 0.3s ease-out;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

@keyframes slideup {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 排行榜条目样式 */
.ranking-item {
  display: flex;
  align-items: center;
  padding: 8px 4px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.ranking-item:last-child {
  margin-bottom: 0;
}

/* .ranking-item:hover {
  background: rgba(255, 216, 77, 0.1);
} */

.ranking-item:active {
  background: rgba(255, 216, 77, 0.1);
  transform: translateX(4px);
}

/* 排名索引样式 */
.ranking-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  color: #6b4e00;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(255, 216, 77, 0.3);
}

/* 统一所有排名使用黄色背景 */
.ranking-item:nth-child(1) .ranking-index,
.ranking-item:nth-child(2) .ranking-index,
.ranking-item:nth-child(3) .ranking-index {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  color: #6b4e00;
}

/* 排行榜信息样式 */
.ranking-info {
  flex: 1;
  min-width: 0;
}

.ranking-note {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-date {
  font-size: 12px;
  color: #999;
}

/* 排行榜金额样式 */
.ranking-amount {
  text-align: right;
  margin-left: 12px;
  min-width: 80px;
}

.ranking-amount .amount {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.ranking-amount .percentage {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}


.list-item:active {
  transform: scale(0.98);
  transform-origin: center;
}

.list-item.highlighted {
  background: rgba(255, 216, 77, 0.2);
  box-shadow: 0 2px 8px rgba(255, 216, 77, 0.3);
}

.category-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.category-name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.category-amount {
  text-align: right;
  margin-left: 16px;
  min-width: 120px;
  margin-right: 8px;
}

.amount {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.percentage {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  font-weight: 500;
}

/* 进度条 */
.progress-bar {
  height: 3px;
  width: 100%;
  background: rgba(0, 0, 0, 0.05);
  overflow: visible;
  border-radius: 12px;
  opacity: 0;
  transition: all 0.8s ease-out;
}

.progress-fill {
  height: 100%;
  width: 0;
  transition: all 1.2s ease-out;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);  
}

.progress-bar.show {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  opacity: 1;
}

.progress-fill.show {
  width: var(--width);
}

/* .progress-percentage {
  font-size: 10px;
  color: #999;
  margin-left: 8px;
  margin-bottom: 5px;
  font-weight: 500;
} */

.summary-card,
.chart-section {
  animation: fadeIn 0.6s ease-out;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-item {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (min-width: 414px) {
  .summary-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 导航栏样式增强 */
:deep(.van-nav-bar) {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%) !important;
}

:deep(.van-nav-bar__title) {
  color: #6b4e00 !important;
  font-weight: 600;
}
</style>


