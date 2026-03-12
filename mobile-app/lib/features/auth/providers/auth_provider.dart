import 'package:flutter/material.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  bool _isLoading = false;
  bool _isLoggedIn = false;
  String? _error;
  Map<String, dynamic>? _user;
  String? _pendingVerificationEmail;

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String? get error => _error;
  Map<String, dynamic>? get user => _user;
  String? get pendingVerificationEmail => _pendingVerificationEmail;

  Future<void> checkAuthStatus() async {
    _isLoggedIn = await _storageService.isLoggedIn();
    if (_isLoggedIn) {
      try {
        _user = await _authService.getProfile();
      } catch (_) {
        _isLoggedIn = false;
        await _storageService.clearAll();
      }
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.login(email: email, password: password);
      _user = data['user'];
      _isLoggedIn = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _authService.getErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup({
    required String email,
    required String password,
    required String role,
    String? firstName,
    String? lastName,
    String? mobileNumber,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.signup(
        email: email,
        password: password,
        role: role,
        firstName: firstName,
        lastName: lastName,
        mobileNumber: mobileNumber,
      );
      _pendingVerificationEmail = email;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _authService.getErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtp(String email, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _authService.verifyOtp(email: email, otp: otp);
      _user = data['user'];
      _isLoggedIn = true;
      _pendingVerificationEmail = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _authService.getErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resendOtp(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.resendOtp(email: email);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _authService.getErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.forgotPassword(email: email);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _authService.getErrorMessage(e);
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _isLoggedIn = false;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
