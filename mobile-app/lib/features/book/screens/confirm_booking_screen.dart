import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/providers/booking_provider.dart';

class ConfirmBookingScreen extends StatelessWidget {
  const ConfirmBookingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bookingData = Provider.of<BookingProvider>(context).bookingData;

    return AppScaffold(
      appBar: null,
      body: Column(
        children: [
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back),
                    color: AppColors.textPrimary,
                  ),
                  const Spacer(),
                  Text(
                    'Confirmation',
                    style: AppTextStyles.h3.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
              ),
            ),
          ),

          LinearProgressIndicator(
            value: 1.0,
            backgroundColor: AppColors.border,
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 4,
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  const SizedBox(height: AppSpacing.xl),

                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.calendar_today,
                      size: 36,
                      color: AppColors.primary,
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  Text(
                    'Confirm Session',
                    style: AppTextStyles.h1.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xxl),

                  Container(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadii.lg),
                      border: Border.all(color: AppColors.border, width: 1.5),
                    ),
                    child: Column(
                      children: [
                        _buildSummaryRow(
                          'Coach',
                          bookingData.coachName ?? 'N/A',
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        _buildSummaryRow(
                          'Horse',
                          bookingData.horseName ?? 'N/A',
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        _buildSummaryRow(
                          'Date',
                          bookingData.selectedDate != null
                              ? '${bookingData.selectedDate!.month}/${bookingData.selectedDate!.day}/${bookingData.selectedDate!.year}'
                              : 'N/A',
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        _buildSummaryRow(
                          'Time',
                          bookingData.selectedTime ?? 'N/A',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xxl),
                ],
              ),
            ),
          ),

          // Bottom button
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
                label: 'Confirm Booking',
                onPressed: () {
                  // Show success message
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Booking Confirmed!',
                            style: AppTextStyles.h3.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your session has been successfully scheduled.',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ],
                      ),
                      backgroundColor: AppColors.primary,
                      duration: const Duration(seconds: 3),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadii.md),
                      ),
                    ),
                  );

                  // Navigate back to the home dashboard
                  Future.delayed(const Duration(milliseconds: 500), () {
                    // Manually pop back to home screen
                    // Current: ConfirmBookingScreen
                    // Pop 1: SelectDateTimeScreen
                    // Pop 2: ChooseCoachScreen
                    // Pop 3: SelectHorseScreen
                    // Pop 4: BookRootScreen
                    // Result: Back at Home (RiderHomeScreen or CoachHomeScreen)

                    // Pop 4 times to get back to BookRootScreen, then pop once more to home
                    for (
                      int i = 0;
                      i < 5 && Navigator.of(context).canPop();
                      i++
                    ) {
                      Navigator.of(context).pop();
                    }
                  });
                },
                width: double.infinity,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
