import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';

import '../core/api_client.dart';
import '../core/auth_storage.dart';
import '../models/file_item.dart';

class FilesService {
  Future<List<FileItem>> getFiles() async {
    final token = await AuthStorage.getToken();

    final response = await ApiClient.dio.get(
      '/files',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    final List data = response.data;

    return data.map((e) => FileItem.fromJson(e)).toList();
  }

  Future<List<FileItem>> searchFiles(String query) async {
    final token = await AuthStorage.getToken();

    final response = await ApiClient.dio.get(
      '/files/search/$query',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    final List data = response.data;

    return data.map((e) => FileItem.fromJson(e)).toList();
  }

  Future<bool> pickAndUploadFile() async {
    final result = await FilePicker.platform.pickFiles();

    if (result == null) {
      return false;
    }

    await uploadFile(result.files.first);

    return true;
  }

  Future<void> uploadFile(PlatformFile file) async {
    final token = await AuthStorage.getToken();

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path!,
        filename: file.name,
      ),
    });

    await ApiClient.dio.post(
      '/storage/upload',
      data: formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );
  }

  Future<String> getDownloadUrl(String fileId) async {
    final token = await AuthStorage.getToken();

    final response = await ApiClient.dio.get(
      '/files/$fileId/download',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    return response.data['downloadUrl'];
  }

  Future<Map<String, dynamic>> createShareLink(
      String fileId,
      ) async {
    final token = await AuthStorage.getToken();

    final response = await ApiClient.dio.post(
      '/files/$fileId/share',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    return response.data;
  }

  Future<void> deleteFile(String fileId) async {
    final token = await AuthStorage.getToken();

    await ApiClient.dio.delete(
      '/files/$fileId',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );
  }

  Future<List<FileItem>> getTrashFiles() async {
    final token = await AuthStorage.getToken();

    final response = await ApiClient.dio.get(
      '/files/trash',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    final List data = response.data;

    return data.map((e) => FileItem.fromJson(e)).toList();
  }

  Future<void> restoreFile(String fileId) async {
    final token = await AuthStorage.getToken();

    await ApiClient.dio.patch(
      '/files/$fileId/restore',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );
  }
}