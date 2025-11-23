<template>
  <div class="add-page">
    <!-- 头部切换区域 -->
    <div class="header">
      <!-- 左侧占位，保持中间 Tab 居中 -->
      <div class="header-placeholder"></div>

      <div class="tab-toggle">
        <div 
          class="tab-item" 
          :class="{ active: tabIndex === 0 }"
          @click="switchTab(0)"
        >支出</div>
        <div 
          class="tab-item" 
          :class="{ active: tabIndex === 1 }"
          @click="switchTab(1)"
        >收入</div>
      </div>

      <!-- 右侧编辑按钮 -->
      <div class="header-action">
        <div 
          class="edit-btn" 
          :class="{ active: isEditMode }"
          @click="toggleEditMode"
        >
          {{ isEditMode ? '完成' : '编辑' }}
        </div>
      </div>
    </div>
    
    <!-- 分类网格区域 -->
    <div class="category">
      <div class="category-tip">
        {{ isEditMode ? '管理分类 (点击图标删除)' : '选择分类' }}
      </div>
      
      <div class="category-grid">
        <!-- 现有分类列表 -->
        <div 
          v-for="c in currentCategories"
          :key="c.value"
          class="cat-item-wrapper"
          @click="handleCategoryClick(c)"
        >
          <!-- 添加抖动动画类名: shaking -->
          <div :class="['cat-item', { active: form.category === c.value && !isEditMode, shaking: isEditMode }]">
            
            <!-- 编辑模式下的删除角标 (系统分类"其他"不可删除) -->
            <div v-if="isEditMode && c.value !== '其他'" class="del-badge">
              <van-icon name="cross" />
            </div>

            <!-- 图片图标 -->
            <img 
              v-if="c.icon.includes('.png')" 
              :src="getImageUrl(c.icon)" 
              class="icon" 
            />
            <!-- Emoji图标 -->
            <div v-else class="icon emoji-icon">{{ c.icon }}</div>
            
            <div class="text">{{ c.text }}</div>
          </div>
        </div>

        <!-- 新增按钮 (仅编辑模式显示) -->
        <div v-if="isEditMode" class="cat-item-wrapper" @click="onAddCategory">
          <div class="cat-item add-item">
            <div class="icon emoji-icon">➕</div>
            <div class="text">新增</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日期选择弹窗 -->
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
        class="clash-picker"
      />
    </van-popup>

    <!-- 输入面板 (覆盖在底部，编辑模式下隐藏) -->
    <transition name="slide-up">
      <div v-if="showKeyboard && !isEditMode" class="kb-panel">
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
    
    <!-- 遮罩层 -->
    <div 
      v-if="showKeyboard && !isEditMode" 
      class="overlay" 
      @click="showKeyboard = false"
    ></div>

    <!-- 新增分类弹窗 (Vant Dialog) -->
    <van-dialog
      v-model:show="showAddDialog"
      title="新增分类"
      show-cancel-button
      class="clash-dialog"
      @confirm="confirmAddCategory"
    >
      <div class="add-cat-form">
        <!-- 名称输入 -->
        <van-field
          v-model="newCatName"
          placeholder="分类名称 (最多4字)"
          maxlength="4"
          input-align="center"
          class="clash-input-mini"
        />
        
        <!-- 图标选择器区域 -->
        <div class="icon-selector-area">
          <!-- 1. 分组标签栏 (可横向滚动) -->
          <div class="icon-tabs">
            <div 
              v-for="(groupName) in sortedGroupKeys" 
              :key="groupName"
              class="icon-tab-item"
              :class="{ active: currentIconGroup === groupName }"
              @click="currentIconGroup = groupName"
            >
              {{ groupName }}
            </div>
          </div>

          <!-- 2. 图标网格 -->
          <div class="emoji-list-wrapper">
            <div class="emoji-list">
              <div 
                v-for="iconPath in iconGroups[currentIconGroup]" 
                :key="iconPath" 
                class="emoji-item" 
                :class="{ active: newCatIcon === iconPath }"
                @click="newCatIcon = iconPath"
              >
                <!-- 如果包含 .png 显示图片，否则显示 Emoji 文字 -->
                <img 
                  v-if="iconPath.includes('.png')" 
                  :src="getImageUrl(iconPath)" 
                  class="select-img"
                />
                <span v-else class="select-emoji">{{ iconPath }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showFailToast, showSuccessToast, showDialog, showConfirmDialog } from 'vant';
import { useLedger } from '../composables/useLedger';

const router = useRouter();
const { 
  addRecord, 
  expenseCategories, 
  incomeCategories, 
  addCategory, 
  removeCategory 
} = useLedger();

// --- 状态定义 ---
const tabIndex = ref(0);
const isEditMode = ref(false); // 编辑模式开关
const showKeyboard = ref(false);
const showAddDialog = ref(false);
const newCatName = ref('');
const newCatIcon = ref('🏷️');

// --- 图标分组数据 ---
const iconGroups = ref({
  
});
const currentIconGroup = ref('办公');
// [新增] 计算属性：用于控制 Tab 的显示顺序
const sortedGroupKeys = computed(() => {
  // 1. 获取所有分组名称
  const keys = Object.keys(iconGroups.value);
  
  // 2. 过滤掉 "其他"
  const list = keys.filter(k => k !== '其他');
  
  // 3. (可选) 对剩余的分类按中文拼音排序，让界面更整洁
  // list.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  
  // 4. 如果原数据中包含 "其他"，则将其追加到最后
  if (keys.includes('其他')) {
    list.push('其他');
  }
  
  return list;
});


// 自动扫描 assets 下的 png 图片
const imageFiles = import.meta.glob('../assets/**/*.png');

onMounted(() => {
  let temp = {};
  for (const path in imageFiles) {
    // path 格式示例: "../assets/食物/food1.png"
    
    // 提取文件夹名 (作为组名)
    const groupMatch = path.match(/\/assets\/([^/]+)\//);
    // 提取相对路径 (用于存储和 getImageUrl)
    const pathMatch = path.match(/\/assets\/(.+)$/);

    if (groupMatch && pathMatch) {
      const groupName = groupMatch[1];     // "食物"
      const relativePath = pathMatch[1];   // "食物/food1.png"

      if (!iconGroups.value[groupName]) {
        iconGroups.value[groupName] = [];
      }
      if(groupName !== '其他'){
        iconGroups.value[groupName].push(relativePath);
      }else{
        if(!temp[groupName]){
          temp[groupName] = [];
        }
        temp[groupName].push(relativePath);
      }
    }
  }
  iconGroups.value['其他'] = temp['其他'];
});

const form = ref({
  type: 'expense',
  amount: undefined,
  category: '餐饮',
  note: '',
  date: new Date().toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit', hour12: false
  }).replace(/\//g, '-').slice(0,10)
});

const currentCategories = computed(() => tabIndex.value === 0 ? expenseCategories.value : incomeCategories.value);

// 切换 Tab 逻辑
const switchTab = (idx) => {
  tabIndex.value = idx;
  // 切换时退出编辑模式
  isEditMode.value = false;
};

watch(tabIndex, (newVal) => {
  form.value.type = newVal === 0 ? 'expense' : 'income';
  const cats = newVal === 0 ? expenseCategories.value : incomeCategories.value;
  // 确保有分类才赋值
  if (cats.length > 0) form.value.category = cats[0].value;
});

const getImageUrl = (name) => {
  // 兼容处理：如果是完整的路径(Emoji)或者图片相对路径
  // 这里的 name 预期是 "食物/food1.png" 这种格式
  return new URL(`../assets/${name}`, import.meta.url).href;
};

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (isEditMode.value) {
    showKeyboard.value = false; // 进入编辑模式时收起键盘
  }
};

// 点击分类的处理逻辑
const handleCategoryClick = (c) => {
  if (isEditMode.value) {
    // --- 编辑模式：删除逻辑 ---
    if (c.value === '其他') {
      showFailToast('系统分类无法删除');
      return;
    }
    showConfirmDialog({
      title: '删除分类',
      message: `确定要删除“${c.text}”吗？`,
      className: 'clash-dialog'
    }).then(() => {
      try {
        removeCategory(form.value.type, c.value);
        // 如果删除的是当前选中的，重置选中状态
        if (form.value.category === c.value) {
           form.value.category = '其他';
        }
      } catch (error) {
        showFailToast(error.message);
      }
    }).catch(() => {});
  } else {
    // --- 正常模式：选择逻辑 ---
    form.value.category = c.value;
    showKeyboard.value = true;
  }
};

// 打开新增弹窗
const onAddCategory = () => {
  console.log(iconGroups.value);
  currentIconGroup.value = Object.keys(iconGroups.value)[0]; 
  newCatName.value = '';
  newCatIcon.value = iconGroups.value[currentIconGroup.value][0]; 
  showAddDialog.value = true;
};

// 确认新增
const confirmAddCategory = () => {
  if (!newCatName.value.trim()) {
    showFailToast('请输入名称');
    return;
  }
  try {
    addCategory(form.value.type, {
      text: newCatName.value.trim(),
      icon: newCatIcon.value
    });
    showSuccessToast('添加成功');
  } catch (e) {
    showFailToast(e.message);
  }
};

// --- 日期与键盘逻辑 (保持不变) ---
const showDate = ref(false);
const minDate = new Date(new Date().getFullYear() - 3, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 1, 11, 31, 23, 59, 59);
const now = new Date();
const ymd = ref([String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')]);
const dateText = computed(() => form.value.date.slice(5));

const onPickDate = (arg) => {
  const sel = Array.isArray(arg) ? arg : arg?.selectedValues;
  const [y, m, d] = sel || ymd.value;
  const cur = new Date();
  const dt = new Date(Number(y), Number(m) - 1, Number(d || '1'), cur.getHours(), cur.getMinutes());
  form.value.date = dt.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour12: false }).replace(/\//g, '-').slice(0,10);
  ymd.value = [String(y), String(m).padStart(2,'0'), String(d).padStart(2,'0')];
  showDate.value = false;
};

const amountStr = ref('0');
const displayAmount = computed(() => amountStr.value);
const onKey = (key) => {
  if (key === '.') { if (amountStr.value.includes('.')) return; amountStr.value += '.'; return; }
  if (amountStr.value === '0') amountStr.value = key;
  else {
    const parts = amountStr.value.split('.');
    if (parts.length > 1 && parts[1].length >= 2) return;
    if (amountStr.value.length >= 9) return;
    amountStr.value += key;
  }
};
const onDel = () => amountStr.value.length <= 1 ? amountStr.value = '0' : amountStr.value = amountStr.value.slice(0, -1);
const openToday = () => {
  const t = new Date();
  form.value.date = t.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour12: false }).replace(/\//g, '-').slice(0,10);
  ymd.value = [String(t.getFullYear()), String(t.getMonth()+1).padStart(2,'0'), String(t.getDate()).padStart(2,'0')];
  showSuccessToast('已切换到今天');
};
const onSubmit = () => {
  form.value.amount = Number(amountStr.value);
  if (!form.value.amount || form.value.amount <= 0) { showFailToast('请输入金额'); return; }
  try {
    addRecord({ ...form.value });
    showSuccessToast('记账成功');
    amountStr.value = '0';
    form.value.note = '';
    showKeyboard.value = false;
  } catch (error) { showFailToast('保存失败'); }
};
</script>

<style scoped>
.add-page {
  height: 100vh;
  background: var(--clash-bg, #F0F2F5);
  background-image: radial-gradient(#2D3436 1px, transparent 1px);
  background-size: 20px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* --- 头部调整 --- */
.header {
  padding: 20px;
  background: transparent;
  display: flex;
  justify-content: space-between; /* 改为两端对齐 */
  align-items: center;
  z-index: 10;
}

/* 占位符，为了让 Tab 视觉居中 */
.header-placeholder {
  width: 60px; 
}

.header-action {
  width: 64px;
  display: flex;
  justify-content: flex-end;
}

/* 编辑按钮样式 */
.edit-btn {
  font-size: 12px;
  font-weight: 700;
  color: #2D3436;
  padding: 4px 12px;
  background: #fff;
  border: 2px solid #2D3436;
  border-radius: 20px;
  box-shadow: 2px 2px 0 #2D3436;
  cursor: pointer;
  transition: all 0.1s;
}
.edit-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #2D3436;
}
.edit-btn.active {
  background: #FF7675;
  color: #fff;
}

/* Tab 保持原样 */
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
.tab-item:first-child { border-right: 2px solid #2D3436; }
.tab-item.active { background: #FDCB6E; color: #2D3436; }

/* --- 分类区 --- */
.category {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 100px;
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

/* 分类项 */
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
  box-shadow: 2px 2px 0 #2D3436;
  position: relative; /* 为角标定位 */
}

.cat-item:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #2D3436;
}

.cat-item.active {
  background: #6C5CE7;
  color: #fff;
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 #2D3436;
  border-color: #2D3436;
}

/* 编辑模式下的抖动动画 */
@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(2deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-2deg); }
  100% { transform: rotate(0deg); }
}
.cat-item.shaking {
  animation: shake 0.3s infinite linear;
}

/* 删除角标 */
.del-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #FF7675;
  border: 2px solid #2D3436;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 2;
}

/* 新增按钮样式 */
.cat-item.add-item {
  border-style: dashed;
  background: transparent;
}
.cat-item.add-item:active {
  background: rgba(255,255,255,0.5);
}

.icon { height: 48px; width: 48px; display: block; object-fit: contain; }
.emoji-icon { font-size: 28px; display: flex; align-items: center; justify-content: center; }
.text { font-size: 12px; font-weight: 600; color: #2D3436; }
.cat-item.active .text { color: #fff; }

/* --- 弹窗与图标选择器样式 --- */
.add-cat-form {
  padding: 20px;
  text-align: center;
}
.clash-input-mini {
  border: 2px solid #2D3436 !important;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 700;
}

.icon-selector-area {
  border: 2px solid #2D3436;
  border-radius: 8px;
  overflow: hidden; /* 包含内部滚动条 */
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* 顶部标签栏 */
.icon-tabs {
  display: flex;
  overflow-x: auto;
  background: #f0f0f0;
  border-bottom: 2px solid #2D3436;
  scrollbar-width: none; 
}
.icon-tabs::-webkit-scrollbar { display: none; }

.icon-tab-item {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #A0A0A0;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid #e0e0e0;
}

.icon-tab-item.active {
  background: #FDCB6E; /* 亮黄选中 */
  color: #2D3436;
  box-shadow: inset 0 -2px 0 #2D3436; 
}

/* 图标列表容器 */
.emoji-list-wrapper {
  height: 180px;
  overflow-y: auto;
  padding: 12px;
  background: #fff;
}

.emoji-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  gap: 8px;
}

.emoji-item {
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.emoji-item:active { background: #f0f0f0; }
.emoji-item.active {
  border-color: #2D3436;
  background: #ffeaa7;
}

.select-img { width: 48px; height: 48px; object-fit: contain; }
.select-emoji { font-size: 24px; }

/* 复用之前的样式 */
.kb-panel {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  border-top: 2px solid #2D3436; z-index: 200; padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 0 rgba(0,0,0,0.1); margin-bottom: 64px
}
.collapse-bar { height: 24px; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #2D3436; background: #f0f0f0; }
.collapse-handle { width: 40px; height: 4px; background: #2D3436; border-radius: 2px; }
.amount-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 12px 16px; border-bottom: 2px solid #2D3436; }
.amount-display { font-weight: 900; color: #2D3436; }
.currency { font-size: 24px; margin-right: 4px; }
.amount { font-size: 36px; font-family: 'Outfit', sans-serif; }
.current-date { background: #FDCB6E; border: 2px solid #2D3436; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 4px; box-shadow: 2px 2px 0 #2D3436; }
.note-box { padding: 8px 16px; border-bottom: 2px solid #2D3436; }
.clash-input { background: #f9f9f9; border: 2px solid #2D3436 !important; border-radius: 8px; padding: 6px 12px; }
.keyboard-grid { display: flex; height: 240px; }
.num-pad { flex: 3; display: flex; flex-direction: column; border-right: 2px solid #2D3436; }
.key-row { flex: 1; display: flex; border-bottom: 2px solid #2D3436; }
.key-row:last-child { border-bottom: none; }
.key-btn { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; border-right: 2px solid #2D3436; background: #fff; }
.key-btn:last-child { border-right: none; }
.key-btn:active { background: #e0e0e0; }
.del-btn { color: #FF7675; }
.func-pad { flex: 1; display: flex; flex-direction: column; }
.func-btn { display: flex; align-items: center; justify-content: center; font-weight: 900; border-bottom: 2px solid #2D3436; }
.date-btn { flex: 1; background: #fff; font-size: 16px; }
.confirm-btn { flex: 2; background: #00B894; color: #2D3436; font-size: 18px; border-bottom: none; }
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.2); z-index: 150; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }
:deep(.clash-popup) { border-top: 2px solid #2D3436; }
:deep(.clash-picker) { .van-picker__confirm { color: #6C5CE7; font-weight: 900; } .van-picker__toolbar { border-bottom: 2px solid #2D3436; } }
/* Dialog 样式覆盖 */
:deep(.clash-dialog) {
  border: 2px solid #2D3436 !important;
  border-radius: 16px !important;
  box-shadow: 4px 4px 0 #2D3436 !important;
  overflow: hidden;
}
:deep(.van-dialog__header) {
  font-weight: 900;
  padding-top: 20px;
}
:deep(.van-dialog__confirm) {
  color: #6C5CE7;
  font-weight: 900;
}
</style>