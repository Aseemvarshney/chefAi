from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services import gemini_service

router = APIRouter(prefix="/recipes", tags=["Recipes"])


def _save_recipe_to_db(db: Session, data: dict, servings: int) -> models.Recipe:
    """Save AI-generated recipe to database and return the model."""
    recipe = models.Recipe(
        name=data["name"],
        cuisine=data.get("cuisine", ""),
        description=data.get("description", ""),
        preparation_time=data.get("preparation_time", 0),
        cooking_time=data.get("cooking_time", 0),
        difficulty=data.get("difficulty", "Medium"),
        servings=servings,
        image_url=data.get("image_url", ""),
        instructions=data.get("instructions", "[]"),
        tags=data.get("tags", ""),
        is_ai_generated=True,
    )
    db.add(recipe)
    db.flush()

    # Save ingredients
    for ing in data.get("ingredients", []):
        ingredient = models.Ingredient(
            recipe_id=recipe.id,
            name=ing["name"],
            quantity=float(ing.get("quantity", 0)),
            unit=ing.get("unit", ""),
        )
        db.add(ingredient)

    # Save nutrition
    nutr = data.get("nutrition", {})
    nutrition = models.Nutrition(
        recipe_id=recipe.id,
        calories=float(nutr.get("calories", 0)),
        protein=float(nutr.get("protein", 0)),
        carbohydrates=float(nutr.get("carbohydrates", 0)),
        fat=float(nutr.get("fat", 0)),
        fiber=float(nutr.get("fiber", 0)),
        sugar=float(nutr.get("sugar", 0)),
        sodium=float(nutr.get("sodium", 0)),
        vitamins=nutr.get("vitamins", "{}") if isinstance(nutr.get("vitamins"), str) else json.dumps(nutr.get("vitamins", {})),
    )
    db.add(nutrition)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.post("/search", response_model=schemas.RecipeOut)
async def search_recipe(
    search: schemas.RecipeSearch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    dish_name = search.dish_name.strip()

    # Save to search history
    history = models.SearchHistory(user_id=current_user.id, keyword=dish_name)
    db.add(history)
    db.commit()

    # Check if same recipe already cached in DB (same name + servings)
    existing = (
        db.query(models.Recipe)
        .filter(
            models.Recipe.name.ilike(f"%{dish_name}%"),
            models.Recipe.servings == search.servings,
            models.Recipe.is_ai_generated == True,
        )
        .first()
    )
    if existing:
        return existing

    # Generate with AI
    data = await gemini_service.generate_recipe(dish_name, search.servings)
    recipe = _save_recipe_to_db(db, data, search.servings)
    return recipe


@router.get("/", response_model=List[schemas.RecipeOut])
def list_recipes(
    skip: int = 0,
    limit: int = 20,
    cuisine: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Recipe)
    if cuisine:
        query = query.filter(models.Recipe.cuisine.ilike(f"%{cuisine}%"))
    if difficulty:
        query = query.filter(models.Recipe.difficulty == difficulty)
    return query.offset(skip).limit(limit).all()


@router.get("/trending", response_model=List[schemas.RecipeOut])
def trending_recipes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return most recently generated recipes as trending."""
    return db.query(models.Recipe).order_by(models.Recipe.created_at.desc()).limit(8).all()


@router.get("/history", response_model=List[schemas.SearchHistoryOut])
def search_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.SearchHistory)
        .filter(models.SearchHistory.user_id == current_user.id)
        .order_by(models.SearchHistory.search_time.desc())
        .limit(10)
        .all()
    )


@router.delete("/history", response_model=schemas.MessageResponse)
def clear_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.SearchHistory).filter(models.SearchHistory.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Search history cleared"}


@router.get("/{recipe_id}", response_model=schemas.RecipeOut)
def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe
