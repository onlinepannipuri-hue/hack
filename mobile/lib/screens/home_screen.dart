import 'package:flutter/material.dart';
import '../models/sms_message.dart';
import '../services/sms_service.dart';
import '../services/sync_manager.dart';
import '../widgets/sms_tile.dart';
import '../widgets/sync_banner.dart';
import 'conversation_detail_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<SmsMessage> _messages = [];
  bool _isLoading = true;
  bool _isSyncing = false;
  String _statusMessage = 'Up to date';
  String _searchQuery = '';
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _autoSync();
  }

  Future<void> _loadMessages() async {
    setState(() => _isLoading = true);
    try {
      final msgs = await SmsService.getAllSms(limit: 300);
      if (mounted) {
        setState(() {
          _messages = msgs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _autoSync() async {
    await Future.delayed(const Duration(milliseconds: 500));
    _triggerSync();
  }

  Future<void> _triggerSync({bool force = false}) async {
    if (_isSyncing) return;
    setState(() {
      _isSyncing = true;
      _statusMessage = 'Synchronizing SMS to server...';
    });

    final result = await SyncManager.performSync(forceFullSync: force);

    if (!mounted) return;
    setState(() {
      _isSyncing = false;
      _statusMessage = result.message;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor: result.success ? const Color(0xFF4F46E5) : Colors.red.shade800,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Group messages by contact display name, sorted by most recent first
  Map<String, List<SmsMessage>> _getGroupedConversations() {
    final Map<String, List<SmsMessage>> map = {};
    for (var msg in _filteredMessages) {
      final key = msg.displayName;
      map.putIfAbsent(key, () => []).add(msg);
    }
    // Sort each conversation's messages by timestamp descending
    for (var msgs in map.values) {
      msgs.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    }
    // Sort conversations by latest message timestamp
    final sorted = map.entries.toList()
      ..sort((a, b) => b.value.first.timestamp.compareTo(a.value.first.timestamp));
    return Map.fromEntries(sorted);
  }

  List<SmsMessage> get _filteredMessages {
    if (_searchQuery.trim().isEmpty) return _messages;
    final q = _searchQuery.toLowerCase();
    return _messages.where((m) =>
        m.sender.toLowerCase().contains(q) || m.body.toLowerCase().contains(q)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _getGroupedConversations();
    final conversationSenders = grouped.keys.toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B0F19),
        elevation: 0,
        title: _isSearching
            ? TextField(
                autofocus: true,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: const InputDecoration(
                  hintText: 'Search sender, OTP, message...',
                  hintStyle: TextStyle(color: Colors.grey),
                  border: InputBorder.none,
                ),
                onChanged: (val) => setState(() => _searchQuery = val),
              )
            : const Text(
                'Secure SMS Reader',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search, color: Colors.grey.shade300),
            onPressed: () {
              setState(() {
                if (_isSearching) _searchQuery = '';
                _isSearching = !_isSearching;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.grey),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              ).then((_) => _loadMessages());
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _loadMessages();
          await _triggerSync();
        },
        color: const Color(0xFF6366F1),
        backgroundColor: const Color(0xFF131B2E),
        child: Column(
          children: [
            SyncBanner(
              isSyncing: _isSyncing,
              statusMessage: _statusMessage,
              onSyncTap: () => _triggerSync(),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,

                children: [
                  Text(
                    'Conversations (${conversationSenders.length})',
                    style: TextStyle(
                      color: Colors.grey.shade400,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  Text(
                    '${_messages.length} SMS',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  ),
                ],
              ),
            ),
            const Divider(color: Color(0xFF1F2937), height: 12),
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
                      ),
                    )
                  : conversationSenders.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.mark_email_read_outlined,
                                  size: 48, color: Colors.grey.shade700),
                              const SizedBox(height: 12),
                              Text(
                                _searchQuery.isNotEmpty
                                    ? 'No matches found for "$_searchQuery"'
                                    : 'No SMS messages on device',
                                style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          itemCount: conversationSenders.length,
                          separatorBuilder: (_, __) =>
                              const Divider(color: Color(0xFF161F36), height: 1),
                          itemBuilder: (context, index) {
                            final sender = conversationSenders[index];
                            final msgs = grouped[sender]!;
                            final latestMsg = msgs.first;

                            return SmsTile(
                              message: latestMsg,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ConversationDetailScreen(
                                      sender: sender,
                                      phoneNumber: latestMsg.sender,
                                      messages: msgs,
                                    ),
                                  ),
                                ).then((_) => _loadMessages());
                              },
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
