# WhatsApp Clone Deployment Guide

This guide explains how to deploy your WhatsApp Clone to a permanent web server so it's accessible 24/7 without using `localtunnel`.

## Recommended Services
We recommend **Render** or **Railway** (both have free tiers for hobby projects).

### 1. Prepare for Deployment
- Initialize a Git repository in your `whatsapp-clone` folder.
- Create a `.gitignore` file to exclude `node_modules`, `.env`, and `dist`.
- Push your code to **GitHub**.

### 2. Database Setup (Production)
SQLite (used locally) works but resets if the server restarts on most free hosting plans. For a permanent app:
- Use **Neon DB** (PostgreSQL free tier).
- Update your `schema.prisma` provider to `postgresql`.
- Run `npx prisma db push` with your Neon connection string.

### 3. Deploy Backend (Render Example)
1. **Sign up** at [render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your **GitHub** repository.
4. **Build Command**: `npm install && npx prisma generate && npm run build` (Note: You may need to add a build script to `package.json`).
5. **Start Command**: `node dist/index.js`.
6. **Environment Variables**:
   - `JWT_SECRET`: (Your secret key)
   - `DATABASE_URL`: (Your Neon DB connection string)
   - `PORT`: `3000`

### 4. Setting up custom Domain
Once deployed, Render will give you a URL like `my-whatsapp.onrender.com`.
- You can add your own custom domain in the Render settings.
- Render automatically handles SSL (HTTPS) for you.

### 5. Finalizing PWA Icons
For a truly professional feel, replace the icon links in `index.html` and `manifest.json` with actual files hosted on your server rather than external `flaticon` links.
