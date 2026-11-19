# 🍳 ChefAI – AI-Powered Personalized Cooking Assistant

An intelligent full-stack cooking web app powered by **Python FastAPI + React + PostgreSQL / SQLite + AI**.

---

## 🐳 Run with Docker (Recommended - 1 Command)

Docker containerizes the **Frontend (React + Nginx)**, **Backend (FastAPI)**, and **Database (PostgreSQL)** with persistent storage and zero configuration:

```bash
docker compose up --build -d
```

| Service | Container URL | Purpose |
|---|---|---|
| 🌐 **Frontend** | [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost) | React SPA served via Nginx |
| 🔧 **Backend** | [http://localhost:8000](http://localhost:8000) | FastAPI REST API |
| 📖 **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI |
| 🐘 **Database** | `localhost:5432` | PostgreSQL 16 with persistent volume |

Default Login:
- **Email:** `aseem@test.com`
- **Password:** `admin123`

To stop:
```bash
docker compose down
```

---

## ⚡ Local Development Quick Start (Without Docker)

### Step 1 – Start the Backend
```bash
cd backend
# First time only:
pip install fastapi uvicorn sqlalchemy python-jose passlib python-multipart python-dotenv google-generativeai pydantic[email] aiosqlite bcrypt

# Run:
python run.py
```
Backend runs at → **http://localhost:8000**  
API Docs at → **http://localhost:8000/docs**

### Step 2 – Start the Frontend
```bash
cd frontend
npm install   # first time only
npm run dev
```
Frontend runs at → **http://localhost:5173**

### Step 3 – Open the App
Visit **http://localhost:5173** → Register an account → Start cooking! 🎉

---

## 🤖 Enable Real AI (Optional)

1. Get a **free** Gemini API key at https://ai.google.dev
2. Open `backend/.env` and add:
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Restart the backend

> Without an API key, the app uses **smart mock responses** and is fully functional!

---

## 📁 Project Structure

```
ChefAI/
├── backend/           ← Python FastAPI
│   ├── app/
│   │   ├── routers/   ← auth, recipes, favorites, grocery, meal_plans, profile, ai, admin
│   │   ├── services/  ← gemini_service.py (AI + mock)
│   │   ├── models.py  ← SQLAlchemy ORM (8 tables)
│   │   ├── schemas.py ← Pydantic validation
│   │   ├── auth.py    ← JWT security
│   │   └── main.py    ← FastAPI app
│   ├── .env           ← Config (edit to add Gemini key)
│   └── run.py
│
├── frontend/          ← React + Vite + TailwindCSS
│   └── src/
│       ├── pages/     ← Dashboard, RecipeDetail, Favorites, Grocery, MealPlanner, FridgeMode, Profile, Admin
│       ├── components/← Navbar, RecipeCard
│       ├── context/   ← AuthContext
│       └── services/  ← api.js (Axios)
│
└── database/
    ├── schema.sql
    └── sample_data.sql
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Register, login, JWT, password change |
| 🔍 Recipe Search | Search any dish → AI generates full recipe |
| 🤖 AI Recipe Gen | Ingredients, steps, nutrition, tips |
| ❤️ Favorites | Save, categorize, view saved recipes |
| 🛒 Grocery Lists | Auto-generate from recipe or manual |
| 📅 Meal Planner | Weekly calendar + AI meal plan |
| 🧊 Fridge Mode | Enter available ingredients → get recipes |
| 📊 Nutrition | Donut chart with macros per serving |
| ↔️ Substitutions | AI ingredient substitution suggestions |
| ⚙️ Admin Panel | User management, stats dashboard |

---

## 🔑 Default Admin Account

Register any account, then manually update in SQLite:
```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS v4 |
| Backend | Python 3.10+ + FastAPI |
| Database | SQLite (auto-created, zero setup!) |
| Auth | JWT tokens (7-day expiry) |
| AI | Google Gemini API (with mock fallback) |
| Charts | Recharts (nutrition pie chart) |
| Icons | Lucide React + Emoji |
