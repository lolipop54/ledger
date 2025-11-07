<template>
  <div class="home-page">
    <div class="hero">
      <div class="ym" @click="showMonth = true">
        <span class="y">{{ currentYM.slice(0,4) }}年</span>
        <span class="m">{{ currentYM.slice(5,7) }}月</span>
        <van-icon name="arrow-down" size="14" class="arrow-icon" />
      </div>
      <div class="totals">
        <div class="item income-item">
          <div class="label">本月收入</div>
          <div class="value income">{{ format(monthSummary.income) }}</div>
        </div>
        <div class="item expense-item">
          <div class="label">本月支出</div>
          <div class="value expense">{{ format(monthSummary.expense) }}</div>
        </div>
      </div>
      <div class="balance">
        <div class="label">本月结余</div>
        <div class="value" :class="{ 'positive': monthSummary.income >= monthSummary.expense, 'negative': monthSummary.income < monthSummary.expense }">
          {{ monthSummary.income >= monthSummary.expense ? '+' : '-' }}{{ format(Math.abs(monthSummary.income - monthSummary.expense)) }}
        </div>
      </div>
    </div>

    <van-popup v-model:show="showMonth" round position="bottom">
      <van-date-picker
        :columns-type="['year','month']"
        :min-date="minMonth"
        :max-date="maxMonth"
        v-model="ym"
        title="选择月份"
        @confirm="onPickMonth"
        @cancel="showMonth = false"
      />
    </van-popup>

    <div class="content">
      <div v-if="monthGroups.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">本月暂无记账记录</div>
      <div class="empty-subtext">点击下方「记一笔」开始记录</div>
    </div>
      <div v-else>
        <div v-for="g in monthGroups" :key="g.date" class="group">
          <div class="date">
            <span class="date-text">{{ g.date }}</span>
            <div class="day-total">
              <span class="income-total">收入: {{ format(g.total.income) }}</span>
              <span class="expense-total">支出: {{ format(g.total.expense) }}</span>
            </div>
          </div>
          <div class="records-container">
            <transaction-item
              v-for="r in g.list"
              :key="r.id"
              :record="r"
              @remove="onRemove(r.id)"
              @update="onUpdate"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Dialog, showSuccessToast } from 'vant';
import TransactionItem from '../components/TransactionItem.vue';
import { useLedger, formatAmount } from '../composables/useLedger';
import { ref, computed, inject, onMounted } from 'vue';

const { monthSummaryOf, groupsByDateOf, removeRecord, updateRecord, initData } = useLedger();

// 组件挂载时初始化数据
onMounted(async () => {
  try {
    await initData();
  } catch (error) {
    console.error('初始化数据失败:', error);
  }
});

// 注入共享的月份状态
const sharedCurrentYM = inject('sharedCurrentYM');
const nowYM = new Date().toISOString().slice(0,7);
const currentYM = computed({
  get: () => sharedCurrentYM.value,
  set: (val) => { sharedCurrentYM.value = val; }
});
const monthSummary = computed(() => monthSummaryOf(currentYM.value));
const monthGroups = computed(() => groupsByDateOf(currentYM.value));

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

const onRemove = (id) => {
  // 使用原生confirm对话框，兼容性更好
  if (window.confirm('确定删除该记录吗？')) {
    removeRecord(id);
    showSuccessToast('已删除');
  }
};

const onUpdate = (id, updates) => {
  updateRecord(id, updates);
  showSuccessToast('已更新');
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f7f8fa 0%, #f0f2f5 100%);
}

/* Hero区域美化 */
.hero { 
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%); 
  padding-top: 48px; 
  padding-bottom: 24px; 
  padding-left: 20px; 
  padding-right: 20px; 
  color: #6b4e00; 
  border-radius: 0 0 30px 30px;
  box-shadow: 0 4px 20px rgba(255, 216, 77, 0.2);
  margin-bottom: 20px;
}

.ym { 
  font-size: 16px; 
  opacity: 0.9; 
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ym:hover {
  opacity: 1;
}

.ym .y {
  font-weight: 500;
}

.ym .m { 
  font-size: 32px; 
  font-weight: 700; 
  margin-left: 8px;
  margin-right: 8px;
}

.arrow-icon {
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.ym:hover .arrow-icon {
  transform: translateY(2px);
}

/* 收入支出显示 */
.totals { 
  display: flex; 
  justify-content: space-around; 
  margin-top: 20px;
  margin-bottom: 20px;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  min-width: 140px;
}

.item .label { 
  font-size: 14px; 
  opacity: 0.9;
  margin-bottom: 8px;
  font-weight: 500;
}

.item .value { 
  font-size: 24px; 
  font-weight: 700;
}

.item .value.income { 
  color: #2aa515;
}

.item .value.expense { 
  color: #e84d3d;
}

/* 结余显示 */
.balance {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 16px 20px;
  text-align: center;
  margin-top: 10px;
}

.balance .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
  font-weight: 500;
}

.balance .value {
  font-size: 24px;
  font-weight: 700;
}

.balance .value.positive {
  color: #2aa515;
}

.balance .value.negative {
  color: #e84d3d;
}

/* 内容区域 */
.content { 
  padding: 0 16px 120px;
}

.group { 
  margin-top: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 日期标题 */
.date { 
  color: #666;
  font-size: 14px;
  padding: 12px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px 12px 0 0;
  margin-bottom: 2px;
}

.date-text {
  font-weight: 600;
  color: #333;
}

.day-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.income-total {
  color: #2aa515;
  font-size: 12px;
}

.expense-total {
  color: #e84d3d;
  font-size: 12px;
}

/* 记录容器 */
.records-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}



/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: #999;
}

/* 月份选择器样式增强 */
:deep(.van-popup) {
  border-radius: 20px 20px 0 0;
}

:deep(.van-picker) {
  border-radius: 20px 20px 0 0;
}

:deep(.van-picker__confirm) {
  color: #FFD84D;
  font-weight: 600;
}
</style>

