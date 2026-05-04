/**
 * 数据导出工具 —— 将 myapp 的记账数据导出为通用 JSON 格式，
 * 方便迁移至 ledger_flutter 等其他记账应用。
 *
 * 导出格式与 ledger_flutter 的导入功能配套使用。
 * Android 上使用 @capacitor/filesystem 保存到 Downloads 目录。
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useLedger } from './useLedger';

/** 分类名称 → ledger_flutter iconId 映射表 */
const CATEGORY_TO_ICON_MAP = {
  // 支出
  '餐饮': 0,
  '买菜': 4,   // → 蔬菜
  '购物': 1,
  '交通': 3,
  '娱乐': 8,
  '通讯': 9,
  '零食': 6,
  '日用': 2,
  '水果': 5,
  '运动': 7,
  '服饰': 10,
  '美容': 11,
  '住房': 12,
  '医疗': 21,
  '旅行': 17,
  '其他': 37,  // 支出 → 归入收入的"其他" icon；导入时按 type 正确归类
  // 收入
  '工资': 33,
  '兼职': 34,
  '理财': 35,
};

/** 获取 myapp 分类对应的 ledger_flutter iconId，未命中返回 -1 */
function getIconId(categoryName, type) {
  if (categoryName === '其他' && type === 'expense') return 37; // 使用"其他"图标
  if (categoryName === '其他' && type === 'income') return 37;
  const id = CATEGORY_TO_ICON_MAP[categoryName];
  return id != null ? id : 37;
}

/**
 * 生成迁移用的 JSON 数据
 * @returns {{ formatVersion: number, source: string, exportedAt: string, records: Array, categories: Object }}
 */
export function generateExportData() {
  const { records: _records, expenseCategories: _expCats, incomeCategories: _incCats } = useLedger();

  const now = new Date().toISOString();

  const records = _records.value.map(r => ({
    type: r.type,
    amount: r.amount,
    category: r.category,
    note: r.note || '',
    date: r.date || '',
    iconId: getIconId(r.category, r.type),
  }));

  const categories = {
    expense: (_expCats.value || []).map(c => ({
      name: c.text || c.value,
      icon: c.icon || '',
    })),
    income: (_incCats.value || []).map(c => ({
      name: c.text || c.value,
      icon: c.icon || '',
    })),
  };

  return {
    formatVersion: 1,
    source: 'myapp',
    exportedAt: now,
    records,
    categories,
  };
}

/**
 * 生成 JSON 字符串
 */
export function generateExportJson() {
  return JSON.stringify(generateExportData(), null, 2);
}

/**
 * 生成导出用的文件名
 */
function getExportFileName() {
  const now = new Date();
  const dateStr = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '');
  return `ledger_backup_${dateStr}.json`;
}

/**
 * 保存 JSON 文件到 Android Downloads 目录（Capacitor Filesystem）
 * 同时尝试浏览器下载作为降级方案。
 *
 * @returns {Promise<{success: boolean, path?: string, message: string}>}
 */
export async function downloadExportFile() {
  const json = generateExportJson();
  const fileName = getExportFileName();

  try {
    // 优先使用 Capacitor Filesystem → 保存到 Downloads/ 目录
    const result = await Filesystem.writeFile({
      path: `Download/${fileName}`,
      data: json,
      directory: Directory.ExternalStorage,
      encoding: Encoding.UTF8,
    });
    return {
      success: true,
      path: result.uri,
      message: `已保存到 Downloads/${fileName}`,
    };
  } catch (e) {
    // 降级方案：浏览器下载（PC 端开发调试时可用）
    console.warn('Filesystem 写入失败，尝试浏览器下载:', e);
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, message: fileName };
    } catch (e2) {
      return { success: false, message: `写入失败: ${e2}` };
    }
  }
}

/**
 * 复制 JSON 到剪贴板
 */
export async function copyExportToClipboard() {
  const json = generateExportJson();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(json);
    return true;
  }
  // 降级方案
  const textarea = document.createElement('textarea');
  textarea.value = json;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return true;
}
