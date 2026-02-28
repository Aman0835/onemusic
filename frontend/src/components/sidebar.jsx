import { Headset } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "../index.css";
import Button from "./Login/Button";
import ProfileCard from "./cards/profileCard";

export default function Sidebar({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <aside className="h-screen w-16 md:w-60">
      <nav className="relative h-full flex flex-col shadow-xl rounded-br-3xl rounded-tr-3xl bg-black/20 backdrop-blur-md border border-white/20 text-white w-16 md:w-60 transition-all duration-300">
        <div
          className="p-3 md:p-4 pb-2 flex items-center justify-center cursor-pointer"
          onClick={() => navigate("/home")}>
          <Headset
            size={55}
            className="hidden md:block text-[#0b0f0c] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:scale-[1.05] hover:text-white"
          />
          <h1 className="hidden md:block font-bold text-2xl p-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            One Music
          </h1>
        </div>
        <ul className="flex-1 px-2 md:px-3">{children}</ul>

        {user ? (
          <div className="p-3 md:p-4 text-white flex items-center justify-center ">
            <ProfileCard />
          </div>
        ) : (
          <NavLink to="/login" className="hidden md:block">
            <div className="p-2 md:p-4 text-white hover:text-[#04A72E]">
              {Button()}
            </div>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

export function SidebarItem({ icon, text, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex items-center py-2 px-3 my-1
         rounded-md font-medium cursor-pointer justify-center md:justify-start
          transition-colors ${
            isActive
              ? "bg-gradient-to-r from-[#04A72E] to-[#04A72E] text-black"
              : "text-white hover:bg-[#d3cfd3aa] hover:text-[#090909] hover:shadow-lg/20"
          }`
      }>
      {icon}
      <span className="overflow-hidden transition-all w-0 md:w-full md:ml-3">
        {text}
      </span>
    </NavLink>
  );
}
