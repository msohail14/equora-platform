import 'api_service.dart';

class StableService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getStables({int page = 1, int limit = 20, String? search}) async {
    final response = await _api.get('/stables/public', queryParameters: {
      'page': page,
      'limit': limit,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final data = response.data;
    if (data is Map && data.containsKey('stables')) return data['stables'] as List;
    if (data is List) return data;
    return [];
  }

  Future<Map<String, dynamic>> getStableById(int id) async {
    final response = await _api.get('/stables/public/$id');
    return response.data;
  }
}
