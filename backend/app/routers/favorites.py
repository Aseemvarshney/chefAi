from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("/", response_model=List[schemas.FavoriteOut])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == current_user.id)
        .order_by(models.Favorite.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.FavoriteOut, status_code=201)
def add_favorite(
    data: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Verify recipe exists
    recipe = db.query(models.Recipe).filter(models.Recipe.id == data.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Check not already favorited
    existing = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.user_id == current_user.id,
            models.Favorite.recipe_id == data.recipe_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Recipe already in favorites")

    fav = models.Favorite(
        user_id=current_user.id,
        recipe_id=data.recipe_id,
        category=data.category,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{favorite_id}", response_model=schemas.MessageResponse)
def remove_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    fav = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.id == favorite_id,
            models.Favorite.user_id == current_user.id,
        )
        .first()
    )
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
    return {"message": "Removed from favorites"}


@router.get("/check/{recipe_id}")
def check_favorite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    fav = (
        db.query(models.Favorite)
        .filter(
            models.Favorite.user_id == current_user.id,
            models.Favorite.recipe_id == recipe_id,
        )
        .first()
    )
    return {"is_favorite": fav is not None, "favorite_id": fav.id if fav else None}
