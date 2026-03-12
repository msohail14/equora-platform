import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const _tokenKey = 'auth_token';
  static const _userIdKey = 'user_id';
  static const _userRoleKey = 'user_role';
  static const _userEmailKey = 'user_email';
  static const _userNameKey = 'user_name';

  StorageService._internal();

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> saveUserId(String id) => _storage.write(key: _userIdKey, value: id);
  Future<String?> getUserId() => _storage.read(key: _userIdKey);

  Future<void> saveUserRole(String role) => _storage.write(key: _userRoleKey, value: role);
  Future<String?> getUserRole() => _storage.read(key: _userRoleKey);

  Future<void> saveUserEmail(String email) => _storage.write(key: _userEmailKey, value: email);
  Future<String?> getUserEmail() => _storage.read(key: _userEmailKey);

  Future<void> saveUserName(String name) => _storage.write(key: _userNameKey, value: name);
  Future<String?> getUserName() => _storage.read(key: _userNameKey);

  Future<void> saveUserSession({
    required String token,
    required String id,
    required String role,
    required String email,
    String? name,
  }) async {
    await saveToken(token);
    await saveUserId(id);
    await saveUserRole(role);
    await saveUserEmail(email);
    if (name != null) await saveUserName(name);
  }

  Future<void> clearAll() => _storage.deleteAll();

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
