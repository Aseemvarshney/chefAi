"""
RAG (Retrieval Augmented Generation) Service for ChefAI.

Uses keyword-based BM25-style retrieval over the SQLite recipe store to
build a grounding context block that is injected into Gemini prompts.
No external vector DB required — works entirely with the existing schema.
"""

import re
from typing import Optional
from sqlalchemy.orm import Session
from app import models


# ─── Tokenisation helpers ─────────────────────────────────────────────────────

def _tokenise(text: str) -> set[str]:
    """Lower-case word-tokens, strip punctuation."""
    return set(re.findall(r"[a-z]+", text.lower()))


def _score(query_tokens: set[str], document: str) -> int:
    """Simple token overlap score between query and document text."""
    doc_tokens = _tokenise(document)
    return len(query_tokens & doc_tokens)


# ─── Retrieval ────────────────────────────────────────────────────────────────

def retrieve_relevant_recipes(
    query: str,
    db: Session,
    user_id: Optional[int] = None,
    top_k: int = 3,
) -> list[models.Recipe]:
    """
    Retrieve the top-k most relevant recipes from the DB for a given query.

    Scoring:
      - Matches query tokens against recipe name, cuisine, tags, and ingredient names.
      - Recipes the user has saved as favorites get a +3 boost.
      - Most-recently-generated recipes get a small freshness boost.
    """
    query_tokens = _tokenise(query)
    if not query_tokens:
        return []

    # Collect user favourite recipe IDs for boosting
    fav_ids: set[int] = set()
    if user_id:
        favs = (
            db.query(models.Favorite.recipe_id)
            .filter(models.Favorite.user_id == user_id)
            .all()
        )
        fav_ids = {f.recipe_id for f in favs}

    recipes = db.query(models.Recipe).limit(200).all()  # cap to avoid full scan

    scored: list[tuple[int, models.Recipe]] = []
    for recipe in recipes:
        # Build a combined text corpus for this recipe
        ingredient_names = " ".join(i.name for i in recipe.ingredients)
        corpus = f"{recipe.name} {recipe.cuisine} {recipe.tags} {ingredient_names}"

        score = _score(query_tokens, corpus)
        if score == 0:
            continue

        # Favourites boost
        if recipe.id in fav_ids:
            score += 3

        scored.append((score, recipe))

    # Sort descending by score, break ties by recency
    scored.sort(key=lambda x: (x[0], x[1].id), reverse=True)
    return [r for _, r in scored[:top_k]]


# ─── Context Builder ─────────────────────────────────────────────────────────

def build_rag_context(
    query: str,
    db: Session,
    user_id: Optional[int] = None,
) -> tuple[str, list[str]]:
    """
    Build a RAG context string and return (context_text, source_names).

    The context text is injected into the Gemini system prompt so the model
    answers with knowledge grounded in the user's actual saved recipes.
    """
    recipes = retrieve_relevant_recipes(query, db, user_id)

    if not recipes:
        return "", []

    lines: list[str] = [
        "## Relevant Recipes from the User's Library\n",
        "Use the following saved recipes as your primary source of truth when answering. "
        "Prefer information from these recipes over general knowledge.\n",
    ]

    source_names: list[str] = []

    for recipe in recipes:
        source_names.append(recipe.name)
        ingredient_list = ", ".join(
            f"{i.quantity} {i.unit} {i.name}".strip() for i in recipe.ingredients
        )
        lines.append(
            f"### {recipe.name} ({recipe.cuisine})\n"
            f"- Difficulty: {recipe.difficulty} | "
            f"Prep: {recipe.preparation_time}min | Cook: {recipe.cooking_time}min\n"
            f"- Tags: {recipe.tags}\n"
            f"- Ingredients: {ingredient_list or 'N/A'}\n"
        )
        if recipe.nutrition:
            n = recipe.nutrition
            lines.append(
                f"- Nutrition (per serving): {n.calories:.0f} kcal, "
                f"{n.protein:.0f}g protein, {n.carbohydrates:.0f}g carbs, {n.fat:.0f}g fat\n"
            )

    return "\n".join(lines), source_names
