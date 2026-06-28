import '../core/auth_storage.dart';
import '../models/user.dart';
import 'auth_service.dart';

class UserService {
  final AuthService _authService = AuthService();

  Future<User> getCurrentUser() async {
    final token = await AuthStorage.getToken();

    if (token == null) {
      throw Exception('User not authenticated');
    }

    return await _authService.getCurrentUser(token);
  }
}