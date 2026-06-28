import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/file_item.dart';
import '../../services/files_service.dart';
import 'trash_screen.dart';

class FilesScreen extends StatefulWidget {
  const FilesScreen({super.key});

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  final FilesService _filesService = FilesService();

  final TextEditingController searchController =
      TextEditingController();

  List<FileItem> files = [];

  bool isLoading = true;
  bool isUploading = false;
  bool isSearching = false;

  String? error;

  @override
  void initState() {
    super.initState();
    loadFiles();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> loadFiles() async {
    try {
      final result = await _filesService.getFiles();

      setState(() {
        files = result;
        isLoading = false;
        error = null;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> searchFiles(String query) async {
    if (query.trim().isEmpty) {
      await loadFiles();
      return;
    }

    try {
      setState(() {
        isSearching = true;
      });

      final result =
          await _filesService.searchFiles(query);

      setState(() {
        files = result;
      });
    } finally {
      setState(() {
        isSearching = false;
      });
    }
  }

  Future<void> clearSearch() async {
    searchController.clear();
    await loadFiles();
  }

  Future<void> pickAndUploadFile() async {
    try {
      final result = await FilePicker.platform.pickFiles();

      if (result == null) {
        return;
      }

      setState(() {
        isUploading = true;
      });

      await _filesService.uploadFile(
        result.files.first,
      );

      await loadFiles();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'File uploaded successfully',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isUploading = false;
        });
      }
    }
  }

  Future<void> downloadFile(
    FileItem file,
  ) async {
    try {
      final downloadUrl =
          await _filesService.getDownloadUrl(
        file.id,
      );

      await launchUrl(
        Uri.parse(downloadUrl),
        mode: LaunchMode.externalApplication,
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Download failed: $e',
          ),
        ),
      );
    }
  }

  Future<void> shareFile(
    FileItem file,
  ) async {
    try {
      final response =
          await _filesService.createShareLink(
        file.id,
      );

      final token = response['token'];

      final shareUrl =
          'https://zhdrive.in/share/$token';

      await Clipboard.setData(
        ClipboardData(
          text: shareUrl,
        ),
      );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Share link copied',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Share failed: $e',
          ),
        ),
      );
    }
  }

  Future<void> deleteFile(
    FileItem file,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(
            'Move to Trash',
          ),
          content: Text(
            'Move "${file.name}" to Trash?',
          ),
          actions: [
            TextButton(
              onPressed: () =>
                  Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () =>
                  Navigator.pop(context, true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    try {
      await _filesService.deleteFile(
        file.id,
      );

      await loadFiles();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${file.name} moved to trash',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Delete failed: $e',
          ),
        ),
      );
    }
  }

  Future<void> showFileActions(
    FileItem file,
  ) async {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading:
                    const Icon(Icons.download),
                title: const Text(
                  'Download',
                ),
                onTap: () {
                  Navigator.pop(context);
                  downloadFile(file);
                },
              ),
              ListTile(
                leading:
                    const Icon(Icons.share),
                title: const Text(
                  'Share Link',
                ),
                onTap: () {
                  Navigator.pop(context);
                  shareFile(file);
                },
              ),
              ListTile(
                leading:
                    const Icon(Icons.delete),
                title: const Text(
                  'Delete',
                ),
                onTap: () {
                  Navigator.pop(context);
                  deleteFile(file);
                },
              ),
            ],
          ),
        );
      },
    );
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
          title: const Text('Files'),
        ),
        body: Center(
          child: Text(error!),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Files (${files.length})',
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: showSearchDialog,
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      const TrashScreen(),
                ),
              );
            },
          ),
        ],
      ),
      floatingActionButton:
          FloatingActionButton(
        onPressed:
            isUploading ? null : pickAndUploadFile,
        child: isUploading
            ? const CircularProgressIndicator(
                color: Colors.white,
              )
            : const Icon(Icons.upload),
      ),
      body: files.isEmpty
          ? const Center(
              child: Text(
                'No files found',
              ),
            )
          : RefreshIndicator(
              onRefresh: loadFiles,
              child: ListView.builder(
                itemCount: files.length,
                itemBuilder: (context, index) {
                  final file = files[index];

                  return Card(
                    margin:
                        const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    child: ListTile(
                      leading: const Icon(
                        Icons.insert_drive_file,
                      ),
                      title: Text(file.name),
                      subtitle: Text(
                        '${formatSize(file.size)}\n${file.mimeType}',
                      ),
                      trailing: const Icon(
                        Icons.more_vert,
                      ),
                      onTap: () =>
                          showFileActions(file),
                    ),
                  );
                },
              ),
            ),
    );
  }

  void showSearchDialog() {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text(
            'Search Files',
          ),
          content: TextField(
            controller: searchController,
            decoration: const InputDecoration(
              hintText: 'Enter file name...',
            ),
            onSubmitted: (value) async {
              Navigator.pop(context);
              await searchFiles(value);
            },
          ),
          actions: [
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                await clearSearch();
              },
              child: const Text('Clear'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                await searchFiles(
                  searchController.text,
                );
              },
              child: isSearching
                  ? const CircularProgressIndicator()
                  : const Text('Search'),
            ),
          ],
        );
      },
    );
  }
}