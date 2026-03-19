package com.example.ledger;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONArray;
import org.json.JSONException;

@CapacitorPlugin(
    name = "Sms",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            }
        ),
        @Permission(
            alias = "notifications",
            strings = {
                Manifest.permission.POST_NOTIFICATIONS
            }
        )
    }
)
public class SmsPlugin extends Plugin {

    public static final String PREF_NAME = "LedgerSmsPrefs";
    public static final String KEY_PENDING_TX = "pending_transactions";

    @PluginMethod
    public void getPendingTransactions(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_PENDING_TX, "[]");
        
        try {
            JSONArray array = new JSONArray(json);
            JSObject ret = new JSObject();
            ret.put("transactions", array);
            
            // clear after reading
            prefs.edit().putString(KEY_PENDING_TX, "[]").apply();
            
            call.resolve(ret);
        } catch (JSONException e) {
            call.reject("Error parsing JSON", e);
        }
    }
}
