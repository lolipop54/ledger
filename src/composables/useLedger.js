import { ref, computed, watch, onMounted } from 'vue';

const STORAGE_KEY = 'ledger_records_v1';
const DB_NAME = 'LedgerDB';
const DB_VERSION = 1;

const getLocalTime = () => {
    return new Date().toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  };

// 使用IndexedDB存储数据，提供同步接口的包装器
/**
 * 存储管理器，负责处理数据的初始化、迁移和缓存
 */
class StorageManager {
  constructor() {
    this.isInitialized = false;
    this.recordsCache = [];
    this.init();
  }
/**
 * 初始化存储管理器，包括数据迁移和缓存加载
 * 1. 从localStorage迁移旧数据到IndexedDB
 * 2. 从IndexedDB加载数据到缓存
 */
  async init() {
    try {
      // 先尝试从localStorage迁移数据到IndexedDB
      const legacyData = this.loadFromLocalStorage();
      if (legacyData.length > 0) {
        await this.saveToIndexedDB(legacyData);
        // 迁移完成后清空localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      
      // 从IndexedDB加载数据到缓存
      this.recordsCache = await this.loadFromIndexedDB();
      this.isInitialized = true;
    } catch (error) {
      console.error('初始化存储失败:', error);
      this.isInitialized = true; // 即使失败也要标记为已初始化，避免阻塞
    }
  }
/**
 * 从localStorage加载旧数据
 * @returns {Array} 旧数据记录数组
 */
  loadFromLocalStorage() {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('从localStorage加载失败:', e);
      return [];
    }
  }
/**
 * 从IndexedDB加载数据
 * @returns {Array} 数据记录数组
 */
  async loadFromIndexedDB() {
    return new Promise((resolve) => {
      try {
        if (!('indexedDB' in window)) {
          console.warn('浏览器不支持IndexedDB，使用空数据');
          resolve([]);
          return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        /**
         * 数据库升级时创建records对象存储
         * @param {IDBVersionChangeEvent} event - 数据库版本变更事件
         */
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('records')) {
            db.createObjectStore('records');
          }
        };
        /**
         * 数据库打开成功时，从records对象存储中获取数据
         * @param {IDBOpenDBRequest} event - 数据库打开成功事件
         */
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['records'], 'readonly');
          const store = transaction.objectStore('records');
          const getRequest = store.get(STORAGE_KEY);
          /**
           * 获取数据成功时，解析记录并关闭数据库
           * @param {IDBRequest} event - 获取数据成功事件
           */
          getRequest.onsuccess = () => {
            const records = getRequest.result || [];
            db.close();
            resolve(records);
          };
          /**
           * 获取数据失败时，关闭数据库并返回空数组
           * @param {IDBRequest} event - 获取数据失败事件
           */
          getRequest.onerror = () => {
            db.close();
            resolve([]);
          };
        };

        request.onerror = () => {
          console.error('打开IndexedDB失败');
          resolve([]);
        };
      } catch (error) {
        console.error('从IndexedDB加载失败:', error);
        resolve([]);
      }
    });
  }
  /**
   * 异步保存数据到IndexedDB
   * @param {Array} records - 数据记录数组
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveToIndexedDB(records) {
    return new Promise((resolve) => {
      try {
        if (!('indexedDB' in window)) {
          console.warn('浏览器不支持IndexedDB，无法保存数据');
          resolve(false);
          return;
        }
        
        // 深拷贝数据以避免DataCloneError，确保所有数据都可以被序列化
        const serializableRecords = JSON.parse(JSON.stringify(records));

        /**
         * 数据库升级时创建records对象存储
         * @param {IDBVersionChangeEvent} event - 数据库版本变更事件
         */
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('records')) {
            db.createObjectStore('records');
          }
        };
        /**
         * 数据库打开成功时，从records对象存储中获取数据
         * @param {IDBOpenDBRequest} event - 数据库打开成功事件
         */
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['records'], 'readwrite');
          const store = transaction.objectStore('records');
          store.put(serializableRecords, STORAGE_KEY);

          /**
           * 事务完成时，更新缓存并关闭数据库，返回成功
           * @param {IDBTransaction} event - 事务完成事件
           */
          transaction.oncomplete = () => {
            this.recordsCache = [...records]; // 更新缓存
            db.close();
            resolve(true);
          };
          /**
           * 事务失败时，关闭数据库并返回失败
           * @param {IDBTransaction} event - 事务失败事件
           */
          transaction.onerror = () => {
            db.close();
            resolve(false);
          };
        };

        request.onerror = () => {
          console.error('打开IndexedDB失败');
          resolve(false);
        };
      } catch (error) {
        console.error('保存到IndexedDB失败:', error);
        resolve(false);
      }
    });
  }

  // 同步获取数据（返回缓存的数据）
  getRecords() {
    return [...this.recordsCache];
  }

  // 异步保存数据
  async saveRecords(records) {
    return this.saveToIndexedDB(records);
  }
}

// 创建存储管理器实例
const storageManager = new StorageManager();

// 提供同步的loadFromStorage函数，使用缓存数据
function loadFromStorage() {
  return storageManager.getRecords();
}

// 提供同步的saveToStorage函数包装器，内部实际使用异步操作
function saveToStorage(records) {
  try {
    // 异步保存数据，不阻塞主线程
    storageManager.saveRecords(records).catch(error => {
      console.error('异步保存数据失败:', error);
    });
    return true; // 即使异步操作可能失败，这里也返回成功以保持API兼容
  } catch (e) {
    console.error('保存数据失败:', e);
    return false;
  }
}

// 生成默认的模拟数据
function generateMockData() {
  const mockRecords = [
    // 今天的记录
    {
      id: 'mock_1',
      type: 'expense',
      amount: 25.5,
      category: '餐饮',
      note: '午餐',
      date: getLocalTime()
    },
    {
      id: 'mock_2',
      type: 'expense',
      amount: 15.0,
      category: '交通',
      note: '地铁',
      date: new Date(new Date().setHours(9, 0, 0)).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
    },
    // 昨天的记录
    {
      id: 'mock_3',
      type: 'expense',
      amount: 50.0,
      category: '购物',
      note: '日用品',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
    },
    {
      id: 'mock_4',
      type: 'income',
      amount: 5000.0,
      category: '工资',
      note: '月工资',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
    },
    // 上个月的记录
    {
      id: 'mock_5',
      type: 'expense',
      amount: 100.0,
      category: '娱乐',
      note: '电影',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
    }
  ];
  return mockRecords;
}

export function useLedger() {
  let initialRecords = loadFromStorage();
  
  // 如果没有任何记录，添加默认的模拟数据
  if (initialRecords.length === 0) {
    initialRecords = generateMockData();
    try {
      saveToStorage(initialRecords);
    } catch (e) {
      console.error('保存模拟数据失败:', e);
    }
  }
  
  const records = ref(initialRecords);
  const isLoading = ref(false);

  watch(records, (val) => saveToStorage(val), { deep: true });

  const addRecord = (record) => {
  try {
    const item = {
      //解释一下
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: record.type || 'expense', // 'expense' | 'income'
      amount: Number(record.amount) || 0,
      category: record.category || '其他',
      note: record.note || '',
      date: record.date || new Date().toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    };
    records.value.unshift(item);
    return item.id;
  } catch (e) {
    console.error('添加记录失败:', e);
    throw new Error('添加记录失败');
  }
};

  const removeRecord = (id) => {
  try {
    const idx = records.value.findIndex(r => r.id === id);
    if (idx >= 0) records.value.splice(idx, 1);
  } catch (e) {
    console.error('删除记录失败:', e);
    throw new Error('删除记录失败');
  }
};
//解释一下
  const updateRecord = (id, updates) => {
  try {
    const idx = records.value.findIndex(r => r.id === id);
    if (idx >= 0) {
      records.value[idx] = {
        ...records.value[idx],
        ...updates,
        // 确保必要字段的类型正确
        amount: updates.amount ? Number(updates.amount) : records.value[idx].amount
      };
    } else {
      throw new Error('记录不存在');
    }
  } catch (e) {
    console.error('更新记录失败:', e);
    throw new Error('更新记录失败');
  }
};

  const clearAll = () => {
  try {
    records.value = [];
  } catch (e) {
    console.error('清空记录失败:', e);
    throw new Error('清空记录失败');
  }
};

  // 重新加载数据
  const reloadData = () => {
    isLoading.value = true;
    try {
      records.value = loadFromStorage();
    } catch (error) {
      console.error('重新加载数据失败:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // 异步初始化数据，确保IndexedDB数据加载完成
  const initData = async () => {
    isLoading.value = true;
    try {
      // 等待存储管理器初始化完成
      if (!storageManager.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // 再次加载数据，确保获取最新数据
      reloadData();
    } catch (error) {
      console.error('初始化数据失败:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const todayTotal = computed(() => {
    const today = new Date();
    const ymd = today.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-').slice(0, 10);
    return summarize(records.value.filter(r => (r.date || '').slice(0,10) === ymd));
  });

  const monthTotal = computed(() => {
    const today = new Date();
    const ym = today.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-').slice(0, 7);
    return summarize(records.value.filter(r => (r.date || '').slice(0,7) === ym));
  });

  const summarize = (list) => {
    const expense = list.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const income = list.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    return { expense, income, balance: income - expense };
  };

  const groupByDate = computed(() => {
    const map = new Map();
    for (const r of records.value) {
      const ymd = (r.date || '').slice(0, 10);
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(r);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  });

  // New: month helpers for UI filtering
  const monthSummaryOf = (ym) => {
    const list = records.value.filter(r => (r.date || '').slice(0,7) === ym);
    return summarize(list);
  };

  const groupsByDateOf = (ym) => {
    const map = new Map();
    for (const r of records.value) {
      if ((r.date || '').slice(0,7) !== ym) continue;
      const ymd = (r.date || '').slice(0, 10);
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd).push(r);
    }
    // also compute daily subtotal
    const result = Array.from(map.entries()).map(([date, list]) => ({
      date,
      list,
      total: summarize(list)
    })).sort((a, b) => b.date.localeCompare(a.date));
    return result;
  };

  

  return {
    records,
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
    getLocalTime
  };
}

export function formatAmount(n) {
  return (Number(n) || 0).toFixed(2);
}

/**
          
以下是useLedger组合式API中返回的各个属性和方法的详细解释：

响应式数据

1. records - 账本记录数组，包含所有收入和支出记录的响应式引用
2. isLoading - 布尔值，指示数据是否正在加载中，用于UI显示加载状态

数据操作方法

3. addRecord(record) - 添加新记录的函数
   - 参数：record对象，包含type(收入/支出)、amount(金额)、category(分类)等信息
   - 返回：新添加记录的ID

4. removeRecord(id) - 删除指定ID的记录
   - 参数：记录的唯一标识符
   - 直接从records数组中移除匹配的记录

5. updateRecord(id, updates) - 更新指定ID的记录
   - 参数：记录ID和要更新的字段对象
   - 替换匹配记录的对应字段值

6. clearAll() - 清空所有记录的函数
   - 重置records数组为空

数据统计方法

7. todayTotal - 计算属性，返回今日收支汇总
   - 包含expense(支出总额)、income(收入总额)、balance(余额)三个字段

8. monthTotal - 计算属性，返回本月收支汇总
   - 结构与todayTotal相同

9. summarize(list) - 通用汇总函数
   - 参数：记录列表
   - 返回：列表的收支统计信息

10. groupByDate - 计算属性，返回按日期分组的所有记录
    - 按日期降序排列，便于时间线展示

11. monthSummaryOf(ym) - 获取指定月份的收支汇总
    - 参数：年月字符串(格式如'2024-11')
    - 返回：该月份的收支统计

12. groupsByDateOf(ym) - 获取指定月份按日期分组的记录
    - 参数：年月字符串
    - 返回：包含每日记录和当日汇总的数组

数据管理方法

13. reloadData() - 重新加载数据
    - 从IndexedDB缓存中刷新records数据
    - 自动更新isLoading状态

14. initData() - 异步初始化数据
    - 等待IndexedDB初始化完成
    - 确保获取最新存储的数据
    - 适用于应用启动时的数据加载
         
*/