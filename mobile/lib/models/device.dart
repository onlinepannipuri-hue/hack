class Device {
  final String deviceId;
  final String deviceName;
  final String platform;
  final DateTime? lastSeen;

  Device({
    required this.deviceId,
    required this.deviceName,
    this.platform = 'Android',
    this.lastSeen,
  });

  factory Device.fromMap(Map<String, dynamic> map) {
    return Device(
      deviceId: map['deviceId']?.toString() ?? '',
      deviceName: map['deviceName']?.toString() ?? 'Android Device',
      platform: map['platform']?.toString() ?? 'Android',
      lastSeen: map['lastSeen'] != null
          ? DateTime.tryParse(map['lastSeen'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'deviceId': deviceId,
      'deviceName': deviceName,
      'platform': platform,
      if (lastSeen != null) 'lastSeen': lastSeen!.toIso8601String(),
    };
  }
}
