## Run Locally
**Prerequisites:** Node.js (version 18+ recommended)

1. Install all dependencies (this uses `package.json` to pull everything automatically):
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
3. Start the app:
   ```bash
   npm run dev
   ```

## Backend API (FastAPI)

**Prerequisites:** Python 3.10+, PostgreSQL connection URL in `SUPABASE_DB_URL`.

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the API server:
   ```bash
   SUPABASE_DB_URL=postgresql+psycopg://... uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. Open the interactive docs at `http://localhost:8000/docs`.

### API highlights

- Manage users, vocabulary words, and per-user lists.
- Attach words to shared or user-specific lists.
- Track spaced-repetition state per user/word, fetch due cards, and submit reviews with AGAIN/HARD/GOOD ratings.
