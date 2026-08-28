import 'package:flutter/material.dart';
import '../models/sms_message.dart';
import '../services/sms_service.dart';
import '../widgets/conversation_bubble.dart';

class ConversationDetailScreen extends StatefulWidget {
  final String sender;
  final String phoneNumber;
  final List<SmsMessage> messages;

  const ConversationDetailScreen({
    super.key,
    required this.sender,
    required this.messages,
    String? phoneNumber,
  }) : phoneNumber = phoneNumber ?? '';

  @override
  State<ConversationDetailScreen> createState() =>
      _ConversationDetailScreenState();
}

class _ConversationDetailScreenState extends State<ConversationDetailScreen> {
  late List<SmsMessage> _messages;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _messages = List<SmsMessage>.from(widget.messages)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  String get _resolvedPhoneNumber {
    if (widget.phoneNumber.isNotEmpty) return widget.phoneNumber;
    for (var msg in widget.messages) {
      if (msg.sender.isNotEmpty) return msg.sender;
    }
    return '';
  }

  /// Check if this message's date is different from the previous one
  bool _shouldShowDate(int index) {
    if (index == 0) return true;
    final prev = _messages[index - 1].dateTime;
    final curr = _messages[index].dateTime;
    return prev.year != curr.year ||
        prev.month != curr.month ||
        prev.day != curr.day;
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending) return;

    final phone = _resolvedPhoneNumber;
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('No phone number to send to'),
          backgroundColor: Colors.red.shade800,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    setState(() => _isSending = true);
    _textController.clear();

    try {
      await SmsService.sendSms(phoneNumber: phone, message: text);

      final sentMsg = SmsMessage(
        deviceMessageId: 'local_${DateTime.now().millisecondsSinceEpoch}',
        sender: phone,
        contactName: widget.sender,
        body: text,
        timestamp: DateTime.now().millisecondsSinceEpoch,
        type: 'sent',
      );

      setState(() {
        _messages.add(sentMsg);
        _isSending = false;
      });

      await Future.delayed(const Duration(milliseconds: 50));
      _scrollToBottom();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.check_circle, color: Colors.white, size: 16),
                SizedBox(width: 8),
                Text('Message sent'),
              ],
            ),
            backgroundColor: const Color(0xFF22C55E),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 1),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      setState(() => _isSending = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Send failed: $e'),
            backgroundColor: Colors.red.shade800,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final initial = widget.sender
        .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '')
        .padRight(1)
        .substring(0, 1)
        .toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF131B2E),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        titleSpacing: 0,
        title: Row(
          children: [
            // Avatar with online indicator
            Stack(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFF4F46E5),
                  child: Text(
                    initial.isNotEmpty ? initial : '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF131B2E), width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.sender,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    _resolvedPhoneNumber.isNotEmpty &&
                            _resolvedPhoneNumber != widget.sender
                        ? _resolvedPhoneNumber
                        : '${_messages.length} messages',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.call_outlined, color: Color(0xFF64748B), size: 20),
            onPressed: () {},
          ),
        ],
      ),

      body: Column(
        children: [
          // ── Chat messages ───────────────────────────────────────
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline,
                            size: 48, color: Colors.grey.shade700),
                        const SizedBox(height: 12),
                        Text(
                          'No messages yet',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Send a message to start chatting',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.only(top: 8, bottom: 8),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      return ConversationBubble(
                        message: _messages[index],
                        showDate: _shouldShowDate(index),
                      );
                    },
                  ),
          ),

          // ── Compose bar ─────────────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              color: Color(0xFF131B2E),
              border: Border(
                top: BorderSide(color: Color(0xFF1F2937), width: 0.5),
              ),
            ),
            padding: EdgeInsets.only(
              left: 8,
              right: 8,
              top: 8,
              bottom: MediaQuery.of(context).viewPadding.bottom + 8,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Emoji / attachment button
                Container(
                  width: 40,
                  height: 44,
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.emoji_emotions_outlined,
                    color: Colors.grey.shade500,
                    size: 22,
                  ),
                ),

                // Text field
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0B0F19),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: const Color(0xFF2D3748),
                        width: 0.8,
                      ),
                    ),
                    child: TextField(
                      controller: _textController,
                      focusNode: _focusNode,
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(color: Color(0xFF4A5568)),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 6),

                // Send / Mic button
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  transitionBuilder: (child, anim) =>
                      ScaleTransition(scale: anim, child: child),
                  child: _textController.text.trim().isNotEmpty
                      ? _buildSendButton()
                      : _buildMicButton(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSendButton() {
    return SizedBox(
      key: const ValueKey('send'),
      width: 44,
      height: 44,
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6366F1).withOpacity(0.35),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _isSending ? null : _sendMessage,
            borderRadius: BorderRadius.circular(22),
            child: Center(
              child: _isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.send_rounded,
                      color: Colors.white, size: 20),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMicButton() {
    return SizedBox(
      key: const ValueKey('mic'),
      width: 44,
      height: 44,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Center(
          child: Icon(
            Icons.mic_none_rounded,
            color: Colors.grey.shade400,
            size: 22,
          ),
        ),
      ),
    );
  }
}
