import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/sms_message.dart';

class SmsService {
  static const MethodChannel _channel = MethodChannel('com.securesms.dashboard/sms');

  /// Check whether the Android READ_SMS permission is currently granted
  static Future<bool> checkPermission() async {
    try {
      final status = await Permission.sms.status;
      if (status.isGranted) return true;

      // Fallback check via Native MethodChannel
      final bool? nativeResult = await _channel.invokeMethod<bool>('checkPermission');
      return nativeResult ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Request runtime Android READ_SMS permission from the user
  static Future<bool> requestPermission() async {
    try {
      final status = await Permission.sms.request();
      return status.isGranted;
    } catch (e) {
      return false;
    }
  }

  /// Open Android system app settings if permanently denied
  static Future<bool> openAppSettings() async {
    return await openAppSettings();
  }

  /// Fetch all SMS messages (inbox & sent) from the Android Telephony ContentResolver
  static Future<List<SmsMessage>> getAllSms({int limit = 500}) async {
    try {
      final List<dynamic>? rawList = await _channel.invokeMethod('getSmsMessages', {
        'type': 'all',
        'limit': limit,
      });

      if (rawList == null) return [];

      return rawList.map((item) => SmsMessage.fromMap(item as Map)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch inbox SMS messages
  static Future<List<SmsMessage>> getInboxSms({int limit = 500}) async {
    try {
      final List<dynamic>? rawList = await _channel.invokeMethod('getSmsMessages', {
        'type': 'inbox',
        'limit': limit,
      });

      if (rawList == null) return [];

      return rawList.map((item) => SmsMessage.fromMap(item as Map)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Fetch sent SMS messages
  static Future<List<SmsMessage>> getSentSms({int limit = 500}) async {
    try {
      final List<dynamic>? rawList = await _channel.invokeMethod('getSmsMessages', {
        'type': 'sent',
        'limit': limit,
      });

      if (rawList == null) return [];

      return rawList.map((item) => SmsMessage.fromMap(item as Map)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get native device info for auto-naming
  static Future<Map<String, String>> getNativeDeviceInfo() async {
    try {
      final Map<dynamic, dynamic>? info = await _channel.invokeMethod('getDeviceInfo');
      if (info != null) {
        return info.map((k, v) => MapEntry(k.toString(), v.toString()));
      }
    } catch (_) {}
    return {
      'deviceName': 'Android Device',
      'platform': 'Android',
    };
  }

  /// Request SEND_SMS permission
  static Future<bool> requestSendSmsPermission() async {
    try {
      final status = await Permission.sms.request();
      return status.isGranted;
    } catch (e) {
      return false;
    }
  }

  /// Send an SMS to a phone number via the native Android SmsManager
  static Future<bool> sendSms({
    required String phoneNumber,
    required String message,
  }) async {
    try {
      final bool? result = await _channel.invokeMethod<bool>('sendSms', {
        'phoneNumber': phoneNumber,
        'message': message,
      });
      return result ?? false;
    } catch (e) {
      rethrow;
    }
  }
}
