from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/meal-plans", tags=["Meal Planner"])


@router.get("/", response_model=List[schemas.MealPlanOut])
def get_meal_plans(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.MealPlan).filter(models.MealPlan.user_id == current_user.id)
    if start_date:
        query = query.filter(models.MealPlan.date >= start_date)
    if end_date:
        query = query.filter(models.MealPlan.date <= end_date)
    return query.order_by(models.MealPlan.date.asc()).all()


@router.post("/", response_model=schemas.MealPlanOut, status_code=201)
def create_meal_plan(
    data: schemas.MealPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # If recipe_id provided, verify it exists
    if data.recipe_id:
        recipe = db.query(models.Recipe).filter(models.Recipe.id == data.recipe_id).first()
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")

    # Check if a plan already exists for this date + meal_type
    existing = db.query(models.MealPlan).filter(
        models.MealPlan.user_id == current_user.id,
        models.MealPlan.date == data.date,
        models.MealPlan.meal_type == data.meal_type,
    ).first()
    if existing:
        # Update existing
        existing.recipe_id = data.recipe_id
        existing.custom_meal = data.custom_meal
        existing.notes = data.notes
        db.commit()
        db.refresh(existing)
        return existing

    plan = models.MealPlan(
        user_id=current_user.id,
        date=data.date,
        meal_type=data.meal_type,
        recipe_id=data.recipe_id,
        custom_meal=data.custom_meal,
        notes=data.notes,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", response_model=schemas.MessageResponse)
def delete_meal_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plan = db.query(models.MealPlan).filter(
        models.MealPlan.id == plan_id,
        models.MealPlan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    db.delete(plan)
    db.commit()
    return {"message": "Meal plan deleted"}


@router.get("/week/{week_start}", response_model=List[schemas.MealPlanOut])
def get_week_plan(
    week_start: str,  # YYYY-MM-DD (Monday)
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get all meal plans for a 7-day week starting from week_start."""
    from datetime import date, timedelta
    try:
        start = date.fromisoformat(week_start)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    end = start + timedelta(days=6)
    return (
        db.query(models.MealPlan)
        .filter(
            models.MealPlan.user_id == current_user.id,
            models.MealPlan.date >= week_start,
            models.MealPlan.date <= end.isoformat(),
        )
        .order_by(models.MealPlan.date.asc())
        .all()
    )
