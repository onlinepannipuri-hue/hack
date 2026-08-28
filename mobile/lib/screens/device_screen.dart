import 'dart:math';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../services/api_service.dart';
import '../services/sms_service.dart';
import 'home_screen.dart';

class DeviceScreen extends StatefulWidget {
  const DeviceScreen({super.key});

  @override
  State<DeviceScreen> createState() => _DeviceScreenState();
}

class _DeviceScreenState extends State<DeviceScreen> {
  final _nameController = TextEditingController(text: 'My Android Phone');
  String _deviceId = '';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initDevice();
  }

  Future<void> _initDevice() async {
    final prefs = await SharedPreferences.getInstance();
    var devId = prefs.getString(AppConfig.keyDeviceId);
    var devName = prefs.getString(AppConfig.keyDeviceName);

    if (devId == null) {
      final nativeInfo = await SmsService.getNativeDeviceInfo();
      devId = 'android_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(9999)}';
      devName = nativeInfo['deviceName'] ?? 'My Android Phone';
      await prefs.setString(AppConfig.keyDeviceId, devId);
      await prefs.setString(AppConfig.keyDeviceName, devName);
    }

    setState(() {
      _deviceId = devId!;
      _nameController.text = devName ?? 'My Android Phone';
    });
  }

  Future<void> _registerDevice() async {
    setState(() => _isLoading = true);

    final prefs = await SharedPreferences.getInstance();
    final name = _nameController.text.trim();
    await prefs.setString(AppConfig.keyDeviceName, name);

    await ApiService.registerDevice(
      deviceId: _deviceId,
      deviceName: name,
      platform: 'Android',
    );


    if (!mounted) return;
    setState(() => _isLoading = false);

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFF4F46E5).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.phone_android_outlined,
                  size: 40,
                  color: Color(0xFF818CF8),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Register Device',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Assign a friendly name to identify this Android device on your Web Dashboard.',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 13, height: 1.5),
              ),
              const SizedBox(height: 28),
              TextField(
                controller: _nameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Device Name',
                  labelStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                  prefixIcon: const Icon(Icons.smartphone, color: Colors.grey, size: 20),
                  filled: true,
                  fillColor: const Color(0xFF131B2E),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: Colors.grey.shade800),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Device ID: ${_deviceId.isNotEmpty ? _deviceId : 'Generating...'}',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontFamily: 'monospace'),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _registerDevice,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text(
                          'Continue to Dashboard',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
