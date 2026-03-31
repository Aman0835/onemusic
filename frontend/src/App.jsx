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
import PlayerBar from "./components/PlayerBar.jsx";
import ListeningRoom from "./components/room/listeningRoom.jsx";
import RoomLobby from "./components/room/roomLobby.jsx";
import Login from "./components/user/login.jsx";
import Signup from "./components/user/signup.jsx";
import { API_BASE } from "./api/config";

import AuthCallback from "./auth/AuthCallback.jsx";
import Sidebar, { SidebarItem } from "./components/sidebar.jsx";
import "./index.css";

import axios from "axios";
import {
    Album as AlbumIcon,
    House as HouseIcon,
    Library as LibraryIcon,
    MicVocal,
    Plus,
} from "lucide-react";
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
    isRoomMode,
  } = usePlayer();

  const location = useLocation();
  const dispatch = useDispatch();
  const authApiBase = API_BASE + "/api/auth";
  const userApiBase = API_BASE + "/api/user";

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";
  const isRoomPage = location.pathname.startsWith("/room/") && location.pathname !== "/room";
  const hideSidebar = isAuthPage || isRoomPage;

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
    <div className="flex flex-col h-screen w-full bg-black text-white font-sans overflow-hidden bg-gradient-to-br from-indigo-900/60 via-black to-black animate-gradient-xy">
      
      {/* Top Section: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {!hideSidebar && (
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

        {/* Main Content Area */}
        <main className="flex-1 h-full min-w-0 overflow-y-auto scrollbar-hide">
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
            <Route path="/room/:roomName" element={<ListeningRoom />} />
            <Route path="/Home" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>

      {/* Bottom Section: PlayerBar */}
      {!hideSidebar && (
        <div className="flex-shrink-0 z-40">
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
            isRoomMode={isRoomMode}
          />
        </div>
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

