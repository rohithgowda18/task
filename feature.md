# Project Overview
MERN to-do application with a React frontend, Express/Mongoose backend, and MongoDB for persistence. It provides CRUD APIs with validation, timestamps, and an in-memory MongoDB fallback for easy local testing. Axios drives API calls from the UI; CORS is enabled for local dev.

## System Architecture Diagram
```
React UI (CRA) --Axios--> Express API --Mongoose--> MongoDB (or in-memory MongoDB)
```

## Features (Organized)
- **Core Application Features**: CRUD operations; persistent storage; timestamps on items; input validation with clear HTTP responses.
- **Developer / Backend Features**: CORS support; in-memory MongoDB fallback via `mongodb-memory-server`; error handling with sensible status codes; RESTful routing.
- **Frontend Features**: Add/edit/delete UI flows; state updates without mutation; API integration via Axios with configurable base URL.

## Technologies Used
- Node.js
- Express
- MongoDB
- Mongoose
- React
- Axios
- dotenv
- cors
- nodemon
- mongodb-memory-server

## Project Folder Structure
```
backend/
	routes/
		todoItems.js
	models/
		todoItems.js
	index.js
	package.json
frontend/
	src/
		App.js
		index.js
	package.json
README.md
feature.md
.env.example
backend/.env.example
```

## Environment Variables
- `MONGO_URI` — MongoDB connection string; if omitted, backend starts an in-memory MongoDB for local dev.
- `PORT` — backend port (default `5000`).
- `REACT_APP_API_URL` — frontend API base URL; optional, defaults to `http://localhost:5000`.

## API Documentation (Concise)
- **POST /api/item**
	- Body: `{ "item": "Buy milk" }`
	- Success: `201 Created`, returns created item JSON.
	- Failure: `400` if missing/empty item; `500` on server error.
- **GET /api/items**
	- Body: none
	- Success: `200 OK`, returns array of items (newest first).
	- Failure: `500` on server error.
- **PUT /api/item/:id**
	- Body: `{ "item": "Buy eggs" }`
	- Success: `200 OK`, returns updated item JSON.
	- Failure: `400` if empty item; `404` if not found; `500` on server error.
- **DELETE /api/item/:id**
	- Body: none
	- Success: `200 OK`, returns `{ "message": "Item deleted successfully" }`.
	- Failure: `404` if not found; `500` on server error.

## Setup Instructions
- Backend:
```
cd backend
npm install
npm start
```
- Frontend:
```
cd frontend
npm install
npm start
```
- Optional: create `.env` files (`.env` at root or `backend/.env`) to set `MONGO_URI` and `PORT`; frontend can use `.env` with `REACT_APP_API_URL`.

## Suggested Improvements / Roadmap
- Add JWT authentication for user accounts.
- Add rate limiting to protect the API.
- Add pagination for large item lists.
- Move `nodemon` to `devDependencies` and add a combined `dev` script.
- Add backend tests with Jest + Supertest and wire into CI.
- Improve UI/UX (loading and empty states, better styling).
- Add Docker Compose for full-stack local deployment.
