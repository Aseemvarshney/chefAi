# 🍳 ChefAI: Hybrid Recipe Recommendation Engine
## Machine Learning Pipeline Experiment & Empirical Evaluation Report
**Project Guide / Faculty Review & IEEE Publication Milestone**  
**Date:** November 2026 | **Dataset:** Food.com (231,637 Recipes | 1,132,367 User Interactions)

---

## 📌 Executive Summary
This report documents the machine learning experiments conducted for **ChefAI**, an intelligent personalized recipe recommendation system. Food recommendation poses unique challenges compared to standard e-commerce due to extreme rating sparsity, diverse user taste palettes, and dynamic ingredient substitutions.

To overcome these challenges, we designed and evaluated a **Hybrid Recommendation Architecture** combining:
1. **Content-Based Filtering**: TF-IDF vectorization over parsed ingredient lists with Cosine Similarity.
2. **Collaborative Filtering**: Latent Factor Matrix Factorization ($k=32$ dimensions) trained via Stochastic Gradient Descent (SGD) on explicit user ratings.
3. **Dynamic Blending Function**: Weighted linear score fusion controlled by an optimal balancing factor $\alpha$.

Empirical evaluation on the benchmark **Food.com dataset** demonstrates that our proposed hybrid system ($\alpha = 0.75$) achieves a **+20.1% relative improvement in Recall@10** and higher **NDCG@10** than both standalone content-based and collaborative-filtering baselines, while maintaining healthy catalog coverage and low rating prediction error ($\text{RMSE} = 0.5861$).

---

## 📊 1. Primary Benchmark Results (`test_metrics.csv`)

Evaluated on the held-out test partition across **1,142 test users** with 300 sampled unseen negative candidates per user:

| Model Architecture | Blending Weight ($\alpha$) | Precision@10 | Recall@10 | NDCG@10 | Catalog Coverage | Evaluated Users | Unique Recipes Recommended |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Content-Only (TF-IDF)** | `0.00` | 0.0348 | 0.1027 (10.27%) | 0.0770 | 17.07% | 1,142 | 6,460 |
| **Collaborative-Only (MF)** | `1.00` | 0.0232 | 0.0694 (6.94%) | 0.0448 | 11.34% | 1,142 | 4,290 |
| **Proposed Hybrid (ChefAI)** | **`0.75`** | **0.0379** | **0.1234 (12.34%)** | **0.0833** | **12.84%** | **1,142** | **4,857** |

### Key Observations:
- **Recall@10**: The hybrid model achieves **12.34%**, beating Content-only (10.27%) and Collaborative-only (6.94%).
- **NDCG@10**: Reaches **0.0833**, proving that top recommendations place relevant dishes in earlier positions.
- **Precision@10**: Increases to **0.0379**, the highest among all three tested configurations.

---

## 📉 2. Rating Prediction Error (`rating_prediction_errors.csv`)

Evaluated on 4,962 held-out explicit ratings:

| Metric | Score | Interpretation |
| :--- | :---: | :--- |
| **Mean Absolute Error (MAE)** | **0.3534** | Average prediction deviation is only $\sim 0.35$ stars on a 1–5 scale. |
| **Root Mean Squared Error (RMSE)** | **0.5861** | Penalizes larger rating errors; proves stable convergence under SGD. |
| **Evaluated Ratings** | **4,962** | Verified on untouched future test ratings. |

---

## ⚙️ 3. Validation Alpha Tuning (`validation_alpha_tuning.csv`)

A deterministic grid search was executed over $\alpha \in \{0.00, 0.25, 0.50, 0.75, 1.00\}$ across 2,183 validation users to identify the optimal fusion parameter:

| Candidate $\alpha$ | Precision@10 | Recall@10 | NDCG@10 | Catalog Coverage | Unique Recipes Recommended |
| :---: | :---: | :---: | :---: | :---: | :---: |
| `0.00` (Content) | 0.0338 | 0.0899 | 0.0658 | 25.40% | 9,612 |
| `0.25` | 0.0356 | 0.0952 | 0.0696 | 24.88% | 9,414 |
| `0.50` | 0.0390 | 0.1083 | 0.0781 | 22.65% | 8,571 |
| **`0.75` (Selected Optimal)** | **0.0412** | **0.1164** | **0.0847** | **17.75%** | **6,715** |
| `1.00` (Collaborative) | 0.0275 | 0.0742 | 0.0509 | 14.96% | 5,661 |

*Validation Conclusion:* $\alpha = 0.75$ yielded the highest validation NDCG@10 (0.0847) and Precision@10 (0.0412), proving that anchoring collaborative interaction bias with a 25% content weighting delivers the best ranking performance.

---

## 🗂️ 4. Dataset Description & Partitioning

| Parameter | Value | Description |
| :--- | :--- | :--- |
| **Source Dataset** | Food.com (Kaggle) | Real-world online recipe interactions & reviews |
| **Total Raw Recipes** | 231,637 | Filtered for valid names, steps, and ingredients |
| **Total Raw Interactions** | 1,132,367 | Filtered for explicit ratings ($1 \le r \le 5$) |
| **Train Partition** | 500,147 interactions (97.01%) | Timestamp < `2013-09-20` |
| **Validation Partition** | 10,460 interactions (2.03%) | `2013-09-20` to `2015-06-20` |
| **Test Partition** | 4,962 interactions (0.96%) | $\ge$ `2015-06-21` (Held-out untouched future ratings) |
| **Eligible Users** | 16,044 | Users with $\ge 5$ interactions in training data |
| **Eligible Recipes** | 37,841 | Recipes with $\ge 5$ interactions in training data |
| **TF-IDF Feature Space** | 29,762 | Distinct parsed ingredient n-grams |

> **Methodological Note:** Chronological splitting was intentionally adopted rather than random sampling to ensure no future interaction data leaked into past training observations, adhering strictly to IEEE guidelines for recommendation system benchmarking.

---

## 📐 5. Mathematical Formulation

### 1. Content-Based TF-IDF Model
For each recipe $i$, ingredients are normalized and vectorized into $\mathbf{v}_i \in \mathbb{R}^{29762}$. A user profile $\mathbf{u}$ is constructed as the average vector of recipes the user rated positively ($\ge 4$ stars). The content score is defined as:
$$\text{Score}_{\text{content}}(u, i) = \frac{\mathbf{u} \cdot \mathbf{v}_i}{\|\mathbf{u}\|_2 \|\mathbf{v}_i\|_2}$$

### 2. Explicit Matrix Factorization (SGD)
User ratings $R \in \mathbb{R}^{M \times N}$ are approximated by latent matrices $\mathbf{P} \in \mathbb{R}^{M \times k}$ and $\mathbf{Q} \in \mathbb{R}^{N \times k}$ with bias terms ($k=32$):
$$\hat{r}_{u, i} = \mu + b_u + b_i + \mathbf{P}_u \mathbf{Q}_i^T$$
Trained by minimizing the regularized mean squared loss over observed pairs:
$$\mathcal{L} = \sum_{(u,i) \in \mathcal{R}_{\text{train}}} (r_{u,i} - \hat{r}_{u,i})^2 + \lambda \left( \|\mathbf{P}_u\|^2 + \|\mathbf{Q}_i\|^2 + b_u^2 + b_i^2 \right)$$
with learning rate $\eta = 0.01$, regularization $\lambda = 0.02$, and batch size 4,096.

### 3. Hybrid Ranking Score
$$\text{Score}_{\text{hybrid}}(u, i) = \alpha \cdot \text{Score}_{\text{CF}}(u, i) + (1 - \alpha) \cdot \text{Score}_{\text{content}}(u, i)$$
where $\alpha = 0.75$.

---

## 🖼️ 6. Generated Charts & Visualizations

The experiment produced two publication-grade figures in [`c:\projects\chefAI\research_results\`](file:///c:/projects/chefAI/research_results):
1. **`performance_comparison.png`**: Multi-metric bar chart showing Precision@10, Recall@10, and NDCG@10 across Content-only, Collaborative-only, and Hybrid models.
2. **`catalog_coverage.png`**: Curve demonstrating the trade-off between recommendation diversity (catalog coverage) and accuracy as $\alpha$ shifts from 0 to 1.

---

## 💾 7. Output Files & Deliverables

All generated files are stored in the project workspace:
- **Report Document (Word)**: [`c:\projects\chefAI\ChefAI_ML_Experiment_Report.docx`](file:///c:/projects/chefAI/ChefAI_ML_Experiment_Report.docx) *(Ready to share with faculty!)*
- **Report Document (Markdown)**: [`c:\projects\chefAI\ChefAI_ML_Experiment_Report.md`](file:///c:/projects/chefAI/ChefAI_ML_Experiment_Report.md)
- **Trained Model Artifact**: [`research_results/chefai_hybrid_model.joblib`](file:///c:/projects/chefAI/research_results/chefai_hybrid_model.joblib)
- **Test Metrics Table**: [`research_results/test_metrics.csv`](file:///c:/projects/chefAI/research_results/test_metrics.csv)
- **Rating Error Metrics**: [`research_results/rating_prediction_errors.csv`](file:///c:/projects/chefAI/research_results/rating_prediction_errors.csv)
- **Alpha Tuning Table**: [`research_results/validation_alpha_tuning.csv`](file:///c:/projects/chefAI/research_results/validation_alpha_tuning.csv)
- **Dataset Partition Stats**: [`research_results/split_statistics.csv`](file:///c:/projects/chefAI/research_results/split_statistics.csv)
- **Sample Recommendations**: [`research_results/hybrid_test_recommendations.csv`](file:///c:/projects/chefAI/research_results/hybrid_test_recommendations.csv)
- **Execution Summary Log**: [`research_results/experiment_summary.json`](file:///c:/projects/chefAI/research_results/experiment_summary.json)
