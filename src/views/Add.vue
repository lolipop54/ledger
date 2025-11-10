<template>
  <div class="add-page">
    <div class="header">
      <van-tabs v-model:active="tabIndex" color="#333" title-active-color="#333" line-width="36" line-height="4">
        <van-tab title="支出" />
        <van-tab title="收入" />
      </van-tabs>
    </div>
    
    <div class="category">
      <div class="category-tip">点击选择分类</div>
      <van-grid :column-num="4" :gutter="12" :border="false">
        <van-grid-item
          v-for="c in currentCategories"
          :key="c.value"
          @click="pickCategory(c)"
          :custom-style="{ padding: '12px 8px' }"
        >
          <div :class="['cat-item', form.category === c.value ? 'active' : '']">
            <div class="icon">{{ c.icon }}</div>
            <div class="text">{{ c.text }}</div>
          </div>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- amount/note/date are integrated into keyboard panel below -->

    <van-popup v-model:show="showDate" round position="bottom" round-radius="24">
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
        :confirm-button-text="'确定'"
        :cancel-button-text="'取消'"
        :confirm-button-color="'#FFD84D'"
      />
    </van-popup>

    <!-- kb-panel放置在数字键盘上方 -->
    <div v-if="showKeyboard" class="kb-panel">
      <div class="collapse-btn" @click="showKeyboard = false">
        <VanIcon name="arrow-down" class="arrow-icon" />
      </div>
      <div class="amount-row">
        <div class="amount-display">
          <span class="currency">¥</span>
          <span class="amount">{{ displayAmount }}</span>
        </div>
        <div class="current-date">{{ dateText }}</div>
      </div>
      <div class="note"><van-field v-model="form.note" placeholder="添加备注..." :left-icon="'chat-o'" /></div>
      <div class="tools">
        <van-button size="small" icon="calendar-o" @click="showDate = true" class="tool-btn">修改日期</van-button>
        <van-button size="small" @click="openToday" class="tool-btn">今天</van-button>
        <van-button size="small" type="primary" @click="onSubmit" class="submit-btn">完成</van-button>
      </div>
    </div>
    
    <!-- 数字键盘 -->
    <div v-if="showKeyboard" class="keyboard">
      <van-number-keyboard
        v-model:show="showKeyboard"
        theme="default"
        extra-key="."
        @input="onKey"
        @delete="onDel"
        @close="onSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast, showSuccessToast, Icon as VanIcon } from 'vant';
import { useLedger } from '../composables/useLedger';

const router = useRouter();
const { addRecord, isLoading } = useLedger();

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
const showKeyboard = ref(false); // 控制键盘和金额备注栏的显示/隐藏，默认隐藏

// 点击空白区域隐藏键盘
const handleClickOutside = (e) => {
  // 如果点击的元素不是分类、键盘、金额备注栏或它们的子元素
  const target = e.target;
  const categoryArea = document.querySelector('.category');
  const keyboardArea = document.querySelector('.keyboard');
  const kbPanel = document.querySelector('.kb-panel');
  const collapseBtn = document.querySelector('.collapse-btn');
  
  if (categoryArea?.contains(target)) {
    // 点击分类区域不隐藏键盘
    return;
  }
  
  if (keyboardArea?.contains(target) || kbPanel?.contains(target) || collapseBtn?.contains(target)) {
    // 点击键盘区域或金额备注栏不隐藏
    return;
  }
  
  // 点击其他空白区域隐藏键盘
  showKeyboard.value = false;
};

// 监听点击事件
const addClickOutsideListener = () => {
  document.addEventListener('click', handleClickOutside);
};

const removeClickOutsideListener = () => {
  document.removeEventListener('click', handleClickOutside);
};

// 组件挂载时添加监听器
addClickOutsideListener();

// 组件卸载时移除监听器
onUnmounted(() => {
  removeClickOutsideListener();
});

const pickCategory = (c) => {
  form.value.category = c.value;
  // console.log('点击分类:', c.value);
  if (tabIndex.value === 1) form.value.type = 'income'; else form.value.type = 'expense';
  // 点击分类时显示键盘和金额备注栏
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
const dateText = computed(() => form.value.date);
const onPickDate = (arg, event) => {
  // 阻止事件冒泡，防止触发handleClickOutside函数
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  
  const sel = Array.isArray(arg) ? arg : arg?.selectedValues;
  const [y, m, d] = sel || ymd.value;
  // 组合成当天的本地时间（保留当前时分）
  const cur = new Date();
  const dt = new Date(Number(y), Number(m) - 1, Number(d || '1'), cur.getHours(), cur.getMinutes());
  form.value.date = dt.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').slice(0,10);
      
  ymd.value = [String(y), String(m).padStart(2,'0'), String(d).padStart(2,'0')];
  showDate.value = false;
  
  // 如果之前键盘是显示的，保持显示状态
  // 不需要额外操作，因为我们只是阻止了冒泡导致的隐藏
};

// 金额输入
const amountStr = ref('0');
// 键盘高度相关常量已移至CSS中
const displayAmount = computed(() => Number(amountStr.value || '0').toFixed(2));
const onKey = (key) => {
  if (key === '.') {
    if (amountStr.value.includes('.')) return;
    amountStr.value = amountStr.value ? amountStr.value + '.' : '0.';
    return;
  }
  if (amountStr.value === '0') amountStr.value = '';
  // 限制两位小数
  const dot = amountStr.value.indexOf('.');
  if (dot >= 0) {
    const decimals = amountStr.value.length - (dot + 1);
    if (decimals >= 2) return;
  }
  amountStr.value += String(key);
};
const onDel = () => {
  if (!amountStr.value) return;
  amountStr.value = amountStr.value.slice(0, -1) || '0';
};
const openToday = () => {
  const t = new Date();
  form.value.date = t.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').slice(0,10);
  ymd.value = [String(t.getFullYear()), String(t.getMonth()+1).padStart(2,'0'), String(t.getDate()).padStart(2,'0')];
};

const onSubmit = () => {
  form.value.amount = Number(displayAmount.value);
  if (!form.value.amount || form.value.amount <= 0) {
    showFailToast('请输入有效金额');
    return;
  }
  if (tabIndex.value === 1) {
    form.value.type = 'income';
  } else {
    form.value.type = 'expense';
  }
  try {
    addRecord(form.value);
    showSuccessToast('已保存');
    // 延迟一小段时间后跳转，确保用户能看到成功提示
    setTimeout(() => {
      router.replace('/');
    }, 500);
  } catch (error) {
    showFailToast('保存失败，请重试');
    console.error('保存记录失败:', error);
  }
};

// 完成按钮直接保存，但键盘保持常显（不隐藏）
</script>

<style scoped>
/* 页面基础布局 */
.add-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #f7f8fa 0%, #f0f2f5 100%);
}

/* 头部样式 */
.header {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  padding-top: 40px;
  padding-bottom: 20px;
  flex-shrink: 0;
  height: auto;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 20px rgba(255, 216, 77, 0.2);
  position: relative;
  overflow: hidden;
}


/* 标签样式增强 */
:deep(.van-tabs) {
  padding: 0 20px;
  background: transparent !important; /* 确保继承父元素的背景色 */
}

/* 确保标签栏容器背景透明 */
:deep(.van-tabs__wrap) {
  background: transparent !important;
}

/* 确保标签内容区域背景透明 */
:deep(.van-tabs__content) {
  background: transparent !important;
}

/* 确保标签项背景透明 */
:deep(.van-tab) {
  background: transparent !important;
}

/* 确保tab-active-bar背景透明，只显示下划线 */
:deep(.van-tabs__line) {
  background: #6b4e00 !important;
}

/* 确保整个vant-tabs组件内除横线外的所有元素都透明 */
:deep(.van-tabs *) {
  background: transparent !important;
}

/* 特别恢复选中横线的样式 */
:deep(.van-tabs__line) {
  background: #333 !important; /* 设置为黑色 */
  height: 4px !important;
  width: 36px !important;
}

/* 特别确保可能存在的外层容器也透明 */
.header {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  padding-top: 40px;
  padding-bottom: 20px;
  flex-shrink: 0;
  height: auto;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 20px rgba(255, 216, 77, 0.2);
  position: relative;
  overflow: hidden;
  z-index: 1; /* 确保header在最上层 */
}

:deep(.van-tabs__tab) {
  font-size: 16px;
  font-weight: 600;
}

:deep(.van-tabs__tab--active) {
  color: #6b4e00 !important;
}

:deep(.van-tabs__line) {
  background: #6b4e00;
  width: 36px;
  /* 移除固定居中的定位，让vant的默认标签行定位逻辑正常工作 */
}

/* 分类区域样式 */
.category {
  padding: 20px 16px 180px;
  background: rgba(255, 255, 255, 0.95);
  flex-grow: 1;
  overflow-y: auto;
  margin: 16px;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 分类提示 */
.category-tip {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  padding-left: 4px;
}

/* 分类项样式 */
.cat-item {
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content:center;
  width: 100%;
  height: 80px;
  border-radius: 16px;
  background: #f7f8fa;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.cat-item.active {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  color: #6b4e00;
  box-shadow: 0 4px 16px rgba(255, 216, 77, 0.3);
  transform: translateY(-2px);
}

.cat-item .icon {
  font-size: 28px;
  z-index: 1;
  margin-bottom: 6px;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.1));
}

.cat-item .text {
  font-size: 13px;
  font-weight: 500;
  z-index: 1;
}

/* 网格样式调整 */
.category :deep(.van-grid-item__content) {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 日期选择器美化 */
:deep(.van-popup) {
  border-radius: 24px 24px 0 0;
  padding: 0;
}

:deep(.van-date-picker) {
  border-radius: 24px 24px 0 0;
}

:deep(.van-picker__confirm) {
  color: #FFD84D;
  font-weight: 600;
  font-size: 16px;
}

:deep(.van-picker__cancel) {
  color: #999;
  font-size: 16px;
}

/* kb-panel样式 - 放置在键盘上方 */
.kb-panel {
  position: fixed;
  bottom: 325px; /* 调整为更准确的键盘高度+底部内边距，确保紧密贴合 */
  left: 0px;
  right: 0px;
  display:flex;
  flex-direction: column;
  padding: 16px 20px 0;
  background: #fff;
  z-index: 99;
  border-radius: 20px 20px 0px 0px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
}

/* 折叠按钮样式 */
.collapse-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
  color: #999;
  cursor: pointer;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.kb-panel.show {
  transform: translateY(0);
}

/* 简化的键盘区域样式 */
.keyboard {
  position: fixed;
  bottom: 40px !important;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 95;
  border-top: 1px solid #f0f0f0;
  overflow: hidden;
  padding-bottom: 40px; /* 添加底部内边距，避免被导航栏遮挡 */
}

/* 针对vant数字键盘组件的深度样式修改 */
:deep(.van-number-keyboard) {
  position: relative;
  bottom: 0;
  margin-bottom: 0;
  padding-top: 10px;
  border-radius: 0 0 0 0;
}

/* 金额和日期行 */
.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 16px;
}

/* 金额显示 */
.amount-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.currency {
  font-size: 18px;
  font-weight: 600;
  color: #666;
  opacity: 0.8;
}

.amount {
  font-size: 36px;
  font-weight: 700;
  color: #333;
}

/* 日期显示 */
.current-date {
  font-size: 14px;
  color: #666;
  background: #f7f8fa;
  padding: 6px 12px;
  border-radius: 16px;
}

/* 备注输入框 */
.kb-panel .note {
  width: 100%;
  margin-bottom: 16px;
}

.kb-panel .note :deep(.van-field) {
  margin: 0;
  background-color: #f7f8fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.kb-panel .note :deep(.van-field__control-wrapper) {
  border-radius: 12px;
  border: none;
  background: transparent;
}

.kb-panel .note :deep(.van-field__control) {
  font-size: 15px;
  color: #333;
}

.kb-panel .note :deep(.van-field__left-icon) {
  color: #999;
}

/* 工具栏样式 */
.kb-panel .tools {
  display:flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  padding-bottom: 16px;
}

/* 按钮样式美化 */
.tool-btn {
  border-radius: 16px !important;
  font-size: 14px !important;
  background: #f7f8fa !important;
  color: #666 !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

.tool-btn:active {
  background: #e8e8e8 !important;
  transform: scale(0.95);
}

.submit-btn {
  border-radius: 16px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%) !important;
  color: #6b4e00 !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(255, 216, 77, 0.3) !important;
  transition: all 0.3s ease !important;
}

.submit-btn:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(255, 216, 77, 0.4) !important;
}

/* 数字键盘美化 */
:deep(.van-number-keyboard) {
  padding-top: 10px;
  border-radius: 24px 24px 0 0;
}

:deep(.van-keyboard__key) {
  border-radius: 12px !important;
  margin: 6px !important;
  font-size: 22px !important;
  font-weight: 500 !important;
  background: #f7f8fa !important;
  transition: all 0.2s ease !important;
}

:deep(.van-keyboard__key:active) {
  background: #e8e8e8 !important;
  transform: scale(0.95);
}

:deep(.van-keyboard__key--large) {
  background: #f0f0f0 !important;
}

:deep(.van-keyboard__key--large:active) {
  background: #e0e0e0 !important;
}

:deep(.van-button--danger) {
  background: linear-gradient(135deg, #e84d3d 0%, #f56c6c 100%) !important;
  color: #fff !important;
  font-weight: 500 !important;
}

/* 自定义滚动条 */
.category::-webkit-scrollbar {
  width: 6px;
}

.category::-webkit-scrollbar-track {
  background: transparent;
}

.category::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.category::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

:deep(.van-grid-item__content.van-grid-item__content--center){
  padding: 2px
}
</style>

