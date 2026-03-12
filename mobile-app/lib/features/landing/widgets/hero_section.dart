import 'package:flutter/material.dart';
import '../../../../core/constants/asset_paths.dart';
import '../../../../core/theme/app_colors.dart';

class HeroSection extends StatelessWidget {
  const HeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit
          .expand, // Ensures the stack fills the parent (which should be flexible)
      children: [
        // 1. Background Image (Full Bleed)
        Image.asset(
          AssetPaths.riderBackground,
          fit: BoxFit.cover,
          alignment:
              Alignment.topCenter, // Focus on upper part like the screenshot
        ),

        // 2. Gradient Overlay (Dark GreenFade)
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  AppColors.primaryDark.withOpacity(0.0), // Start transparent
                  AppColors.primaryDark.withOpacity(0.4), // Mid darkness
                  AppColors.primaryDark.withOpacity(
                    0.95,
                  ), // Solid dark at bottom
                ],
                stops: const [
                  0.0,
                  0.4,
                  0.7,
                  1.0,
                ], // Adjusted stops for smoother text readability
              ),
            ),
          ),
        ),
      ],
    );
  }
}
