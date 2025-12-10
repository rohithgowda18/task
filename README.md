# CodeClause-To-Do-App
MERN based TO DO List App
# TO-DO List App with MERN Stack

This is a simple To-Do List app built using the MERN stack. The app allows users to create, read, update, and delete to-do items. 

## Installation

1. Clone the repository using `git clone https://github.com/Rajeshds20/CodeClause-To-Do-App.git`
2. `cd` into the project directory
3. Go to Front End using `cd frontend` 
4. Install the dependencies using `npm install` 
5. Run the app using `npm start`
6. Go to Backend using `cd backend`
7. Install the dependencies using `npm install`
8. Run the app using `npm start`
9. The app will be available at `http://localhost:3000`

## Development

Run the backend and frontend in separate terminals for local development.

- Backend (from `backend` folder):

```powershell
cd backend
npm install
# create a .env with MONGO_URI or use the in-memory fallback
node index.js
```

- Frontend (from `frontend` folder):

```powershell
cd frontend
npm install
npm start
```

Notes:
- The backend will use an in-memory MongoDB server when `MONGO_URI` is not provided (useful for quick local testing).
- The frontend reads the API base URL from `REACT_APP_API_URL` (fallback: `http://localhost:5000`).

## Docker Compose

To run everything with Docker (Mongo + backend + frontend):

```powershell
cd D:\projects\task\task
docker compose up --build
```

- App: http://localhost:3000
- API: http://localhost:5000
- Mongo: port 27017 (mapped)

Environment toggles:
- Backend uses `MONGO_URI` (set to Mongo service) and `ALLOW_INMEMORY_MONGO` (default false in compose).
- Frontend build arg `REACT_APP_API_URL` defaults to `http://localhost:5000` in compose; override with `--build-arg REACT_APP_API_URL=<url>` if needed.

## Features

* Create, read, update, and delete to-do items

## Technologies

This app is built with the following technologies:

* MongoDB
* Express.js
* React.js
* Node.js
* Bootstrap
* JWT

