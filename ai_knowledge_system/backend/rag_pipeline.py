import os
from google import genai
from dotenv import load_dotenv
from retriever import retrieve_docs

load_dotenv()

api_key = os.environ.get("GEMINI_API_KEY")

# The Client uses your global GEMINI_API_KEY
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def rewrite_query(query: str):
    prompt = f"""
        Rewrite the user query into 3 clearer and more specific variations.

        User Query: {query}

        Return as a list.
        """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    if response.text:
        queries = []

        for line in response.text.split("\n"):
            line = line.strip()

            if not line:
                continue

            # remove numbering like "1. "
            if line[0].isdigit():
                line = line.split(".", 1)[-1].strip()

            # remove quotes
            line = line.strip('"')

            queries.append(line)
        return queries
    return [query]

def generate_answer(query: str):
    # 1. Retrieve the documentation context
    queries = rewrite_query(query)

    all_docs = []
    for q in queries:
        docs = retrieve_docs(q)
        all_docs.extend(docs)

    unique_docs = list({doc.page_content: doc for doc in all_docs}.values())
    docs = unique_docs

    print("\n Rewritten Queries:", queries)
    print(" Total docs after merge:", len(docs))

    print("\n Retrieved Docs:")
    for d in docs:
        print("Metadata:", d.metadata)
        print("Content:", d.page_content[:100])
        print("------")
    
    context = "\n\n".join([doc.page_content for doc in docs])

    # 2. Attempt to generate the answer
    try:
        # Use the 2026 stable model: gemini-2.5-flash
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config={
                "system_instruction": (
                    "You are an AI assistant for software testing.\n\n"

                    "STRICT RULES:\n"
                    "- Use ONLY the given context\n"
                    "- If relevant information exists, you MUST answer\n"
                    "- DO NOT say 'Not found' if even partial info exists\n"
                    "- Only say 'Not found in documentation' if context is completely empty or unrelated\n"

                    "OUTPUT FORMAT:\n"
                    "1. Summary\n"
                    "2. Key Logic (include step-by-step flow if present)\n"
                    "3. Dependencies\n"
                    "4. Possible Root Causes\n"
                    "5. Suggested Validation Areas\n"
                    "6. Business Impact\n\n"
                    "7. Severity\n"
                    "8. Documentation Gaps\n"

                    "ADVANCED ANALYSIS:\n"
                    "4. Identify if there is a GAP between user query and documentation.\n"
                    "5. If a feature/flow is missing (e.g., refund, cancellation, edge case), clearly highlight it.\n"
                    "6. Suggest what needs to be verified with product/dev team.\n"
                    "7. Also identify probable defect severity: Low, Medium, High, Critical based on potential business impact and likelihood.\n"
                    "Payment failures, refunds, authentication failures → Critical/High;Order issues → Medium;UI/display issues → Low\n"

                    "IMPORTANT:\n"
                    "- Do NOT skip steps mentioned in flow\n"
                    "- Include failure scenarios if present\n"
                    "- Be specific, not generic\n"
                    "- Infer logical outcomes from flow when clearly implied\n"
                    "-Do not infer beyond explicit statements.Use 'implied from dependency' if needed.\n"
                    "- Combine information across modules if relevant\n"
                    "If answer says 'Not found in documentation' but context contains relevant information, then: Faithfulness = 0,Relevance = 0"
                ),
                "temperature": 0.0,
            },
            contents=f"Context:\n{context}\n\nQuestion: {query}"
        )

        # Access the text attribute safely
        if response.text:
            answer = response.text.strip()
        else:
            answer = "Not found in documentation."

    except Exception as e:
        # Check your terminal for this output if it fails
        print(f" Gemini Error: {str(e)}")
        answer = "Error generating response."

    context_text = "\n\n".join([doc.page_content for doc in docs])
    eval_text = evaluate_answer(query, answer, context_text)
    faith, rel = parse_scores(eval_text)

    print("\n Scores:")
    print("Faithfulness:", faith)
    print("Relevance:", rel)

    warning = None

    if faith < 0.3 or rel < 0.3:
        warning = (
        "⚠️ Documentation coverage is incomplete. "
        "Please verify with module expert.\n\n"
    )
    if faith > 0.85 and rel > 0.85:
        status = "✅ Verified Answer"
        label= "High"
    elif faith > 0.3:
        status = "⚠️ Medium Confidence"
        label = "Medium"
    else:
        status = "❌ Needs Expert Review"
        label = "Low"
    print("Answer Status:", status)

    severity = parse_severity_from_answer(answer)

    return {
        "query": query,
        "answer": answer,
        "confidence": {
            "faithfulness": faith,
            "relevance": rel
        },
        "warning": warning,
        "source_docs": docs,
        "label": label,
        "severity": severity
    }

def evaluate_answer(query, answer, context):
    eval_prompt = f"""
        You are a strict evaluator.

        Evaluate the answer based on:

        1. Faithfulness (0 to 1): Is answer strictly from context?
        2. Relevance (0 to 1): Does it answer the query?
        3. If the answer contains like 'not include' or 'not present' , then relevance should be 0.5 or nearby.

        Return ONLY in this format:
        Faithfulness: <score>
        Relevance: <score>

        Provide Faithfulness and Relevance scores in decimals, anywhere in between 0 and 1, with 1 being the best. Do not add any extra text or explanation.

        Context:
        {context}

        Question:
        {query}

        Answer:
        {answer}
        """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=eval_prompt
    )

    return response.text

def parse_scores(eval_text):
    try:
        lines = eval_text.split("\n")
        faith = float(lines[0].split(":")[1].strip())
        rel = float(lines[1].split(":")[1].strip())
        return faith, rel
    except:
        return 0.0, 0.0

def parse_severity_from_answer(answer):
    severity_prompt = f"""
        Analyze the answer and extract the severity level mentioned.

        Return ONLY in this format:
        Severity: <level>

        Where <level> is one of: Low, Medium, High, Critical
        Do not add any extra text or explanation.

        Answer:
        {answer}
        """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=severity_prompt
    )

    try:
        if response.text:
            lines = response.text.split("\n")
            severity = lines[0].split(":")[1].strip()
            return severity
        return "Medium"
    except:
        return "Medium"