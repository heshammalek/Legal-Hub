# backend/app/api/v1/__init__.py

from fastapi import APIRouter
from app.api.v1.endpoints import auth, user, nearby, emergency

api_router = APIRouter()
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(user.router, tags=["User"])
api_router.include_router(nearby.router, tags=["Location"])
api_router.include_router(emergency.router, tags=["Emergency"])


# أضف routers أخرى حسب الحاجة
# api_router.include_router(lawyer.router, tags=["Lawyer"])
# api_router.include_router(judge.router, tags=["Judge"])
# api_router.include_router(expert.router, tags=["Expert"])
# api_router.include_router(admin.router, tags=["Admin"])