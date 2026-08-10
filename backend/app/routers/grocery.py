from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/grocery", tags=["Grocery List"])


@router.get("/", response_model=List[schemas.ShoppingListOut])
def get_lists(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.ShoppingList)
        .filter(models.ShoppingList.user_id == current_user.id)
        .order_by(models.ShoppingList.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.ShoppingListOut, status_code=201)
def create_list(
    data: schemas.ShoppingListCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    shopping_list = models.ShoppingList(user_id=current_user.id, name=data.name)
    db.add(shopping_list)
    db.flush()

    for item_data in data.items:
        item = models.ShoppingItem(
            list_id=shopping_list.id,
            ingredient_name=item_data.ingredient_name,
            quantity=item_data.quantity,
        )
        db.add(item)

    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.post("/{list_id}/items", response_model=schemas.ShoppingItemOut, status_code=201)
def add_item(
    list_id: int,
    item_data: schemas.ShoppingItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    shopping_list = db.query(models.ShoppingList).filter(
        models.ShoppingList.id == list_id,
        models.ShoppingList.user_id == current_user.id
    ).first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")

    item = models.ShoppingItem(
        list_id=list_id,
        ingredient_name=item_data.ingredient_name,
        quantity=item_data.quantity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{list_id}/items/{item_id}", response_model=schemas.ShoppingItemOut)
def toggle_item(
    list_id: int,
    item_id: int,
    data: schemas.ToggleItemCheck,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.ShoppingItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingItem.id == item_id,
            models.ShoppingList.id == list_id,
            models.ShoppingList.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.is_checked = data.is_checked
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{list_id}/items/{item_id}", response_model=schemas.MessageResponse)
def delete_item(
    list_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    item = (
        db.query(models.ShoppingItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingItem.id == item_id,
            models.ShoppingList.id == list_id,
            models.ShoppingList.user_id == current_user.id,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}


@router.delete("/{list_id}", response_model=schemas.MessageResponse)
def delete_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    shopping_list = db.query(models.ShoppingList).filter(
        models.ShoppingList.id == list_id,
        models.ShoppingList.user_id == current_user.id
    ).first()
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    db.delete(shopping_list)
    db.commit()
    return {"message": "Shopping list deleted"}


@router.post("/from-recipe/{recipe_id}", response_model=schemas.ShoppingListOut, status_code=201)
def create_list_from_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Auto-generate a shopping list from a recipe's ingredients."""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    shopping_list = models.ShoppingList(
        user_id=current_user.id,
        name=f"Ingredients for {recipe.name}"
    )
    db.add(shopping_list)
    db.flush()

    for ing in recipe.ingredients:
        item = models.ShoppingItem(
            list_id=shopping_list.id,
            ingredient_name=ing.name,
            quantity=f"{ing.quantity} {ing.unit}".strip(),
        )
        db.add(item)

    db.commit()
    db.refresh(shopping_list)
    return shopping_list
