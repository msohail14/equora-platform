import 'package:flutter/material.dart';
import '../models/user_role.dart';
import '../../features/rider_home/screens/rider_home_screen.dart';
import '../../features/coach_home/screens/coach_home_screen.dart';
import '../../features/book/screens/book_root_screen.dart';
import '../../features/horses/screens/horses_screen.dart';
import '../../features/courses/screens/courses_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../constants/asset_paths.dart';
import '../utils/smooth_page_route.dart';

class AppNavigator {
  static Widget getHomeScreen(UserRole role) {
    switch (role) {
      case UserRole.rider:
        return const RiderHomeScreen();
      case UserRole.coach:
        return const CoachHomeScreen();
    }
  }

  static Widget getProfileScreen(UserRole role) {
    switch (role) {
      case UserRole.rider:
        return const ProfileScreen(
          userName: 'Abdul Mohsen',
          userRole: 'Rider',
          avatarPath: AssetPaths.userAvatar,
        );
      case UserRole.coach:
        return const ProfileScreen(
          userName: 'James Blackwood',
          userRole: 'Coach',
          avatarPath: AssetPaths.userAvatar,
        );
    }
  }

  static void navigateToTab(
    BuildContext context,
    int tabIndex,
    UserRole role,
  ) {
    Widget destination;

    switch (tabIndex) {
      case 0: // Home
        destination = getHomeScreen(role);
        break;
      case 1: // Book
        // Use push instead of pushReplacement for booking
        // so the home screen stays in the stack
        Navigator.push(
          context,
          SmoothPageRoute(page: BookRootScreen(userRole: role)),
        );
        return; // Early return since we already navigated
      case 2: // Horses
        destination = HorsesScreen(userRole: role);
        break;
      case 3: // Courses (Coach only) or Profile (Rider)
        if (role == UserRole.coach) {
          destination = CoursesScreen(userRole: role);
        } else {
          destination = getProfileScreen(role);
        }
        break;
      case 4: // Profile (Coach only)
        destination = getProfileScreen(role);
        break;
      default:
        return;
    }

    Navigator.pushReplacement(
      context,
      SmoothPageRoute(page: destination),
    );
  }
}
