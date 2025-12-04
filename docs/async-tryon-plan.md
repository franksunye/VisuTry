# Async Try-On Implementation Plan (GrsAi + Vercel)

## Objective
Implement a Vercel-compatible asynchronous virtual try-on flow using the GrsAi API. This architecture overcomes Vercel Serverless function timeout limits (10-60s) by splitting the submission and result polling into separate client-driven requests.

## Architecture

### 1. Current (Synchronous) - *To be replaced*
- Client sends `POST /api/try-on` with images.
- Server keeps connection open, uploads images, calls GrsAi, waits for generation.
- Server returns image result.
- **Problem**: GrsAi generation can take >10s (queueing), leading to Vercel 504 Gateway Timeouts.

### 2. New (Asynchronous) - *Target*
- **Step 1: Submission**
  - Client sends `POST /api/try-on/submit` with images.
  - Server:
    - Validates Auth & Quota.
    - Uploads images (or converts to Data URI).
    - Calls GrsAi `/v1/draw/nano-banana` with `webHook="-1"`.
    - Returns `{ taskId: "...", status: "submitted" }` immediately (< 3s).

- **Step 2: Polling (Client-Side)**
  - Client receives `taskId`.
  - Client enters a polling loop (every 2-3s).
  - Client calls `POST /api/try-on/poll` with `{ taskId }`.
  - Server calls GrsAi `/v1/draw/result` (POST).
  - Server returns status (`processing`, `succeeded`, `failed`).
  - If `succeeded`, Server handles post-processing (save to DB, deduct quota) and returns final image URL.

## Component Changes

### 1. Service Layer: `src/lib/grsai.ts` (New)
- **Purpose**: Encapsulate GrsAi API interactions.
- **Methods**:
  - `submitTryOnTask(userImageUrl, itemImageUrl, prompt)`: Returns `taskId`.
  - `getTryOnResult(taskId)`: Returns status and result.
  - Helper: `fileToDataUri` (if needed for direct submission).

### 2. API Endpoints
- **`src/app/api/try-on/submit/route.ts` (New)**
  - Handle file upload.
  - Call `grsai.submitTryOnTask`.
  - Return `taskId`.
- **`src/app/api/try-on/poll/route.ts` (New)**
  - Input: `taskId`.
  - Call `grsai.getTryOnResult`.
  - Return status/image.
- **`src/app/api/try-on/route.ts` (Refactor)**
  - Deprecate or redirect to new flow? 
  - *Decision*: Keep for backward compatibility if needed, but frontend will switch to new endpoints.

### 3. Frontend: `src/components/try-on/TryOnInterface.tsx`
- **State Management**: Add `taskId` and `polling` state.
- **Logic**:
  - `handleTryOn`:
    - Call `/api/try-on/submit`.
    - Set `taskId`, start polling.
  - `pollResult` (useEffect or recursive function):
    - Call `/api/try-on/poll`.
    - If `processing`: Wait 2s, recurse.
    - If `success`: Update UI with image, stop polling.
    - If `failed`: Show error, stop polling.

## Implementation Steps

1.  **Setup**: Create feature branch `feature/async-grsai-tryon`.
2.  **Service Layer**: Implement `src/lib/grsai.ts` with strong typing and error handling.
3.  **Backend - Submit**: Create `api/try-on/submit/route.ts`.
4.  **Backend - Poll**: Create `api/try-on/poll/route.ts`.
5.  **Frontend**: Update `TryOnInterface.tsx` to use the new async flow.
6.  **Cleanup**: Remove legacy synchronous code if no longer needed.

## Testing Strategy
- **Unit**: Test `grsai.ts` with mock responses.
- **Integration**: Use `scripts/test-grsai-poll-only.ts` logic to verify API connectivity.
- **E2E**: Manual test of the full flow on localhost.
