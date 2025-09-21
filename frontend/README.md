# Chess Club Frontend

This project is a React-based web application for running interactive chess club sessions, with real-time voting and game management for both teachers and students.

## Project Structure & Purpose
- **Frontend:** React (with Vite) for fast development and hot module reloads.
- **Backend:** Node.js/Express server (see `../Website/chess-club-backend/index.js`), deployed via Render.com.
- **Static Hosting:** Production frontend is built and deployed to a static site at `../Website/jennyballif.github.io/chess-club` (for GitHub Pages hosting).

## Main Packages Used
- **react** / **react-dom**: Core UI framework.
- **vite**: Modern dev server and build tool.
- **chess.js**: Chess game logic and move validation.
- **react-chessboard**: Interactive chessboard component.
- **socket.io-client**: Real-time communication with backend for voting and state sync.
- **prop-types**: Runtime type checking for React props.
- **react-router-dom**: Routing (if multi-page navigation is needed).
- **eslint** and related plugins: Linting and code quality.

## Development Workflow

### 1. Start Local Development
```sh
npm install
npm run dev
```
- Opens the app at `http://localhost:5173` with hot reload.

### 2. Build for Production
```sh
npm run build
```
- Outputs the production build to the `dist/` folder.
- Also copies `index.html` to `404.html` and runs `node copy-routes.js` for SPA routing support.

### 3. Deploy to GitHub Pages
- Copy the contents of the `dist/` folder to your static site repo:

```sh
cp -r dist/* ../Website/jennyballif.github.io/chess-club
```
- Commit and push changes in the `../Website/jennyballif.github.io` repo to update the live site.

### 4. Backend Deployment (Render.com)
- The backend lives at `../Website/chess-club-backend/index.js`.
- The backend is deployed to [Render.com](https://render.com/) and is configured as a Node service.
- To update the backend:
  1. Commit and push changes to the GitHub repo for `chess-club-backend`.
  2. Render.com automatically redeploys on push.
- The frontend connects to the backend via the URL set in `src/lib/socket.js` (see `SOCKET_URL`).

## Future Updates & Maintenance
- **Frontend:**
  - Make code changes in this repo.
  - Test locally (`npm run dev`).
  - Build (`npm run build`), then copy to the GitHub Pages repo as above.
- **Backend:**
  - Edit `../Website/chess-club-backend/index.js` (and related files).
  - Commit and push to GitHub; Render.com will redeploy.
- **Dependencies:**
  - To update packages, run `npm update` or edit `package.json` and run `npm install`.

## Troubleshooting
- If the frontend is not updating, ensure you copied the latest `dist/` files and pushed to the correct GitHub Pages repo.
- If real-time features break, check backend logs on Render.com and confirm the frontend is connecting to the correct `SOCKET_URL`.

---

For further details on project structure or advanced configuration, see the source files and comments in each module. If you get stuck, check the Vite, React, or Socket.io documentation for up-to-date usage patterns.
