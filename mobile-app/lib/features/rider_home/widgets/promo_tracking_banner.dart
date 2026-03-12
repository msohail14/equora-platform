import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../../../core/widgets/rounded_card.dart';

class PromoTrackingBanner extends StatelessWidget {
  const PromoTrackingBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return RoundedCard(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      color: const Color(0xFFF2EFE9), // Light beige specified
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFeatureRow(Icons.check_circle_outline, 'Your progress tracked automatically'),
          const SizedBox(height: AppSpacing.sm),
          _buildFeatureRow(Icons.check_circle_outline, 'And zero ads!'),
          const SizedBox(height: AppSpacing.lg),
          PrimaryButton(
            label: 'Activate my personalized tracking',
            onPressed: () {},
            width: double.infinity,
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppColors.secondary, // Gold/Bronze color
        ),
        const SizedBox(width: AppSpacing.sm),
        Text(
          text,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
