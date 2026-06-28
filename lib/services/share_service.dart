import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../core/auth_storage.dart';

class ShareService {
  Future<List<dynamic>> getSharedFiles() async {
    final token = await AuthStorage.getToken();

    final response = await ApiClient.dio.get(
      '/files/shared',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    return response.data;
  }
}