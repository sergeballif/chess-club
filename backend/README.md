# Chess Club — Backend

This is the backend server for the Chess Club app. It handles real-time communication between the teacher and students using Socket.io.

The frontend (the files your students and teacher actually see) is distributed separately. See the [chess-club-frontend](https://github.com/sergeballif/chess-club-frontend) repo.

---

## What you need

- A free [GitHub](https://github.com) account
- A free [Render](https://render.com) account
- A place to host static files (any web host works — Google Sites, Netlify, GitHub Pages, your school's server, etc.)

---

## Step 1 — Fork this repo

1. Click **Fork** in the top-right corner of this GitHub page
2. This creates your own copy of the backend under your GitHub account

---

## Step 2 — Deploy to Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Click **Connect account** to link your GitHub account (if not already linked)
4. Find and select your forked `chess-club-backend` repo
5. Fill in the settings:
   - **Name**: anything you like (e.g. `my-chess-club-backend`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: `Free`
6. Scroll down to **Environment Variables** and add one:
   - **Key**: `FRONTEND_ORIGINS`
   - **Value**: the URL of the site where you'll host the frontend (e.g. `https://yourschool.com`)
   - If you're not sure yet, you can add this later
7. Click **Create Web Service**

Render will build and deploy your server. This takes about a minute.

---

## Step 3 — Note your backend URL

Once deployed, Render shows your service URL at the top of the page. It looks like:

```
https://your-service-name.onrender.com
```

Copy this — you'll need it when setting up the frontend.

---

## Step 4 — Set up the frontend

Follow the instructions in the [chess-club-frontend](https://github.com/sergeballif/chess-club-frontend) repo to download and configure the frontend files.

---

## Updating FRONTEND_ORIGINS later

If you change where your frontend is hosted, update the `FRONTEND_ORIGINS` environment variable in Render:

1. Go to your Web Service on Render
2. Click **Environment** in the left sidebar
3. Update the value and click **Save Changes**
4. Render will automatically redeploy

---

## Free tier note

Render's free tier spins down your server after 15 minutes of inactivity. The first connection after a period of inactivity may take 30–60 seconds. This is normal and expected on the free plan.
