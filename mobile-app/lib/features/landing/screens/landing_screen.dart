import 'package:flutter/material.dart';
import '../../../../core/utils/responsive.dart';
import '../../auth/screens/login_screen.dart';
import '../widgets/hero_section.dart';
import '../widgets/role_selection_card.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = Responsive.width(context);
    final screenHeight = Responsive.height(context);

    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: HeroSection()),
          SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                screenWidth * 0.064,
                screenHeight * 0.074,
                screenWidth * 0.064,
                24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Spacer(),
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: const Text(
                      'Premium Equestrian Management',
                      style: TextStyle(
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const Text(
                    'Equestrian',
                    style: TextStyle(
                      fontFamily: 'LibreBaskerville',
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.1,
                      letterSpacing: 0,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: screenWidth * 0.85,
                    child: const Text(
                      'Manage your stable, bookings, and training with elegance and ease.',
                      style: TextStyle(
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 18,
                        fontWeight: FontWeight.w300,
                        color: Color(0xCCFFFFFF),
                        height: 1.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  RoleSelectionCard(
                    title: 'Sign In',
                    subtitle: 'Already have an account',
                    icon: Icons.login,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LoginScreen(),
                        ),
                      );
                    },
                  ),
                  RoleSelectionCard(
                    title: 'Create Account',
                    subtitle: 'Join as a Rider or Coach',
                    icon: Icons.person_add_outlined,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LoginScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
