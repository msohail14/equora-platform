import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class CourseCard extends StatelessWidget {
  final String category;
  final String level;
  final String title;
  final String description;
  final String duration;
  final int participants;
  final VoidCallback? onTap;

  const CourseCard({
    super.key,
    required this.category,
    required this.level,
    required this.title,
    required this.description,
    required this.duration,
    required this.participants,
    this.onTap,
  });

  Color _getCategoryColor() {
    switch (category.toLowerCase()) {
      case 'jumping':
        return const Color(0xFFE8F5E9);
      case 'flatwork':
        return const Color(0xFFFFF3E0);
      case 'dressage':
        return const Color(0xFFE3F2FD);
      case 'gymnastics':
        return const Color(0xFFF3E5F5);
      default:
        return AppColors.background;
    }
  }

  Color _getCategoryTextColor() {
    switch (category.toLowerCase()) {
      case 'jumping':
        return const Color(0xFF2E7D32);
      case 'flatwork':
        return const Color(0xFFE65100);
      case 'dressage':
        return const Color(0xFF1565C0);
      case 'gymnastics':
        return const Color(0xFF6A1B9A);
      default:
        return AppColors.textPrimary;
    }
  }

  Color _getLevelColor() {
    switch (level.toLowerCase()) {
      case 'advanced':
        return const Color(0xFFFFEBEE);
      case 'intermediate':
        return const Color(0xFFFFF3E0);
      case 'beginner':
        return const Color(0xFFE8F5E9);
      default:
        return AppColors.background;
    }
  }

  Color _getLevelTextColor() {
    switch (level.toLowerCase()) {
      case 'advanced':
        return const Color(0xFFC62828);
      case 'intermediate':
        return const Color(0xFFEF6C00);
      case 'beginner':
        return const Color(0xFF2E7D32);
      default:
        return AppColors.textPrimary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadii.lg),
        elevation: 1,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tags
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(),
                        borderRadius: BorderRadius.circular(AppRadii.sm),
                      ),
                      child: Text(
                        category.toUpperCase(),
                        style: AppTextStyles.caption.copyWith(
                          color: _getCategoryTextColor(),
                          fontWeight: FontWeight.w600,
                          fontSize: 10,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getLevelColor(),
                        borderRadius: BorderRadius.circular(AppRadii.sm),
                      ),
                      child: Text(
                        level.toUpperCase(),
                        style: AppTextStyles.caption.copyWith(
                          color: _getLevelTextColor(),
                          fontWeight: FontWeight.w600,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: AppSpacing.md),
                
                // Title
                Text(
                  title,
                  style: AppTextStyles.h3.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                
                const SizedBox(height: AppSpacing.sm),
                
                // Description
                Text(
                  description,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: AppSpacing.md),
                
                // Duration & Participants
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      duration,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.lg),
                    Icon(
                      Icons.people_outline,
                      size: 16,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$participants',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
