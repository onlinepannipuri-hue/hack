class SmsMessage {
  final String? id;
  final String deviceMessageId;
  final String sender;       // raw phone number
  final String contactName;  // resolved display name (falls back to sender)
  final String body;
  final int timestamp;
  final String type; // 'inbox', 'sent', 'draft', 'outbox'
  final String? threadId;
  final String? deviceId;

  SmsMessage({
    this.id,
    required this.deviceMessageId,
    required this.sender,
    String? contactName,
    required this.body,
    required this.timestamp,
    this.type = 'inbox',
    this.threadId,
    this.deviceId,
  }) : contactName = contactName ?? sender;

  /// Display name: use contactName if it differs from sender (i.e. was resolved)
  String get displayName => contactName.isNotEmpty ? contactName : sender;

  factory SmsMessage.fromMap(Map<dynamic, dynamic> map) {
    final rawSender = map['sender']?.toString() ?? map['address']?.toString() ?? '';
    final contactName = map['contactName']?.toString();
    return SmsMessage(
      id: map['_id']?.toString(),
      deviceMessageId: map['deviceMessageId']?.toString() ??
          map['id']?.toString() ?? '',
      sender: rawSender,
      contactName: (contactName != null && contactName.isNotEmpty)
          ? contactName
          : rawSender,
      body: map['body']?.toString() ?? '',
      timestamp: map['timestamp'] is int
          ? map['timestamp']
          : map['date'] is int
              ? map['date']
              : int.tryParse(
                      (map['timestamp'] ?? map['date'])?.toString() ?? '0') ??
                  0,
      type: map['type']?.toString() ?? 'inbox',
      threadId: map['threadId']?.toString(),
      deviceId: map['deviceId']?.toString(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'deviceMessageId': deviceMessageId,
      'sender': sender,
      'contactName': contactName,
      'body': body,
      'timestamp': timestamp,
      'type': type,
      'threadId': threadId,
      if (deviceId != null) 'deviceId': deviceId,
    };
  }

  DateTime get dateTime => DateTime.fromMillisecondsSinceEpoch(timestamp);
  bool get isSent => type == 'sent' || type == 'outbox';
  bool get isInbox => type == 'inbox';
}

