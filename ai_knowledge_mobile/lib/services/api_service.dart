import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static Future getQuiz() async {
    final response = await http.get(
      Uri.parse("http://192.168.0.101:3000/generate-quiz"),
    );
    return jsonDecode(response.body);
  }
}
