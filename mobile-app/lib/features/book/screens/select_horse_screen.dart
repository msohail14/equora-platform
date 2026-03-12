import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/providers/booking_provider.dart';
import '../widgets/booking_step_header.dart';
import '../widgets/horse_card.dart';
import 'choose_coach_screen.dart';
import '../../rider_home/widgets/home_bottom_nav.dart';

class SelectHorseScreen extends StatefulWidget {
  const SelectHorseScreen({super.key});

  @override
  State<SelectHorseScreen> createState() => _SelectHorseScreenState();
}

class _SelectHorseScreenState extends State<SelectHorseScreen> {
  String? selectedHorse;

  final List<Map<String, String>> horses = [
    {
      'name': 'Ferrari',
      'discipline': 'Show Jumping',
      'image': 'assets/images/rider_background.jpg',
    },
    {
      'name': 'Bahr',
      'discipline': 'Jumping',
      'image': 'assets/images/close_up_of_a_brown__060c0827-BItHALfT.jpg',
    },
    {
      'name': 'Beauty',
      'discipline': 'Dressage',
      'image': 'assets/images/dresseage_hourse_photo.png',
    },
    {
      'name': 'Liva',
      'discipline': 'Dressage',
      'image': 'assets/images/work_programm_hourse_photo.avif',
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
          const BookingStepHeader(currentStep: 2),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Select your horse',
                    style: AppTextStyles.h1.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: AppSpacing.md,
                          mainAxisSpacing: AppSpacing.md,
                          childAspectRatio: 0.75,
                        ),
                    itemCount: horses.length,
                    itemBuilder: (context, index) {
                      final horse = horses[index];
                      final isSelected = selectedHorse == horse['name'];

                      return HorseCard(
                        name: horse['name']!,
                        discipline: horse['discipline']!,
                        imageUrl: horse['image']!,
                        isSelected: isSelected,
                        onTap: () {
                          setState(() {
                            selectedHorse = horse['name'];
                          });

                          bookingProvider.setHorse(
                            horse['name']!,
                            horse['image']!,
                          );

                          Future.delayed(const Duration(milliseconds: 300), () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const ChooseCoachScreen(),
                              ),
                            );
                          });
                        },
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
