import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/sms_message.dart';

class ConversationBubble extends StatelessWidget {
  final SmsMessage message;
  final bool showDate;

  const ConversationBubble({
    super.key,
    required this.message,
    this.showDate = false,
  });

  @override
  Widget build(BuildContext context) {
    final isSent = message.isSent;
    final timeStr = DateFormat('h:mm a').format(message.dateTime);
    final screenWidth = MediaQuery.of(context).size.width;

    return Column(
      children: [
        // ── Date separator ───────────────────────────────────────
        if (showDate)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A2236),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF2D3748), width: 0.5),
                ),
                child: Text(
                  _formatDate(message.dateTime),
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ),

        // ── Chat bubble ──────────────────────────────────────────
        Align(
          alignment: isSent ? Alignment.centerRight : Alignment.centerLeft,
          child: GestureDetector(
            onLongPress: () {
              Clipboard.setData(ClipboardData(text: message.body));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: const Text('Copied to clipboard'),
                  backgroundColor: const Color(0xFF334155),
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              );
            },
            child: Container(
              margin: EdgeInsets.only(
                left: isSent ? screenWidth * 0.18 : 10,
                right: isSent ? 10 : screenWidth * 0.18,
                top: 2,
                bottom: 2,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                // Sent: gradient purple/indigo, Received: dark slate
                gradient: isSent
                    ? const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isSent ? null : const Color(0xFF1E293B),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isSent ? 18 : 4),
                  bottomRight: Radius.circular(isSent ? 4 : 18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: isSent
                        ? const Color(0xFF4F46E5).withOpacity(0.15)
                        : Colors.black.withOpacity(0.12),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Message body
                  Text(
                    message.body,
                    style: TextStyle(
                      color: isSent ? Colors.white : const Color(0xFFE2E8F0),
                      fontSize: 14.5,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Time + delivery status
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        timeStr,
                        style: TextStyle(
                          fontSize: 10.5,
                          color: isSent
                              ? Colors.white.withOpacity(0.6)
                              : const Color(0xFF64748B),
                        ),
                      ),
                      if (isSent) ...[
                        const SizedBox(width: 4),
                        Icon(
                          Icons.done_all,
                          size: 14,
                          color: Colors.white.withOpacity(0.6),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final msgDate = DateTime(date.year, date.month, date.day);

    if (msgDate == today) return 'Today';
    if (msgDate == yesterday) return 'Yesterday';
    if (now.difference(date).inDays < 7) return DateFormat('EEEE').format(date);
    return DateFormat('MMM d, yyyy').format(date);
  }
}
