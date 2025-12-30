# CONTINUITY LEDGER

## Goal
Build FaceForge - AI-powered face swapping web application with dual modes (Upload + Live)

## Constraints/Assumptions
- Backend: FastAPI with WebSocket support for real-time streaming
- Frontend: Next.js 16 with dark-mode-first design (inspired by Greptile/Dub.co)
- AI: InsightFace for face swap, Wav2Lip for lip sync, ElevenLabs for voice
- Full body preservation (no cropping)

## Key Decisions
- Dark mode as default for video processing focus
- Orange/amber accent color scheme
- Sticky navigation with backdrop blur
- WebSocket for real-time frame streaming at 15 FPS
- In-memory job storage for MVP (Redis for production)

## State

### Done
**Backend:**
- FastAPI app with CORS, exception handlers, lifespan management
- Routes: /health, /ready, /api/v1/upload, /api/v1/process, /ws/stream
- WebSocket handler for real-time video streaming
- Core modules: face_swap.py, voice_clone.py, lip_sync.py, audio_sync.py
- Docker support with health checks

**Frontend:**
- Next.js 16 with TypeScript, TailwindCSS, shadcn/ui
- Dark-mode-first design with orange accent (Greptile/Dub.co inspired)
- Landing page with sticky nav, hero section, feature cards
- Upload mode page with source/target uploaders, processing options
- Live mode page with WebcamPreview component
- WebRTC camera capture with frame loop
- WebSocket client for real-time processing
- Components: VideoUploader, VideoPlayer, WebcamPreview
- API client, WebRTC helpers, WebSocket stream client

**Infrastructure:**
- Docker Compose with services: backend, frontend, redis, worker, nginx
- nginx reverse proxy with WebSocket support
- Model download script

**Testing:**
- Backend: 26 pytest tests (health, upload, process, websocket endpoints)
- Frontend: 34 Playwright E2E tests (navigation, upload mode, live mode)
- All tests passing

### Now
- All button/UI fixes complete and verified

### Next
- Deploy to production
- Add more AI model integration (actual InsightFace face swap)
- Add voice processing with ElevenLabs

## Open Questions
-

## Working Set
- Files: /Users/bjwet/faceforge/
- Commands:
  - Backend: cd /Users/bjwet/faceforge/backend && pip install -r requirements.txt && uvicorn api.main:app --reload
  - Frontend: cd /Users/bjwet/faceforge/frontend && npm run dev
  - Docker: cd /Users/bjwet/faceforge && docker-compose up
