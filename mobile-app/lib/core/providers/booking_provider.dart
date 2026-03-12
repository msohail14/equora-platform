import 'package:flutter/material.dart';
import '../../features/book/models/booking_data.dart';
import '../models/user_role.dart';

class BookingProvider extends ChangeNotifier {
  BookingData _bookingData = BookingData();

  BookingData get bookingData => _bookingData;

  void setUserRole(UserRole role) {
    _bookingData.userRole = role;
    notifyListeners();
  }

  void setBookingType(String type) {
    _bookingData.bookingType = type;
    notifyListeners();
  }

  void setHorse(String name, String image) {
    _bookingData.horseName = name;
    _bookingData.horseImage = image;
    notifyListeners();
  }

  void setCoach(String name, String image, List<String> skills) {
    _bookingData.coachName = name;
    _bookingData.coachImage = image;
    _bookingData.coachSkills = skills;
    notifyListeners();
  }

  void setDateTime(DateTime date, String time) {
    _bookingData.selectedDate = date;
    _bookingData.selectedTime = time;
    notifyListeners();
  }

  void reset() {
    _bookingData = BookingData();
    notifyListeners();
  }
}
