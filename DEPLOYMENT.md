# Deployment Guide

This repository is prepared for separate frontend and backend deployment:

- `frontend`: React/Vite application for Netlify
- `backend`: Node.js/Express API for Render

## Local Development

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

For local development, set:

```bash
VITE_API_URL=http://localhost:5000
```

The frontend API client automatically sends API requests to `${VITE_API_URL}/api`.

## Deploy Backend To Render

1. Create a new Render Web Service from this GitHub repository.
2. Set the Root Directory to `backend`.
3. Use these commands:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add backend environment variables in Render:

```bash
PORT=5000
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a strong production secret>
NODE_ENV=production
CORS_ORIGINS=http://localhost:5173,https://wins-wereld-winkel.netlify.app
```

If you use image uploads with Cloudinary, also add:

```bash
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
```

After deployment, copy the Render service URL, for example:

```bash
https://wins-wereld-winkel-api.onrender.com
```

## Deploy Frontend To Netlify

1. Create a new Netlify site from this GitHub repository.
2. Set the Base Directory to `frontend`.
3. Use these build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. Add this frontend environment variable in Netlify:

```bash
VITE_API_URL=https://wins-wereld-winkel-api.onrender.com
```

Do not include `/api` in `VITE_API_URL`; the frontend adds it automatically.

The file `frontend/public/_redirects` is included so React Router routes work after refresh:

```txt
/* /index.html 200
```

## Connect Frontend And Backend

1. Deploy the backend first and copy the Render URL.
2. In Netlify, set `VITE_API_URL` to that Render URL.
3. In Render, set `CORS_ORIGINS` to include your Netlify production URL.
4. Redeploy both services after changing environment variables.

Example production connection:

```bash
Frontend VITE_API_URL=https://wins-wereld-winkel-api.onrender.com
Backend CORS_ORIGINS=https://wins-wereld-winkel.netlify.app
```

The backend allows localhost development origins and Netlify app origins. For tighter production security, replace the placeholder Netlify domain with your actual site domain in Render.
