import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../rider_home/widgets/home_bottom_nav.dart';
import '../../../core/models/user_role.dart';
import '../../../core/navigation/app_navigator.dart';
import '../../coach_home/widgets/coach_bottom_nav.dart';

class HorsesScreen extends StatelessWidget {
  final UserRole userRole;

  const HorsesScreen({super.key, required this.userRole});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: null,
      bottomNavigationBar: userRole == UserRole.rider
          ? HomeBottomNavBar(
              currentIndex: 2,
              onTap: (index) {
                if (index == 2) return;
                AppNavigator.navigateToTab(context, index, userRole);
              },
            )
          : CoachBottomNavBar(
              currentIndex: 2,
              onTap: (index) {
                if (index == 2) return;
                AppNavigator.navigateToTab(context, index, userRole);
              },
            ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Stables',
                      style: AppTextStyles.h1.copyWith(
                        color: AppColors.textPrimary,
                        fontSize: 32,
                      ),
                    ),
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            _buildStableSection('Elite Equestrian', 3, [
              _buildHorseCard(
                'Ferrari',
                'Show Jumping',
                'assets/images/rider_background.jpg',
              ),
              _buildHorseCard(
                'Bahr',
                'Jumping',
                'assets/images/close_up_of_a_brown__060c0827-BItHALfT.jpg',
              ),
              _buildHorseCard(
                'Beauty',
                'Dressage',
                'assets/images/beautiful_horse_stab_6be8615c-8mKWohjX.jpg',
              ),
            ]),

            _buildEmptyStableSection('Sawari Stables'),

            _buildEmptyStableSection('Alma Stables'),

            _buildEmptyStableSection('Ghazzawi Stables'),

            _buildStableSection('Moka Academy', 3, [
              _buildHorseCard(
                'Liva',
                'Dressage',
                'assets/images/rider_background.jpg',
              ),
              _buildHorseCard(
                'Sierra',
                'Jumping',
                'assets/images/close_up_of_a_brown__060c0827-BItHALfT.jpg',
              ),
              _buildHorseCard(
                'Zamzam',
                'Flatwork',
                'assets/images/beautiful_horse_stab_6be8615c-8mKWohjX.jpg',
              ),
            ]),

            _buildEmptyStableSection('Trio Ranch'),

            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildStableSection(String name, int horseCount, List<Widget> horses) {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        bottom: AppSpacing.xxl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name,
            style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            '$horseCount horses',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: AppSpacing.md,
            mainAxisSpacing: AppSpacing.md,
            childAspectRatio: 0.85,
            children: horses,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyStableSection(String name) {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        bottom: AppSpacing.xxl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name,
            style: AppTextStyles.h2.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: AppSpacing.lg),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
              child: Text(
                'No horses available',
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary.withOpacity(0.6),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorseCard(String name, String discipline, String imagePath) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadii.lg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppRadii.lg),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(imagePath, fit: BoxFit.cover),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                  stops: const [0.5, 1.0],
                ),
              ),
            ),
            Positioned(
              bottom: 12,
              left: 12,
              right: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: AppTextStyles.h3.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    discipline,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
