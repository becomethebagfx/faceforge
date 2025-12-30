"""FaceForge API - Main application entry point."""

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import get_settings
from core.exceptions import FaceForgeError
from api.routes import health, upload, process, websocket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    settings = get_settings()

    # Startup
    logger.info(f"Starting {settings.api_title} v{settings.api_version}")

    # Ensure required directories exist
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directory: {settings.upload_dir.absolute()}")
    logger.info(f"Output directory: {settings.output_dir.absolute()}")

    yield

    # Shutdown
    logger.info("Shutting down FaceForge API")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        description=settings.api_description,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

    # Global exception handler for custom exceptions
    @app.exception_handler(FaceForgeError)
    async def faceforge_exception_handler(
        request: Request,
        exc: FaceForgeError,
    ) -> JSONResponse:
        """Handle FaceForge custom exceptions."""
        logger.error(f"FaceForgeError: {exc.message}", extra={"details": exc.details})
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.message,
                "details": exc.details,
            },
        )

    # General exception handler
    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Handle unexpected exceptions."""
        logger.exception(f"Unhandled exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "details": {"message": str(exc)} if settings.debug else {},
            },
        )

    # Include routers
    app.include_router(health.router)
    app.include_router(upload.router, prefix="/api/v1")
    app.include_router(process.router, prefix="/api/v1")
    app.include_router(websocket.router)

    return app


# Create app instance
app = create_app()


@app.get("/", response_model=Dict[str, Any])
async def root() -> Dict[str, Any]:
    """Root endpoint with API information."""
    settings = get_settings()
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
