# ELIXR

A social network for coffee enthusiasts. Log your brewing sessions, share your gear, and track your coffee journey.

## Features

- **Brew Logging** - Detailed tracking of your coffee brewing with parameters like ratio, temperature, time, and more
- **Social Network** - Connect with other coffee enthusiasts and share your brewing journey
- **Roaster Database** - Comprehensive database of 150+ specialty coffee roasters worldwide
- **Gear Tracking** - Manage and showcase your brewing equipment
- **Profile Sharing** - Share your coffee profile with others

## Tech Stack

- React + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Google Gemini AI integration
- Local storage for data persistence

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Gemini API key in `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
npm run preview
```

## Deploy to elixr.coffee

Your domain **elixr.coffee** is ready! Here's how to deploy:

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```
Then add your custom domain in Vercel dashboard:
1. Go to Project Settings → Domains
2. Add `elixr.coffee` and `www.elixr.coffee`
3. Configure DNS records as shown by Vercel

### Option 2: Netlify
```bash
npm run build
# Drag the 'dist' folder to Netlify's deploy drop zone
```
Then configure custom domain in Site Settings → Domain Management

### DNS Configuration
Point your DNS to your hosting provider:
- **A Record**: `@` → Your hosting IP
- **CNAME**: `www` → Your hosting domain

### Environment Variables
Don't forget to set `VITE_GEMINI_API_KEY` in your hosting platform's environment variables.
