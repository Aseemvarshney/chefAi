from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.get("/", response_model=schemas.UserOut)
def get_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/", response_model=schemas.UserOut)
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.name is not None:
        current_user.name = data.name
    if data.dietary_preference is not None:
        current_user.dietary_preference = data.dietary_preference
    if data.allergies is not None:
        current_user.allergies = data.allergies
    if data.favorite_cuisine is not None:
        current_user.favorite_cuisine = data.favorite_cuisine
    if data.profile_image is not None:
        current_user.profile_image = data.profile_image

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", response_model=schemas.MessageResponse)
def change_password(
    data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get user statistics for dashboard."""
    favorites_count = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id).count()
    searches_count = db.query(models.SearchHistory).filter(models.SearchHistory.user_id == current_user.id).count()
    meal_plans_count = db.query(models.MealPlan).filter(models.MealPlan.user_id == current_user.id).count()
    grocery_lists_count = db.query(models.ShoppingList).filter(models.ShoppingList.user_id == current_user.id).count()

    return {
        "favorites": favorites_count,
        "searches": searches_count,
        "meal_plans": meal_plans_count,
        "grocery_lists": grocery_lists_count,
    }
