class FileItem {
  final String id;
  final String name;
  final String mimeType;
  final int size;
  final String? folderId;
  final DateTime createdAt;

  FileItem({
    required this.id,
    required this.name,
    required this.mimeType,
    required this.size,
    required this.folderId,
    required this.createdAt,
  });

  factory FileItem.fromJson(Map<String, dynamic> json) {
    return FileItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      mimeType: json['mimeType'] ?? '',
      size: int.tryParse(json['size'].toString()) ?? 0,
      folderId: json['folderId'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}