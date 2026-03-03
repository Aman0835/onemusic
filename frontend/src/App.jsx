import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";


import { PlayerProvider, usePlayer } from "./context/PlayerContext.jsx";

import Album from "./components/album.jsx";
import Artist from "./components/artist.jsx";
import Home from "./components/home.jsx";
import Library from "./components/library.jsx";
import Login from "./components/user/login.jsx";
import PlayerBar from "./components/PlayerBar.jsx";
import RoomLobby from "./components/room/roomLobby.jsx";
import Signup from "./components/user/signup.jsx";

import Sidebar, { SidebarItem } from "./components/sidebar.jsx";
import "./index.css";
import AuthCallback from "./auth/AuthCallback.jsx";

import {
  Album as AlbumIcon,
  House as HouseIcon,
  Library as LibraryIcon,
  MicVocal,
  Plus,
} from "lucide-react";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addUser, removeUser } from "./components/utils/UserSlice";

let hasBootSessionCheckRun = false;

const AppContent = () => {
  const {
    activeTrack,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrev,
    setVolume,
    shuffle,
    setShuffle,
    repeatMode,
    setRepeatMode,
  } = usePlayer();

  const location = useLocation();
  const dispatch = useDispatch();
  const authApiBase =
    import.meta.env.VITE_API_BASE_URL ||
    `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/auth`;

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    if (!authApiBase || isAuthPage) return;

    // Avoid duplicate boot-time checks in React StrictMode (development).
    if (hasBootSessionCheckRun) return;
    hasBootSessionCheckRun = true;

    axios
      .get(authApiBase + "/me", { withCredentials: true })
      .then((res) => {
        const user = res?.data?.user;
        if (user) dispatch(addUser(user));
      })
      .catch(() => {
        dispatch(removeUser());
      });
  }, [authApiBase, dispatch, isAuthPage]);

  return (
    <div
      className="relative flex overflow-hidden h-screen w-full bg-black text-white font-sans 
      bg-gradient-to-br from-indigo-900/60 via-black to-black
      animate-gradient-xy pb-24">
      <div
        id="yt-player"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0.01,
          pointerEvents: "none",
        }}
      />

      {!isAuthPage && (
        <Sidebar>
          <SidebarItem icon={<HouseIcon size={20} />} text="Home" to="/home" />
          <SidebarItem
            icon={<LibraryIcon size={20} />}
            text="Library"
            to="/library"
          />
          <SidebarItem icon={<MicVocal size={20} />} text="Artist" to="/artist" />
          <SidebarItem icon={<AlbumIcon size={20} />} text="Album" to="/album" />
          <SidebarItem icon={<Plus size={20} />} text="Room" to="/room" />
        </Sidebar>
      )}

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/artist" element={<Artist />} />
        <Route path="/album" element={<Album />} />
        <Route path="/room" element={<RoomLobby />} />
        <Route path="/Home" element={<Navigate to="/home" replace />} />
      </Routes>

      {!isAuthPage && (
        <PlayerBar
          activeTrack={activeTrack}
          onNext={playNext}
          onPrev={playPrev}
          onPlayPause={togglePlayPause}
          isPlaying={isPlaying}
          onVolumeChange={setVolume}
          shuffle={shuffle}
          setShuffle={setShuffle}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </Router>
  );
};

export default App;

