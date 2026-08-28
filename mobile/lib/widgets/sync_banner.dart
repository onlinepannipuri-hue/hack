import 'package:flutter/material.dart';

class SyncBanner extends StatelessWidget {
  final bool isSyncing;
  final String? statusMessage;
  final VoidCallback onSyncTap;

  const SyncBanner({
    super.key,
    required this.isSyncing,
    this.statusMessage,
    required this.onSyncTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF131B2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.indigo.shade800.withOpacity(0.5)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.indigo.shade600.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: isSyncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.indigoAccent),
                    ),
                  )
                : const Icon(Icons.sync, color: Colors.indigoAccent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isSyncing ? 'Synchronizing SMS...' : 'Sync Status',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                Text(
                  statusMessage ?? 'Delta synchronization ready',
                  style: TextStyle(
                    color: Colors.grey.shade400,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: isSyncing ? null : onSyncTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: _roundedRectangleRadius(10),
              elevation: 0,
            ),
            child: const Text(
              'Sync Now',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  OutlinedBorder _roundedRectangleRadius(double r) {
    return RoundedRectangleBorder(borderRadius: BorderRadius.circular(r));
  }
}

