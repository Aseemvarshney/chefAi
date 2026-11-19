from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import create_tables
from app.routers import auth, recipes, favorites, grocery, meal_plans, profile, ai, admin, reviews

app = FastAPI(
    title="ChefAI API",
    description="AI-Powered Personalized Cooking Assistant Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Startup ─────────────────────────────────────────────────────────────────
def seed_initial_data():
    from app.database import SessionLocal
    from app import models
    from app.auth import hash_password
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            admin_user = models.User(
                name="aseem",
                email="aseem@test.com",
                password=hash_password("admin123"),
                role="admin",
                email_verified=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("[ChefAI] Seeded default admin user: aseem@test.com / admin123")
    except Exception as e:
        print(f"[ChefAI] Seed note: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    create_tables()
    print("[ChefAI] Database tables created/verified")
    seed_initial_data()
    print(f"[ChefAI] Gemini AI: {'ENABLED' if settings.GEMINI_API_KEY else 'MOCK MODE (add GEMINI_API_KEY to .env for real AI)'}")

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(recipes.router, prefix="/api/v1")
app.include_router(favorites.router, prefix="/api/v1")
app.include_router(grocery.router, prefix="/api/v1")
app.include_router(meal_plans.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": "ChefAI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health")
def health():
    return {"status": "healthy", "ai_mode": "gemini" if settings.GEMINI_API_KEY else "mock"}
