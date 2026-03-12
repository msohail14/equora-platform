import 'package:flutter/material.dart';

class Responsive {
  static double width(BuildContext context) {
    return MediaQuery.of(context).size.width;
  }

  static double height(BuildContext context) {
    return MediaQuery.of(context).size.height;
  }

  static bool isMobile(BuildContext context) {
    return MediaQuery.of(context).size.width < 600;
  }

  static bool isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600 &&
        MediaQuery.of(context).size.width < 1024;
  }

  static bool isDesktop(BuildContext context) {
    return MediaQuery.of(context).size.width >= 1024;
  }

  static double sp(BuildContext context, double size) {
    double baseWidth = 375.0;
    return size * (MediaQuery.of(context).size.width / baseWidth);
  }

  static double hp(BuildContext context, double size) {
    double baseHeight = 812.0;
    return size * (MediaQuery.of(context).size.height / baseHeight);
  }
}
