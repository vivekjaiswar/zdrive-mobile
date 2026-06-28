class User {
  final String id;
  final String email;
  final String plan;
  final String role;
  final int storageUsed;
  final int storageLimit;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    required this.plan,
    required this.role,
    required this.storageUsed,
    required this.storageLimit,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      plan: json['plan'] ?? '',
      role: json['role'] ?? '',
      storageUsed:
          int.tryParse(json['storageUsed']?.toString() ?? '0') ?? 0,
      storageLimit:
          int.tryParse(json['storageLimit']?.toString() ?? '0') ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }
}