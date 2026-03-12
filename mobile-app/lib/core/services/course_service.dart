import 'api_service.dart';

class CourseService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getCourses({int page = 1, int limit = 20, String? search}) async {
    final response = await _api.get('/courses', queryParameters: {
      'page': page,
      'limit': limit,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final data = response.data;
    if (data is Map && data.containsKey('courses')) return data['courses'] as List;
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> getCourseById(int id) async {
    final response = await _api.get('/courses/$id');
    return response.data;
  }

  Future<Map<String, dynamic>> enroll(int courseId) async {
    final response = await _api.post('/enrollments', data: {
      'course_id': courseId,
    });
    return response.data;
  }

  Future<List<dynamic>> getMyEnrollments() async {
    final response = await _api.get('/enrollments/my');
    final data = response.data;
    if (data is Map && data.containsKey('enrollments')) return data['enrollments'] as List;
    if (data is List) return data;
    return [];
  }
}
