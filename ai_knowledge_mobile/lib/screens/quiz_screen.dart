import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'result_screen.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});
  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List questions = [];

  int currentQuestion = 0;
  int score = 0;
  bool submitted = false;
  bool loading = true;
  String selectedOption = "";

  @override
  void initState() {
    super.initState();
    fetchQuiz();
  }

  Future<void> fetchQuiz() async {
    try {
      final response = await Dio().get(
        "http://192.168.0.102:3000/generate-quiz",
      );

      print("RESPONSE:");
      print(response.data);

      if (response.data["questions"] != null) {
        setState(() {
          questions = response.data["questions"];

          loading = false;
        });
      } else {
        print("No questions key");
        setState(() {
          loading = false;
        });
      }
    } catch (e) {
      print("ERROR:");
      print(e);
      setState(() {
        loading = false;
      });
    }
  }

  void checkAnswer(String selected) {
    setState(() {
      submitted = true;
      selectedOption = selected;
    });
    if (selected == questions[currentQuestion]["answer"]) {
      score++;
    }

    if (currentQuestion < questions.length - 1) {
      setState(() {
        currentQuestion++;
      });
    } else {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Quiz Completed"),
          content: Text("Score: $score/${questions.length}"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (questions.isEmpty) {
      return const Scaffold(body: Center(child: Text("No quiz available")));
    }

    final q = questions[currentQuestion];

    return Scaffold(
      appBar: AppBar(title: const Text("Daily AI Quiz")),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [
            Text(
              q["question"],
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 20),

            ...q["options"].map<Widget>((option) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),

                width: double.infinity,

                child: ElevatedButton(
                  onPressed: submitted ? null : () => checkAnswer(option),

                  child: Text(option),
                ),
              );
            }).toList(),

            const SizedBox(height: 20),

            if (submitted)
              ElevatedButton(
                onPressed: () {
                  if (currentQuestion < questions.length - 1) {
                    setState(() {
                      currentQuestion++;

                      submitted = false;

                      selectedOption = "";
                    });
                  } else {
                    Navigator.push(
                      context,

                      MaterialPageRoute(
                        builder: (_) =>
                            ResultScreen(score: score, total: questions.length),
                      ),
                    );
                  }
                },

                child: const Text("Next"),
              ),
          ],
        ),
      ),
    );
  }
}
