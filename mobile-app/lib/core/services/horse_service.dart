import 'api_service.dart';

class HorseService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getHorses({int page = 1, int limit = 20, int? stableId}) async {
    final response = await _api.get('/horses/public', queryParameters: {
      'page': page,
      'limit': limit,
      if (stableId != null) 'stable_id': stableId,
    });
    final data = response.data;
    if (data is Map && data.containsKey('horses')) return data['horses'] as List;
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> getHorseById(int id) async {
    final response = await _api.get('/horses/public/$id');
    return response.data;
  }
}
