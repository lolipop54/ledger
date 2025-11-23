import { ref, computed, watch, reactive } from 'vue';

const STORAGE_KEY = 'ledger_records_v1';
const CATEGORIES_KEY = 'ledger_categories_v1'; // [新增] 分类数据的存储Key
const DB_NAME = 'LedgerDB';
const DB_VERSION = 3;

// [新增] 默认分类配置 (包含之前的修改：部分使用图片，部分使用Emoji)
const DEFAULT_CATEGORIES = {
  expense: [
    { text: '餐饮', value: '餐饮', icon: '饮食/饮食.png', type: 'expense'}, // 假设你有这个图片
    { text: '买菜', value: '买菜', icon: '饮食/买菜.png' ,type:'expense'},
    { text: '购物', value: '购物', icon: '购物/购物.png' ,type:'expense'},
    { text: '交通', value: '交通', icon: '交通/交通.png' ,type:'expense'},
    { text: '娱乐', value: '娱乐', icon: '娱乐/娱乐.png' ,type:'expense'},
    { text: '通讯', value: '通讯', icon: '个人/通讯.png' ,type:'expense'},
    { text: '零食', value: '零食', icon: '饮食/零食.png' ,type:'expense'},
    { text: '日用', value: '日用', icon: '生活/日用.png' ,type:'expense'},
    { text: '水果', value: '水果', icon: '饮食/水果.png' ,type:'expense'},
    { text: '运动', value: '运动', icon: '运动/运动.png' ,type:'expense'},
    { text: '服饰', value: '服饰', icon: '生活/衣服.png' ,type:'expense'},
    { text: '美容', value: '美容', icon: '生活/美容.png' ,type:'expense'},
    { text: '住房', value: '住房', icon: '家居/住房.png' ,type:'expense'},
    { text: '医疗', value: '医疗', icon: '医疗/医疗.png' ,type:'expense'},
    { text: '旅行', value: '旅行', icon: '交通/旅行.png' ,type:'expense'},
    { text: '其他', value: '其他', icon: '其他/default.png' ,type:'expense'}
  ],
  income: [
    { text: '工资', value: '工资', icon: '收入/工资.png', type: 'income'},
    { text: '兼职', value: '兼职', icon: '收入/兼职.png', type: 'income'},
    { text: '理财', value: '理财', icon: '收入/理财.png', type: 'income'},
    { text: '其他', value: '其他', icon: '其他/default.png', type: 'income'}
  ]
};

const getLocalTime = () => {
    return new Date().toLocaleString('zh-CN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/\//g, '-');
};

/**
 * 存储管理器
 */
/**
 * 存储管理器
 */
class StorageManager {
  constructor() {
    this.isInitialized = false;
    this.recordsCache = [];
    this.categoriesCache = null;
    this.init();
  }

  async init() {
    try {
      // 1. 初始化记录
      const legacyData = this.loadFromLocalStorage(STORAGE_KEY);
      if (legacyData && legacyData.length > 0) {
        await this.saveToIndexedDB(STORAGE_KEY, legacyData);
        if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      }
      this.recordsCache = await this.loadFromIndexedDB(STORAGE_KEY) || [];

      // 2. 初始化分类
      let dbCategories = await this.loadFromIndexedDB(CATEGORIES_KEY);
      
      // 如果 DB 里没有分类数据，使用默认数据
      if (!dbCategories || (!dbCategories.expense && !dbCategories.income)) {
        dbCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        await this.saveToIndexedDB(CATEGORIES_KEY, dbCategories);
      }
      this.categoriesCache = dbCategories;

      this.isInitialized = true;
    } catch (error) {
      console.error('初始化存储失败:', error);
      this.recordsCache = [];
      this.categoriesCache = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.isInitialized = true;
    }
  }

  loadFromLocalStorage(key) {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 通用的从 IndexedDB 加载数据方法
   * [修改] 在这里添加了版本迁移逻辑
   */
  async loadFromIndexedDB(key) {
    return new Promise((resolve) => {
      try {
        if (!('indexedDB' in window)) {
          resolve(null);
          return;
        }
        // 打开数据库，传入新的版本号
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // --- 核心修改：处理数据库升级和数据迁移 ---
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const transaction = request.transaction; // 获取升级事务
          
          // 1. 确保存储库存在
          if (!db.objectStoreNames.contains('records')) {
            db.createObjectStore('records');
          }

          // 2. 数据迁移逻辑：从 v2 升级到 v3
          if (event.oldVersion < 3) {
            console.log('正在执行数据库迁移: v2 -> v3 (更新通讯图标)');
            const store = transaction.objectStore('records');
            
            // 读取现有的分类数据
            const getReq = store.get(CATEGORIES_KEY);
            
            getReq.onsuccess = (e) => {
              const data = e.target.result;
              // 确保数据结构完整
              if (data && data.expense) {
                // 查找 "通讯" 分类
                const targetCat = data.expense.find(c => c.value === '通讯');
                if (targetCat) {
                  // === 执行更新 ===
                  // 如果旧路径包含 '其他' 或者是旧路径，则更新为 '个人'
                  // 或者直接强制覆盖为新的正确路径
                  targetCat.icon = '个人/通讯.png'; 
                  
                  // 写回数据库
                  store.put(data, CATEGORIES_KEY);
                  console.log('通讯分类图标已更新完毕');
                }
              }
            };
          }
        };

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['records'], 'readonly');
          const store = transaction.objectStore('records');
          const getRequest = store.get(key);
          
          getRequest.onsuccess = () => {
            db.close();
            resolve(getRequest.result || null);
          };
          getRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        request.onerror = () => {
          resolve(null);
        };
      } catch (error) {
        resolve(null);
      }
    });
  }

  /**
   * 通用的保存数据到 IndexedDB 方法
   * 注意：为了保险起见，save 方法也应该包含相同的 onupgradeneeded 逻辑，
   * 虽然通常 app 启动时会先调用 init/load。
   */
  async saveToIndexedDB(key, data) {
    return new Promise((resolve) => {
      try {
        if (!('indexedDB' in window)) {
          resolve(false);
          return;
        }
        const serializableData = JSON.parse(JSON.stringify(data));
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // 复制 load 方法中的升级逻辑，防止 save 先于 load 被调用的极端情况
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const transaction = request.transaction;
          if (!db.objectStoreNames.contains('records')) {
            db.createObjectStore('records');
          }
          // 同样的迁移逻辑 v2 -> v3
          if (event.oldVersion < 3) {
            const store = transaction.objectStore('records');
            const getReq = store.get(CATEGORIES_KEY);
            getReq.onsuccess = (e) => {
              const savedCats = e.target.result;
              if (savedCats && savedCats.expense) {
                const target = savedCats.expense.find(c => c.value === '通讯');
                if (target) {
                  target.icon = '个人/通讯.png';
                  store.put(savedCats, CATEGORIES_KEY);
                }
              }
            };
          }
        };

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['records'], 'readwrite');
          const store = transaction.objectStore('records');
          store.put(serializableData, key);

          transaction.oncomplete = () => {
            if (key === STORAGE_KEY) {
              this.recordsCache = serializableData;
            } else if (key === CATEGORIES_KEY) {
              this.categoriesCache = serializableData;
            }
            db.close();
            resolve(true);
          };
          transaction.onerror = () => {
            db.close();
            resolve(false);
          };
        };
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }
  
  // ...其余方法保持不变 (getRecords, getCategories, saveRecords, saveCategories)
  getRecords() {
    return [...this.recordsCache];
  }

  getCategories() {
    return this.categoriesCache ? JSON.parse(JSON.stringify(this.categoriesCache)) : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }

  async saveRecords(records) {
    return this.saveToIndexedDB(STORAGE_KEY, records);
  }

  async saveCategories(categories) {
    return this.saveToIndexedDB(CATEGORIES_KEY, categories);
  }
}

const storageManager = new StorageManager();

// 全局状态
// 初始化时先加载默认值，稍后 initData 会覆盖
const records = ref([]);
// [新增] 分类数据的响应式对象
const categoriesState = ref(JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)));

export function useLedger() {
  const isLoading = ref(false);

  // 监听记录变化并保存
  watch(records, (val) => {
    storageManager.saveRecords(val).catch(e => console.error(e));
  }, { deep: true });

  // [新增] 监听分类变化并保存
  watch(categoriesState, (val) => {
    storageManager.saveCategories(val).catch(e => console.error('保存分类失败', e));
  }, { deep: true });

  // --- 分类管理逻辑 ---

  // 计算属性：方便在 UI 中分别获取
  const expenseCategories = computed(() => categoriesState.value.expense);
  const incomeCategories = computed(() => categoriesState.value.income);

  /**
   * 新增分类
   * @param {string} type 'expense' | 'income'
   * @param {object} newCat { text, icon } (value 会自动生成或指定)
   */
  const addCategory = (type, newCat) => {
    try {
      const targetList = type === 'expense' ? categoriesState.value.expense : categoriesState.value.income;
      
      // 简单的查重 (基于 text)
      if (targetList.some(c => c.text === newCat.text)) {
        throw new Error('分类名称已存在');
      }

      const categoryItem = {
        text: newCat.text,
        value: newCat.text, // 简单起见 value 等于 text
        icon: newCat.icon || '🏷️', // 默认图标
        type: type
      };

      // 插入到列表前面（或者后面，看喜好）
      // 如果想保留"其他"在最后，可以用 splice 插入到倒数第二位
      // 这里直接 push 到最后
      targetList.push(categoryItem);
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  /**
   * 删除分类
   * @param {string} type 'expense' | 'income'
   * @param {string} value 分类的 value 值
   */
  const removeCategory = (type, value) => {
    try {
      const list = type === 'expense' ? categoriesState.value.expense : categoriesState.value.income;
      const index = list.findIndex(c => c.value === value);
      
      if (index === -1) throw new Error('分类不存在');
      // 可选：禁止删除"其他"
      if (list[index].value === '其他') throw new Error('系统分类无法删除');

      list.splice(index, 1);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // --- 现有记录逻辑 ---

  const useMockData = () => {
    if (!records.value || records.value.length === 0) {
      records.value = generateMockData(); // 使用之前的 generateMockData 函数
    }
  };

  const addRecord = (record) => {
    const item = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: record.type || 'expense',
      amount: Number(record.amount) || 0,
      category: record.category || '其他',
      note: record.note || '',
      date: record.date || getLocalTime()
    };
    records.value.unshift(item);
    return item.id;
  };

  const removeRecord = (id) => {
    const idx = records.value.findIndex(r => r.id === id);
    if (idx >= 0) records.value.splice(idx, 1);
  };

  const updateRecord = (id, updates) => {
    const idx = records.value.findIndex(r => r.id === id);
    if (idx >= 0) {
      records.value[idx] = {
        ...records.value[idx],
        ...updates,
        amount: updates.amount ? Number(updates.amount) : records.value[idx].amount
      };
    }
  };

  const clearAll = () => {
    records.value = [];
  };

  const reloadData = () => {
    records.value = storageManager.getRecords();
    categoriesState.value = storageManager.getCategories(); // [新增] 重载时也刷新分类
  };

  const initData = async () => {
    isLoading.value = true;
    try {
      if (!storageManager.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // 从 StorageManager 获取数据同步到 refs
      records.value = storageManager.getRecords();
      categoriesState.value = storageManager.getCategories(); // [新增]
    } catch (error) {
      console.error('初始化数据失败:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // --- 统计逻辑 (保持不变) ---
  const summarize = (list) => {
    const expense = list.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const income = list.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    return { expense, income, balance: income - expense };
  };

  const todayTotal = computed(() => {
    const ymd = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour12:false}).replace(/\//g, '-').slice(0, 10);
    return summarize(records.value.filter(r => (r.date || '').slice(0,10) === ymd));
  });

  const monthTotal = computed(() => {
    const ym = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour12:false}).replace(/\//g, '-').slice(0, 7);
    return summarize(records.value.filter(r => (r.date || '').slice(0,7) === ym));
  });

  const groupByDate = computed(() => {
    const map = new Map();
    for (const r of records.value) {
      const ymd = (r.date || '').slice(0, 10);
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(r);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  });

  const monthSummaryOf = (ym) => {
    return summarize(records.value.filter(r => (r.date || '').slice(0,7) === ym));
  };

  const groupsByDateOf = (ym) => {
    const map = new Map();
    for (const r of records.value) {
      if ((r.date || '').slice(0,7) !== ym) continue;
      const ymd = (r.date || '').slice(0, 10);
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(r);
    }
    return Array.from(map.entries()).map(([date, list]) => ({
      date, list, total: summarize(list)
    })).sort((a, b) => b.date.localeCompare(a.date));
  };

  return {
    records,
    // [新增] 导出分类相关
    expenseCategories, 
    incomeCategories,
    addCategory,
    removeCategory,
    
    isLoading,
    addRecord,
    removeRecord,
    updateRecord,
    clearAll,
    todayTotal,
    monthTotal,
    summarize,
    groupByDate,
    monthSummaryOf,
    groupsByDateOf,
    reloadData,
    initData,
    getLocalTime,
    useMockData
  };
}

// 辅助函数
export function formatAmount(n) {
  return (Number(n) || 0).toFixed(2);
}

// 生成模拟数据 (保持之前逻辑)
function generateMockData() {
   const mockRecords = [
    // 今天的记录
    {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'expense',
      amount: 25.5,
      category: '餐饮',
      note: '午餐',
      date: getLocalTime()
    },
    {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'expense',
      amount: 15.0,
      category: '交通',
      note: '地铁',
      date: new Date(new Date().setHours(9, 0, 0)).toLocaleString('zh-CN', { 
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/\//g, '-')
    },
    // 昨天的记录
    {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'expense',
      amount: 50.0,
      category: '购物',
      note: '日用品',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('zh-CN', { 
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/\//g, '-')
    },
  ];
  return mockRecords;
}