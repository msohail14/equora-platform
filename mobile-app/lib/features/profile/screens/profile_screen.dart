import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../rider_home/widgets/home_bottom_nav.dart';
import '../../coach_home/widgets/coach_bottom_nav.dart';
import '../../landing/screens/landing_screen.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/models/user_role.dart';
import '../../../core/navigation/app_navigator.dart';

class ProfileScreen extends StatelessWidget {
  final String userName;
  final String userRole;
  final String avatarPath;

  const ProfileScreen({
    super.key,
    required this.userName,
    required this.userRole,
    required this.avatarPath,
  });

  @override
  Widget build(BuildContext context) {
    final UserRole role = userRole == 'Rider' ? UserRole.rider : UserRole.coach;

    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final displayName = auth.user != null
            ? '${auth.user!['first_name'] ?? ''} ${auth.user!['last_name'] ?? ''}'.trim()
            : userName;
        final displayRole = auth.user != null
            ? (auth.user!['role'] as String?)?.replaceFirst(
                auth.user!['role'][0], auth.user!['role'][0].toUpperCase()) ?? userRole
            : userRole;

        return AppScaffold(
          appBar: null,
          backgroundColor: AppColors.background,
          bottomNavigationBar: role == UserRole.rider
              ? HomeBottomNavBar(
                  currentIndex: 3,
                  onTap: (index) {
                    if (index == 3) return;
                    AppNavigator.navigateToTab(context, index, role);
                  },
                )
              : CoachBottomNavBar(
                  currentIndex: 4,
                  onTap: (index) {
                    if (index == 4) return;
                    AppNavigator.navigateToTab(context, index, role);
                  },
                ),
          body: SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: AppSpacing.xxl),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    children: [
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 4),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                          color: AppColors.primary.withOpacity(0.2),
                        ),
                        child: ClipOval(
                          child: auth.user?['profile_picture_url'] != null
                              ? Image.network(
                                  auth.user!['profile_picture_url'],
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Icon(
                                    Icons.person,
                                    size: 60,
                                    color: AppColors.primary,
                                  ),
                                )
                              : Icon(
                                  Icons.person,
                                  size: 60,
                                  color: AppColors.primary,
                                ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text(
                        displayName.isEmpty ? 'User' : displayName,
                        style: AppTextStyles.h1.copyWith(
                          color: AppColors.textPrimary,
                          fontSize: 28,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        displayRole,
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (auth.user?['email'] != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          auth.user!['email'],
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadii.lg),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _buildMenuItem(
                        icon: Icons.history,
                        label: 'Booking History',
                        onTap: () {},
                      ),
                      Divider(height: 1, color: AppColors.border, indent: 60),
                      _buildMenuItem(
                        icon: Icons.emoji_events_outlined,
                        label: 'Achievements',
                        onTap: () {},
                      ),
                      Divider(height: 1, color: AppColors.border, indent: 60),
                      _buildMenuItem(
                        icon: Icons.payment,
                        label: 'Payment & Subscription',
                        onTap: () {},
                      ),
                      Divider(height: 1, color: AppColors.border, indent: 60),
                      _buildMenuItem(
                        icon: Icons.settings_outlined,
                        label: 'Settings',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                  child: Material(
                    color: const Color(0xFFE74C3C),
                    borderRadius: BorderRadius.circular(AppRadii.lg),
                    child: InkWell(
                      onTap: () async {
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(
                              builder: (context) => const LandingScreen(),
                            ),
                            (route) => false,
                          );
                        }
                      },
                      borderRadius: BorderRadius.circular(AppRadii.lg),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.logout, color: Colors.white, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Log Out',
                              style: AppTextStyles.button.copyWith(
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xxl),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.lg,
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.textSecondary, size: 24),
              const SizedBox(width: AppSpacing.lg),
              Text(
                label,
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
