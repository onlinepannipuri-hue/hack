import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/sms_message.dart';
import 'auth_service.dart';

class ApiService {
  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static List<String> _getCandidateUrls(String preferred) {
    final list = <String>[preferred];
    const fallbacks = [
      'http://127.0.0.1:5000/api',
      'http://10.11.139.242:5000/api',
      'http://10.0.2.2:5000/api',
    ];
    for (final fb in fallbacks) {
      if (!list.contains(fb)) list.add(fb);
    }
    return list;
  }

  /// Register or update device metadata on the server
  static Future<Map<String, dynamic>> registerDevice({
    required String deviceId,
    required String deviceName,
    String platform = 'Android',
  }) async {
    final currentBaseUrl = await AppConfig.getBaseUrl();
    final candidates = _getCandidateUrls(currentBaseUrl);
    final headers = await _getHeaders();
    String lastError = 'Device registration failed';

    for (final baseUrl in candidates) {
      try {
        final uri = Uri.parse('$baseUrl/devices/register');
        final response = await http
            .post(
              uri,
              headers: headers,
              body: jsonEncode({
                'deviceId': deviceId,
                'deviceName': deviceName,
                'platform': platform,
              }),
            )
            .timeout(const Duration(seconds: 4));

        final data = jsonDecode(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          await AppConfig.setBaseUrl(baseUrl);
          return data;
        }
        return data;
      } catch (e) {
        lastError = 'Device registration failed ($baseUrl): $e';
      }
    }
    return {'success': false, 'message': lastError};
  }

  /// Synchronize a batch of SMS messages to backend
  static Future<Map<String, dynamic>> syncSmsBatch({
    required String deviceId,
    String? deviceName,
    required List<SmsMessage> messages,
  }) async {
    final currentBaseUrl = await AppConfig.getBaseUrl();
    final candidates = _getCandidateUrls(currentBaseUrl);
    final headers = await _getHeaders();
    String lastError = 'SMS sync failed';

    final payload = {
      'deviceId': deviceId,
      if (deviceName != null) 'deviceName': deviceName,
      'messages': messages.map((m) => m.toMap()).toList(),
    };

    for (final baseUrl in candidates) {
      try {
        final uri = Uri.parse('$baseUrl/sms/sync');
        final response = await http
            .post(uri, headers: headers, body: jsonEncode(payload))
            .timeout(const Duration(seconds: 8));

        final data = jsonDecode(response.body);
        if (response.statusCode >= 200 && response.statusCode < 300) {
          await AppConfig.setBaseUrl(baseUrl);
          return data;
        }
        return data;
      } catch (e) {
        lastError = 'SMS sync failed ($baseUrl): $e';
      }
    }
    return {'success': false, 'message': lastError};
  }

  /// Delete server-side synchronized SMS messages
  static Future<Map<String, dynamic>> deleteServerSms({String? deviceId}) async {
    final currentBaseUrl = await AppConfig.getBaseUrl();
    final candidates = _getCandidateUrls(currentBaseUrl);
    final headers = await _getHeaders();
    final query = deviceId != null ? '?deviceId=$deviceId' : '';
    String lastError = 'Delete failed';

    for (final baseUrl in candidates) {
      try {
        final uri = Uri.parse('$baseUrl/sms$query');
        final response = await http
            .delete(uri, headers: headers)
            .timeout(const Duration(seconds: 4));
        return jsonDecode(response.body);
      } catch (e) {
        lastError = 'Delete failed ($baseUrl): $e';
      }
    }
    return {'success': false, 'message': lastError};
  }
}

