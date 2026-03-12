import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/constants/asset_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/providers/booking_provider.dart';
import '../widgets/booking_step_header.dart';
import '../widgets/coach_selection_card.dart';
import 'pick_time_screen.dart';
import '../../rider_home/widgets/home_bottom_nav.dart';

class ChooseCoachScreen extends StatefulWidget {
  const ChooseCoachScreen({super.key});

  @override
  State<ChooseCoachScreen> createState() => _ChooseCoachScreenState();
}

class _ChooseCoachScreenState extends State<ChooseCoachScreen> {
  String? selectedCoach;

  final List<Map<String, dynamic>> coaches = [
    {
      'name': 'James Blackwood',
      'bio': 'Specializing in advanced show jumping...',
      'skills': ['Show Jumping', 'Cross Country'],
      'image': AssetPaths.coachJames,
    },
    {
      'name': 'Sarah Jenkins',
      'bio': 'Dressage expert focusing on classical training...',
      'skills': ['Dressage', 'Flatwork'],
      'image': AssetPaths.coachSarah,
    },
    {
      'name': 'Michael Hassan',
      'bio': 'Gymnastics and fitness conditioning specialist.',
      'skills': ['Gymnastics', 'Cross Training'],
      'image': AssetPaths.userAvatar,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final bookingProvider = Provider.of<BookingProvider>(
      context,
      listen: false,
    );

    return AppScaffold(
      appBar: null,
      bottomNavigationBar: HomeBottomNavBar(
        currentIndex: 1,
        onTap: (index) {
          if (index == 0) Navigator.pop(context);
        },
      ),
      body: Column(
        children: [
          const BookingStepHeader(currentStep: 3),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Choose a Coach',
                    style: AppTextStyles.h1.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  ...coaches.map((coach) {
                    final isSelected = selectedCoach == coach['name'];

                    return CoachSelectionCard(
                      name: coach['name'],
                      bio: coach['bio'],
                      skills: List<String>.from(coach['skills']),
                      imageUrl: coach['image'],
                      isSelected: isSelected,
                      onTap: () {
                        setState(() {
                          selectedCoach = coach['name'];
                        });

                        bookingProvider.setCoach(
                          coach['name'],
                          coach['image'],
                          List<String>.from(coach['skills']),
                        );
                      },
                    );
                  }).toList(),

                  const SizedBox(height: AppSpacing.xxl),
                ],
              ),
            ),
          ),

          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: PrimaryButton(
                label: 'Continue',
                onPressed: selectedCoach != null
                    ? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const PickTimeScreen(),
                          ),
                        );
                      }
                    : null,
                width: double.infinity,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
