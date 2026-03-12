import 'api_service.dart';

class CoachService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getCoaches({int page = 1, int limit = 20, String? search}) async {
    final response = await _api.get('/coaches/public', queryParameters: {
      'page': page,
      'limit': limit,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final data = response.data;
    if (data is Map && data.containsKey('coaches')) return data['coaches'] as List;
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> getCoachById(int id) async {
    final response = await _api.get('/coaches/public/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> getCoachSummary(int id) async {
    final response = await _api.get('/coaches/public/$id/summary');
    return response.data;
  }

  Future<List<dynamic>> getCoachCourses(int coachId) async {
    final response = await _api.get('/coaches/public/$coachId/courses');
    final data = response.data;
    if (data is Map && data.containsKey('courses')) return data['courses'] as List;
    if (data is List) return data;
    return [];
  }

  Future<List<dynamic>> getCoachUpcomingAvailability(int coachId) async {
    final response = await _api.get('/coaches/$coachId/upcoming-availability');
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('slots')) return data['slots'] as List;
    return [];
  }

  Future<List<dynamic>> getCoachReviews(int coachId) async {
    final response = await _api.get('/coach-reviews/public/coach/$coachId');
    final data = response.data;
    if (data is Map && data.containsKey('reviews')) return data['reviews'] as List;
    if (data is List) return data;
    return [];
  }
}
