import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/asset_paths.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../../../../core/widgets/section_title.dart';
import '../widgets/bottom_action_buttons.dart';
import '../widgets/coach_card.dart';
import '../widgets/discipline_card.dart';
import '../widgets/home_bottom_nav.dart';
import '../widgets/home_header.dart';
import '../widgets/next_session_card.dart';
import '../widgets/promo_tracking_banner.dart';
import '../widgets/published_session_card.dart';
import '../widgets/work_program_card.dart';
import '../../book/screens/book_root_screen.dart';
import '../../horses/screens/horses_screen.dart';
import '../../../core/utils/smooth_page_route.dart';
import '../../../core/models/user_role.dart';
import '../../../core/navigation/app_navigator.dart';

class RiderHomeScreen extends StatelessWidget {
  const RiderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = Responsive.width(context);

    return AppScaffold(
      appBar: null,
      bottomNavigationBar: HomeBottomNavBar(
        currentIndex: 0,
        onTap: (index) {
          if (index == 0) return;
          AppNavigator.navigateToTab(context, index, UserRole.rider);
        },
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: screenWidth * 0.128),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.lg),

            HomeHeader(
              userName: 'Abdul Mohsen',
              dateText: 'WEDNESDAY, JANUARY 21',
              onProfileTap: () {
                Navigator.push(
                  context,
                  SmoothPageRoute(
                    page: AppNavigator.getProfileScreen(UserRole.rider),
                  ),
                );
              },
            ),
            const SizedBox(height: AppSpacing.lg),

            const NextSessionCard(
              title: 'Jumping Training',
              subtitle: 'with Coach James',
              time: '5:18 PM',
              location: 'Main Arena',
            ),
            const SizedBox(height: AppSpacing.xl),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: SectionTitle(
                title: 'Latest published sessions',
                actionLabel: 'View All',
                onActionPressed: () {},
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              height: 250,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Row(
                  children: [
                    PublishedSessionCard(
                      title: 'The Crosses',
                      category: 'Jumping',
                      difficulty: 'Medium',
                      imagePath: AssetPaths.diagramJumpingMedium,
                      onTap: () {},
                    ),
                    const SizedBox(width: 16),
                    PublishedSessionCard(
                      title: 'Active Transition',
                      category: 'Dressage',
                      difficulty: 'Easy',
                      imagePath: AssetPaths.diagramDressageEasy,
                      onTap: () {},
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            const PromoTrackingBanner(),
            const SizedBox(height: AppSpacing.xl),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: const SectionTitle(title: 'Sessions by discipline'),
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              height: 190,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: 8,
                ),
                children: [
                  DisciplineCard(
                    title: 'Dressage',
                    imagePath: AssetPaths.photoDressage,
                    onTap: () {},
                  ),
                  DisciplineCard(
                    title: 'Jumping',
                    imagePath: AssetPaths.photoJumping,
                    onTap: () {},
                  ),
                  DisciplineCard(
                    title: 'Show',
                    imagePath: AssetPaths.photoDressage,
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: const SectionTitle(title: 'Work programmes'),
            ),
            const SizedBox(height: AppSpacing.sm),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Column(
                children: [
                  WorkProgramCard(
                    title: 'Strengthening your horse’s back – from the',
                    subtitle: 'Horse Focused',
                    imagePath: AssetPaths.photoProgram1,
                    onTap: () {},
                  ),
                  WorkProgramCard(
                    title: 'Improving groundwork for jumping',
                    subtitle: 'Balanced',
                    imagePath: AssetPaths.photoProgram2,
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: const SectionTitle(title: 'Recommended coaches'),
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              height: 240,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: 8,
                ),
                children: const [
                  CoachCard(
                    name: 'James Blackwood',
                    rating: 4.9,
                    imagePath: AssetPaths.coachJames,
                  ),
                  CoachCard(
                    name: 'Sarah Jenkins',
                    rating: 4.8,
                    imagePath: AssetPaths.coachSarah,
                  ),
                  CoachCard(
                    name: 'Michael Chen',
                    rating: 4.7,
                    imagePath: AssetPaths.userAvatar,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),

            // 8. Bottom Action Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: BottomActionButtons(
                onBookSessionPressed: () {
                  Navigator.push(
                    context,
                    SmoothPageRoute(
                      page: BookRootScreen(userRole: UserRole.rider),
                    ),
                  );
                },
                onMyStablesPressed: () {
                  Navigator.push(
                    context,
                    SmoothPageRoute(
                      page: HorsesScreen(userRole: UserRole.rider),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}
