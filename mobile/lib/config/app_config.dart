import 'package:shared_preferences/shared_preferences.dart';

class AppConfig {
  // Default API endpoint (127.0.0.1 for USB ADB reverse / local, 10.11.139.242 for Wi-Fi, 10.0.2.2 for Emulator)
  static const String defaultBaseUrl = 'http://127.0.0.1:5000/api';

  static const String keyApiUrl = 'config_api_url';
  static const String keyAutoSync = 'config_auto_sync';
  static const String keyLastSyncTime = 'config_last_sync_timestamp';
  static const String keyDeviceId = 'config_device_id';
  static const String keyDeviceName = 'config_device_name';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(keyApiUrl) ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(keyApiUrl, url.trim());
  }

  static Future<bool> isAutoSyncEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(keyAutoSync) ?? true;
  }

  static Future<void> setAutoSyncEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(keyAutoSync, enabled);
  }

  static Future<int> getLastSyncTimestamp() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(keyLastSyncTime) ?? 0;
  }

  static Future<void> setLastSyncTimestamp(int timestamp) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(keyLastSyncTime, timestamp);
  }
}
