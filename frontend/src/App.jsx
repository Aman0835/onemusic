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
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import { API_BASE } from "./api/config";
import { getToken, authHeaders } from "./api/auth";

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
    Menu
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
    volume,
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

  const { isOpen: isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  useEffect(() => {
    if (!authApiBase || isAuthPage) return;

    // Avoid duplicate boot-time checks in React StrictMode (development).
    if (hasBootSessionCheckRun) return;
    hasBootSessionCheckRun = true;

    if (!getToken()) {
      dispatch(removeUser());
      return;
    }

    axios
      .get(authApiBase + "/me", { headers: authHeaders() })
      .then((res) => {
        const user = res?.data?.user;
        if (user) dispatch(addUser(user));
      })
      .catch(() => {
        dispatch(removeUser());
      });
  }, [authApiBase, dispatch, isAuthPage]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-black text-white font-sans overflow-hidden bg-gradient-to-br from-indigo-900/60 via-black to-black animate-gradient-xy">
      
      {/* Top Section: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {!hideSidebar && (
          <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={closeSidebar}
              />
            )}
            
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar}>
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
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header (Hamburger) */}
          {!hideSidebar && (
            <div className="md:hidden flex items-center p-4">
              <button 
                onClick={toggleSidebar}
                className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <Menu size={24} />
              </button>
            </div>
          )}

          <main className={`flex-1 overflow-y-auto scrollbar-hide ${!hideSidebar ? "pb-24 sm:pb-32" : ""}`}>
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
            volume={volume}
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
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </PlayerProvider>
    </Router>
  );
};

export default App;

