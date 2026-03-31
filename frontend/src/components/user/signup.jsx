import {
    ChevronLeft,
    ChevronRight,
    Lock,
    Mail,
    Mars,
    MoreHorizontal,
    User,
    Venus
} from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addUser } from "../utils/UserSlice";
import { API_BASE } from "../../api/config";
import { saveToken } from "../../api/auth";

const AUTH_API_BASE = API_BASE + "/api/auth";

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "male",
    password: "",
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  });

  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jameson",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Toby",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  ];

  const genderOptions = [
    { value: "male", label: "Male", icon: <Mars size={18} /> },
    { value: "female", label: "Female", icon: <Venus size={18} /> },
    { value: "other", label: "Other", icon: <MoreHorizontal size={18} /> },
  ];

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${AUTH_API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Signup failed");
      
      if (data.token) saveToken(data.token);
      const user = data.user || data;
      
      if (user) {
        dispatch(addUser(user));
        setMessage("Account created! Welcome to OneMusic.");
        setTimeout(() => navigate("/home"), 1200);
      } else {
        setMessage("Signup successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setMessage(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex items-start md:items-center justify-center p-6 py-12 bg-[#050505] text-white overflow-y-auto">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#04A72E] rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-lg bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 my-auto leading-relaxed">
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-6 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 overflow-hidden">
            <img src="/logo.png" alt="OneMusic Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">OneMusic</h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">Join the ultimate listening experience</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
               <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#04A72E] transition-colors" />
               <input
                 required
                 placeholder="First Name"
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#04A72E]/50 focus:bg-white/10 transition-all text-sm"
                 onChange={(e) => setForm({ ...form, firstName: e.target.value })}
               />
            </div>
            <div className="relative group">
               <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#04A72E] transition-colors" />
               <input
                 required
                 placeholder="Last Name"
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#04A72E]/50 focus:bg-white/10 transition-all text-sm"
                 onChange={(e) => setForm({ ...form, lastName: e.target.value })}
               />
            </div>
          </div>

          <div className="relative group">
             <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#04A72E] transition-colors" />
             <input
               required
               type="email"
               placeholder="Email Address"
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#04A72E]/50 focus:bg-white/10 transition-all text-sm"
               onChange={(e) => setForm({ ...form, email: e.target.value })}
             />
          </div>

          <div className="relative group">
             <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#04A72E] transition-colors" />
             <input
               required
               type="password"
               placeholder="Secret Password"
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#04A72E]/50 focus:bg-white/10 transition-all text-sm"
               onChange={(e) => setForm({ ...form, password: e.target.value })}
             />
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Identify As</p>
             <div className="grid grid-cols-3 gap-3">
               {genderOptions.map((opt) => (
                 <button
                   key={opt.value}
                   type="button"
                   onClick={() => setForm({ ...form, gender: opt.value })}
                   className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all duration-300 ${
                     form.gender === opt.value 
                       ? "bg-[#04A72E]/10 border-[#04A72E] text-white shadow-[0_0_20px_rgba(4,167,46,0.1)]"
                       : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:bg-white/10"
                   }`}
                 >
                   {opt.icon}
                   <span className="text-[10px] font-bold uppercase">{opt.label}</span>
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Choose Character</p>
            <div className="flex flex-wrap items-center justify-center gap-4 py-2">
              {avatars.map((url) => (
                <div key={url} className="relative group/avatar">
                   <img
                    src={url}
                    alt="Avatar"
                    className={`w-14 h-14 rounded-full cursor-pointer border-2 transition-all duration-500 group-hover/avatar:scale-110 ${
                      form.photoUrl === url 
                        ? "border-[#04A72E] scale-110 shadow-[0_0_15px_rgba(4,167,46,0.2)] bg-[#04A72E]/10" 
                        : "border-transparent bg-white/5 hover:border-white/20"
                    }`}
                    onClick={() => setForm({ ...form, photoUrl: url })}
                  />
                  {form.photoUrl === url && (
                    <div className="absolute -bottom-1 -right-1 bg-[#04A72E] rounded-full p-1 border-2 border-[#050505] animate-in zoom-in">
                        <ChevronRight size={10} className="text-black rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full relative group overflow-hidden bg-[#04A72E] hover:bg-[#038b26] text-black font-black py-4 rounded-2xl mt-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[20deg]"></div>
            <span className="relative flex items-center justify-center gap-2">
              {loading ? "CREATING WORLD..." : "CREATE ACCOUNT"}
              {!loading && <ChevronRight size={18} />}
            </span>
          </button>

          <div className="text-center pt-4">
            <Link to="/login" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">
              Already have an account? <span className="text-[#04A72E]">Log In</span>
            </Link>
          </div>

          {message && (
            <div className="text-center animate-in slide-in-from-top-2">
               <p className={`text-[11px] font-bold ${message.includes("successful") ? "text-green-400" : "text-red-400"}`}>
                 {message.toUpperCase()}
               </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

