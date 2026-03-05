<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/images/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Wedding Party Planner

A comprehensive wedding timeline planner application with AI-powered schedule generation.

View your app in AI Studio: https://ai.studio/apps/ced6c458-79ba-4198-b4ec-fdb064b21258

## Deployed App

The app is automatically deployed to GitHub Pages on every push to the main branch:
**[Wedding Party Planner](https://msburberryy-web.github.io/Wedding-Party-Planner/)**

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (optional, needed only for AI timeline generation)
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## GitHub Pages Deployment

This app is automatically deployed to GitHub Pages whenever you push to the `main` branch. The deployment is handled by GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Manual Deployment

If you need to manually deploy:

```bash
npm install -g gh-pages
npm run deploy
```

### Configure GitHub Pages Settings

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select the branch: **gh-pages**
4. Click **Save**

The app will be available at: `https://msburberryy-web.github.io/Wedding-Party-Planner/`

## Features

- Create and manage wedding day timeline
- Predefined activity library
- Custom activity support
- Time tracking (used vs. remaining)
- Timeline visualization
- Export to Excel
- AI-powered timeline generation (with Gemini API)
- Multi-language support (English, Japanese, Myanmar)
- Save and load plans

## Build

```bash
npm run build
```

This generates an optimized production build in the `dist/` directory.
