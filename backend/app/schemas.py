from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# OTP Authentication
class OTPRequest(BaseModel):
    identifier: str  # email or phone
    identifier_type: str  # 'email' or 'phone'
    
    @field_validator('identifier_type')
    def validate_identifier_type(cls, v):
        if v not in ['email', 'phone']:
            raise ValueError('identifier_type must be either "email" or "phone"')
        return v

class OTPVerification(BaseModel):
    identifier: str
    identifier_type: str
    otp_code: str
    name: Optional[str] = None  # for registration
    
    @field_validator('identifier_type')
    def validate_identifier_type(cls, v):
        if v not in ['email', 'phone']:
            raise ValueError('identifier_type must be either "email" or "phone"')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    profile_image: Optional[str] = None
    dietary_preference: Optional[str] = "none"
    allergies: Optional[str] = ""
    favorite_cuisine: Optional[str] = ""
    is_active: bool
    phone_verified: bool = False
    email_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()

# ─── Ingredients ─────────────────────────────────────────────────────────────

class IngredientOut(BaseModel):
    id: int
    name: str
    quantity: float
    unit: str

    class Config:
        from_attributes = True

class IngredientCreate(BaseModel):
    name: str
    quantity: float
    unit: str

# ─── Nutrition ───────────────────────────────────────────────────────────────

class NutritionOut(BaseModel):
    calories: float
    protein: float
    carbohydrates: float
    fat: float
    fiber: float
    sugar: float
    sodium: float
    vitamins: Optional[str] = ""

    class Config:
        from_attributes = True

# ─── Recipe ──────────────────────────────────────────────────────────────────

class RecipeOut(BaseModel):
    id: int
    name: str
    cuisine: str
    description: str
    preparation_time: int
    cooking_time: int
    difficulty: str
    servings: int
    image_url: str
    instructions: str
    tags: str
    is_ai_generated: bool
    created_at: datetime
    ingredients: List[IngredientOut] = []
    nutrition: Optional[NutritionOut] = None

    class Config:
        from_attributes = True

class RecipeSearch(BaseModel):
    dish_name: str
    servings: int = 2

# ─── Favorites ───────────────────────────────────────────────────────────────

class FavoriteCreate(BaseModel):
    recipe_id: int
    category: str = "General"

class FavoriteOut(BaseModel):
    id: int
    recipe_id: int
    category: str
    created_at: datetime
    recipe: RecipeOut

    class Config:
        from_attributes = True

# ─── Shopping List ───────────────────────────────────────────────────────────

class ShoppingItemCreate(BaseModel):
    ingredient_name: str
    quantity: str = ""

class ShoppingItemOut(BaseModel):
    id: int
    ingredient_name: str
    quantity: str
    is_checked: bool

    class Config:
        from_attributes = True

class ShoppingListCreate(BaseModel):
    name: str
    items: List[ShoppingItemCreate] = []

class ShoppingListOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    items: List[ShoppingItemOut] = []

    class Config:
        from_attributes = True

class ToggleItemCheck(BaseModel):
    is_checked: bool

# ─── Meal Plan ───────────────────────────────────────────────────────────────

class MealPlanCreate(BaseModel):
    date: str  # YYYY-MM-DD
    meal_type: str
    recipe_id: Optional[int] = None
    custom_meal: str = ""
    notes: str = ""

class MealPlanOut(BaseModel):
    id: int
    date: str
    meal_type: str
    recipe_id: Optional[int]
    custom_meal: str
    notes: str
    created_at: datetime
    recipe: Optional[RecipeOut] = None

    class Config:
        from_attributes = True

# ─── User Profile ────────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    dietary_preference: Optional[str] = None
    allergies: Optional[str] = None
    favorite_cuisine: Optional[str] = None
    profile_image: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class Auth0LoginRequest(BaseModel):
    email: EmailStr
    name: str
    sub: Optional[str] = None
    picture: Optional[str] = None

# ─── AI Requests ─────────────────────────────────────────────────────────────

class AIChatMessage(BaseModel):
    sender: str  # 'user' | 'assistant'
    text: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[AIChatMessage]] = []

class FridgeModeRequest(BaseModel):
    ingredients: List[str]

class SubstitutionRequest(BaseModel):
    ingredient: str
    context: str = ""

class MealPlanRequest(BaseModel):
    plan_type: str = "weekly"  # daily, weekly, monthly
    dietary_preference: str = "none"
    calories_target: int = 2000
    budget: str = "medium"

class LocationMealRequest(BaseModel):
    country: str
    city: str = ""
    meal_time: str = "any"  # breakfast, lunch, dinner, any
    dietary_preference: str = "none"

class LocationMealSuggestion(BaseModel):
    name: str
    cuisine: str
    description: str
    reason: str
    difficulty: str = "Medium"
    prep_time: int = 20

class SmartFridgeIngredient(BaseModel):
    name: str
    quantity: str = ""
    unit: str = ""
    category: str = "fridge"  # fridge, pantry, spices

class SmartFridgeRequest(BaseModel):
    ingredients: List[SmartFridgeIngredient]
    dietary_preference: str = "none"
    max_cooking_time: int = 60  # minutes

class SmartFridgeSuggestion(BaseModel):
    name: str
    matching_ingredients: List[str]
    missing_ingredients: List[str]
    estimated_calories: int = 0
    difficulty: str = "Medium"
    cooking_time: int = 30
    reason: str = ""

class RAGChatRequest(BaseModel):
    message: str
    history: Optional[List[AIChatMessage]] = []

class RAGChatResponse(BaseModel):
    message: str
    response: str
    sources: List[str] = []  # recipe names used as RAG context

class RecommendationRequest(BaseModel):
    based_on: str = "history"  # history, favorites, ingredients

# ─── Search History ──────────────────────────────────────────────────────────

class SearchHistoryOut(BaseModel):
    id: int
    keyword: str
    search_time: datetime

    class Config:
        from_attributes = True

# ─── Admin ───────────────────────────────────────────────────────────────────

class AdminUserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UpdateUserRole(BaseModel):
    role: str

class ToggleUserStatus(BaseModel):
    is_active: bool

# ─── Generic ─────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str

class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    data: list

# ─── Reviews ─────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    title: str
    review_text: str
    rating: int
    
    @field_validator('rating')
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

class ReviewOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    title: str
    review_text: str
    rating: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
