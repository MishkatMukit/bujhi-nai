# Frontend — Bujhi Nai

Next.js App Router + TypeScript, mobile-first, single-screen workspace. Calls the Express API described in `backend.md`; product context is in `plans.md`.

## Layout

Use the actual directory `bujhi-nai-frontend/` (not `frontend/` as written in `plans.md`).

```text
bujhi-nai-frontend/
├── public/samples/                    # sample whiteboard images for demo pills
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # imports katex CSS
│   │   └── page.tsx                   # owns workspace + archive state
│   ├── components/
│   │   ├── Header.tsx                 # branding + sample pills
│   │   ├── BoardUploader.tsx          # dropzone/camera, department, text, submit
│   │   ├── VoiceRecorder.tsx          # MediaRecorder + preview
│   │   ├── ExplanationViewer.tsx      # tabs, Markdown/KaTeX, practice accordion
│   │   └── CampusArchiveGrid.tsx      # filters, search, cards, upvote
│   ├── lib/
│   │   ├── api.ts                     # typed fetch client
│   │   └── utils.ts                   # shadcn class merging
│   └── types/
│       └── board.ts                   # shared API types (hand-synced with backend)
├── .env.local.example
├── package.json
└── tsconfig.json
```

Stack: Next.js App Router, Tailwind CSS, shadcn/ui (`card`, `tabs`, `badge`, `button`, `accordion`, `select`, `textarea`, `skeleton`), `lucide-react`, `react-markdown`, `remark-math`, `rehype-katex`, `katex`.

## API contract

`NEXT_PUBLIC_API_URL=http://localhost:5000/api` in `.env.local`; only public values belong in this variable.

Every success response is wrapped:

```ts
type ApiResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
};
```

Unwrap `data` inside `lib/api.ts`; components should not know about `success`/`statusCode`. `meta` is only present if the list endpoint is paginated later.

| Function | Request | Unwrapped result |
| :--- | :--- | :--- |
| `explainBoard(formData)` | `POST /boards/explain` with `image`, optional `audio`, optional `textQuestion`, `department` | `BoardExplanation` |
| `listBoards({ department, search })` | `GET /boards?...` | `BoardExplanation[]` |
| `getBoard(id)` | `GET /boards/:id` | `BoardExplanation` |
| `upvoteBoard(id)` | `PATCH /boards/:id/helpful` | `{ helpfulCount: number }` |

- Build `FormData` for explain; never set `Content-Type` manually, the browser must add the multipart boundary.
- Check `res.ok`; error bodies are `{ success: false, statusCode, name, message, error?, stack? }`. In production only `AppError` messages are safe to show; generic errors say `"Internal Server Error"`. Parse `message` and surface a Bangla-friendly fallback.
- The catch-all 404 returns `{ message, path, date }` and does **not** use the envelope; handle a missing `success` field without crashing.
- `GET /boards` puts at most 15 boards in `data`, already sorted by sample → helpful → newest.
- Mongo dates arrive as ISO strings, so type `createdAt`/`updatedAt` as `string` in `board.ts`.
- No auth is planned; do not add token handling.

```ts
type Department = "CSE" | "EEE" | "BBA" | "Pharmacy" | "URC" | "General";

interface BoardExplanation {
  _id: string;
  department: Department;
  semester: string;
  courseDetected: string;
  topicTitle: string;
  imageBase64: string;
  studentQuestion: string;
  hadAudioQuestion: boolean;
  cleanTranscription: string;
  specificAnswer: string;
  stepByStepBangla: {
    stepNumber: number;
    equationOrConcept: string;
    banglaExplanation: string;
  }[];
  examShortcutTip: string;
  practiceProblem: { question: string; hint: string; solution: string };
  helpfulCount: number;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}
```

There is no shared package between the two apps; keep `types/board.ts` in sync with the backend model by hand.

## Screen and component behavior

`page.tsx` is the client-side container: it holds the selected board, archive list, filters, and loading/error state, and passes callbacks down.

- **Header**: brand + 3–4 demo pills (CSE NFA→DFA, EEE supernode, URC Arabic grammar). On click, call `listBoards({ search })` and select the first `isSample` result; do not hardcode Mongo IDs.
- **BoardUploader**: drag-and-drop plus `<input type="file" accept="image/*" capture="environment">`; department select; optional text field; submit disabled while a request is in flight. Compose the full `FormData` here and hand it to the page callback.
- **VoiceRecorder**: request mic permission on first use, show elapsed time, preview with an `<audio>` element, and return a `Blob`. Recording is optional. Keep it short (the plan targets a ~5-second note). Use `MediaRecorder.isTypeSupported` to pick a format (`audio/webm;codecs=opus`, then browser fallbacks) and derive the filename extension from the chosen mime type. Stop all tracks and revoke object URLs on reset/unmount.
- **ExplanationViewer**: highlight `specificAnswer` above the tabs.
  - Tab 1, `সহজ বাংলা ব্যাখ্যা`: numbered steps pairing `equationOrConcept` with `banglaExplanation`, plus the `examShortcutTip` callout.
  - Tab 2, `পরিষ্কার নোট`: render `cleanTranscription` with `react-markdown` + `remark-math` + `rehype-katex`; provide copy-raw-Markdown and print/PDF actions.
  - Tab 3, `নিজে ট্রাই করো`: practice question, toggleable hint, accordion for the solution.
- **CampusArchiveGrid**: department tabs + search box, cards showing `courseDetected`, `topicTitle`, and `helpfulCount`. On upvote, call the API, update the count, and guard against duplicate clicks; refresh or roll back on failure.

Default states matter: skeletons while loading, a clear empty-archive message, and a retry path for failed uploads/upvotes.

## Rendering and UX constraints

- Import `katex/dist/katex.min.css` once in `app/layout.tsx`; without it, equations render as raw text.
- Keep backend Markdown/LaTeX as-is. Do not escape backslashes or inject HTML; `react-markdown` does not need `dangerouslySetInnerHTML`.
- Mobile-first single screen: input column stacks above the explanation/archive on small screens, side-by-side on desktop. Maintain tap targets and visible focus states.
- UI copy is Bangla, but keep technical terms in English (e.g. Time Complexity, Epsilon Closure, Supernode) to match the answers students write in exams.
- Microphone access requires a secure context; `localhost` works, deployed demos need HTTPS.

## State flow

1. On mount, `listBoards()` for the archive.
2. Sample pill → `listBoards({ search })` → select the matching sample board.
3. Upload → `explainBoard(formData)` → render the returned board in `ExplanationViewer` → refresh/prepend the archive.
4. Upvote → `upvoteBoard(id)` → update that card and the selected board if it matches.
5. Filter/search → `listBoards({ department, search })`; debounce search input.

## Target package scripts

Next.js defaults once scaffolded: `dev`, `build`, `start`, `lint`. There is no test runner yet; verify in the browser and Network tab until one is chosen. Use the package manager chosen at scaffold time and keep one lockfile.

Scaffold order (run inside the existing empty `bujhi-nai-frontend/`):

1. Create the Next.js TypeScript + Tailwind + App Router app with the chosen package manager.
2. `npx shadcn@latest init`, then add the components listed above.
3. Install `react-markdown remark-math rehype-katex katex lucide-react`.
4. Add `src/types/board.ts`, `src/lib/api.ts`, `.env.local.example`.
5. Build `BoardUploader` and `VoiceRecorder` against the API, then `ExplanationViewer`, then the archive.
6. Verify against a running backend on port 5000.

## Verification checklist

- Upload a sample image with no text/audio and get three populated tabs.
- Record a Bangla voice note, preview it, submit, and confirm `hadAudioQuestion` is true.
- LaTeX renders (fractions, summations, ε-closure), and copy-Markdown returns the source.
- Sample pills load instantly from seeded boards.
- Department filter and keyword search return the expected archive cards.
- Upvote survives a page refresh.
- Test at a phone viewport with camera capture and confirm the layout stacks cleanly.
