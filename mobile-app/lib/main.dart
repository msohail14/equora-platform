import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/booking_provider.dart';
import 'features/landing/screens/landing_screen.dart';

void main() {
  runApp(const EquestrianApp());
}

class EquestrianApp extends StatelessWidget {
  const EquestrianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BookingProvider(),
      child: MaterialApp(
        title: 'Equestrian',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const LandingScreen(),
      ),
    );
  }
}
