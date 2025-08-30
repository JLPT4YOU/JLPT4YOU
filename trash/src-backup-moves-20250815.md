- What: Move 5 backup/artefact files from src to trash
- Why: Keep src clean from non-source artefacts, reduce lint noise
- Impact: none


Moved backup/artefact files from src to trash on 2025-08-15

Files:
- src/app/api/dict/[...path]/route.backup.ts -> trash/src/app/api/dict/[...path]/route.backup.ts
- src/components/premium/thank-you-modal.tsx.bak -> trash/src/components/premium/thank-you-modal.tsx.bak
- src/lib/study/localStorage-service.backup.ts -> trash/src/lib/study/localStorage-service.backup.ts
- src/lib/study/exercise-prompts.backup.ts -> trash/src/lib/study/exercise-prompts.backup.ts
- src/lib/dict/dict-service.backup.ts -> trash/src/lib/dict/dict-service.backup.ts

Notes:
- No functional changes. Pure relocation to avoid bundling/lint noise.
- Can be restored if needed.
