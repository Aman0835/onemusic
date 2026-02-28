import React from 'react';


const ProfileCard = () => {


    const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="flex items-center p-3 w-64 h-16 bg-white rounded-md shadow-lg">
      <section className="flex justify-center items-center w-14 h-14 rounded-full shadow-md bg-[#F9C97C]">
      </section>
      <section className="block border-l border-gray-300 m-3">
        <div className="pl-3">
          <h3 className="text-gray-600 font-semibold text-sm">{user.firstName} {user.lastName}</h3>
          <h3 className="bg-clip-text text-transparent truncate w-26 bg-gradient-to-l from-[#005BC4] to-[#27272A] text-xs font-bold">{user.email}</h3>
        </div>
        
      </section>
    </div>
  );
}

export default ProfileCard;
