from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"

class DietaryPreference(str, enum.Enum):
    none = "none"
    vegetarian = "vegetarian"
    vegan = "vegan"
    keto = "keto"
    gluten_free = "gluten_free"
    dairy_free = "dairy_free"

class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"

# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    profile_image = Column(String(500), nullable=True)
    dietary_preference = Column(String(50), default="none")
    allergies = Column(Text, default="")
    favorite_cuisine = Column(String(100), default="")
    is_active = Column(Boolean, default=True)
    phone_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete")
    shopping_lists = relationship("ShoppingList", back_populates="user", cascade="all, delete")
    meal_plans = relationship("MealPlan", back_populates="user", cascade="all, delete")
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete")
    otp_requests = relationship("OTPRequest", back_populates="user", cascade="all, delete")
    reviews = relationship("Review", back_populates="user", cascade="all, delete")

# ─── Recipe ──────────────────────────────────────────────────────────────────

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    cuisine = Column(String(100), default="")
    description = Column(Text, default="")
    preparation_time = Column(Integer, default=0)   # minutes
    cooking_time = Column(Integer, default=0)       # minutes
    difficulty = Column(String(20), default="Medium")
    servings = Column(Integer, default=2)
    image_url = Column(String(500), default="")
    instructions = Column(Text, default="")         # JSON string
    tags = Column(Text, default="")                 # comma-separated
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete")
    nutrition = relationship("Nutrition", back_populates="recipe", uselist=False, cascade="all, delete")
    favorites = relationship("Favorite", back_populates="recipe", cascade="all, delete")
    meal_plans = relationship("MealPlan", back_populates="recipe")

# ─── Ingredient ──────────────────────────────────────────────────────────────

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    name = Column(String(200), nullable=False)
    quantity = Column(Float, default=0)
    unit = Column(String(50), default="")

    recipe = relationship("Recipe", back_populates="ingredients")

# ─── Nutrition ───────────────────────────────────────────────────────────────

class Nutrition(Base):
    __tablename__ = "nutrition"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), unique=True, nullable=False)
    calories = Column(Float, default=0)
    protein = Column(Float, default=0)
    carbohydrates = Column(Float, default=0)
    fat = Column(Float, default=0)
    fiber = Column(Float, default=0)
    sugar = Column(Float, default=0)
    sodium = Column(Float, default=0)
    vitamins = Column(Text, default="")  # JSON string

    recipe = relationship("Recipe", back_populates="nutrition")

# ─── Favorite ────────────────────────────────────────────────────────────────

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    category = Column(String(100), default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
    recipe = relationship("Recipe", back_populates="favorites")

# ─── Shopping List ───────────────────────────────────────────────────────────

class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="shopping_lists")
    items = relationship("ShoppingItem", back_populates="shopping_list", cascade="all, delete")

class ShoppingItem(Base):
    __tablename__ = "shopping_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("shopping_lists.id"), nullable=False)
    ingredient_name = Column(String(200), nullable=False)
    quantity = Column(String(100), default="")
    is_checked = Column(Boolean, default=False)

    shopping_list = relationship("ShoppingList", back_populates="items")

# ─── Meal Plan ───────────────────────────────────────────────────────────────

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(20), nullable=False)  # YYYY-MM-DD
    meal_type = Column(String(20), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    custom_meal = Column(String(200), default="")  # if no recipe_id
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="meal_plans")
    recipe = relationship("Recipe", back_populates="meal_plans")

# ─── Search History ──────────────────────────────────────────────────────────

class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    keyword = Column(String(200), nullable=False)
    search_time = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="search_history")

# ─── OTP Request ─────────────────────────────────────────────────────────────

class OTPRequest(Base):
    __tablename__ = "otp_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for first-time users
    identifier = Column(String(255), nullable=False, index=True)  # email or phone
    identifier_type = Column(String(10), nullable=False)  # 'email' or 'phone'
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(20), nullable=False, default="login")  # 'login', 'register', 'reset'
    is_used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="otp_requests")

# ─── Review ──────────────────────────────────────────────────────────────────

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    review_text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="reviews")

# Update User model to include reviews relationship
