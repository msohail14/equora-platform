import '../../../core/models/user_role.dart';

class BookingData {
  UserRole? userRole; // Track which user role is booking
  String? bookingType; // 'coach', 'stable', 'rider'
  String? horseName;
  String? horseImage;
  String? coachName;
  String? coachImage;
  List<String>? coachSkills;
  DateTime? selectedDate;
  String? selectedTime;

  BookingData();
}
