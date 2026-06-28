import 'package:flutter/material.dart';

import '../../models/file_item.dart';
import '../../services/files_service.dart';

class TrashScreen extends StatefulWidget {
  const TrashScreen({super.key});

  @override
  State<TrashScreen> createState() => _TrashScreenState();
}

class _TrashScreenState extends State<TrashScreen> {
  final FilesService _filesService = FilesService();

  List<FileItem> files = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    loadTrash();
  }

  Future<void> loadTrash() async {
    try {
      final result = await _filesService.getTrashFiles();

      setState(() {
        files = result;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> restoreFile(FileItem file) async {
    try {
      await _filesService.restoreFile(file.id);

      await loadTrash();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${file.name} restored',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Restore failed: $e',
          ),
        ),
      );
    }
  }

  String formatSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    }

    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(2)} KB';
    }

    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Trash'),
        ),
        body: Center(
          child: Text(error!),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Trash (${files.length})',
        ),
      ),
      body: RefreshIndicator(
        onRefresh: loadTrash,
        child: ListView.builder(
          itemCount: files.length,
          itemBuilder: (context, index) {
            final file = files[index];

            return Card(
              margin: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 4,
              ),
              child: ListTile(
                leading: const Icon(
                  Icons.delete,
                  color: Colors.red,
                ),
                title: Text(file.name),
                subtitle: Text(
                  '${formatSize(file.size)}\n${file.mimeType}',
                ),
                trailing: IconButton(
                  icon: const Icon(
                    Icons.restore,
                  ),
                  onPressed: () {
                    restoreFile(file);
                  },
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}