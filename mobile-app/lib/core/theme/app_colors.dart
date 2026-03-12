import 'package:flutter/material.dart';

class AppColors {
  // Primary (Forest Green Theme)
  static const Color primary = Color(0xFF2C5E4E); // Deep Forest Green
  static const Color primaryDark = Color(0xFF1E4236);
  static const Color primaryLight = Color(0xFF4A8B78);

  // Secondary (Accents)
  static const Color secondary = Color(0xFFD4A373); // Soft Saddle Brown / Gold
  static const Color secondaryLight = Color(0xFFE8C8A8);

  // Backgrounds
  static const Color background = Color(0xFFF9F8F6); // Soft Off-White / Beige
  static const Color surface = Color(0xFFFFFFFF); // Pure White cards
  static const Color surfaceWarm = Color(0xFFF2EFE9); // Slightly warmer surface

  // Text
  static const Color textPrimary = Color(0xFF1A1A1A); // Almost Black
  static const Color textSecondary = Color(0xFF666666); // Dark Gray
  static const Color textTertiary = Color(0xFF999999); // Light Gray
  static const Color textInverse = Color(0xFFFFFFFF); // White text

  // Status
  static const Color error = Color(0xFFD32F2F);
  static const Color success = Color(0xFF388E3C);
  static const Color warning = Color(0xFFFBC02D);

  // Borders & Dividers
  static const Color border = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFEEEEEE);
  
  // Overlay
  static const Color overlay = Color(0x66000000); // 40% Black

  // Private constructor to prevent instantiation
  const AppColors._();
}
