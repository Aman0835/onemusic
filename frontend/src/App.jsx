import { useEffect, Suspense, lazy } from "react";
import {
    Navigate,
    Route,
    BrowserRouter as Router,
    Routes,
    useLocation,
    Link,
} from "react-router-dom";


import { PlayerProvider, usePlayer } from "./context/PlayerContext.jsx";
import { Analytics } from "@vercel/analytics/react";

import PlayerBar from "./components/PlayerBar.jsx";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import { API_BASE } from "./api/config";
import { getToken, authHeaders } from "./api/auth";

import Sidebar, { SidebarItem } from "./components/sidebar.jsx";
import "./index.css";

const Album = lazy(() => import("./components/album.jsx"));
const Artist = lazy(() => import("./components/artist.jsx"));
const Home = lazy(() => import("./components/home.jsx"));
const Library = lazy(() => import("./components/library.jsx"));
const ListeningRoom = lazy(() => import("./components/room/listeningRoom.jsx"));
const RoomLobby = lazy(() => import("./components/room/roomLobby.jsx"));
const Login = lazy(() => import("./components/user/login.jsx"));
const Signup = lazy(() => import("./components/user/signup.jsx"));
const AuthCallback = lazy(() => import("./auth/AuthCallback.jsx"));


import axios from "axios";
import {
    Album as AlbumIcon,
    House as HouseIcon,
    Library as LibraryIcon,
    MicVocal,
    Plus,
    Menu
} from "lucide-react";
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
          {/* Mobile Header */}
          {!hideSidebar && (
            <div className="md:hidden relative flex items-center justify-between p-4 pb-2 min-h-[60px]">
              <button 
                onClick={toggleSidebar}
                className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95 z-10"
              >
                <Menu size={24} />
              </button>
              
              <Link 
                to="/home" 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-1 flex items-center gap-2 cursor-pointer group"
              >
                <span className="text-[#1DB954] font-bold text-[22px] tracking-tight group-hover:text-[#1ed760] transition-colors">OneMusic</span>
              </Link>
            </div>
          )}

          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <Suspense fallback={<div className="flex items-center justify-center w-full h-full"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div></div>}>
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
                <Route path="/room/:roomId" element={<ListeningRoom />} />
                <Route path="/Home" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
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
    <>
      <Router>
        <PlayerProvider>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </PlayerProvider>
      </Router>
      <Analytics />
    </> 
  );
};

export default App;

