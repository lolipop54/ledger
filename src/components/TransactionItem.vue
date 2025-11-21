<template>
  <van-swipe-cell class="swipe-wrapper">
    <div class="transaction-card">
      <van-cell 
        :title="title" 
        :label="label" 
        :value="value" 
        class="transaction-content"
        :border="false"
      >
        <template #title>
          <div class="title-row">
            <div :class="['icon-box', (record.type === 'expense' ? 'icon-expense' : 'icon-income')]">
              {{ icon }}
            </div>
            <span class="title-text">{{ title }}</span>
          </div>
        </template>
        <template #label>
          <div class="label-text">{{ label }}</div>
        </template>
        <template #value>
          <span :class="['amount-text', (record.type === 'expense' ? 'text-expense' : 'text-income')]">
            {{ value }}
          </span>
        </template>
      </van-cell>
    </div>

    <template #right>
      <div class="action-buttons">
        <div class="action-btn btn-edit" @click="openEditDialog">
          <van-icon name="edit" />
        </div>
        <div class="action-btn btn-delete" @click="$emit('remove', record.id)">
          <van-icon name="delete" />
        </div>
      </div>
    </template>
  </van-swipe-cell>

  <!-- 修改对话框 -->
  <van-dialog
    v-model:show="showEditDialog"
    title="修改记录"
    show-cancel-button
    @confirm="handleUpdate"
    className="clash-dialog" 
    confirm-button-color="#FF7675"
    cancel-button-color="#666"
  >
    <div class="edit-form">
      <van-field
        label="金额"
        v-model="editForm.amount"
        type="number"
        placeholder="0.00"
        class="clash-field"
      />
      
      <div class="type-toggle">
        <div 
          class="type-option" 
          :class="{ active: editForm.type === 'expense' }"
          @click="editForm.type = 'expense'; onTypeChange()"
        >支出</div>
        <div 
          class="type-option" 
          :class="{ active: editForm.type === 'income' }"
          @click="editForm.type = 'income'; onTypeChange()"
        >收入</div>
      </div>

      <van-field 
        readonly
        label="类别" 
        v-model="editForm.category"
        @click="showCategoryPicker = true"
        class="clash-field clickable"
        right-icon="arrow"
      />
      
      <van-field
        label="备注"
        v-model="editForm.note"
        placeholder="写点什么..."
        class="clash-field"
      />
      
      <van-field 
        readonly
        label="时间" 
        v-model="editForm.date"
        @click="showDatePicker = true"
        class="clash-field clickable"
        right-icon="calendar-o"
      />
    </div>
  </van-dialog>

  <!-- 类别选择器 -->
  <van-popup 
    v-model:show="showCategoryPicker" 
    position="bottom" 
    class="clash-popup"
  >
    <div class="popup-header">选择类别</div>
    <div class="category-grid">
      <div 
        v-for="(category, index) in currentCategories" 
        :key="index"
        class="category-chip"
        :class="{ active: editForm.category === category }"
        @click="selectCategory(category)"
      >
        {{ category }}
      </div>
    </div>
    <div class="popup-footer">
      <div class="clash-btn" @click="showCategoryPicker = false">确定</div>
    </div>
  </van-popup>

  <!-- 日期选择器 -->
  <van-popup 
    v-model:show="showDatePicker" 
    position="bottom" 
    class="clash-popup"
  >
    <van-date-picker
      title="选择日期"
      :columns-type="['year','month','day']"
      :min-date="minDate"
      :max-date="maxDate"
      v-model="currentDateTime"
      @confirm="handleDateTimeConfirm"
      @cancel="showDatePicker = false"
      class="clash-picker"
    />
  </van-popup>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatAmount } from '../composables/useLedger';

const props = defineProps({
  record: { type: Object, required: true }
});

const emit = defineEmits(['remove', 'update']);

// ... (JS 逻辑部分完全保持不变，不需要修改，为了节省篇幅省略) ...
// 请保留你原有的 JS 代码
// 编辑相关变量
const showEditDialog = ref(false);
const showCategoryPicker = ref(false);
const showDatePicker = ref(false);
const editForm = ref({
  amount: '',
  type: '',
  category: '',
  note: '',
  date: ''
});

// 类别列表定义
const expenseCategories = ['餐饮','买菜','购物','交通','娱乐','通讯','零食','日用','蔬菜','水果','运动','服饰','美容','住房','医疗','孩子','长辈','旅行','聚会','其他'];
const incomeCategories = ['工资','兼职','理财','其他'];

// 日期时间选择相关
const now = new Date();
const ymd = ref([
  String(now.getFullYear()),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
]);
const currentDateTime = ref(ymd);
// month:0-11 day:1-31
const minDate = new Date(new Date().getFullYear() - 3, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 1, 11, 31, 23, 59, 59);

// 格式化日期时间
const formatDateTime = (date) => {
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-').slice(0,10);
};

// 当前显示的类别列表
const currentCategories = computed(() => {
  return editForm.value.type === 'expense' ? expenseCategories : incomeCategories;
});

// 获取默认类别索引
const getDefaultCategoryIndex = computed(() => {
  const index = currentCategories.value.indexOf(editForm.value.category);
  return index !== -1 ? index : 0;
});

// 处理类别选择
const selectCategory = (category) => {
  editForm.value.category = category;
};

// 打开编辑对话框
const openEditDialog = () => {
  // 填充当前记录数据
  const recordDate = props.record.date ? new Date(props.record.date) : new Date();
  currentDateTime.value = [String(recordDate.getFullYear()), String(recordDate.getMonth() + 1).padStart(2, '0'), String(recordDate.getDate()).padStart(2, '0')]
  
  editForm.value = {
    amount: String(props.record.amount || ''),
    type: props.record.type || 'expense',
    category: props.record.category || '其他',
    note: props.record.note || '',
    date: formatDateTime(recordDate)
  };
  showEditDialog.value = true;
};

// 类型改变时的处理
const onTypeChange = () => {
  // 当类型改变时，检查当前类别是否在新类型的类别列表中
  const categories = editForm.value.type === 'expense' ? expenseCategories : incomeCategories;
  if (!categories.includes(editForm.value.category)) {
    // 如果不在，设置为第一个类别或默认类别
    editForm.value.category = categories[0];
  }
};

// 处理日期时间选择确认
const handleDateTimeConfirm = (arg) => {
  try {
    // 安全地处理参数，避免类型错误
    let selectedValues = [];
    
    if (Array.isArray(arg)) {
      selectedValues = arg;
    } else if (arg && arg.selectedValues && Array.isArray(arg.selectedValues)) {
      selectedValues = arg.selectedValues;
    } else {
      selectedValues = currentDateTime.value || [];
    }
    
    if (selectedValues.length >= 3) {
      const [y, m, d] = selectedValues;
      // 确保日期有效
      const date = new Date(y, parseInt(m) - 1, d);
      if (!isNaN(date.getTime())) {
        editForm.value.date = formatDateTime(date);
      }
    }
    
    // 同步关闭选择器
    showDatePicker.value = false;
  } catch (error) {
    console.error('日期处理错误:', error);
    // 即使出错也确保关闭选择器
    showDatePicker.value = false;
  }
};

// 处理更新
const handleUpdate = () => {
  // 验证金额
  if (!editForm.value.amount || Number(editForm.value.amount) <= 0) {
    alert('请输入有效的金额');
    return;
  }
  
  // 发送更新事件，包含类别信息和日期
  emit('update', props.record.id, {
    amount: Number(editForm.value.amount),
    type: editForm.value.type,
    category: editForm.value.category,
    note: editForm.value.note,
    date: editForm.value.date
  });
  
  showEditDialog.value = false;
};

const title = computed(() => `${props.record.category}`);
const label = computed(() => (props.record.note || ''));
const value = computed(() => (props.record.type === 'expense' ? '-' : '+') + formatAmount(props.record.amount));

const categoryIconMap = {
  '餐饮': '🍜',
  '买菜': '🍖',
  '购物': '🛍️',
  '交通': '🚌',
  '娱乐': '🎮',
  '通讯': '📞',
  '零食': '🧁',
  '医疗': '💊',
  '住房': '🏠',
  '日用': '🧻',
  '蔬菜': '🥕',
  '水果': '🍎',
  '运动': '🚴',
  '服饰': '👕',
  '美容': '💄',
  '住房': '🏠',
  '医疗': '💊',
  '孩子': '🧒',
  '长辈': '🧓',
  '旅行': '✈️',
  '聚会': '🍷',
  '其他': '📦',
  '工资': '💰',
  '兼职': '🧾',
  '理财': '📈' ,
  '其他2': '💵',
};

const icon = computed(() => {
    if(props.record.category === "其他" && props.record.type === "income"){
      return categoryIconMap["其他2"] || '📦';
    }
    return categoryIconMap[props.record.category] || '📦';
  });
</script>

<style scoped>
/* 引入全局颜色变量 (假设 App.vue 已定义) */
/* --clash-black: #2D3436; --clash-orange: #FF7675; --clash-green: #00B894; */

.swipe-wrapper {
  margin-bottom: 12px;
  /* 防止 swipe cell 阴影被切 */
  padding-bottom: 4px; 
}

/* --- 列表卡片 --- */
.transaction-card {
  background: #fff;
  /* 只有下边框，营造一种列表感 */
  border-bottom: 2px solid var(--clash-black, #2D3436);
  transition: transform 0.1s;
}

.transaction-card:active {
  background: #F9F9F9;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-box {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 2px solid var(--clash-black, #2D3436);
  border-radius: 8px;
  box-shadow: 2px 2px 0 var(--clash-black, #2D3436);
}

.icon-expense {
  background: #FFEAA7; /* 浅黄 */
}
.icon-income {
  background: #55EFC4; /* 浅绿 */
}

.title-text {
  font-weight: 700;
  font-size: 15px;
  color: var(--clash-black, #2D3436);
}

.label-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  /* 限制行数 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.amount-text {
  font-family: 'Outfit', sans-serif; /* 推荐使用英文字体 */
  font-weight: 900;
  font-size: 16px;
}

.text-expense { color: var(--clash-orange, #FF7675); }
.text-income { color: var(--clash-green, #00B894); }

/* --- 右滑按钮 --- */
.action-buttons {
  display: flex;
  height: 100%;
}

.action-btn {
  width: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  border-top: 2px solid var(--clash-black, #2D3436);
  border-bottom: 2px solid var(--clash-black, #2D3436);
  /* border-left: 2px solid var(--clash-black, #2D3436); */
  cursor: pointer;
}

.btn-edit {
  background: #74B9FF;
}

.btn-delete {
  background: var(--clash-orange, #FF7675);
  border-right: 2px solid var(--clash-black, #2D3436); /* 只有最后一个有右边框 */
}

/* --- 弹窗样式覆盖 --- */
/* 全局 Dialog 样式已经在 App.vue 中覆盖，这里只补充内容 */
.edit-form {
  padding: 10px 0;
}

/* 输入框 & 字段 */
.clash-field {
  border: 2px solid var(--clash-black, #2D3436);
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 8px 12px;
  /* 去掉 Vant 默认底边框 */
  &::after { display: none; }
}

.clash-field.clickable:active {
  background: #F0F0F0;
}

/* 类型切换 Tab */
.type-toggle {
  display: flex;
  border: 2px solid var(--clash-black, #2D3436);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 4px 4px 0 var(--clash-black, #2D3436);
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:first-child {
  border-right: 2px solid var(--clash-black, #2D3436);
}

.type-option.active {
  background: var(--clash-black, #2D3436);
  color: #fff;
}

/* --- 类别选择弹窗 --- */
.clash-popup {
  /* Vant Popup 样式覆盖 */
  background: #fff !important;
  border-top: 2px solid var(--clash-black, #2D3436);
  padding: 20px;
}

.popup-header {
  font-size: 18px;
  font-weight: 900;
  text-align: center;
  margin-bottom: 20px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.category-chip {
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.category-chip.active {
  border-color: var(--clash-black, #2D3436);
  background: var(--clash-yellow, #FDCB6E); /* 高亮黄 */
  color: var(--clash-black, #2D3436);
  font-weight: 700;
  box-shadow: 2px 2px 0 var(--clash-black, #2D3436);
  transform: translate(-2px, -2px);
}

.clash-btn {
  background: var(--clash-black, #2D3436);
  color: #fff;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
}

.clash-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
}

/* --- 日期选择器 --- */
:deep(.clash-picker) {
  /* 强制覆盖 picker 样式 */
  .van-picker__toolbar {
    border-bottom: 2px solid var(--clash-black, #2D3436);
  }
  .van-picker__confirm {
    color: var(--clash-purple, #6C5CE7);
    font-weight: 900;
  }
}
</style>