import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/sms_message.dart';

class SmsTile extends StatelessWidget {
  final SmsMessage message;
  final VoidCallback? onTap;

  const SmsTile({
    super.key,
    required this.message,
    this.onTap,
  });

  String _formatTimestamp(int timestamp) {
    if (timestamp == 0) return '';
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    final now = DateTime.now();

    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      return DateFormat('h:mm a').format(date);
    }
    return DateFormat('MMM d').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final isInbox = message.isInbox;


    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: isInbox ? Colors.indigo.shade900 : Colors.purple.shade900,
              child: Text(
                message.displayName.isNotEmpty
                    ? message.displayName.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').padRight(1).substring(0, 1).toUpperCase()
                    : '?',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,

                    children: [
                      Expanded(
                        child: Text(
                          message.displayName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTimestamp(message.timestamp),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        isInbox ? Icons.south_west : Icons.north_east,
                        size: 13,
                        color: isInbox ? Colors.greenAccent : Colors.indigoAccent,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          message.body,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade300,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
