import { registerPlugin } from '@capacitor/core';
import { useLedger } from './useLedger';
import { showToast } from 'vant';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const SmsPlugin = registerPlugin('Sms');

export function useSms() {
  const { records, initData, addRecord } = useLedger();

  const checkSmsTransactions = async () => {
    try {
      const response = await SmsPlugin.getPendingTransactions();
      let transactions = [];
      if (response && response.transactions) {
        if (typeof response.transactions === 'string') {
          try {
            transactions = JSON.parse(response.transactions);
          } catch (e) {
            console.error('Failed to parse transactions string', e);
          }
        } else if (Array.isArray(response.transactions)) {
          transactions = response.transactions;
        }
      }

      if (transactions && transactions.length > 0) {
        // Ensure data is synced before adding records
        if (!records.value || records.value.length === 0) {
          await initData();
        }

        transactions.forEach(tx => {
          // Convert dateStr (e.g. 03月15日) to current year format
          const currentYear = new Date().getFullYear();
          // Try to parse "03月15日"
          let dateFormatted = new Date().toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          }).replace(/\//g, '-');
          
          if (tx.dateStr) {
            const match = tx.dateStr.match(/(\d{2})月(\d{2})日/);
            if (match) {
              const month = match[1];
              const day = match[2];
              dateFormatted = `${currentYear}-${month}-${day} 00:00:00`;
            }
          }

          addRecord({
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            note: tx.remark,
            date: dateFormatted
          });
        });
        showToast(`已自动记账 ${transactions.length} 笔短信记录`);
      }
    } catch (e) {
      console.error('Failed to read SMS transactions', e);
    }
  };

  const initSmsListener = async () => {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      // Check permissions
      const permissions = await SmsPlugin.checkPermissions();
      
      const permissionsToRequest = [];
      if (permissions.sms !== 'granted') {
        permissionsToRequest.push('sms');
      }
      if (permissions.notifications !== 'granted') {
        permissionsToRequest.push('notifications');
      }

      if (permissionsToRequest.length > 0) {
        const req = await SmsPlugin.requestPermissions();
        if (req.sms !== 'granted') {
          console.warn('SMS permission not granted');
          return;
        }
      }

      // Check immediately on startup
      checkSmsTransactions();

      // Listen for app state changes to check immediately when returning to the app
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkSmsTransactions();
        }
      });

      // Still keep a fallback periodic check (can be less frequent now)
      setInterval(checkSmsTransactions, 10000); // Check every 10 seconds
      
    } catch (e) {
      console.error('Failed to initialize SMS listener', e);
    }
  };

  return {
    initSmsListener
  };
}
