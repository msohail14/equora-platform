import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/asset_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../widgets/coach_bottom_nav.dart';
import '../widgets/schedule_card.dart';
import '../widgets/quick_action_card.dart';
import '../../../core/models/user_role.dart';
import '../../../core/navigation/app_navigator.dart';

class CoachHomeScreen extends StatelessWidget {
  const CoachHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = Responsive.width(context);

    return AppScaffold(
      appBar: null,
      bottomNavigationBar: CoachBottomNavBar(
        currentIndex: 0,
        onTap: (index) {
          if (index == 0) return;
          AppNavigator.navigateToTab(context, index, UserRole.coach);
        },
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: screenWidth * 0.064),

            Padding(
              padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.064),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'THURSDAY, JANUARY 22',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.textTertiary,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      RichText(
                        text: TextSpan(
                          text: 'Welcome back\n',
                          style: AppTextStyles.h2.copyWith(
                            fontWeight: FontWeight.w400,
                            color: AppColors.textSecondary,
                          ),
                          children: [
                            TextSpan(
                              text: 'James Blackwood',
                              style: AppTextStyles.h2.copyWith(
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        SmoothPageRoute(
                          page: AppNavigator.getProfileScreen(UserRole.coach),
                        ),
                      );
                    },
                    child: CircleAvatar(
                      radius: 24,
                      backgroundImage: const AssetImage(AssetPaths.userAvatar),
                      backgroundColor: AppColors.surfaceWarm,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Choose your session of the day with your horse!',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Today\'s Schedule',
                style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Column(
                children: [
                  ScheduleCard(
                    time: '10:00',
                    period: 'AM',
                    title: 'Private Lesson',
                    studentName: 'Eleanor',
                    horseName: 'Midnight Dancer',
                    onTap: () {},
                  ),
                  ScheduleCard(
                    time: '11:00',
                    period: 'AM',
                    title: 'Private Lesson',
                    studentName: 'Eleanor',
                    horseName: 'Midnight Dancer',
                    onTap: () {},
                  ),
                  ScheduleCard(
                    time: '12:00',
                    period: 'AM',
                    title: 'Private Lesson',
                    studentName: 'Eleanor',
                    horseName: 'Midnight Dancer',
                    onTap: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                'Quick Management',
                style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Row(
                children: [
                  QuickActionCard(
                    icon: Icons.add,
                    label: 'Create Course',
                    isDashed: true,
                    onTap: () {},
                  ),
                  const SizedBox(width: AppSpacing.md),
                  QuickActionCard(
                    icon: Icons.person_outline,
                    label: 'Rider List',
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
