<template>
  <div class="add-page">
    <!-- 头部切换区域 -->
    <div class="header">
      <div class="tab-toggle">
        <div 
          class="tab-item" 
          :class="{ active: tabIndex === 0 }"
          @click="tabIndex = 0"
        >支出</div>
        <div 
          class="tab-item" 
          :class="{ active: tabIndex === 1 }"
          @click="tabIndex = 1"
        >收入</div>
      </div>
    </div>
    
    <!-- 分类网格区域 -->
    <div class="category">
      <div class="category-tip">选择分类</div>
      <div class="category-grid">
        <div 
          v-for="c in currentCategories"
          :key="c.value"
          class="cat-item-wrapper"
          @click="pickCategory(c)"
        >
          <div :class="['cat-item', { active: form.category === c.value }]">
            <div class="icon">{{ c.icon }}</div>
            <div class="text">{{ c.text }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期选择弹窗 (样式覆盖) -->
    <van-popup 
      v-model:show="showDate" 
      position="bottom" 
      class="clash-popup"
    >
      <van-date-picker
        title="选择日期"
        :columns-type="['year','month','day']"
        :min-date="minDate"
        :max-date="maxDate"
        v-model="ymd"
        @confirm="onPickDate"
        @cancel="showDate = false"
        @click.stop
        @touchmove.stop
        class="clash-picker"
      />
    </van-popup>

    <!-- 输入面板 (覆盖在底部) -->
    <transition name="slide-up">
      <div v-if="showKeyboard" class="kb-panel">
        <!-- 顶部折叠条 -->
        <div class="collapse-bar" @click="showKeyboard = false">
          <div class="collapse-handle"></div>
        </div>

        <!-- 金额显示 -->
        <div class="amount-row">
          <div class="amount-display">
            <span class="currency">¥</span>
            <span class="amount">{{ displayAmount }}</span>
          </div>
          <div class="current-date" @click="showDate = true">
            {{ dateText }} <van-icon name="arrow-down" />
          </div>
        </div>

        <!-- 备注输入 -->
        <div class="note-box">
          <van-field 
            v-model="form.note" 
            placeholder="写点备注..." 
            class="clash-input"
            :border="false"
          >
            <template #left-icon>
              <span style="font-size: 18px; margin-right: 4px;">✏️</span>
            </template>
          </van-field>
        </div>

        <!-- 键盘操作区 -->
        <div class="keyboard-grid">
          <div class="num-pad">
            <div class="key-row">
              <div class="key-btn" @click="onKey('1')">1</div>
              <div class="key-btn" @click="onKey('2')">2</div>
              <div class="key-btn" @click="onKey('3')">3</div>
            </div>
            <div class="key-row">
              <div class="key-btn" @click="onKey('4')">4</div>
              <div class="key-btn" @click="onKey('5')">5</div>
              <div class="key-btn" @click="onKey('6')">6</div>
            </div>
            <div class="key-row">
              <div class="key-btn" @click="onKey('7')">7</div>
              <div class="key-btn" @click="onKey('8')">8</div>
              <div class="key-btn" @click="onKey('9')">9</div>
            </div>
            <div class="key-row">
              <div class="key-btn" @click="onKey('.')">.</div>
              <div class="key-btn" @click="onKey('0')">0</div>
              <div class="key-btn del-btn" @click="onDel">
                <van-icon name="delete-o" />
              </div>
            </div>
          </div>
          
          <!-- 右侧功能键 -->
          <div class="func-pad">
            <div class="func-btn date-btn" @click="openToday">今天</div>
            <div class="func-btn confirm-btn" @click="onSubmit">
              完成
            </div>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 遮罩层 (点击关闭键盘) -->
    <div 
      v-if="showKeyboard" 
      class="overlay" 
      @click="showKeyboard = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'; // 引入 watch
import { useRouter } from 'vue-router';
import { showFailToast, showSuccessToast } from 'vant';
import { useLedger } from '../composables/useLedger';

const router = useRouter();
const { addRecord } = useLedger();

const form = ref({
  type: 'expense',
  amount: undefined,
  category: '餐饮',
  note: '',
  date: new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').slice(0,10)
});

// 数据定义保持不变
const expenseCategories = [
  { text: '餐饮', value: '餐饮', icon: '🍽️' ,type:'expense'},
  { text: '买菜', value: '买菜', icon: '🍖' ,type:'expense'},
  { text: '购物', value: '购物', icon: '🛍️' ,type:'expense'},
  { text: '交通', value: '交通', icon: '🚌' ,type:'expense'},
  { text: '娱乐', value: '娱乐', icon: '🎮' ,type:'expense'},
  { text: '通讯', value: '通讯', icon: '📞' ,type:'expense'},
  { text: '零食', value: '零食', icon: '🧁' ,type:'expense'},
  { text: '日用', value: '日用', icon: '🧻' ,type:'expense'},
  { text: '蔬菜', value: '蔬菜', icon: '🥕' ,type:'expense'},
  { text: '水果', value: '水果', icon: '🍎' ,type:'expense'},
  { text: '运动', value: '运动', icon: '🚴' ,type:'expense'},
  { text: '服饰', value: '服饰', icon: '👕' ,type:'expense'},
  { text: '美容', value: '美容', icon: '💄' ,type:'expense'},
  { text: '住房', value: '住房', icon: '🏠' ,type:'expense'},
  { text: '医疗', value: '医疗', icon: '💊' ,type:'expense'},
  { text: '孩子', value: '孩子', icon: '🧒' ,type:'expense'},
  { text: '长辈', value: '长辈', icon: '🧓' ,type:'expense'},
  { text: '旅行', value: '旅行', icon: '✈️' ,type:'expense'},
  { text: '聚会', value: '聚会', icon: '🍷' ,type:'expense'},
  { text: '其他', value: '其他', icon: '📦' ,type:'expense'}
];
const incomeCategories = [
  { text: '工资', value: '工资', icon: '💰' ,type:'income'},
  { text: '兼职', value: '兼职', icon: '🧾' ,type:'income'},
  { text: '理财', value: '理财', icon: '📈' ,type:'income'},
  { text: '其他', value: '其他', icon: '💵' ,type:'income'}
];

const tabIndex = ref(0); // 0 支出 1 收入
const currentCategories = computed(() => tabIndex.value === 0 ? expenseCategories : incomeCategories);
const showKeyboard = ref(false);

// 监听 tabIndex 变化来切换 type，修复切换 Tab 不更新 type 的问题
watch(tabIndex, (newVal) => {
  form.value.type = newVal === 0 ? 'expense' : 'income';
  // 切换 tab 时重置分类为该类型下的第一个
  const cats = newVal === 0 ? expenseCategories : incomeCategories;
  form.value.category = cats[0].value;
});

const pickCategory = (c) => {
  form.value.category = c.value;
  showKeyboard.value = true;
};

const showDate = ref(false);
const minDate = new Date(new Date().getFullYear() - 3, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 1, 11, 31, 23, 59, 59);
const now = new Date();
const ymd = ref([
  String(now.getFullYear()),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
]);
const dateText = computed(() => form.value.date.slice(5)); // 只显示月-日

const onPickDate = (arg) => {
  const sel = Array.isArray(arg) ? arg : arg?.selectedValues;
  const [y, m, d] = sel || ymd.value;
  const cur = new Date();
  const dt = new Date(Number(y), Number(m) - 1, Number(d || '1'), cur.getHours(), cur.getMinutes());
  
  form.value.date = dt.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).replace(/\//g, '-').slice(0,10);
  
  ymd.value = [String(y), String(m).padStart(2,'0'), String(d).padStart(2,'0')];
  showDate.value = false;
};

// 金额输入逻辑
const amountStr = ref('0');
const displayAmount = computed(() => amountStr.value);

const onKey = (key) => {
  if (key === '.') {
    if (amountStr.value.includes('.')) return;
    amountStr.value += '.';
    return;
  }
  if (amountStr.value === '0') {
    amountStr.value = key;
  } else {
    // 限制两位小数
    const parts = amountStr.value.split('.');
    if (parts.length > 1 && parts[1].length >= 2) return;
    if (amountStr.value.length >= 9) return; // 限制最大长度
    amountStr.value += key;
  }
};

const onDel = () => {
  if (amountStr.value.length <= 1) {
    amountStr.value = '0';
  } else {
    amountStr.value = amountStr.value.slice(0, -1);
  }
};

const openToday = () => {
  const t = new Date();
  form.value.date = t.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).replace(/\//g, '-').slice(0,10);
  ymd.value = [String(t.getFullYear()), String(t.getMonth()+1).padStart(2,'0'), String(t.getDate()).padStart(2,'0')];
  showSuccessToast('已切换到今天');
};

const onSubmit = () => {
  form.value.amount = Number(amountStr.value);
  if (!form.value.amount || form.value.amount <= 0) {
    showFailToast('请输入金额');
    return;
  }
  
  try {
    addRecord({ ...form.value });
    showSuccessToast('记账成功');
    // 重置表单
    amountStr.value = '0';
    form.value.note = '';
    showKeyboard.value = false;
    // router.replace('/'); // 可选：记账后不跳转，方便连续记账
  } catch (error) {
    showFailToast('保存失败');
  }
};
</script>

<style scoped>
/* 全局变量占位，确保样式生效 (假设 App.vue 已定义) */
/* :root { --clash-black: #2D3436; --clash-purple: #6C5CE7; --clash-yellow: #FDCB6E; --clash-bg: #F0F2F5; } */

.add-page {
  height: 100vh;
  background: var(--clash-bg, #F0F2F5);
  /* 波点背景 */
  background-image: radial-gradient(#2D3436 1px, transparent 1px);
  background-size: 20px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* --- 头部 --- */
.header {
  padding: 20px;
  /* 去掉渐变背景，改用透明 */
  background: transparent;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.tab-toggle {
  display: flex;
  background: #fff;
  border: 2px solid #2D3436;
  border-radius: 12px;
  box-shadow: 4px 4px 0 #2D3436;
  overflow: hidden;
}

.tab-item {
  padding: 10px 30px;
  font-weight: 900;
  font-size: 16px;
  cursor: pointer;
  color: #2D3436;
  transition: all 0.2s;
}

.tab-item:first-child {
  border-right: 2px solid #2D3436;
}

.tab-item.active {
  background: #FDCB6E; /* 亮黄 */
  color: #2D3436;
}

/* --- 分类区 --- */
.category {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 100px; /* 底部留白给键盘 */
}

.category-tip {
  text-align: center;
  font-weight: 700;
  margin: 16px 0;
  color: #2D3436;
  opacity: 0.6;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.cat-item-wrapper {
  display: flex;
  justify-content: center;
}

.cat-item {
  width: 72px;
  height: 72px;
  background: #fff;
  border: 2px solid #2D3436;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  box-shadow: 2px 2px 0 #2D3436; /* 默认小阴影 */
}

.cat-item:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #2D3436;
}

.cat-item.active {
  background: #6C5CE7; /* 高亮紫 */
  color: #fff;
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #2D3436; /* 选中时按下效果 */
  border-color: #2D3436;
}

.cat-item.active .text {
  color: #fff;
  font-weight: 700;
}

.icon { font-size: 24px; margin-bottom: 4px; }
.text { font-size: 12px; font-weight: 600; color: #2D3436; }

/* --- 键盘面板 (Neo-Brutalism) --- */
.kb-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 2px solid #2D3436;
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 0 rgba(0,0,0,0.1);
  margin-bottom: 64px
}

/* 折叠条 */
.collapse-bar {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2px solid #2D3436;
  background: #f0f0f0;
}
.collapse-handle {
  width: 40px;
  height: 4px;
  background: #2D3436;
  border-radius: 2px;
}

/* 金额行 */
.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 12px 16px;
  border-bottom: 2px solid #2D3436;
}

.amount-display {
  font-weight: 900;
  color: #2D3436;
}
.currency { font-size: 24px; margin-right: 4px; }
.amount { font-size: 36px; font-family: 'Outfit', sans-serif; }

.current-date {
  background: #FDCB6E;
  border: 2px solid #2D3436;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 2px 2px 0 #2D3436;
}
.current-date:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #2D3436;
}

/* 备注 */
.note-box {
  padding: 8px 16px;
  border-bottom: 2px solid #2D3436;
}
.clash-input {
  background: #f9f9f9;
  border: 2px solid #2D3436 !important;
  border-radius: 8px;
  padding: 6px 12px;
}

/* 键盘按键区 */
.keyboard-grid {
  display: flex;
  height: 240px;
}

.num-pad {
  flex: 3;
  display: flex;
  flex-direction: column;
  border-right: 2px solid #2D3436;
}

.key-row {
  flex: 1;
  display: flex;
  border-bottom: 2px solid #2D3436;
}
.key-row:last-child { border-bottom: none; }

.key-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  border-right: 2px solid #2D3436;
  background: #fff;
}
.key-btn:last-child { border-right: none; }
.key-btn:active { background: #e0e0e0; }

.del-btn { color: #FF7675; }

/* 右侧功能区 */
.func-pad {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.func-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  border-bottom: 2px solid #2D3436;
}
.func-btn:active { opacity: 0.8; }

.date-btn {
  flex: 1;
  background: #fff;
  font-size: 16px;
}

.confirm-btn {
  flex: 2; /* 占据更多高度 */
  background: #00B894; /* 确认色 */
  color: #2D3436;
  font-size: 18px;
  border-bottom: none;
}

/* 遮罩 */
.overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.2);
  z-index: 150;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 弹窗样式覆盖 (与 TransactionItem 一致) */
:deep(.clash-popup) {
  border-top: 2px solid #2D3436;
}
:deep(.clash-picker) {
  .van-picker__confirm { color: #6C5CE7; font-weight: 900; }
  .van-picker__toolbar { border-bottom: 2px solid #2D3436; }
}
</style>