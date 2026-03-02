import React from "react";
import { useSelector } from "react-redux";
import Logout from "../user/logout.jsx";

const ProfileCard = () => {
  const user = useSelector((store) => store.user);

  if (!user) return null;
  return (
    <div className="flex items-center justify-between w-64 bg-white p-3 rounded-xl shadow-lg">
      <div className="w-12 h-12 rounded-full bg-[#F9C97C] shadow-md flex-shrink-0"></div>

      <div className="flex flex-col flex-1 mx-3 overflow-hidden">
        <h3 className="text-gray-700 font-semibold text-sm leading-tight truncate">
          {user.firstName} {user.lastName}
        </h3>

        <h3
          className="text-xs font-bold bg-clip-text text-transparent truncate 
                     bg-gradient-to-l from-[#005BC4] to-[#27272A] leading-tight">
          {user.email}
        </h3>
      </div>

      <div className="flex-shrink-0">
        <Logout iconOnly/>
      </div>
    </div>
  );
};

export default ProfileCard;
