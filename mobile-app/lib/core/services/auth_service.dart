import 'package:dio/dio.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? lastName,
    String? mobileNumber,
  }) async {
    final response = await _api.post('/users/signup', data: {
      'email': email,
      'password': password,
      'role': role,
      if (firstName != null) 'first_name': firstName,
      if (lastName != null) 'last_name': lastName,
      if (mobileNumber != null) 'mobile_number': mobileNumber,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post('/users/login', data: {
      'email': email,
      'password': password,
    });

    final data = response.data;
    if (data['token'] != null && data['user'] != null) {
      final user = data['user'];
      await _storage.saveUserSession(
        token: data['token'],
        id: user['id'].toString(),
        role: user['role'],
        email: user['email'],
        name: '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim(),
      );
    }
    return data;
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otp,
  }) async {
    final response = await _api.post('/users/verify-email-otp', data: {
      'email': email,
      'otp': otp,
    });

    final data = response.data;
    if (data['token'] != null && data['user'] != null) {
      final user = data['user'];
      await _storage.saveUserSession(
        token: data['token'],
        id: user['id'].toString(),
        role: user['role'],
        email: user['email'],
        name: '${user['first_name'] ?? ''} ${user['last_name'] ?? ''}'.trim(),
      );
    }
    return data;
  }

  Future<Map<String, dynamic>> resendOtp({required String email}) async {
    final response = await _api.post('/users/resend-verification-otp', data: {
      'email': email,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> forgotPassword({required String email}) async {
    final response = await _api.post('/users/forgot-password', data: {
      'email': email,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await _api.post('/users/reset-password', data: {
      'token': token,
      'new_password': newPassword,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _api.post('/users/change-password', data: {
      'current_password': currentPassword,
      'new_password': newPassword,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _api.get('/users/me');
    return response.data;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _api.put('/users/change-profile', data: data);
    return response.data;
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<bool> isLoggedIn() => _storage.isLoggedIn();

  String getErrorMessage(dynamic error) {
    if (error is DioException) {
      if (error.response?.data is Map) {
        return error.response?.data['message'] ?? 'Something went wrong.';
      }
      if (error.type == DioExceptionType.connectionTimeout) {
        return 'Connection timed out. Please check your internet.';
      }
      if (error.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Please try again later.';
      }
    }
    return error.toString();
  }
}
