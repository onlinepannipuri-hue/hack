import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/sms_service.dart';
import 'login_screen.dart';

class PermissionScreen extends StatefulWidget {
  const PermissionScreen({super.key});

  @override
  State<PermissionScreen> createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  bool _isDenied = false;
  bool _isLoading = false;

  Future<void> _handleRequestPermission() async {
    setState(() => _isLoading = true);

    final granted = await SmsService.requestPermission();

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _isDenied = !granted;
    });

    if (granted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
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
                  color: _isDenied
                      ? Colors.amber.shade900.withOpacity(0.3)
                      : const Color(0xFF4F46E5).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _isDenied
                        ? Colors.amber.shade700
                        : const Color(0xFF4F46E5).withOpacity(0.4),
                  ),
                ),
                child: Icon(
                  _isDenied ? Icons.warning_amber_rounded : Icons.sms_outlined,
                  size: 40,
                  color: _isDenied ? Colors.amberAccent : const Color(0xFF818CF8),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _isDenied ? 'Permission Denied' : 'SMS Access Required',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _isDenied
                    ? 'SMS permission was not granted.\n\nYou can enable it later from Android Settings.'
                    : 'This app needs permission to read SMS messages stored on this device so they can be displayed in your secure dashboard.\n\nYour permission is required to continue.',
                style: TextStyle(
                  color: Colors.grey.shade300,
                  fontSize: 14,
                  height: 1.55,
                ),
              ),
              const Spacer(),
              if (!_isDenied) ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleRequestPermission,
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
                            'Allow SMS Access',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.grey.shade400,
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
              ] else ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleRequestPermission,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Request Permission',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton(
                    onPressed: () => openAppSettings(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.grey.shade700),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Open Settings'),
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
