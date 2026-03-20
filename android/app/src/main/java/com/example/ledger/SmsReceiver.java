package com.example.ledger;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private static final String CHANNEL_ID = "LedgerSmsChannel";
    
    // 范本1：您的借记卡账户长城电子借记卡，于03月15日网上支付支取人民币50.00元,交易后余额392.93【中国银行】
    // 范本2：尾号5166卡3月20日11:41手机银行支出(信使费)30元，余额489.57元。【工商银行】
    private static final Pattern EXPENSE_PATTERN = Pattern.compile("(?:于)?(\\d{1,2}月\\d{1,2}日).*?(支取|消费|支出).*?(?:人民币)?([0-9.]+)(?:元)?");
    private static final Pattern INCOME_PATTERN = Pattern.compile("(?:于)?(\\d{1,2}月\\d{1,2}日).*?(转入|汇入|存入|收入).*?(?:人民币)?([0-9.]+)(?:元)?");

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");
                if (pdus != null) {
                    StringBuilder bodyBuilder = new StringBuilder();
                    for (Object pdu : pdus) {
                        SmsMessage message;
                        if (android.os.Build.VERSION.SDK_INT >= 23) {
                            message = SmsMessage.createFromPdu((byte[]) pdu, format);
                        } else {
                            message = SmsMessage.createFromPdu((byte[]) pdu);
                        }
                        bodyBuilder.append(message.getMessageBody());
                    }
                    String msgBody = bodyBuilder.toString();
                    Log.d(TAG, "Received SMS: " + msgBody);
                    
                    parseAndStore(context, msgBody);
                }
            }
        }
    }

    private void parseAndStore(Context context, String msgBody) {
        Matcher expenseMatcher = EXPENSE_PATTERN.matcher(msgBody);
        Matcher incomeMatcher = INCOME_PATTERN.matcher(msgBody);
        
        boolean isExpense = expenseMatcher.find();
        boolean isIncome = !isExpense && incomeMatcher.find();
        
        if (isExpense || isIncome) {
            Matcher matcher = isExpense ? expenseMatcher : incomeMatcher;
            String dateStr = matcher.group(1); // e.g., 03月15日
            String action = matcher.group(2); // e.g., 支取 or 转入
            String amountStr = matcher.group(3); // e.g., 50.00
            
            String bankName = "银行";
            Matcher bankMatcher = Pattern.compile("【(.*?)】").matcher(msgBody);
            if (bankMatcher.find()) {
                bankName = bankMatcher.group(1);
            }
            
            try {
                JSONObject tx = new JSONObject();
                tx.put("amount", Double.parseDouble(amountStr));
                tx.put("remark", bankName + "短信自动记账: " + action);
                tx.put("dateStr", dateStr);
                tx.put("type", isExpense ? "expense" : "income");
                tx.put("category", isExpense ? "其他" : "理财"); // Default categories
                
                SharedPreferences prefs = context.getSharedPreferences(SmsPlugin.PREF_NAME, Context.MODE_PRIVATE);
                String json = prefs.getString(SmsPlugin.KEY_PENDING_TX, "[]");
                JSONArray array = new JSONArray(json);
                array.put(tx);
                
                prefs.edit().putString(SmsPlugin.KEY_PENDING_TX, array.toString()).apply();
                Log.d(TAG, "Stored transaction: " + tx.toString());
                Log.d(TAG, "Current array size: " + array.length());
                
                showNotification(context, action + " " + amountStr + "元", bankName + "短信自动记账");
                
            } catch (Exception e) {
                Log.e(TAG, "Error parsing SMS", e);
            }
        } else {
            Log.d(TAG, "SMS did not match expense or income pattern");
        }
    }

    private void showNotification(Context context, String title, String content) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "POST_NOTIFICATIONS permission not granted");
                return;
            }
        }

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "自动记账通知",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // using default android icon for simplicity
                .setContentTitle(title)
                .setContentText(content)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }
}
