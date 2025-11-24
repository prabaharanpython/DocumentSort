<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1giNUJ3nSQQEjpDGmCDoDGzJi1YtV4c_u

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `API_KEY` in a local environment file (e.g. `.env.local`) to your Gemini API key. The app reads `process.env.API_KEY` in `services/geminiService.ts`.
3. Run the app:
   `npm run dev`

## Deploying to Netlify

1. Connect this GitHub repository to Netlify (Site → New site → Import from GitHub).
2. Set the build settings on Netlify:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add your Gemini API key in Netlify's Site settings → Environment → Environment variables:
   - Key: `API_KEY`
   - Value: (your Gemini / Google GenAI API key — keep this secret)
4. Deploy — Netlify will run `npm install` then the build and publish the `dist` directory.

If your project uses the `@google/genai` package, make sure it is a valid version in `package.json` (this repo uses `@google/genai@^1.30.0`).
