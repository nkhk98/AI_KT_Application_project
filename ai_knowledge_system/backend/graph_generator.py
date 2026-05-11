import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Gemini Client
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY")
)

GRAPH_PROMPT = """
You are an expert software architect AI.

Analyze the provided software documentation carefully.

Your task:

1. Identify ALL important application modules/components
2. Identify dependencies between modules
3. Generate 2-3 concise KT points for each module

IMPORTANT RULES:
- Use ONLY information from context
- Do NOT hallucinate modules
- Keep summaries concise
- Node ids must be lowercase
- Dependency direction matters
- Return ONLY valid JSON
- No markdown
- No explanations

Required Output Format like below example:

{
  "nodes": [
    {
      "id": "payment",
      "label": "Payment",
      "info": [
        "Handles Razorpay payments",
        "Processes secure checkout",
        "Triggers order creation"
      ]
    }
  ],

  "edges": [
    {
      "source": "cart",
      "target": "payment"
    }
  ]
}
"""


def generate_graph(context: str):

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",

            contents=f"""
            {GRAPH_PROMPT}

            DOCUMENTATION:
            {context}
            """
        )

        if not response.text:
            return {
                "nodes": [],
                "edges": []
            }

        text = response.text.strip()

        # Cleanup if Gemini returns markdown
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

        graph = json.loads(text)

        return graph

    except Exception as e:

        print(" Graph Generation Error:", str(e))

        return {
            "nodes": [],
            "edges": []
        }