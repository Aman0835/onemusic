import { useState } from "react";
import { useSelector } from "react-redux";
import Logout from "../user/logout.jsx";

const ProfileCard = () => {
  const user = useSelector((store) => store.user);
  const [showMobileLogout, setShowMobileLogout] = useState(false);

  if (!user) return null;
  return (
    <div className="relative flex flex-col items-center w-full">
      <div 
        onClick={() => setShowMobileLogout(!showMobileLogout)}
        className="flex items-center justify-between w-full md:w-56 bg-white/5 border border-white/10 p-2 md:p-3 rounded-2xl shadow-2xl backdrop-blur-md hover:border-[#04A72E]/30 transition-all duration-300 cursor-pointer"
      >
        {/* Avatar */}
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex-shrink-0 border-2 border-white/10 group-hover:scale-105 transition-transform overflow-hidden ${!user.photoUrl ? 'bg-gradient-to-br from-[#F9C97C] to-[#f7b733]' : 'bg-black'}`}>
          {user.photoUrl ? (
            <img src={user.photoUrl} referrerPolicy="no-referrer" alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black font-black text-lg">
               {user.firstName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex flex-col flex-1 mx-3 overflow-hidden text-left">
          <h3 className="text-white font-bold text-sm leading-tight truncate">
            {user.firstName} {user.lastName}
          </h3>

          <h3 className="text-[10px] font-black text-zinc-500 truncate uppercase tracking-widest leading-tight mt-0.5">
            {user.email}
          </h3>
        </div>

        {/* Desktop Logout Icon */}
        <div className="hidden md:block flex-shrink-0">
          <Logout iconOnly />
        </div>
      </div>

      {/* Mobile Logout Dropdown/Option */}
      {showMobileLogout && (
        <div className="md:hidden absolute bottom-full mb-2 w-full bg-[#111] border border-white/10 rounded-xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
           <Logout />
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
