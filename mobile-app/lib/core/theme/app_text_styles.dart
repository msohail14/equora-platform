import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  static const String _serifFont = 'LibreBaskerville';
  static const String _sansSerifFont = 'PlusJakartaSans';

  // Headings - Using Libre Baskerville for elegant, prominent headings
  static const TextStyle h1 = TextStyle(
    fontFamily: _serifFont,
    fontSize: 30,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
    height: 1.2,
  );

  static const TextStyle h2 = TextStyle(
    fontFamily: _serifFont,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    height: 1.25,
  );

  static const TextStyle h3 = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  // Body - Using Plus Jakarta Sans for clean, readable body text
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textTertiary,
    height: 1.5,
  );

  // Buttons & Labels - Using Plus Jakarta Sans for UI elements
  static const TextStyle button = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textInverse,
    letterSpacing: 0.5,
  );

  static const TextStyle label = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
    letterSpacing: 0.2,
  );
  
  static const TextStyle caption = TextStyle(
    fontFamily: _sansSerifFont,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.textTertiary,
    letterSpacing: 0.4,
  );

  const AppTextStyles._();
}
