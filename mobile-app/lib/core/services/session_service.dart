import 'api_service.dart';

class SessionService {
  final ApiService _api = ApiService();

  Future<Map<String, dynamic>> createSession({
    required int courseId,
    required int coachId,
    required String sessionDate,
    required String startTime,
    required String endTime,
    required int durationMinutes,
    int? riderId,
  }) async {
    final response = await _api.post('/sessions', data: {
      'course_id': courseId,
      'coach_id': coachId,
      'session_date': sessionDate,
      'start_time': startTime,
      'end_time': endTime,
      'duration_minutes': durationMinutes,
      if (riderId != null) 'rider_id': riderId,
    });
    return response.data;
  }

  Future<List<dynamic>> getMySessions() async {
    final response = await _api.get('/sessions/my');
    final data = response.data;
    if (data is Map && data.containsKey('sessions')) return data['sessions'] as List;
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> cancelSession(int id, {String? reason}) async {
    final response = await _api.patch('/sessions/$id/cancel', data: {
      if (reason != null) 'cancel_reason': reason,
    });
    return response.data;
  }
}
