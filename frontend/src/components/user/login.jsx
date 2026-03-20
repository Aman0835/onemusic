import axios from "axios";
import {
    ChevronRight,
    Eye,
    EyeOff,
    Lock,
    Mail
} from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { addUser } from "../utils/UserSlice";

const AUTH_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/auth`;

function extractUser(payload) {
  return payload?.user || payload || null;
}

export default function Login() {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const req = await axios.post(
        AUTH_API_BASE + "/login",
        {
          email: emailId,
          password,
        },
        { withCredentials: true },
      );

      const user = extractUser(req.data);
      if (!user) throw new Error("Invalid login response");

      dispatch(addUser(user));
      navigate("/home");
    } catch (error) {
      setError(error?.response?.data || error?.message || "Something went wrong");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-start md:items-center justify-center p-6 py-12 bg-[#050505] text-white overflow-y-auto">
      {/* Background Blurs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#04A72E] rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 my-auto">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 overflow-hidden">
            <img src="/logo.png" alt="OneMusic Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Welcome Back</h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">Ready to start the rhythm?</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative group">
             <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#04A72E] transition-colors" />
             <input
               required
               type="email"
               placeholder="Email Address"
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#04A72E]/50 focus:bg-white/10 transition-all text-sm font-medium"
               onChange={(e) => setEmailId(e.target.value)}
               value={emailId}
             />
          </div>

          <div className="relative group">
             <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#04A72E] transition-colors" />
             <input
               required
               type={showPassword ? "text" : "password"}
               placeholder="Password"
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#04A72E]/50 focus:bg-white/10 transition-all text-sm font-medium"
               onChange={(e) => setPassword(e.target.value)}
               value={password}
             />
             <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
          </div>

          <div className="flex justify-end pr-1">
             <button type="button" className="text-[10px] font-bold text-zinc-500 hover:text-[#04A72E] transition-colors uppercase tracking-widest">
               Forgot Password?
             </button>
          </div>

          <button
            disabled={loading}
            className="w-full relative group overflow-hidden bg-[#04A72E] hover:bg-[#038b26] text-black font-black py-4 rounded-2xl mt-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[20deg]"></div>
            <span className="relative flex items-center justify-center gap-2">
              {loading ? "LOGGING IN..." : "START LISTENING"}
              {!loading && <ChevronRight size={18} />}
            </span>
          </button>

          <div className="text-center pt-6">
            <Link to="/signup" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">
              New here? <span className="text-[#04A72E]">Create an Account</span>
            </Link>
          </div>

          {error && (
            <div className="text-center pt-4 animate-in slide-in-from-top-2">
               <p className="text-[11px] font-black text-red-400 bg-red-400/10 py-2 px-4 rounded-lg border border-red-400/20 uppercase tracking-widest">
                 {error}
               </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}



