import { Headset, X, User } from "lucide-react";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import "../index.css";
import Button from "./Login/Button";
import ProfileCard from "./cards/profileCard";
import { useSidebar } from "../context/SidebarContext";

export default function Sidebar({ children, isOpen, onClose }) {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
   

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <nav className="relative h-full flex flex-col shadow-xl rounded-r-3xl bg-black/90 md:bg-black/20 backdrop-blur-md border-r border-y border-white/20 text-white w-full">
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white md:hidden hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div
          className="p-4 flex items-center justify-center cursor-pointer group mt-2 md:mt-0"
          onClick={() => {
            navigate("/home");
            onClose && onClose();
          }}>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(4,167,46,0.3)] transition-transform group-hover:scale-110">
            <img src="/logo.png" alt="OneMusic Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-bold text-2xl p-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            One Music
          </h1>
        </div>
        <ul className="flex-1 px-2 md:px-3">{children}</ul>

        {user ? (
          <div className="p-3 md:p-4 text-white flex items-center justify-center">
            <ProfileCard />
          </div>
        ) : (
          <div className="p-3 md:p-4 flex items-center justify-center w-full">
            <NavLink to="/login" className="w-full flex justify-center">
              <div className="w-full md:w-56 bg-white/5 border border-white/10 p-2 md:p-3 rounded-2xl shadow-2xl backdrop-blur-md hover:border-[#04A72E]/50 hover:bg-white/10 transition-all duration-300 cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border-2 border-white/5">
                  <User size={20} className="text-zinc-400" />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-white font-bold text-sm truncate">Guest User</span>
                  <span className="text-[#04A72E] text-[10px] font-black uppercase tracking-widest mt-0.5 truncate">
                    Click to Login
                  </span>
                </div>
              </div>
            </NavLink>
          </div>
        )}
      </nav>
    </aside>
  );
}

export function SidebarItem({ icon, text, to }) {
  const { closeSidebar } = useSidebar();

  return (
    <NavLink
      to={to}
      onClick={closeSidebar}
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
      <span className="ml-3 font-semibold">
        {text}
      </span>
    </NavLink>
  );
}
