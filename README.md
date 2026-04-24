# OneMusic 🎵

OneMusic is a full-stack web application designed for a premium music streaming experience. It features collaborative listening rooms, real-time chat, personal libraries, and seamless music playback powered by YouTube Music and Spotify integrations. The platform offers a sleek, modern, and responsive user interface with glassmorphism aesthetics and smooth animations.

## ✨ Features

- **Music Streaming:** Browse, search, and play tracks, artists, and albums via robust backend API integrations (e.g., YouTube Music API).
- **Collaborative Listening Rooms:** Create or join dynamic rooms to listen to music together with friends in real-time.
- **Live Chat:** Real-time messaging within listening rooms powered by WebSockets.
- **Modern UI/UX:** Premium design featuring dark mode, glassmorphism, responsive layouts, and GSAP animations.
- **User Authentication:** Secure signup and login flow using JWT, Bcrypt, and persistent sessions.
- **Global State Management:** Persistent player state and user sessions using Redux Toolkit and Redux Persist.

## 🛠️ Tech Stack

**Frontend:**
- React 19 (via Vite)
- Tailwind CSS v4 & Styled Components
- Redux Toolkit & Redux Persist
- React Router DOM v7
- GSAP for Animations
- Axios for API requests
- Lucide React for UI Icons

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- WebSockets (`ws`) for real-time chat and room synchronization
- JWT & Bcryptjs for secure authentication
- `ytmusic-api`  for music metadata and processing

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas)

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd OneMusic
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

Create a `.env` file in the `backend` directory and configure the necessary environment variables:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
# MongoDB Connection String
MONGO_URI=your_mongodb_connection_string
# JWT Secret Key
JWT_SECRET=your_jwt_secret
```

### Running the Application

You will need two separate terminal windows/tabs to run the frontend and backend concurrently.

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *The backend will run on `http://localhost:5000` and connect to MongoDB.*

2. **Start the Frontend Development Server:**
   ```bash
   cd frontend
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

## 📁 Project Structure

- `/frontend` - Contains the React Vite application, Redux store, UI components (Sidebar, PlayerBar, Views), and context providers.
- `/backend` - Contains the Express server, MongoDB models, REST API routes (users, auth, rooms, data), WebSocket server implementation, and third-party API configurations.
