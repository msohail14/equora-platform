import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../coach_home/widgets/coach_bottom_nav.dart';
import '../widgets/course_card.dart';
import '../../../core/models/user_role.dart';
import '../../../core/navigation/app_navigator.dart';

class CoursesScreen extends StatelessWidget {
  final UserRole userRole;

  const CoursesScreen({super.key, required this.userRole});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: null,
      bottomNavigationBar: CoachBottomNavBar(
        currentIndex: 3,
        onTap: (index) {
          if (index == 3) return;
          AppNavigator.navigateToTab(context, index, userRole);
        },
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Courses',
                      style: AppTextStyles.h1.copyWith(
                        color: AppColors.textPrimary,
                        fontSize: 32,
                      ),
                    ),
                    // New button
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(AppRadii.md),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.add, color: Colors.white, size: 18),
                          const SizedBox(width: 4),
                          Text(
                            'New',
                            style: AppTextStyles.button.copyWith(fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Rider Focused
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Rider Focused',
                style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: CourseCard(
                category: 'Jumping',
                level: 'Advanced',
                title: 'Advanced Jumping Mechanics',
                description:
                    'Mastering the approach and landing for 1.2m+ obstacles.',
                duration: '6 Weeks',
                participants: 1,
                onTap: () {},
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Horse Focused
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Horse Focused',
                style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: CourseCard(
                category: 'Flatwork',
                level: 'Intermediate',
                title: 'Horse Conditioning & Fitness',
                description:
                    'Strengthen your horse\'s core and improve athletic...',
                duration: '5 Weeks',
                participants: 0,
                onTap: () {},
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Balanced
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Balanced',
                style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                children: [
                  CourseCard(
                    category: 'Dressage',
                    level: 'Beginner',
                    title: 'Dressage Fundamentals',
                    description: 'Building a solid foundation',
                    duration: '4 Weeks',
                    participants: 3,
                    onTap: () {},
                  ),
                  CourseCard(
                    category: 'Gymnastics',
                    level: 'Intermediate',
                    title: 'Gymnastics Training Series',
                    description: 'Progressive jumping',
                    duration: '6 Weeks',
                    participants: 2,
                    onTap: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }
}
