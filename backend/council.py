"""3-stage LLM Council orchestration."""

from typing import List, Dict, Any, Tuple
from .openrouter import query_advisors_parallel, query_models_parallel, query_model
from .config import COUNCIL_ADVISORS, CHAIRMAN_MODEL


async def stage1_collect_responses(user_query: str) -> List[Dict[str, Any]]:
    """
    Stage 1: Collect individual responses from all council advisors.

    Returns:
        List of dicts with 'role', 'model', and 'response' keys
    """
    advisor_calls = [
        {
            "role": advisor["role"],
            "model": advisor["model"],
            "messages": [
                {"role": "system", "content": advisor["system_prompt"]},
                {"role": "user", "content": user_query},
            ],
        }
        for advisor in COUNCIL_ADVISORS
    ]

    responses = await query_advisors_parallel(advisor_calls)

    stage1_results = []
    for advisor in COUNCIL_ADVISORS:
        role = advisor["role"]
        response = responses.get(role)
        if response is not None:
            stage1_results.append({
                "role": role,
                "model": advisor["model"],
                "response": response.get("content", ""),
            })

    return stage1_results


async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """
    Stage 2: Each advisor ranks the anonymized responses.

    Anonymity guarantee: role names never appear in the ranking prompt —
    only 'Response A', 'Response B', etc.

    Returns:
        Tuple of (rankings list, label_to_model mapping)
    """
    labels = [chr(65 + i) for i in range(len(stage1_results))]

    label_to_model = {
        f"Response {label}": result["model"]
        for label, result in zip(labels, stage1_results)
    }

    responses_text = "\n\n".join([
        f"Response {label}:\n{result['response']}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""You are evaluating different responses to the following question:

Question: {user_query}

Here are the responses from different models (anonymized):

{responses_text}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:"""

    # Verify anonymity: ranking prompt must contain zero role names
    role_names = [a["role"] for a in COUNCIL_ADVISORS]
    for role_name in role_names:
        assert role_name not in ranking_prompt, (
            f"ANONYMITY VIOLATION: role name '{role_name}' leaked into Stage 2 prompt"
        )

    messages = [{"role": "user", "content": ranking_prompt}]

    models = [advisor["model"] for advisor in COUNCIL_ADVISORS]
    responses = await query_models_parallel(models, messages)

    stage2_results = []
    for model, response in responses.items():
        if response is not None:
            full_text = response.get("content", "")
            parsed = parse_ranking_from_text(full_text)
            stage2_results.append({
                "model": model,
                "ranking": full_text,
                "parsed_ranking": parsed,
            })

    return stage2_results, label_to_model


async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Stage 3: Chairman synthesizes final response, referencing advisors by role.
    """
    stage1_text = "\n\n".join([
        f"Advisor ({result['role']}):\n{result['response']}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result['model']}\nRanking: {result['ranking']}"
        for result in stage2_results
    ])

    chairman_prompt = f"""You are the Chairman of an LLM Council of Advisors. Five advisors with distinct roles have provided responses to a founder's question, and then ranked each other's responses anonymously.

Original Question: {user_query}

STAGE 1 - Advisor Responses:
{stage1_text}

STAGE 2 - Peer Rankings:
{stage2_text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, actionable answer to the founder's original question. Consider:
- Each advisor's perspective and the role they were playing
- The peer rankings and what they reveal about response quality
- Points of agreement and disagreement across advisors

Reference advisors by their role name (Contrarian, First Principles Operator, Customer Realist, Expansionist, Executor) when attributing specific insights. Provide a clear, well-reasoned final answer that represents the council's collective wisdom:"""

    messages = [{"role": "user", "content": chairman_prompt}]

    response = await query_model(CHAIRMAN_MODEL, messages)

    if response is None:
        return {
            "model": CHAIRMAN_MODEL,
            "response": "Error: Unable to generate final synthesis.",
        }

    return {
        "model": CHAIRMAN_MODEL,
        "response": response.get("content", ""),
    }


def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """Parse the FINAL RANKING section from the model's response."""
    import re

    if "FINAL RANKING:" in ranking_text:
        parts = ranking_text.split("FINAL RANKING:")
        if len(parts) >= 2:
            ranking_section = parts[1]
            numbered_matches = re.findall(r'\d+\.\s*Response [A-Z]', ranking_section)
            if numbered_matches:
                return [re.search(r'Response [A-Z]', m).group() for m in numbered_matches]
            matches = re.findall(r'Response [A-Z]', ranking_section)
            return matches

    return re.findall(r'Response [A-Z]', ranking_text)


def calculate_aggregate_rankings(
    stage2_results: List[Dict[str, Any]],
    label_to_model: Dict[str, str]
) -> List[Dict[str, Any]]:
    """Calculate aggregate rankings across all advisors."""
    from collections import defaultdict

    model_positions = defaultdict(list)

    for ranking in stage2_results:
        parsed_ranking = parse_ranking_from_text(ranking["ranking"])
        for position, label in enumerate(parsed_ranking, start=1):
            if label in label_to_model:
                model_name = label_to_model[label]
                model_positions[model_name].append(position)

    aggregate = []
    for model, positions in model_positions.items():
        if positions:
            aggregate.append({
                "model": model,
                "average_rank": round(sum(positions) / len(positions), 2),
                "rankings_count": len(positions),
            })

    aggregate.sort(key=lambda x: x["average_rank"])
    return aggregate


async def generate_conversation_title(user_query: str) -> str:
    """Generate a short title for a conversation based on the first user message."""
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    response = await query_model("google/gemini-2.5-flash", messages, timeout=30.0)

    if response is None:
        return "New Conversation"

    title = response.get("content", "New Conversation").strip().strip("\"'")

    if len(title) > 50:
        title = title[:47] + "..."

    return title


async def run_full_council(user_query: str) -> Tuple[List, List, Dict, Dict]:
    """Run the complete 3-stage council process."""
    stage1_results = await stage1_collect_responses(user_query)

    if not stage1_results:
        return [], [], {
            "model": "error",
            "response": "All advisors failed to respond. Please try again.",
        }, {}

    stage2_results, label_to_model = await stage2_collect_rankings(user_query, stage1_results)

    aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)

    # Build label_to_role for post-hoc display (without touching main.py)
    model_to_role = {r["model"]: r["role"] for r in stage1_results}
    label_to_role = {
        label: model_to_role[model]
        for label, model in label_to_model.items()
        if model in model_to_role
    }

    stage3_result = await stage3_synthesize_final(
        user_query,
        stage1_results,
        stage2_results,
    )

    metadata = {
        "label_to_model": label_to_model,
        "label_to_role": label_to_role,
        "aggregate_rankings": aggregate_rankings,
    }

    return stage1_results, stage2_results, stage3_result, metadata
