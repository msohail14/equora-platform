import 'api_service.dart';

class DisciplineService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getDisciplines() async {
    final response = await _api.get('/disciplines/public');
    final data = response.data;
    if (data is Map && data.containsKey('disciplines')) return data['disciplines'] as List;
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> getDisciplineById(int id) async {
    final response = await _api.get('/disciplines/public/$id');
    return response.data;
  }
}
