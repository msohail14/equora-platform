import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/asset_paths.dart';
import '../../../../core/utils/responsive.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../../../../core/widgets/section_title.dart';
import '../../../../core/services/discipline_service.dart';
import '../../../../core/services/coach_service.dart';
import '../../../../core/services/session_service.dart';
import '../../auth/providers/auth_provider.dart';
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

class RiderHomeScreen extends StatefulWidget {
  const RiderHomeScreen({super.key});

  @override
  State<RiderHomeScreen> createState() => _RiderHomeScreenState();
}

class _RiderHomeScreenState extends State<RiderHomeScreen> {
  List<dynamic> _disciplines = [];
  List<dynamic> _coaches = [];
  List<dynamic> _sessions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        DisciplineService().getDisciplines().catchError((_) => <dynamic>[]),
        CoachService().getCoaches().catchError((_) => <dynamic>[]),
        SessionService().getMySessions().catchError((_) => <dynamic>[]),
      ]);
      if (mounted) {
        setState(() {
          _disciplines = results[0];
          _coaches = results[1];
          _sessions = results[2];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = Responsive.width(context);
    final auth = context.watch<AuthProvider>();
    final userName = auth.user != null
        ? '${auth.user!['first_name'] ?? ''} ${auth.user!['last_name'] ?? ''}'.trim()
        : 'Rider';
    final dateText = DateFormat('EEEE, MMMM d').format(DateTime.now()).toUpperCase();

    return AppScaffold(
      appBar: null,
      bottomNavigationBar: HomeBottomNavBar(
        currentIndex: 0,
        onTap: (index) {
          if (index == 0) return;
          AppNavigator.navigateToTab(context, index, UserRole.rider);
        },
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.only(bottom: screenWidth * 0.128),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.lg),
              HomeHeader(
                userName: userName.isEmpty ? 'Rider' : userName,
                dateText: dateText,
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

              if (_sessions.isNotEmpty)
                NextSessionCard(
                  title: _sessions.first['course']?['title'] ?? 'Upcoming Session',
                  subtitle: 'with ${_sessions.first['coach']?['first_name'] ?? 'Coach'}',
                  time: _sessions.first['start_time'] ?? '',
                  location: _sessions.first['course']?['stable']?['name'] ?? 'Arena',
                )
              else
                const NextSessionCard(
                  title: 'No upcoming sessions',
                  subtitle: 'Book a session to get started',
                  time: '',
                  location: '',
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
                child: _disciplines.isNotEmpty
                    ? ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
                        itemCount: _disciplines.length,
                        itemBuilder: (context, index) {
                          final d = _disciplines[index];
                          return DisciplineCard(
                            title: d['name'] ?? 'Discipline',
                            imagePath: AssetPaths.photoDressage,
                            onTap: () {},
                          );
                        },
                      )
                    : ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
                        children: [
                          DisciplineCard(title: 'Dressage', imagePath: AssetPaths.photoDressage, onTap: () {}),
                          DisciplineCard(title: 'Jumping', imagePath: AssetPaths.photoJumping, onTap: () {}),
                          DisciplineCard(title: 'Show', imagePath: AssetPaths.photoDressage, onTap: () {}),
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
                      title: 'Strengthening your horse\'s back – from the',
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
                child: _coaches.isNotEmpty
                    ? ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
                        itemCount: _coaches.length > 5 ? 5 : _coaches.length,
                        itemBuilder: (context, index) {
                          final c = _coaches[index];
                          return CoachCard(
                            name: '${c['first_name'] ?? ''} ${c['last_name'] ?? ''}'.trim(),
                            rating: 4.5,
                            imagePath: AssetPaths.userAvatar,
                          );
                        },
                      )
                    : ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 8),
                        children: const [
                          CoachCard(name: 'James Blackwood', rating: 4.9, imagePath: AssetPaths.coachJames),
                          CoachCard(name: 'Sarah Jenkins', rating: 4.8, imagePath: AssetPaths.coachSarah),
                        ],
                      ),
              ),
              const SizedBox(height: AppSpacing.xl),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: BottomActionButtons(
                  onBookSessionPressed: () {
                    Navigator.push(
                      context,
                      SmoothPageRoute(page: BookRootScreen(userRole: UserRole.rider)),
                    );
                  },
                  onMyStablesPressed: () {
                    Navigator.push(
                      context,
                      SmoothPageRoute(page: HorsesScreen(userRole: UserRole.rider)),
                    );
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}
