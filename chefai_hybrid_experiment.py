"""
ChefAI Hybrid Recipe Recommendation Experiment
================================================
One-file research pipeline for Food.com RAW_recipes.csv and RAW_interactions.csv.

What it does:
1. Loads and cleans the two Food.com CSV files.
2. Creates a chronological train/validation/test split.
3. Applies a minimum-interaction filter using training data only.
4. Trains TF-IDF content-based features and a collaborative Truncatedmatrix-factorization model.
5. Selects the hybrid weight on validation NDCG@10.
6. Evaluates content-only, collaborative-only, and hybrid ranking on test data.
7. Saves metrics, graphs, recommendations, and a model bundle.

Place this script in your ChefAI project root and put the two CSVs in ./dataset/.
See the step-by-step instructions provided with this script.
"""

from __future__ import annotations

import ast
import json
import math
import re
import sys
import warnings
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Any

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer

warnings.filterwarnings("ignore", category=FutureWarning)

# ----------------------------- USER SETTINGS -----------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "dataset"
OUTPUT_DIR = BASE_DIR / "research_results"

RECIPES_FILE = "RAW_recipes.csv"
INTERACTIONS_FILE = "RAW_interactions.csv"

MIN_TRAIN_INTERACTIONS = 5   # Minimum per user and per recipe in training data
MF_FACTORS = 32             # Latent dimensions; reduce to 16 on a low-memory PC
MF_EPOCHS = 15
MF_BATCH_SIZE = 4096
MF_LEARNING_RATE = 0.01
MF_REGULARIZATION = 0.02
MAX_EVAL_USERS = 3000        # Deterministic user sample for manageable ranking evaluation
NEGATIVE_CANDIDATES = 300    # Sampled unseen recipes per evaluation user
TOP_K = 10
ALPHA_VALUES = [0.0, 0.25, 0.50, 0.75, 1.0]  # alpha is the collaborative-filtering weight
RANDOM_SEED = 42

# ----------------------------- BASIC UTILITIES ----------------------------

def find_dataset_file(filename: str) -> Path:
    """Find a dataset file in ./dataset or beside this script."""
    candidates = [DATA_DIR / filename, BASE_DIR / filename]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError(
        f"Could not find {filename}. Put it inside: {DATA_DIR}\n"
        f"Expected file name exactly: {filename}"
    )


def parse_ingredients(value: Any) -> List[str]:
    """Safely parse Food.com ingredient-list strings."""
    if isinstance(value, list):
        raw_items = value
    elif pd.isna(value):
        return []
    else:
        try:
            raw_items = ast.literal_eval(str(value))
        except (ValueError, SyntaxError):
            return []

    if not isinstance(raw_items, (list, tuple)):
        return []

    cleaned: List[str] = []
    for item in raw_items:
        text = re.sub(r"\s+", " ", str(item).lower()).strip()
        if text and text not in {"nan", "none"}:
            cleaned.append(text)
    return cleaned


def iterative_k_core(
    frame: pd.DataFrame, min_count: int
) -> Tuple[pd.DataFrame, set, set]:
    """Keep users and recipes having >= min_count interactions in training."""
    current = frame.copy()
    while True:
        before = len(current)
        user_counts = current["user_id"].value_counts()
        recipe_counts = current["recipe_id"].value_counts()
        valid_users = set(user_counts[user_counts >= min_count].index)
        valid_recipes = set(recipe_counts[recipe_counts >= min_count].index)
        current = current[
            current["user_id"].isin(valid_users)
            & current["recipe_id"].isin(valid_recipes)
        ].copy()
        if len(current) == before:
            return current, valid_users, valid_recipes


def make_chronological_split(
    interactions: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Timestamp, pd.Timestamp]:
    """Split by whole calendar dates to avoid same-day temporal leakage."""
    unique_dates = np.array(sorted(interactions["date"].dropna().unique()))
    if len(unique_dates) < 3:
        raise ValueError("Not enough distinct interaction dates for a chronological split.")

    cut1_index = min(max(int(len(unique_dates) * 0.70), 1), len(unique_dates) - 2)
    cut2_index = min(max(int(len(unique_dates) * 0.80), cut1_index + 1), len(unique_dates) - 1)
    train_cutoff = pd.Timestamp(unique_dates[cut1_index])
    test_cutoff = pd.Timestamp(unique_dates[cut2_index])

    train = interactions[interactions["date"] < train_cutoff].copy()
    validation = interactions[
        (interactions["date"] >= train_cutoff)
        & (interactions["date"] < test_cutoff)
    ].copy()
    test = interactions[interactions["date"] >= test_cutoff].copy()
    return train, validation, test, train_cutoff, test_cutoff


def build_mf_model(
    history: pd.DataFrame,
    catalog_ids: np.ndarray,
    factors: int | None = None,
) -> Dict[str, Any]:
    """Fit explicit-rating matrix factorization with mini-batch SGD.

    Only observed user-item ratings contribute to the loss. Missing ratings are
    not inserted as zero-valued observations.
    """
    user_ids = np.array(sorted(history["user_id"].unique()), dtype=np.int64)
    item_ids = np.array(catalog_ids, dtype=np.int64)
    user_to_idx = {int(uid): idx for idx, uid in enumerate(user_ids)}
    item_to_idx = {int(iid): idx for idx, iid in enumerate(item_ids)}

    user_idx = history["user_id"].map(user_to_idx).to_numpy(dtype=np.int32)
    item_idx = history["recipe_id"].map(item_to_idx).to_numpy(dtype=np.int32)
    ratings = history["rating"].to_numpy(dtype=np.float32)
    global_mean = float(np.mean(ratings))

    n_users = len(user_ids)
    n_items = len(item_ids)
    if factors is None:
        factors = MF_FACTORS
    n_factors = min(int(factors), min(n_users, n_items) - 1)
    if n_factors < 2:
        raise ValueError(
            "Not enough users/recipes to fit collaborative filtering. "
            "Try lowering MIN_TRAIN_INTERACTIONS or use more data."
        )

    rng = np.random.default_rng(RANDOM_SEED)
    user_factors = rng.normal(0.0, 0.05, size=(n_users, n_factors)).astype(np.float32)
    item_factors = rng.normal(0.0, 0.05, size=(n_items, n_factors)).astype(np.float32)
    user_bias = np.zeros(n_users, dtype=np.float32)
    item_bias = np.zeros(n_items, dtype=np.float32)

    print(
        f"Training explicit-rating matrix factorization: {n_users:,} users x "
        f"{n_items:,} recipes; {len(ratings):,} observed ratings; "
        f"{n_factors} factors; {MF_EPOCHS} epochs"
    )

    order = np.arange(len(ratings))
    for epoch in range(MF_EPOCHS):
        rng.shuffle(order)
        epoch_squared_error = 0.0

        for start in range(0, len(order), MF_BATCH_SIZE):
            batch = order[start : start + MF_BATCH_SIZE]
            u = user_idx[batch]
            i = item_idx[batch]
            r = ratings[batch]

            # Snapshot factors before calculating this mini-batch's gradients.
            pu = user_factors[u].copy()
            qi = item_factors[i].copy()
            bu = user_bias[u].copy()
            bi = item_bias[i].copy()

            predictions = (
                global_mean + bu + bi + np.sum(pu * qi, axis=1)
            )
            errors = r - predictions
            epoch_squared_error += float(np.dot(errors, errors))

            grad_p = errors[:, None] * qi - MF_REGULARIZATION * pu
            grad_q = errors[:, None] * pu - MF_REGULARIZATION * qi
            grad_bu = errors - MF_REGULARIZATION * bu
            grad_bi = errors - MF_REGULARIZATION * bi

            # Average gradients for repeated users/items within each mini-batch.
            unique_u, inverse_u, counts_u = np.unique(
                u, return_inverse=True, return_counts=True
            )
            unique_i, inverse_i, counts_i = np.unique(
                i, return_inverse=True, return_counts=True
            )

            sum_grad_p = np.zeros((len(unique_u), n_factors), dtype=np.float32)
            sum_grad_bu = np.zeros(len(unique_u), dtype=np.float32)
            np.add.at(sum_grad_p, inverse_u, grad_p)
            np.add.at(sum_grad_bu, inverse_u, grad_bu)

            sum_grad_q = np.zeros((len(unique_i), n_factors), dtype=np.float32)
            sum_grad_bi = np.zeros(len(unique_i), dtype=np.float32)
            np.add.at(sum_grad_q, inverse_i, grad_q)
            np.add.at(sum_grad_bi, inverse_i, grad_bi)

            learning_rate = MF_LEARNING_RATE / (1.0 + 0.05 * epoch)
            user_factors[unique_u] += learning_rate * (
                sum_grad_p / counts_u[:, None]
            )
            user_bias[unique_u] += learning_rate * (
                sum_grad_bu / counts_u
            )
            item_factors[unique_i] += learning_rate * (
                sum_grad_q / counts_i[:, None]
            )
            item_bias[unique_i] += learning_rate * (
                sum_grad_bi / counts_i
            )

        rmse = math.sqrt(epoch_squared_error / max(len(ratings), 1))
        print(f"  Epoch {epoch + 1:02d}/{MF_EPOCHS} - training RMSE: {rmse:.4f}")

    return {
        "user_ids": user_ids,
        "item_ids": item_ids,
        "user_to_idx": user_to_idx,
        "item_to_idx": item_to_idx,
        "user_factors": user_factors,
        "item_factors": item_factors,
        "user_bias": user_bias,
        "item_bias": item_bias,
        "global_mean": global_mean,
        "n_components": n_factors,
    }


def make_user_history(history: pd.DataFrame) -> Dict[int, pd.DataFrame]:
    return {
        int(uid): group[["recipe_id", "rating"]].copy()
        for uid, group in history.groupby("user_id", sort=False)
    }


def build_eval_cases(
    history: pd.DataFrame,
    holdout: pd.DataFrame,
    catalog_ids: np.ndarray,
    max_users: int,
    n_negatives: int,
    seed: int,
) -> List[Dict[str, Any]]:
    """Build per-user candidate sets: all held-out ratings + sampled unseen items."""
    rng = np.random.default_rng(seed)
    catalog_set = set(map(int, catalog_ids))
    history_by_user = make_user_history(history)
    cases: List[Dict[str, Any]] = []

    holdout = holdout[holdout["recipe_id"].isin(catalog_set)].copy()
    grouped = {int(uid): group for uid, group in holdout.groupby("user_id")}
    eligible_users = []

    for uid, group in grouped.items():
        hist = history_by_user.get(uid)
        if hist is None:
            continue
        # Content profiles need at least one positively rated historical recipe.
        if not (hist["rating"] >= 4).any():
            continue
        relevant = set(group.loc[group["rating"] >= 4, "recipe_id"].astype(int))
        if relevant:
            eligible_users.append(uid)

    if not eligible_users:
        return cases

    rng.shuffle(eligible_users)
    eligible_users = eligible_users[:max_users]
    catalog_array = np.asarray(catalog_ids, dtype=np.int64)

    for uid in eligible_users:
        hist = history_by_user[uid]
        group = grouped[uid]
        observed_ids = set(group["recipe_id"].astype(int))
        relevant_ids = set(group.loc[group["rating"] >= 4, "recipe_id"].astype(int))
        seen_ids = set(hist["recipe_id"].astype(int))
        excluded = seen_ids | observed_ids

        negative_ids: set = set()
        attempts = 0
        while len(negative_ids) < n_negatives and attempts < 12:
            batch_size = max(200, (n_negatives - len(negative_ids)) * 3)
            draws = rng.choice(catalog_array, size=min(batch_size, max(len(catalog_array), 1)), replace=False)
            for rid in draws:
                rid_int = int(rid)
                if rid_int not in excluded:
                    negative_ids.add(rid_int)
                    if len(negative_ids) >= n_negatives:
                        break
            attempts += 1

        candidate_ids = list(observed_ids | negative_ids)
        if len(candidate_ids) < TOP_K:
            continue
        rng.shuffle(candidate_ids)
        rating_lookup = {
            int(row.recipe_id): float(row.rating)
            for row in group[["recipe_id", "rating"]].itertuples(index=False)
        }
        cases.append(
            {
                "user_id": uid,
                "candidate_ids": np.asarray(candidate_ids, dtype=np.int64),
                "relevant_ids": relevant_ids,
                "heldout_ratings": rating_lookup,
            }
        )

    return cases


def content_profile_scores(
    uid: int,
    candidate_ids: np.ndarray,
    history_by_user: Dict[int, pd.DataFrame],
    recipe_features: csr_matrix,
    item_to_idx: Dict[int, int],
) -> np.ndarray:
    hist = history_by_user.get(uid)
    if hist is None:
        return np.zeros(len(candidate_ids), dtype=np.float32)

    positive = hist[hist["rating"] >= 4]
    if positive.empty:
        return np.zeros(len(candidate_ids), dtype=np.float32)

    hist_indices = np.array(
        [item_to_idx[int(rid)] for rid in positive["recipe_id"] if int(rid) in item_to_idx],
        dtype=np.int32,
    )
    if len(hist_indices) == 0:
        return np.zeros(len(candidate_ids), dtype=np.float32)

    weights = (positive["rating"].to_numpy(dtype=np.float32) - 3.0)
    if len(weights) != len(hist_indices):
        weights = np.ones(len(hist_indices), dtype=np.float32)

    # Weighted average of the user's positively rated recipe vectors.
    profile = np.asarray(recipe_features[hist_indices].T.dot(weights)).ravel()
    norm = float(np.linalg.norm(profile))
    if norm == 0.0:
        return np.zeros(len(candidate_ids), dtype=np.float32)
    profile = profile / norm

    candidate_indices = np.array(
        [item_to_idx[int(rid)] for rid in candidate_ids], dtype=np.int32
    )
    scores = recipe_features[candidate_indices].dot(profile)
    return np.clip(np.asarray(scores).ravel(), 0.0, 1.0).astype(np.float32)


def collaborative_scores(
    uid: int,
    candidate_ids: np.ndarray,
    model: Dict[str, Any],
) -> np.ndarray:
    user_idx = model["user_to_idx"].get(int(uid))
    if user_idx is None:
        return np.full(len(candidate_ids), 0.5, dtype=np.float32)
    item_indices = np.array(
        [model["item_to_idx"][int(rid)] for rid in candidate_ids], dtype=np.int32
    )
    predicted_ratings = (
        model["global_mean"]
        + model["user_bias"][user_idx]
        + model["item_bias"][item_indices]
        + model["item_factors"][item_indices].dot(model["user_factors"][user_idx])
    )
    predicted_ratings = np.clip(predicted_ratings, 1.0, 5.0)
    return ((predicted_ratings - 1.0) / 4.0).astype(np.float32)



def rating_prediction_error(
    heldout: pd.DataFrame, model: Dict[str, Any]
) -> Dict[str, float]:
    """MAE/RMSE for explicit-rating predictions on eligible held-out records."""
    known = heldout[
        heldout["user_id"].isin(model["user_to_idx"])
        & heldout["recipe_id"].isin(model["item_to_idx"])
    ].copy()
    if known.empty:
        return {"MAE": float("nan"), "RMSE": float("nan"), "Evaluated_Ratings": 0}

    u_idx = known["user_id"].map(model["user_to_idx"]).to_numpy(dtype=np.int32)
    i_idx = known["recipe_id"].map(model["item_to_idx"]).to_numpy(dtype=np.int32)
    predictions = (
        model["global_mean"]
        + model["user_bias"][u_idx]
        + model["item_bias"][i_idx]
        + np.sum(model["user_factors"][u_idx] * model["item_factors"][i_idx], axis=1)
    )
    predictions = np.clip(predictions, 1.0, 5.0)
    actual = known["rating"].to_numpy(dtype=np.float32)
    errors = actual - predictions
    return {
        "MAE": float(np.mean(np.abs(errors))),
        "RMSE": float(np.sqrt(np.mean(errors ** 2))),
        "Evaluated_Ratings": int(len(actual)),
    }

def ranking_metrics(
    ranked_ids: np.ndarray,
    relevant_ids: set,
    k: int = TOP_K,
) -> Tuple[float, float, float]:
    top_ids = ranked_ids[:k]
    hits = np.array([1.0 if int(rid) in relevant_ids else 0.0 for rid in top_ids])
    precision = float(hits.sum() / k)
    recall = float(hits.sum() / max(len(relevant_ids), 1))

    discounts = 1.0 / np.log2(np.arange(2, len(hits) + 2))
    dcg = float(np.sum(hits * discounts))
    ideal_count = min(len(relevant_ids), k)
    ideal_hits = np.ones(ideal_count, dtype=np.float32)
    idcg = float(np.sum(ideal_hits / np.log2(np.arange(2, ideal_count + 2))))
    ndcg = dcg / idcg if idcg > 0 else 0.0
    return precision, recall, ndcg


def evaluate_recommender(
    cases: List[Dict[str, Any]],
    model: Dict[str, Any],
    history: pd.DataFrame,
    recipe_features: csr_matrix,
    recipe_names: Dict[int, str],
    alpha: float,
    label: str,
    save_recommendations: bool = False,
) -> Tuple[Dict[str, float], List[Dict[str, Any]]]:
    history_by_user = make_user_history(history)
    precisions: List[float] = []
    recalls: List[float] = []
    ndcgs: List[float] = []
    all_recommended: set = set()
    recommendation_rows: List[Dict[str, Any]] = []

    for case in cases:
        uid = int(case["user_id"])
        candidates = case["candidate_ids"]
        content = content_profile_scores(
            uid, candidates, history_by_user, recipe_features, model["item_to_idx"]
        )
        collaborative = collaborative_scores(uid, candidates, model)
        hybrid = alpha * collaborative + (1.0 - alpha) * content

        order = np.argsort(-hybrid, kind="stable")
        ranked_ids = candidates[order]
        p, r, n = ranking_metrics(ranked_ids, case["relevant_ids"], TOP_K)
        precisions.append(p)
        recalls.append(r)
        ndcgs.append(n)

        top_positions = order[:TOP_K]
        top_ids = candidates[top_positions]
        all_recommended.update(map(int, top_ids))

        if save_recommendations:
            for rank, pos in enumerate(top_positions, start=1):
                rid = int(candidates[pos])
                recommendation_rows.append(
                    {
                        "user_id": uid,
                        "rank": rank,
                        "recipe_id": rid,
                        "recipe_name": recipe_names.get(rid, "Unknown recipe"),
                        "hybrid_score": float(hybrid[pos]),
                        "content_score": float(content[pos]),
                        "collaborative_score": float(collaborative[pos]),
                        "heldout_rating": case["heldout_ratings"].get(rid, np.nan),
                        "is_relevant_rating_4_or_5": int(rid in case["relevant_ids"]),
                    }
                )

    if not cases:
        raise ValueError("No eligible evaluation users. Review split/filter settings.")

    metrics = {
        "Precision@10": float(np.mean(precisions)),
        "Recall@10": float(np.mean(recalls)),
        "NDCG@10": float(np.mean(ndcgs)),
        "Catalog_Coverage": float(len(all_recommended) / max(len(model["item_ids"]), 1)),
        "Evaluated_Users": int(len(cases)),
        "Recommended_Unique_Recipes": int(len(all_recommended)),
    }
    return metrics, recommendation_rows


def save_graphs(metrics_frame: pd.DataFrame, output_dir: Path) -> None:
    metric_cols = ["Precision@10", "Recall@10", "NDCG@10"]
    ax = metrics_frame.set_index("Model")[metric_cols].plot(
        kind="bar", figsize=(10, 6), rot=0
    )
    ax.set_title("ChefAI: Test Ranking Performance Comparison")
    ax.set_ylabel("Score")
    ax.set_xlabel("Recommendation configuration")
    ax.set_ylim(0, 1)
    ax.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    plt.savefig(output_dir / "performance_comparison.png", dpi=300)
    plt.close()

    ax = metrics_frame.set_index("Model")["Catalog_Coverage"].plot(
        kind="bar", figsize=(8, 5), rot=0
    )
    ax.set_title("ChefAI: Catalog Coverage Comparison")
    ax.set_ylabel("Coverage (0–1)")
    ax.set_xlabel("Recommendation configuration")
    ax.set_ylim(0, 1)
    ax.grid(axis="y", alpha=0.25)
    plt.tight_layout()
    plt.savefig(output_dir / "catalog_coverage.png", dpi=300)
    plt.close()


def main() -> None:
    print("\n========== ChefAI Hybrid Recommendation Experiment ==========")
    print("Python:", sys.version.split()[0])
    print("Dataset folder:", DATA_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    recipes_path = find_dataset_file(RECIPES_FILE)
    interactions_path = find_dataset_file(INTERACTIONS_FILE)
    print("\nLoading datasets...")
    recipes = pd.read_csv(recipes_path, low_memory=False)
    interactions = pd.read_csv(interactions_path, low_memory=False)

    required_recipe_cols = {"id", "name", "ingredients"}
    required_interaction_cols = {"user_id", "recipe_id", "rating", "date"}
    if not required_recipe_cols.issubset(recipes.columns):
        raise ValueError(f"RAW_recipes.csv must contain: {sorted(required_recipe_cols)}")
    if not required_interaction_cols.issubset(interactions.columns):
        raise ValueError(
            f"RAW_interactions.csv must contain: {sorted(required_interaction_cols)}"
        )

    print("Raw recipe rows:", f"{len(recipes):,}")
    print("Raw interaction rows:", f"{len(interactions):,}")

    print("\nCleaning recipe metadata...")
    recipes = recipes[["id", "name", "ingredients"]].copy()
    recipes["id"] = pd.to_numeric(recipes["id"], errors="coerce")
    recipes = recipes.dropna(subset=["id"]).copy()
    recipes["id"] = recipes["id"].astype(np.int64)
    recipes = recipes.drop_duplicates(subset=["id"], keep="last")
    recipes["ingredients_clean"] = recipes["ingredients"].apply(parse_ingredients)
    recipes["ingredient_text"] = recipes["ingredients_clean"].apply(lambda x: " ".join(x))
    recipes["name"] = recipes["name"].fillna("Unnamed recipe").astype(str)
    recipes = recipes[recipes["ingredient_text"].str.strip().ne("")].copy()

    print("Cleaning user interactions...")
    interactions = interactions[["user_id", "recipe_id", "rating", "date"]].copy()
    for col in ["user_id", "recipe_id", "rating"]:
        interactions[col] = pd.to_numeric(interactions[col], errors="coerce")
    interactions["date"] = pd.to_datetime(interactions["date"], errors="coerce")
    interactions = interactions.dropna(subset=["user_id", "recipe_id", "rating", "date"]).copy()
    interactions["user_id"] = interactions["user_id"].astype(np.int64)
    interactions["recipe_id"] = interactions["recipe_id"].astype(np.int64)
    interactions["rating"] = interactions["rating"].astype(np.float32)
    # Food.com uses rating 0 for an unrated interaction; keep only explicit 1–5 ratings.
    interactions = interactions[interactions["rating"].between(1, 5)].copy()
    interactions = interactions.sort_values("date")
    interactions = interactions.drop_duplicates(
        subset=["user_id", "recipe_id"], keep="last"
    )
    interactions = interactions.merge(
        recipes[["id"]], left_on="recipe_id", right_on="id", how="inner"
    ).drop(columns=["id"])

    if len(interactions) < 100:
        raise ValueError("Too few valid interactions after cleaning. Check the CSV files.")

    print("Clean recipes:", f"{len(recipes):,}")
    print("Clean explicit ratings:", f"{len(interactions):,}")

    print("\nCreating chronological train/validation/test split...")
    train_raw, val_raw, test_raw, train_cut, test_cut = make_chronological_split(interactions)
    train, valid_users, valid_items = iterative_k_core(train_raw, MIN_TRAIN_INTERACTIONS)
    if train.empty:
        raise ValueError(
            "Training set became empty after minimum-interaction filtering. "
            "Set MIN_TRAIN_INTERACTIONS = 3 and rerun."
        )

    # Only evaluate warm-start users and recipes that exist in training.
    val = val_raw[
        val_raw["user_id"].isin(valid_users)
        & val_raw["recipe_id"].isin(valid_items)
    ].copy()
    test = test_raw[
        test_raw["user_id"].isin(valid_users)
        & test_raw["recipe_id"].isin(valid_items)
    ].copy()

    catalog_ids = np.array(sorted(valid_items), dtype=np.int64)
    catalog_recipes = recipes.set_index("id").loc[catalog_ids].reset_index()
    recipe_names = {
        int(row.id): str(row.name)
        for row in catalog_recipes[["id", "name"]].itertuples(index=False)
    }

    split_stats = pd.DataFrame(
        [
            {"Partition": "Train", "Rows": len(train)},
            {"Partition": "Validation", "Rows": len(val)},
            {"Partition": "Test", "Rows": len(test)},
        ]
    )
    split_stats["Share_of_retained_rows"] = split_stats["Rows"] / max(split_stats["Rows"].sum(), 1)
    split_stats.to_csv(OUTPUT_DIR / "split_statistics.csv", index=False)

    print("\nSplit cutoffs (whole dates):")
    print("Train before:", train_cut)
    print("Test begins:", test_cut)
    print("Retained train/validation/test:", len(train), len(val), len(test))
    print("Eligible users:", f"{len(valid_users):,}")
    print("Eligible recipes:", f"{len(catalog_ids):,}")

    if val.empty or test.empty:
        raise ValueError(
            "Validation or test data is empty after warm-start filtering. "
            "Try MIN_TRAIN_INTERACTIONS = 3 or check the date distribution."
        )

    print("\nBuilding TF-IDF ingredient vectors...")
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        max_features=50000,
        sublinear_tf=True,
        token_pattern=r"(?u)\b\w+\b",
    )
    recipe_features = vectorizer.fit_transform(
        catalog_recipes["ingredient_text"].astype(str)
    ).tocsr()
    print("TF-IDF matrix:", recipe_features.shape)

    print("\nTraining initial model on training interactions...")
    validation_model = build_mf_model(train, catalog_ids)
    validation_cases = build_eval_cases(
        history=train,
        holdout=val,
        catalog_ids=catalog_ids,
        max_users=MAX_EVAL_USERS,
        n_negatives=NEGATIVE_CANDIDATES,
        seed=RANDOM_SEED + 1,
    )
    print("Validation users evaluated:", len(validation_cases))
    if not validation_cases:
        raise ValueError(
            "No validation users have positive training and validation history. "
            "Try lowering MIN_TRAIN_INTERACTIONS or inspect rating/date distributions."
        )

    print("\nSelecting hybrid weight using validation NDCG@10...")
    alpha_results = []
    for alpha in ALPHA_VALUES:
        metrics, _ = evaluate_recommender(
            cases=validation_cases,
            model=validation_model,
            history=train,
            recipe_features=recipe_features,
            recipe_names=recipe_names,
            alpha=float(alpha),
            label=f"alpha={alpha}",
            save_recommendations=False,
        )
        alpha_results.append({"alpha_CF_weight": alpha, **metrics})
        print(f"alpha={alpha:.2f} -> validation NDCG@10={metrics['NDCG@10']:.4f}")

    alpha_frame = pd.DataFrame(alpha_results)
    alpha_frame.to_csv(OUTPUT_DIR / "validation_alpha_tuning.csv", index=False)
    best_row = alpha_frame.sort_values(
        ["NDCG@10", "Precision@10"], ascending=False
    ).iloc[0]
    best_alpha = float(best_row["alpha_CF_weight"])
    print(f"\nSelected collaborative weight alpha = {best_alpha:.2f}")

    print("\nRetraining model on training + validation data...")
    final_history = pd.concat([train, val], ignore_index=True)
    # train and validation are disjoint by date, so each user-recipe pair remains unique.
    final_model = build_mf_model(final_history, catalog_ids)

    test_cases = build_eval_cases(
        history=final_history,
        holdout=test,
        catalog_ids=catalog_ids,
        max_users=MAX_EVAL_USERS,
        n_negatives=NEGATIVE_CANDIDATES,
        seed=RANDOM_SEED + 2,
    )
    print("Test users evaluated:", len(test_cases))
    if not test_cases:
        raise ValueError(
            "No eligible test users have positive historical and test ratings. "
            "Try lowering MIN_TRAIN_INTERACTIONS or inspect the date distribution."
        )

    rating_errors = rating_prediction_error(test, final_model)
    pd.DataFrame([rating_errors]).to_csv(
        OUTPUT_DIR / "rating_prediction_errors.csv", index=False
    )

    print("\nEvaluating the three configurations on the untouched test set...")
    configurations = [
        ("Content-only", 0.0),
        ("Collaborative-only", 1.0),
        ("Proposed hybrid", best_alpha),
    ]
    result_rows = []
    hybrid_recommendations: List[Dict[str, Any]] = []

    for label, alpha in configurations:
        metrics, recommendations = evaluate_recommender(
            cases=test_cases,
            model=final_model,
            history=final_history,
            recipe_features=recipe_features,
            recipe_names=recipe_names,
            alpha=alpha,
            label=label,
            save_recommendations=(label == "Proposed hybrid"),
        )
        result_rows.append({"Model": label, "CF_weight_alpha": alpha, **metrics})
        if label == "Proposed hybrid":
            hybrid_recommendations = recommendations
        print(
            f"{label}: Precision@10={metrics['Precision@10']:.4f}, "
            f"Recall@10={metrics['Recall@10']:.4f}, "
            f"NDCG@10={metrics['NDCG@10']:.4f}, "
            f"Coverage={metrics['Catalog_Coverage']:.4f}"
        )

    metrics_frame = pd.DataFrame(result_rows)
    metrics_frame.to_csv(OUTPUT_DIR / "test_metrics.csv", index=False)
    pd.DataFrame(hybrid_recommendations).to_csv(
        OUTPUT_DIR / "hybrid_test_recommendations.csv", index=False
    )
    save_graphs(metrics_frame, OUTPUT_DIR)

    model_bundle = {
        "model_description": "ChefAI hybrid recipe recommender",
        "alpha_cf_weight": best_alpha,
        "top_k": TOP_K,
        "user_ids": final_model["user_ids"],
        "item_ids": final_model["item_ids"],
        "user_to_idx": final_model["user_to_idx"],
        "item_to_idx": final_model["item_to_idx"],
        "user_factors": final_model["user_factors"],
        "item_factors": final_model["item_factors"],
        "user_bias": final_model["user_bias"],
        "item_bias": final_model["item_bias"],
        "global_mean": final_model["global_mean"],
        "tfidf_vectorizer": vectorizer,
        "recipe_features": recipe_features,
        "recipe_names": recipe_names,
        "training_history": final_history[["user_id", "recipe_id", "rating"]].copy(),
        "catalog_ids": catalog_ids,
        "configuration": {
            "min_train_interactions": MIN_TRAIN_INTERACTIONS,
            "matrix_factorization_factors": final_model["n_components"],
            "matrix_factorization_epochs": MF_EPOCHS,
            "matrix_factorization_batch_size": MF_BATCH_SIZE,
            "matrix_factorization_learning_rate": MF_LEARNING_RATE,
            "matrix_factorization_regularization": MF_REGULARIZATION,
            "max_eval_users": MAX_EVAL_USERS,
            "negative_candidates_per_user": NEGATIVE_CANDIDATES,
            "random_seed": RANDOM_SEED,
            "rating_relevance_threshold": 4,
            "chronological_split": "70/10/20 by distinct dates, actual row shares in split_statistics.csv",
        },
    }
    joblib.dump(model_bundle, OUTPUT_DIR / "chefai_hybrid_model.joblib", compress=3)

    summary = {
        "train_cutoff_exclusive": str(train_cut),
        "test_cutoff_inclusive": str(test_cut),
        "train_rows_after_filter": int(len(train)),
        "validation_rows_after_filter": int(len(val)),
        "test_rows_after_filter": int(len(test)),
        "eligible_users": int(len(valid_users)),
        "eligible_recipes": int(len(catalog_ids)),
        "validation_users_evaluated": int(len(validation_cases)),
        "test_users_evaluated": int(len(test_cases)),
        "selected_collaborative_weight_alpha": best_alpha,
        "note": "Ranking metrics use held-out rated items plus sampled unseen candidates; see paper for protocol.",
    }
    with open(OUTPUT_DIR / "experiment_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n==================== EXPERIMENT COMPLETE ====================")
    print("Selected alpha:", best_alpha)
    print("\nTest ranking metrics:")
    print(metrics_frame.to_string(index=False))
    print("\nCollaborative rating prediction errors (held-out ratings):")
    print(rating_errors)
    print("\nSaved files in:", OUTPUT_DIR)
    print(" - test_metrics.csv")
    print(" - rating_prediction_errors.csv")
    print(" - validation_alpha_tuning.csv")
    print(" - split_statistics.csv")
    print(" - hybrid_test_recommendations.csv")
    print(" - performance_comparison.png")
    print(" - catalog_coverage.png")
    print(" - chefai_hybrid_model.joblib")
    print(" - experiment_summary.json")
    print("\nUse the values in test_metrics.csv in your IEEE Results section.")
    print("Do not describe Precision/Recall/NDCG as classification accuracy.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("\nERROR:", exc)
        print("Check the step-by-step setup instructions and CSV filenames.")
        raise
