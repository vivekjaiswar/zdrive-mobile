import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/user.dart';

class AuthService {
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await ApiClient.dio.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );

    if (response.statusCode != 201) {
      throw Exception(
        response.data['message'] ?? 'Login failed',
      );
    }

    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
  }) async {
    final response = await ApiClient.dio.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
      },
    );

    if (response.statusCode != 201) {
      throw Exception(
        response.data['message'] ?? 'Registration failed',
      );
    }

    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    final response = await ApiClient.dio.post(
      '/auth/forgot-password',
      data: {
        'email': email,
      },
    );

    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> resendVerification({
    required String email,
  }) async {
    final response = await ApiClient.dio.post(
      '/auth/resend-verification',
      data: {
        'email': email,
      },
    );

    return Map<String, dynamic>.from(response.data);
  }

  Future<User> getCurrentUser(String token) async {
    final response = await ApiClient.dio.get(
      '/auth/me',
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
      ),
    );

    if (response.statusCode != 200) {
      throw Exception(
        response.data['message'] ?? 'Unable to fetch user.',
      );
    }

    return User.fromJson(response.data);
  }
}