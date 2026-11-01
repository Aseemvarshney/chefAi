from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services import gemini_service, rag_service

router = APIRouter(prefix="/ai", tags=["AI Features"])


@router.post("/chat")
async def ai_chat(
    data: schemas.AIChatRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Chat with the AI Assistant — ask any question."""
    response_text = await gemini_service.chat_with_assistant(
        message=data.message,
        history=data.history,
        user_name=current_user.name if current_user else "Chef",
        persona=data.persona or "auguste",
    )
    return {"message": data.message, "response": response_text}


@router.post("/fridge-mode")
async def fridge_mode(
    data: schemas.FridgeModeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Suggest recipes from available ingredients."""
    suggestions = await gemini_service.get_fridge_suggestions(data.ingredients)
    return {"ingredients_provided": data.ingredients, "suggestions": suggestions}


@router.post("/substitution")
async def ingredient_substitution(
    data: schemas.SubstitutionRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Get substitution options for an ingredient."""
    subs = await gemini_service.get_ingredient_substitutions(data.ingredient, data.context)
    return {"ingredient": data.ingredient, "substitutions": subs}


@router.post("/meal-plan-ai")
async def ai_meal_plan(
    data: schemas.MealPlanRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an AI-powered meal plan."""
    dietary = current_user.dietary_preference or data.dietary_preference
    plan = await gemini_service.generate_meal_plan(
        plan_type=data.plan_type,
        dietary_pref=dietary,
        calories=data.calories_target,
        budget=data.budget,
    )
    return plan


@router.get("/recommendations")
async def recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get personalized recipe recommendations."""
    # Get recent search history
    history = (
        db.query(models.SearchHistory)
        .filter(models.SearchHistory.user_id == current_user.id)
        .order_by(models.SearchHistory.search_time.desc())
        .limit(5)
        .all()
    )
    history_keywords = [h.keyword for h in history]

    # Get favorite recipe names
    favs = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == current_user.id)
        .limit(5)
        .all()
    )
    fav_names = [f.recipe.name for f in favs if f.recipe]

    recs = await gemini_service.get_recommendations(
        search_history=history_keywords,
        favorites=fav_names,
        dietary_pref=current_user.dietary_preference or "none",
    )
    return {"recommendations": recs}


@router.get("/cooking-tips/{recipe_id}")
async def cooking_tips(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get AI cooking tips for a recipe."""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        return {"tips": ["Always taste as you cook!", "Prep all ingredients before starting.", "Use fresh ingredients for best results."]}

    tips = [
        f"For perfect {recipe.name}, ensure all ingredients are at room temperature.",
        f"The key to great {recipe.cuisine} cooking is balancing spices.",
        "Don't rush the cooking process — patience yields the best results.",
        "Taste and adjust seasoning at every stage.",
        "Use fresh herbs for garnish to brighten the flavors.",
    ]
    return {"recipe": recipe.name, "tips": tips}


@router.post("/location-meals")
async def location_meals(
    data: schemas.LocationMealRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Get location-aware meal suggestions."""
    suggestions = await gemini_service.get_location_meals(
        country=data.country,
        city=data.city,
        meal_time=data.meal_time,
        dietary_pref=data.dietary_preference or (current_user.dietary_preference if current_user else "none"),
    )
    return {"country": data.country, "city": data.city, "suggestions": suggestions}


@router.post("/smart-fridge")
async def smart_fridge(
    data: schemas.SmartFridgeRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Enhanced smart fridge suggestions factoring in categories, limits, and nutrition."""
    dietary = data.dietary_preference if data.dietary_preference != "none" else (current_user.dietary_preference if current_user else "none")
    suggestions = await gemini_service.get_smart_fridge_suggestions(
        ingredients=data.ingredients,
        dietary_pref=dietary,
        max_cooking_time=data.max_cooking_time,
    )
    return {
        "ingredients": data.ingredients,
        "dietary_preference": dietary,
        "max_cooking_time": data.max_cooking_time,
        "suggestions": suggestions,
    }


@router.post("/rag-chat", response_model=schemas.RAGChatResponse)
async def rag_chat(
    data: schemas.RAGChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """RAG-enhanced AI chat grounded in user's saved recipes."""
    user_id = current_user.id if current_user else None
    context_text, source_names = rag_service.build_rag_context(
        query=data.message,
        db=db,
        user_id=user_id,
    )
    response_text = await gemini_service.rag_chat(
        message=data.message,
        context=context_text,
        history=data.history,
        user_name=current_user.name if current_user else "Chef",
        persona=data.persona or "auguste",
    )
    return schemas.RAGChatResponse(
        message=data.message,
        response=response_text,
        sources=source_names,
    )

