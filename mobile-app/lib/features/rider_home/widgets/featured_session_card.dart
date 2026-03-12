import 'package:flutter/material.dart';

class FeaturedSessionCard extends StatelessWidget {
  final String imageUrl;
  final String timeLabel;
  final String title;
  final String subtitle;
  final String location;
  final VoidCallback? onTap;
  final double height;
  final BorderRadius borderRadius;
  final Color primaryGreen;

  const FeaturedSessionCard({
    super.key,
    required this.imageUrl,
    required this.timeLabel,
    required this.title,
    required this.subtitle,
    required this.location,
    this.onTap,
    this.height = 180.0,
    this.borderRadius = const BorderRadius.all(Radius.circular(24.0)),
    this.primaryGreen = const Color(0xFF1A3B34), // Deep green
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: height,
        margin: const EdgeInsets.symmetric(horizontal: 20.0),
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          // Soft shadow for elevation and depth
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 20.0,
              spreadRadius: 2.0,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: borderRadius,
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // LAYER 1: Background Image (left side, ~45% width)
              _BackgroundImageLayer(
                imageUrl: imageUrl,
                primaryGreen: primaryGreen,
              ),

              // LAYER 2: Gradient Scrim Overlay (improves text contrast)
              _GradientOverlayLayer(primaryGreen: primaryGreen),

              // LAYER 3: Foreground Content (text + icons)
              _ContentLayer(
                timeLabel: timeLabel,
                title: title,
                subtitle: subtitle,
                location: location,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BackgroundImageLayer extends StatelessWidget {
  final String imageUrl;
  final Color primaryGreen;

  const _BackgroundImageLayer({
    required this.imageUrl,
    required this.primaryGreen,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Left side: Image (45% width)
        Expanded(
          flex: 45,
          child: Image.asset(
            imageUrl,
            fit: BoxFit.cover,
            height: double.infinity,
          ),
        ),
        // Right side: Solid green background (55% width)
        Expanded(flex: 55, child: Container(color: primaryGreen)),
      ],
    );
  }
}

class _GradientOverlayLayer extends StatelessWidget {
  final Color primaryGreen;

  const _GradientOverlayLayer({required this.primaryGreen});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            primaryGreen.withOpacity(0.85),
            primaryGreen.withOpacity(0.65),
            primaryGreen.withOpacity(0.45),
          ],
          stops: const [0.0, 0.5, 1.0],
        ),
      ),
    );
  }
}

class _ContentLayer extends StatelessWidget {
  final String timeLabel;
  final String title;
  final String subtitle;
  final String location;

  const _ContentLayer({
    required this.timeLabel,
    required this.title,
    required this.subtitle,
    required this.location,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      // Comfortable padding from edges (20px horizontal, 24px vertical)
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Time pill at the top
          _TimePill(timeLabel: timeLabel),

          const SizedBox(height: 16.0),

          // Session title (large, bold, serif)
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'LibreBaskerville',
              fontSize: 24.0,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              height: 1.2,
            ),
          ),

          const SizedBox(height: 6.0),

          // Subtitle (smaller, light opacity)
          Text(
            subtitle,
            style: TextStyle(
              fontFamily: 'PlusJakartaSans',
              fontSize: 15.0,
              fontWeight: FontWeight.w400,
              color: Colors.white.withOpacity(0.75),
            ),
          ),

          const SizedBox(height: 14.0),

          // Location row with pin icon
          Row(
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 16.0,
                color: Colors.white.withOpacity(0.7),
              ),
              const SizedBox(width: 6.0),
              Text(
                location,
                style: TextStyle(
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13.0,
                  fontWeight: FontWeight.w400,
                  color: Colors.white.withOpacity(0.7),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Time Pill Component
/// Rounded capsule with semi-transparent background
/// Contains clock icon + time text
/// Purpose: highlight the session time in a visually distinct way
class _TimePill extends StatelessWidget {
  final String timeLabel;

  const _TimePill({required this.timeLabel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 8.0),
      decoration: BoxDecoration(
        // Semi-transparent white background for glassmorphism effect
        color: Colors.white.withOpacity(0.18),
        borderRadius: BorderRadius.circular(999.0), // Fully rounded capsule
        border: Border.all(color: Colors.white.withOpacity(0.12), width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.access_time_rounded,
            size: 16.0,
            color: Colors.white.withOpacity(0.95),
          ),
          const SizedBox(width: 8.0),
          Text(
            timeLabel,
            style: TextStyle(
              fontFamily: 'PlusJakartaSans',
              fontSize: 13.0,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.95),
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
