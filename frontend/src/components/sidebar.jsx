import { Headset } from "lucide-react";
import { useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import "../index.css";
import Button from "./Login/Button";
import ProfileCard from "./cards/profileCard";

export default function Sidebar({ children }) {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
   

  return (
    <aside className="h-full w-16 md:w-60">
      <nav className="relative h-full flex flex-col shadow-xl rounded-br-3xl rounded-tr-3xl bg-black/20 backdrop-blur-md border border-white/20 text-white w-16 md:w-60 transition-all duration-300">
        <div
          className="p-3 md:p-4 pb-2 flex items-center justify-center cursor-pointer group"
          onClick={() => navigate("/home")}>
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(4,167,46,0.3)] transition-transform group-hover:scale-110">
            <img src="/logo.png" alt="OneMusic Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="hidden md:block font-bold text-2xl p-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            One Music
          </h1>
        </div>
        <ul className="flex-1 px-2 md:px-3">{children}</ul>

        {user ? (
          <div className="p-3 md:p-4 text-white flex items-center justify-center">
            <ProfileCard />
          </div>
        ) : (
          <NavLink to="/login" className="flex items-center justify-center mb-4">
            <div className="p-1 md:p-2 text-white hover:text-[#04A72E]">
              <Button text="Login" />
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
