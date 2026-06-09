from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.config import settings
from .core.database import Base, engine
from .api import auth, users, rooms, scripts, hosts, host_schedules, sessions, bookings, orders


def create_tables():
    Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="剧本杀门店拼团成局与主持排班系统",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(rooms.router, prefix=api_prefix)
app.include_router(scripts.router, prefix=api_prefix)
app.include_router(hosts.router, prefix=api_prefix)
app.include_router(host_schedules.router, prefix=api_prefix)
app.include_router(sessions.router, prefix=api_prefix)
app.include_router(bookings.router, prefix=api_prefix)
app.include_router(orders.router, prefix=api_prefix)


@app.get("/")
def root():
    return {
        "message": "剧本杀门店管理系统 API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
