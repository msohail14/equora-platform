import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/booking_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/landing/screens/landing_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/rider_home/screens/rider_home_screen.dart';
import 'features/coach_home/screens/coach_home_screen.dart';

void main() {
  runApp(const EquestrianApp());
}

class EquestrianApp extends StatelessWidget {
  const EquestrianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
      ],
      child: MaterialApp(
        title: 'Equestrian',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AppEntryPoint(),
      ),
    );
  }
}

class AppEntryPoint extends StatefulWidget {
  const AppEntryPoint({super.key});

  @override
  State<AppEntryPoint> createState() => _AppEntryPointState();
}

class _AppEntryPointState extends State<AppEntryPoint> {
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final auth = context.read<AuthProvider>();
    await auth.checkAuthStatus();
    if (mounted) {
      setState(() => _isChecking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoggedIn && auth.user != null) {
          final role = auth.user!['role'];
          if (role == 'coach') return const CoachHomeScreen();
          return const RiderHomeScreen();
        }
        return const LandingScreen();
      },
    );
  }
}
