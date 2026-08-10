from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from typing import List

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=schemas.ReviewOut)
def create_review(
    review_data: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new review"""
    # Create the review
    review = models.Review(
        user_id=current_user.id,
        title=review_data.title,
        review_text=review_data.review_text,
        rating=review_data.rating
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Return review with user name
    return schemas.ReviewOut(
        id=review.id,
        user_id=review.user_id,
        user_name=current_user.name,
        title=review.title,
        review_text=review.review_text,
        rating=review.rating,
        created_at=review.created_at,
        updated_at=review.updated_at
    )


@router.get("/")
def get_reviews(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all reviews with pagination"""
    # Get reviews with user names
    reviews_query = (
        db.query(models.Review, models.User.name)
        .join(models.User, models.Review.user_id == models.User.id)
        .order_by(desc(models.Review.created_at))
        .offset(skip)
        .limit(limit)
    )
    
    reviews_data = reviews_query.all()
    
    # Format the response
    reviews = []
    for review, user_name in reviews_data:
        reviews.append(schemas.ReviewOut(
            id=review.id,
            user_id=review.user_id,
            user_name=user_name,
            title=review.title,
            review_text=review.review_text,
            rating=review.rating,
            created_at=review.created_at,
            updated_at=review.updated_at
        ))
    
    # Get total count
    total = db.query(models.Review).count()
    
    return {
        "reviews": reviews,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/my")
def get_my_reviews(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's reviews"""
    reviews = (
        db.query(models.Review)
        .filter(models.Review.user_id == current_user.id)
        .order_by(desc(models.Review.created_at))
        .all()
    )
    
    reviews_out = []
    for review in reviews:
        reviews_out.append(schemas.ReviewOut(
            id=review.id,
            user_id=review.user_id,
            user_name=current_user.name,
            title=review.title,
            review_text=review.review_text,
            rating=review.rating,
            created_at=review.created_at,
            updated_at=review.updated_at
        ))
    
    return {"reviews": reviews_out}


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a review (only by owner or admin)"""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user owns the review or is admin
    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}


@router.get("/stats")
def get_review_stats(db: Session = Depends(get_db)):
    """Get review statistics"""
    from sqlalchemy import func
    
    stats = db.query(
        func.count(models.Review.id).label('total_reviews'),
        func.avg(models.Review.rating).label('average_rating'),
        func.count(func.distinct(models.Review.user_id)).label('unique_reviewers')
    ).first()
    
    # Get rating distribution
    rating_dist = db.query(
        models.Review.rating,
        func.count(models.Review.id).label('count')
    ).group_by(models.Review.rating).all()
    
    rating_distribution = {f"{r.rating}_star": r.count for r in rating_dist}
    
    return {
        "total_reviews": stats.total_reviews or 0,
        "average_rating": round(stats.average_rating or 0, 2),
        "unique_reviewers": stats.unique_reviewers or 0,
        "rating_distribution": rating_distribution
    }