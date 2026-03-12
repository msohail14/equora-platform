import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/providers/booking_provider.dart';
import '../widgets/booking_step_header.dart';
import '../widgets/booking_option_card.dart';
import 'select_horse_screen.dart';
import '../../rider_home/widgets/home_bottom_nav.dart';
import '../../coach_home/widgets/coach_bottom_nav.dart';
import '../../../core/models/user_role.dart';
import '../../../core/navigation/app_navigator.dart';

class BookRootScreen extends StatefulWidget {
  final UserRole userRole;

  const BookRootScreen({super.key, required this.userRole});

  @override
  State<BookRootScreen> createState() => _BookRootScreenState();
}

class _BookRootScreenState extends State<BookRootScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().setUserRole(widget.userRole);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bookingProvider = context.read<BookingProvider>();

    return AppScaffold(
      appBar: null,
      bottomNavigationBar: widget.userRole == UserRole.rider
          ? HomeBottomNavBar(
              currentIndex: 1,
              onTap: (index) {
                if (index == 1) return;
                AppNavigator.navigateToTab(context, index, widget.userRole);
              },
            )
          : CoachBottomNavBar(
              currentIndex: 1,
              onTap: (index) {
                if (index == 1) return;
                AppNavigator.navigateToTab(context, index, widget.userRole);
              },
            ),
      body: Column(
        children: [
          const BookingStepHeader(currentStep: 1),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'What would you like to book?',
                    style: AppTextStyles.h1.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  BookingOptionCard(
                    icon: Icons.person,
                    title: 'Coach Session',
                    subtitle: 'One-on-one training',
                    iconBackgroundColor: AppColors.primary,
                    onTap: () {
                      bookingProvider.setBookingType('coach');
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const SelectHorseScreen(),
                        ),
                      );
                    },
                  ),

                  BookingOptionCard(
                    icon: Icons.home_outlined,
                    title: 'Stable Time',
                    subtitle: 'Arena usage',
                    iconBackgroundColor: AppColors.primary,
                    onTap: () {
                      bookingProvider.setBookingType('stable');
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const SelectHorseScreen(),
                        ),
                      );
                    },
                  ),

                  BookingOptionCard(
                    icon: Icons.group,
                    title: 'Rider Training',
                    subtitle: 'Group sessions',
                    iconBackgroundColor: AppColors.primary,
                    onTap: () {
                      bookingProvider.setBookingType('rider');
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const SelectHorseScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
