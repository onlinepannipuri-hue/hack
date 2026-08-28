import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/sync_manager.dart';
import 'welcome_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  User? _user;
  bool _autoSync = true;
  int _lastSyncTimestamp = 0;
  String _deviceId = '';
  String _deviceName = '';
  final _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final user = await AuthService.getStoredUser();
    final autoSync = await AppConfig.isAutoSyncEnabled();
    final lastSync = await AppConfig.getLastSyncTimestamp();
    final url = await AppConfig.getBaseUrl();
    final prefs = await SharedPreferences.getInstance();

    setState(() {
      _user = user;
      _autoSync = autoSync;
      _lastSyncTimestamp = lastSync;
      _deviceId = prefs.getString(AppConfig.keyDeviceId) ?? 'Not registered';
      _deviceName = prefs.getString(AppConfig.keyDeviceName) ?? 'Android Phone';
      _urlController.text = url;
    });
  }

  Future<void> _saveServerUrl() async {
    await AppConfig.setBaseUrl(_urlController.text.trim());
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Server URL updated successfully'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _toggleAutoSync(bool val) async {
    await AppConfig.setAutoSyncEnabled(val);
    setState(() => _autoSync = val);
  }

  Future<void> _handleDeleteServerSms() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF131B2E),
        title: const Text('Delete Server Copies?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'This will delete all synchronized SMS records from the server database.\n\nNOTE: This will NOT delete any SMS messages stored on your physical Android phone.',
          style: TextStyle(color: Colors.grey, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade800),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete Server Copy'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final res = await ApiService.deleteServerSms();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Server records deleted'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    await AuthService.logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const WelcomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lastSyncDateStr = _lastSyncTimestamp > 0
        ? DateFormat('MMM d, yyyy h:mm a').format(
            DateTime.fromMillisecondsSinceEpoch(_lastSyncTimestamp),
          )
        : 'Never synchronized';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Settings & Privacy',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Account Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade800),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: const Color(0xFF4F46E5),
                  child: Text(
                    _user?.name.isNotEmpty == true ? _user!.name[0].toUpperCase() : 'U',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _user?.name ?? 'Authenticated User',
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      Text(
                        _user?.email ?? '',
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Privacy Statement Box
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1B4B).withOpacity(0.4),

              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.indigo.shade800.withOpacity(0.5)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, color: Color(0xFF818CF8), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Your SMS messages are synchronized from this device to your authenticated account so that you can view them through the dashboard.',
                    style: TextStyle(color: Colors.indigo.shade100, fontSize: 12, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Sync Settings
          Text(
            'SYNCHRONIZATION',
            style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade800),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('SMS Sync',
                      style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: Text('Enable automatic synchronization',
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                  value: _autoSync,
                  activeColor: const Color(0xFF6366F1),
                  onChanged: _toggleAutoSync,
                ),
                const Divider(color: Color(0xFF1F2937), height: 1),
                ListTile(
                  title: const Text('Last Synchronized',
                      style: TextStyle(color: Colors.white, fontSize: 14)),
                  subtitle: Text(lastSyncDateStr,
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 12)),
                  trailing: TextButton(
                    onPressed: () async {
                      await SyncManager.performSync(forceFullSync: true);
                      _loadSettings();
                    },
                    child: const Text('Full Resync', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const Divider(color: Color(0xFF1F2937), height: 1),
                ListTile(
                  title: const Text('Device Identifier',
                      style: TextStyle(color: Colors.white, fontSize: 14)),
                  subtitle: Text('$_deviceName\n($_deviceId)',
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Server URL Config
          Text(
            'BACKEND CONFIGURATION',
            style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade800),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'API Base URL',
                  style: TextStyle(color: Colors.grey.shade300, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _urlController,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'http://10.0.2.2:5000/api',
                          hintStyle: const TextStyle(color: Colors.grey),
                          isDense: true,
                          filled: true,
                          fillColor: const Color(0xFF0B0F19),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(color: Colors.grey.shade800),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _saveServerUrl,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4F46E5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Save', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Actions
          Text(
            'DATA & SESSION',
            style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF131B2E),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade800),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.delete_sweep_outlined, color: Colors.amberAccent, size: 22),
                  title: const Text('Delete Synchronized SMS',
                      style: TextStyle(color: Colors.white, fontSize: 14)),
                  subtitle: Text('Removes server copies (does not delete phone SMS)',
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                  onTap: _handleDeleteServerSms,
                ),
                const Divider(color: Color(0xFF1F2937), height: 1),
                ListTile(
                  leading: const Icon(Icons.logout, color: Colors.redAccent, size: 22),
                  title: const Text('Logout',
                      style: TextStyle(color: Colors.redAccent, fontSize: 14, fontWeight: FontWeight.bold)),
                  subtitle: Text('Disconnect this device session',
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                  onTap: _handleLogout,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
