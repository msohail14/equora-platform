enum UserRole {
  rider,
  coach,
}

extension UserRoleExtension on UserRole {
  String get displayName {
    switch (this) {
      case UserRole.rider:
        return 'Rider';
      case UserRole.coach:
        return 'Coach';
    }
  }
}
