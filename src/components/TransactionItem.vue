<template>
  <van-swipe-cell>
    <van-cell 
      :title="title" 
      :label="label" 
      :value="value" 
      class="transaction-item"
      :title-style="{ display:'flex',alignItems:'center', gap: '5px'}"
    >
      <template #title>
        <span :class="['icon', (record.type === 'expense' ? 'down' : 'up')]">{{ icon }}</span>
        <span class="title">{{ title }}</span>
      </template>
      <template #label>
        <div class="label">{{ label }}</div>
      </template>
      <template #value>
        <span :class="['amount', (record.type === 'expense' ? 'down' : 'up')]">{{ value }}</span>
      </template>
  
    </van-cell>
    <template #right>
        <div style="display: flex; flex-direction: row; height: 100%;">
          <van-button type="primary" text="修改" @click="openEditDialog" style="width:48px; height: 100%; padding: 0 5px; font-size: 14px; background: linear-gradient(135deg, #1989fa 0%, #5ac8fa 100%); border-radius: 5px 5px 5px 5px;" />
          <van-button type="danger" text="删除" @click="$emit('remove', record.id)" style="width:48px; height: 100%; padding: 0 5px; font-size: 14px; background: linear-gradient(135deg, #e84d3d 0%, #ff6b6b 100%);border-radius: 5px 5px 5px 5px;" />
        </div>
      </template>
  </van-swipe-cell>

  <!-- 修改对话框 -->
  <van-dialog
    v-model:show="showEditDialog"
    title="修改记账"
    show-cancel-button
    @confirm="handleUpdate"
    :round="true"
    confirm-button-color="#FFD84D"
    cancel-button-color="#8c8c8c"
  >
    <div class="edit-form">
      <van-field
        label="金额"
        v-model="editForm.amount"
        type="number"
        placeholder="请输入金额"
        clearable
      />
      <van-field label="类型">
        <template #input>
          <van-radio-group v-model="editForm.type" @change="onTypeChange">
            <van-radio name="expense">支出</van-radio>
            <van-radio name="income">收入</van-radio>
          </van-radio-group>
        </template>
      </van-field>
      <van-field 
        is-link  
        label="类别" 
        v-model="editForm.category"
        readonly
        clickable
        @click="showCategoryPicker = true"
      />
      
      <!-- 类别选择器弹出层 -->
      <van-popup v-model:show="showCategoryPicker" position="bottom" round :style="{borderRadius: '20px 20px 0 0'}">
        <div style="padding: 16px;">
          <h3 style="margin-top: 0; margin-bottom: 16px; text-align: center; color: #333; font-weight: 600; font-size: 16px;">选择类别</h3>
          <div class="category-list">
            <div 
              v-for="(category, index) in currentCategories" 
              :key="index"
              class="category-item"
              :class="{ active: editForm.category === category }"
              @click="selectCategory(category)"
            >
              {{ category }}
            </div>
          </div>
          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <van-button type="primary" @click="showCategoryPicker = false" size="large" :style="{borderRadius: '20px', paddingHorizontal: '30px', background: 'linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%)', border: 'none'}">确定</van-button>
          </div>
        </div>
      </van-popup>
      <van-field
        label="备注"
        v-model="editForm.note"
        placeholder="请输入备注"
        clearable
      />
      <van-field 
        is-link
        label="日期时间" 
        v-model="editForm.date"
        readonly
        clickable
        @click="showDatePicker = true"
        right-icon="calendar"
      />
    </div>
  </van-dialog>

  <!-- 日期时间选择器 - 使用新的实现方式 -->
   <van-popup v-model:show="showDatePicker" position="bottom" round-radius="24">
      <van-date-picker
        title="选择日期"
        :columns-type="['year','month','day']"
        :min-date="minDate"
        :max-date="maxDate"
        v-model="currentDateTime"
        @confirm="handleDateTimeConfirm"
        @cancel="showDatePicker = false"
        :confirm-button-text="'确定'"
        :cancel-button-text="'取消'"
        :confirm-button-color="'#FFD84D'"
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
.icon { font-size: 20px; width: 32px; display: inline-block; text-align: center; }
.amount { font-weight: 700; width: 160px; font-size: 14px; }
.amount.up { color: #2aa515; }
.amount.down { color: #e84d3d; }
.label { width: 30vw; text-align: left; color: #8c8c8c; font-size: 12px; overflow: hidden; line-height: 1.1; word-break: break-word;}
.title { width: 64px; font-weight: 500; color: #333; font-size: 14px;}


.transaction-item{
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0 0 12px 12px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06)
}

.category-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.category-item {
  padding: 16px 12px;
  text-align: center;
  background-color: #f7f7f7;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  border: 1px solid #f0f0f0;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.category-item.active {
  background: linear-gradient(135deg, #FFD84D 0%, #FFC75F 100%);
  color: #6b4e00;
  border-color: #FFD84D;
  box-shadow: 0 4px 12px rgba(255, 216, 77, 0.3);
}

.category-item:active {
  opacity: 0.9;
  transform: scale(0.98);
}

/* 为不同类别的图标添加不同的背景色 */
.icon {
  padding: 1px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

/* 支出类别的图标背景色 */
.icon.down {
  background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
}

/* 收入类别的图标背景色 */
.icon.up {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}
</style>

