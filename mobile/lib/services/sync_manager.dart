import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/sms_message.dart';
import 'api_service.dart';
import 'sms_service.dart';

class SyncSummary {
  final bool success;
  final int totalScanned;
  final int newSynchronized;
  final String message;

  SyncSummary({
    required this.success,
    required this.totalScanned,
    required this.newSynchronized,
    required this.message,
  });
}

class SyncManager {
  static bool _isSyncing = false;
  static bool get isSyncing => _isSyncing;

  /// Perform delta synchronization
  static Future<SyncSummary> performSync({bool forceFullSync = false}) async {
    if (_isSyncing) {
      return SyncSummary(
        success: false,
        totalScanned: 0,
        newSynchronized: 0,
        message: 'A synchronization operation is already in progress',
      );
    }

    _isSyncing = true;

    try {
      // 1. Verify Android permission
      final hasPerm = await SmsService.checkPermission();
      if (!hasPerm) {
        return SyncSummary(
          success: false,
          totalScanned: 0,
          newSynchronized: 0,
          message: 'Android READ_SMS permission is not granted',
        );
      }

      // 2. Fetch device details
      final prefs = await SharedPreferences.getInstance();
      var deviceId = prefs.getString(AppConfig.keyDeviceId);
      var deviceName = prefs.getString(AppConfig.keyDeviceName);

      if (deviceId == null) {
        final nativeInfo = await SmsService.getNativeDeviceInfo();
        deviceId = 'android_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(9999)}';
        deviceName = nativeInfo['deviceName'] ?? 'Android Phone';
        await prefs.setString(AppConfig.keyDeviceId, deviceId);
        await prefs.setString(AppConfig.keyDeviceName, deviceName);
      }

      // 3. Register device if needed
      await ApiService.registerDevice(
        deviceId: deviceId,
        deviceName: deviceName ?? 'Android Phone',
        platform: 'Android',
      );

      // 4. Query SMS messages from native provider
      final allMessages = await SmsService.getAllSms(limit: 500);
      if (allMessages.isEmpty) {
        return SyncSummary(
          success: true,
          totalScanned: 0,
          newSynchronized: 0,
          message: 'No SMS messages found on device',
        );
      }

      // 5. Delta Filtering
      final lastSyncTime = forceFullSync ? 0 : await AppConfig.getLastSyncTimestamp();
      final List<SmsMessage> messagesToUpload = forceFullSync
          ? allMessages
          : allMessages.where((m) => m.timestamp > lastSyncTime).toList();

      if (messagesToUpload.isEmpty) {
        return SyncSummary(
          success: true,
          totalScanned: allMessages.length,
          newSynchronized: 0,
          message: 'All messages are up to date. No new SMS detected.',
        );
      }

      // 6. Chunking into batches of 100
      int totalUploadedNew = 0;
      const chunkSize = 100;
      for (var i = 0; i < messagesToUpload.length; i += chunkSize) {
        final chunk = messagesToUpload.sublist(
          i,
          min(i + chunkSize, messagesToUpload.length),
        );

        final response = await ApiService.syncSmsBatch(
          deviceId: deviceId,
          deviceName: deviceName,
          messages: chunk,
        );

        if (response['success'] == true) {
          totalUploadedNew += (response['data']?['newInserted'] as int? ?? chunk.length);
        } else {
          return SyncSummary(
            success: false,
            totalScanned: allMessages.length,
            newSynchronized: totalUploadedNew,
            message: response['message'] ?? 'Partial sync error',
          );
        }
      }

      // 7. Update last sync timestamp to the highest message timestamp
      final newestTimestamp = allMessages.map((m) => m.timestamp).reduce(max);
      await AppConfig.setLastSyncTimestamp(newestTimestamp);

      return SyncSummary(
        success: true,
        totalScanned: allMessages.length,
        newSynchronized: totalUploadedNew,
        message: 'Successfully synchronized $totalUploadedNew new SMS messages',
      );
    } catch (e) {
      return SyncSummary(
        success: false,
        totalScanned: 0,
        newSynchronized: 0,
        message: 'Sync failed: $e',
      );
    } finally {
      _isSyncing = false;
    }
  }
}
