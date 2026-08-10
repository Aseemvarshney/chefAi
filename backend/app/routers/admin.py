from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[schemas.AdminUserOut])
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    return db.query(models.User).offset(skip).limit(limit).all()


@router.patch("/users/{user_id}/role", response_model=schemas.MessageResponse)
def update_user_role(
    user_id: int,
    data: schemas.UpdateUserRole,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user.role = data.role
    db.commit()
    return {"message": f"User role updated to {data.role}"}


@router.patch("/users/{user_id}/status", response_model=schemas.MessageResponse)
def toggle_user_status(
    user_id: int,
    data: schemas.ToggleUserStatus,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = data.is_active
    db.commit()
    status = "activated" if data.is_active else "deactivated"
    return {"message": f"User {status} successfully"}


@router.delete("/users/{user_id}", response_model=schemas.MessageResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    return {
        "total_users": db.query(models.User).count(),
        "active_users": db.query(models.User).filter(models.User.is_active == True).count(),
        "total_recipes": db.query(models.Recipe).count(),
        "ai_generated_recipes": db.query(models.Recipe).filter(models.Recipe.is_ai_generated == True).count(),
        "total_favorites": db.query(models.Favorite).count(),
        "total_shopping_lists": db.query(models.ShoppingList).count(),
        "total_meal_plans": db.query(models.MealPlan).count(),
        "total_searches": db.query(models.SearchHistory).count(),
    }
