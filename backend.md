# Backend — Bujhi Nai

Express + TypeScript API for the Bujhi Nai whiteboard explainer. Owns uploads, Gemma 4 calls, and MongoDB Atlas persistence. The frontend contract lives in `frontend.md`; product context is in `plans.md`.

Structure and response conventions follow the existing `housely-backend` project: application code sits under `src/app/`, with `src/app.ts` and `src/server.ts` as the only entry files.

## Layout

Use the actual directory `bujhi-nai-backend/` (not `backend/` as written in `plans.md`).

```text
bujhi-nai-backend/
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   └── index.ts                 # dotenv + config object
│   │   ├── Interfaces/
│   │   │   └── board.interface.ts       # IBoardExplanation, payload/query types
│   │   ├── lib/
│   │   │   ├── mongoose.ts              # connection
│   │   │   ├── gemma.ts                 # Gemma client + prompt + response schema
│   │   │   └── multer.ts                # memory upload + mime/size checks
│   │   ├── middleware/
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts              # exports routeHandler
│   │   │   └── validateRequest.ts       # validateRequest/validateQuery/validateParams
│   │   ├── models/
│   │   │   └── BoardExplanation.model.ts
│   │   ├── modules/
│   │   │   └── board/
│   │   │       ├── board.route.ts
│   │   │       ├── board.controller.ts
│   │   │       ├── board.service.ts
│   │   │       └── board.validation.ts
│   │   └── utils/
│   │       ├── appError.ts
│   │       ├── catchAsync.ts
│   │       └── sendResponse.ts
│   ├── scripts/
│   │   └── seed.ts
│   ├── app.ts                           # express app + middleware + routes
│   └── server.ts                        # DB connect + listen
├── .env.example
├── biome.json
├── package.json
├── tsconfig.json
└── tsup.config.js
```

`Interfaces/` is intentionally capitalised, matching the reference project. Every feature gets `src/app/modules/<name>/` with the same four files; shared infrastructure stays in `config`, `lib`, `models`, and `utils`.

## Shared conventions

### `utils/appError.ts`

Use this class for every expected failure. Do not send ad-hoc status codes from services.

```ts
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number, stack?: string) {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
```

Use `http-status` constants (`httpStatus.NOT_FOUND`, `httpStatus.BAD_REQUEST`, ...) instead of raw numbers.

### `utils/sendResponse.ts`

Every successful controller response goes through this helper and uses this envelope:

```ts
type TMeta = { page: number; limit: number; total: number };

type TResponseData<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: TMeta;
};

const sendResponse = <T>(res: Response, data: TResponseData<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
    meta: data.meta,
  });
};

export default sendResponse;
```

The success shape is always `{ success, statusCode, message, data, meta? }`; `meta` is only for paginated lists. This differs from the earlier raw-body plan, so the frontend must unwrap `data`.

### `utils/catchAsync.ts`

Wrap every controller handler so rejected promises reach the global error handler:

```ts
const catchAsync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default catchAsync;
```

### `middleware/validateRequest.ts`

Zod schemas live in `<module>.validation.ts`; routes wire them with the three validators:

- `validateRequest(schema)` parses/coerces `req.body`.
- `validateQuery(schema)` parses `req.query`.
- `validateParams(schema)` parses `req.params`.

On failure call `next(error)`; the global handler converts `ZodError` to `400`. **Express 5 gotcha:** `req.query` is a getter and rejects assignment. `validateQuery` must redefine it with `Object.defineProperty(req, "query", { value: parsed, writable: true, enumerable: true, configurable: true })`; do not mutate it in place. For params, delete keys absent from the parsed object before `Object.assign`.

### `middleware/globalErrorHandler.ts`

The final error middleware keeps the reference shape:

```ts
res.status(statusCode).json({
  success: false,
  statusCode,
  name: isDev ? errorName : err instanceof AppError ? err.name : "Internal Server Error",
  message: isDev ? errorMessage : err instanceof AppError ? err.message : "Internal Server Error",
  error: isDev ? err : undefined,
  stack: isDev ? err.stack : undefined,
});
```

Branch order to mirror, adapted for Mongoose instead of Prisma:

1. `ZodError` → `400`, join `issue.path.join(".") + ": " + issue.message`.
2. `mongoose.Error.ValidationError` → `400`, join field messages.
3. `mongoose.Error.CastError` → `400` (`Invalid <path>` — invalid ObjectId).
4. `MongoServerError` with `code === 11000` → `409` (`Duplicate key`).
5. `AppError` → its own `statusCode` and message, always safe to expose.
6. Any other `Error` → `500`; hide the message outside development.
7. Unknown throw → `500` `Internal Server Error`.

Only expose `error` and `stack` when `config.node_env === "development"`.

### `middleware/notFound.ts`

Re-export the reference convention as `routeHandler`:

```ts
export const routeHandler = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: "Route not found",
    path: req.originalUrl,
    date: new Date(),
  });
};
```

This 404 is the one response that does not use the `sendResponse` envelope. Mount routes first, then `routeHandler`, then `globalErrorHandler`.

### `lib/multer.ts`

Use `multer.memoryStorage()`; reject unsupported mime types with `new AppError(...)` and cap uploads (`5 * 1024 * 1024` per file, `files: 2` for image + audio). The board route uses:

```ts
upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);
```

Allow `image/jpeg`, `image/png`, `image/webp`, plus `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/wav`, `audio/ogg`.

## App wiring

`src/app.ts` builds the app and this order:

1. `cors({ origin: [config.frontend_url, "http://localhost:3000"].filter(Boolean), credentials: true })`
2. `express.json()`, `express.urlencoded({ extended: true })`, `cookieParser()`
3. `app.use("/api/boards", boardRoutes)`
4. Root health route
5. `routeHandler`
6. `globalErrorHandler`
7. `export default app`

`src/server.ts` connects Mongoose first, then listens; log and `process.exit(1)` on startup failure. Do not call `app.listen` from `app.ts`.

`src/app/config/index.ts` loads `.env` and exports a default object, mirroring the reference naming style:

```ts
export default {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT || 5000,
  mongodb_uri: process.env.MONGODB_URI!,
  gemini_api_key: process.env.GEMINI_API_KEY!,
  gemma_model: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
};
```

Add a small startup check for `mongodb_uri` and `gemini_api_key`; the reference uses non-null assertions, but failing fast gives a better error than a runtime 500.

## Module conventions

| File | Exports | Rules |
| :--- | :--- | :--- |
| `board.route.ts` | `boardRoutes` (named `Router`) | Paths, Multer, `validate*` middleware, controller wiring only |
| `board.controller.ts` | `boardController` object | `catchAsync` + `sendResponse`; read `req`, call service; never import Mongoose or Gemma |
| `board.service.ts` | `boardService` object | Business logic, Mongoose queries, Gemma call; throw `AppError`; never touch `req`/`res` |
| `board.validation.ts` | `boardValidation` object | Zod schemas for body/query/params; no logic |

Use Zod schemas such as `createBoardSchema`, `listBoardsQuerySchema`, and `boardIdParamSchema`. Validate and coerce query values (`z.coerce.number()`, enums, trimmed strings). Type `req.query`/`req.body` as the matching `I...` interface after validation.

Dependency direction is one-way: `route → controller → service → model / lib/gemma`.

## API

Base URL: `http://localhost:5000/api/boards`

All success responses use the envelope, e.g. `POST` returns:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Board explained successfully",
  "data": { "...": "IBoardExplanation" }
}
```

| Method | Path | Input | `data` |
| :--- | :--- | :--- | :--- |
| POST | `/explain` | `multipart/form-data`: `image` (required file), `audio` (optional file), `textQuestion` (optional string), `department` (required enum) | created board |
| GET | `/` | Query: `department` (optional), `search` (optional) | up to 15 boards |
| GET | `/:id` | Mongo `_id` | one board |
| PATCH | `/:id/helpful` | Mongo `_id` | `{ helpfulCount }` |

- Feed sort: `{ isSample: -1, helpfulCount: -1, createdAt: -1 }`; hard limit `15`. Add `meta: { page, limit, total }` only if pagination is introduced later.
- `search` uses the Mongo text index. `$text` matches whole terms, not arbitrary substrings; use regex/Atlas Search only if partial-word search is required.
- `PATCH /:id/helpful` increments atomically with `$inc: { helpfulCount: 1 }` and returns the new count. No auth in v1.

### POST /explain flow

1. Multer `memoryStorage`; reject missing `image`, invalid `department`, and unsupported mime types.
2. Convert the image buffer to a `data:<mime>;base64,...` URL. Downscale/compress before storing if needed: base64 adds ~33%, and a MongoDB document is capped at 16 MB.
3. Call `lib/gemma.ts` with image, optional audio, optional `textQuestion`, and `department`.
4. Validate the parsed JSON against the response shape. Do not persist partial or unvalidated output; throw `AppError` with `502` for invalid/upstream AI output.
5. Persist request-owned fields yourself: `department` from the client (never trust the model to override it), `studentQuestion` from `textQuestion` or `"🎙️ Voice Question Asked"` when audio-only, `hadAudioQuestion`, and `imageBase64`.
6. Return the saved document with `201`.

## Data model

Database: `bujhi_nai_iiuc`; collection: `boardexplanations`; interface: `IBoardExplanation` in `src/app/Interfaces/board.interface.ts`.

```ts
{
  _id: ObjectId;
  department: "CSE" | "EEE" | "BBA" | "Pharmacy" | "URC" | "General";
  semester: string;
  courseDetected: string;
  topicTitle: string;
  imageBase64: string;
  studentQuestion: string;
  hadAudioQuestion: boolean;
  cleanTranscription: string;        // Markdown + LaTeX
  specificAnswer: string;            // Bangla answer to the actual confusion
  stepByStepBangla: {
    stepNumber: number;
    equationOrConcept: string;       // LaTeX or concept heading
    banglaExplanation: string;
  }[];
  examShortcutTip: string;
  practiceProblem: {
    question: string;
    hint: string;
    solution: string;
  };
  helpfulCount: number;              // default 0
  isSample: boolean;                 // default false
  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```ts
{ department: 1, isSample: -1, helpfulCount: -1, createdAt: -1 }
{ courseDetected: "text", topicTitle: "text", cleanTranscription: "text" }
```

## Gemma integration

`src/app/lib/gemma.ts` owns the integration; `board.service.ts` calls it.

- Model: `gemma-4-26b-a4b-it` via `@google/genai`; local fallback `gemma4:e4b` via Ollama. Read the model ID from `config.gemma_model`.
- Temperature `0.3`; request `application/json` with a strict response schema.
- The AI response schema contains only content fields: `semester`, `courseDetected`, `topicTitle`, `cleanTranscription`, `specificAnswer`, `stepByStepBangla`, `examShortcutTip`, `practiceProblem`. Server-owned fields (`_id`, `department`, `imageBase64`, `studentQuestion`, `hadAudioQuestion`, `helpfulCount`, `isSample`, timestamps) are added by the service.
- Prompt rules: friendly IIUC senior tutor; natural Bangladeshi Bangla with technical terms in English (Time Complexity, Epsilon Closure, Supernode, Debit/Credit); call out steps professors skip; exactly one exam-style practice problem with hint and solution; JSON only.
- Validate required strings, non-empty `stepByStepBangla`, and the `practiceProblem` shape before saving. Log the raw failure, not the user's image/audio.

## Environment

`.env` stays untracked; commit only `.env.example`.

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
GEMMA_MODEL=gemma-4-26b-a4b-it
FRONTEND_URL=http://localhost:3000
```

## Build and scripts

Match the reference toolchain: ESM (`"type": "module"`), `tsx` for dev, `tsup` for production, `http-status`, `zod`, `multer`, `cookie-parser`, `cors`, `mongoose`, `@google/genai`.

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "seed": "tsx src/scripts/seed.ts"
  }
}
```

`tsup.config.js` entry is `src/server.ts`, output `dist`, ESM/CJS, clean, sourcemaps. Keep the reference `tsconfig` style (`module: esnext`, `moduleResolution: bundler`, `strict`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`); use `import type` for type-only imports. Format/lint with Biome (`biome.json`: tabs, double quotes), matching the reference.

## Implementation phases

Build one phase at a time. Do not start the next phase in the same change; each phase must compile, run, and pass its exit check before moving on.

| # | Phase | Status |
| :--- | :--- | :--- |
| 1 | Scaffold + HTTP skeleton | Done |
| 2 | Shared conventions (`AppError`, `sendResponse`, middleware) | Done |
| 3 | Mongoose model + seed data | Done |
| 4 | Read API (`GET /`, `GET /:id`) | Done |
| 5 | Gemma integration | Done |
| 6 | Explain API (`POST /explain`) | Not started |
| 7 | Upvote + end-to-end hardening | Not started |

### Phase 1 — Scaffold + HTTP skeleton

Files: `package.json`, `tsconfig.json`, `tsup.config.js`, `biome.json`, `.env.example`, `.gitignore`, `src/app/config/index.ts`, `src/app.ts`, `src/server.ts`.

- ESM project (`"type": "module"`), dependencies for Express 5, Mongoose, Zod, Multer, `http-status`, `cookie-parser`, `cors`, `@google/genai`, `dotenv`; dev deps `tsx`, `tsup`, TypeScript, Biome, `@types/*`.
- Config object loaded from `.env`; no DB connection yet.
- App with CORS, JSON/urlencoded parsing, cookie parser, `GET /` health route.
- Server listens on `config.port`; no `app.listen` in `app.ts`.
- Add Node/Next/TS ignores to `.gitignore` before the first commit.

**Exit:** `npm install`, `npm run dev`, `GET /` returns `200`; `npm run typecheck` and `npm run build` pass.

### Phase 2 — Shared conventions

Files: `src/app/utils/{appError,sendResponse,catchAsync}.ts`, `src/app/middleware/{validateRequest,globalErrorHandler,notFound}.ts`.

- Implement the exact `AppError`, `sendResponse`, and `catchAsync` contracts from this doc.
- Implement `validateRequest`, `validateQuery`, `validateParams` (including the Express 5 `req.query` workaround).
- Implement the Mongoose/Zod-aware `globalErrorHandler` and `routeHandler`.
- Mount `routeHandler` then `globalErrorHandler` in `app.ts`.

**Exit:** unknown route returns the `{ message, path, date }` 404; a temporary `throw new AppError(...)` returns the expected error envelope and is then removed; typecheck passes. Feature-route validation is exercised in Phase 4.

### Phase 3 — Mongoose model + seed data

Files: `src/app/Interfaces/board.interface.ts`, `src/app/models/BoardExplanation.model.ts`, `src/app/lib/mongoose.ts`, `src/scripts/seed.ts`.

- Define `IBoardExplanation` and the Mongoose schema/defaults.
- Create both indexes exactly as specified.
- Connect Mongoose from `server.ts` before listening.
- Seed local sample images as data URLs, `isSample: true`, idempotent re-runs.

**Exit:** server boots against Atlas; `npm run seed` inserts the samples; a second run does not duplicate them.

### Phase 4 — Read API

Files: `src/app/modules/board/{board.validation,board.service,board.controller,board.route}.ts`, plus the route mount in `app.ts`.

- Implement `GET /api/boards` (department filter, text search, 15-item sort) and `GET /api/boards/:id`.
- Wire `validateQuery` and `validateParams`; service throws `AppError` for missing records.
- Use `catchAsync` + `sendResponse`.

**Exit:** seeded boards come back inside `data`; department/search filters work; bad ObjectId → `400`; missing id → `404`; all errors use the global handler.

### Phase 5 — Gemma integration

Files: `src/app/lib/gemma.ts`, `src/scripts/test-gemma.ts`, fixture image under `src/scripts/fixtures/`.

- Implement prompt, response schema, model config, and JSON parsing/validation.
- Keep server-owned fields out of the AI schema.
- Add a smoke script that sends the fixture image and prints/validates the parsed result. No HTTP route or DB writes yet.

**Exit:** `npx tsx src/scripts/test-gemma.ts` returns valid JSON with Bangla explanations, non-empty steps, and one practice problem. Use the Ollama fallback if the hosted model/key is unavailable; never fake the response in the production path.

### Phase 6 — Explain API

Files: `src/app/lib/multer.ts`, plus the `POST /explain` additions to `board.validation`, `board.service`, `board.controller`, and `board.route`.

- Add image/audio Multer fields, mime and size limits.
- Validate `department`, optional `textQuestion`, and required `image`.
- Call `lib/gemma.ts`, validate its output, persist request-owned fields, return `201`.
- Reject AI failures with an `AppError` (`502`) without saving.

**Exit:** multipart `curl` with image only creates a board; image + audio works and sets `hadAudioQuestion`; invalid mime/missing image → `400`; created board appears in `GET /api/boards`.

### Phase 7 — Upvote + end-to-end hardening

Files: `board.service/controller/route` for `PATCH /:id/helpful`; small fixes elsewhere.

- Atomic `$inc` on `helpfulCount`, return the new count, 404 on missing board.
- Re-check upload limits, Mongo 16 MB document risk, env fail-fast, seed idempotency, and production error masking.
- Run the full endpoint sweep and `npm run build`.

**Exit:** `PATCH` increments exactly once per call and survives reload; complete curl suite passes; build/typecheck pass; update the status table and `AGENTS.md` if commands changed.

## Verification

No test runner is chosen yet. At minimum, exercise the routes directly and check the envelope:

```bash
curl -X POST http://localhost:5000/api/boards/explain \
  -F "image=@sample-whiteboard.jpg" \
  -F "department=CSE" \
  -F "textQuestion=৩ নম্বর লাইনটা বুঝি নাই"

curl "http://localhost:5000/api/boards?department=CSE&search=DFA"
curl -X PATCH http://localhost:5000/api/boards/<id>/helpful
```

Confirm `data.helpfulCount === 0`, `data.isSample === false`, valid LaTeX in `data.cleanTranscription`, and that a bad `department` returns `{ success: false, statusCode: 400, ... }`.
