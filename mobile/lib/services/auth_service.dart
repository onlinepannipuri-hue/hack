import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user.dart';

class AuthService {
  static const String keyAccessToken = 'auth_access_token';
  static const String keyRefreshToken = 'auth_refresh_token';
  static const String keyUserData = 'auth_user_data';

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(keyAccessToken) != null;
  }

  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(keyAccessToken);
  }

  static Future<User?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString(keyUserData);
    if (userJson == null) return null;
    try {
      return User.fromMap(jsonDecode(userJson));
    } catch (_) {
      return null;
    }
  }

  static List<String> _getCandidateUrls(String preferred) {
    final list = <String>[preferred];
    const fallbacks = [
      'https://secure-sms-backend.onrender.com/api',
      'http://127.0.0.1:5000/api',
      'http://10.11.139.242:5000/api',
      'http://10.0.2.2:5000/api',
    ];
    for (final fb in fallbacks) {
      if (!list.contains(fb)) list.add(fb);
    }
    return list;
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final currentBaseUrl = await AppConfig.getBaseUrl();
    final candidates = _getCandidateUrls(currentBaseUrl);

    String lastError = 'Unable to connect to server';

    for (final baseUrl in candidates) {
      try {
        final uri = Uri.parse('$baseUrl/auth/login');
        final response = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({'email': email.trim(), 'password': password}),
            )
            .timeout(const Duration(seconds: 4));

        final data = jsonDecode(response.body);

        if (response.statusCode == 200 && data['success'] == true) {
          await AppConfig.setBaseUrl(baseUrl);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(keyAccessToken, data['data']['accessToken']);
          await prefs.setString(keyRefreshToken, data['data']['refreshToken']);
          await prefs.setString(keyUserData, jsonEncode(data['data']['user']));

          return {'success': true, 'user': User.fromMap(data['data']['user'])};
        } else {
          return {'success': false, 'message': data['message'] ?? 'Login failed'};
        }
      } catch (e) {
        lastError = 'Connection failed ($baseUrl): $e';
      }
    }

    return {'success': false, 'message': lastError};
  }

  static Future<Map<String, dynamic>> register(String name, String email, String password) async {
    final currentBaseUrl = await AppConfig.getBaseUrl();
    final candidates = _getCandidateUrls(currentBaseUrl);

    String lastError = 'Unable to connect to server';

    for (final baseUrl in candidates) {
      try {
        final uri = Uri.parse('$baseUrl/auth/register');
        final response = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({
                'name': name.trim(),
                'email': email.trim(),
                'password': password,
              }),
            )
            .timeout(const Duration(seconds: 4));

        final data = jsonDecode(response.body);

        if (response.statusCode == 201 && data['success'] == true) {
          await AppConfig.setBaseUrl(baseUrl);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(keyAccessToken, data['data']['accessToken']);
          await prefs.setString(keyRefreshToken, data['data']['refreshToken']);
          await prefs.setString(keyUserData, jsonEncode(data['data']['user']));

          return {'success': true, 'user': User.fromMap(data['data']['user'])};
        } else {
          return {'success': false, 'message': data['message'] ?? 'Registration failed'};
        }
      } catch (e) {
        lastError = 'Connection failed ($baseUrl): $e';
      }
    }

    return {'success': false, 'message': lastError};
  }


  static Future<void> logout() async {
    final baseUrl = await AppConfig.getBaseUrl();
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString(keyRefreshToken);
    final accessToken = prefs.getString(keyAccessToken);

    if (refreshToken != null && accessToken != null) {
      try {
        await http.post(
          Uri.parse('$baseUrl/auth/logout'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $accessToken',
          },
          body: jsonEncode({'refreshToken': refreshToken}),
        );
      } catch (_) {}
    }

    await prefs.remove(keyAccessToken);
    await prefs.remove(keyRefreshToken);
    await prefs.remove(keyUserData);
  }
}
