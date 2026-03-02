import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  const [isSignup, setIsSignup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setError("");
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
      setError(error?.response?.data || error?.message || "something went wrong");
      console.error(error);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      const req = await axios.post(
        AUTH_API_BASE + "/signup",
        {
          email: emailId,
          password,
          firstName,
          lastName,
          gender,
        },
        { withCredentials: true },
      );

      const user = extractUser(req.data);
      if (!user) throw new Error("Invalid signup response");

      dispatch(addUser(user));
      navigate("/home");
    } catch (error) {
      setError(error?.response?.data || error?.message || "something went wrong");
      console.error(error);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-white/10 text-black">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setIsSignup(false)}
            className={`text-lg font-semibold underline rounded-3xl px-4 py-2 ${
              !isSignup ? "text-black bg-green-500" : "text-gray-700"
            }`}>
            Log in
          </button>

          <div
            onClick={() => setIsSignup(!isSignup)}
            className="w-14 h-7 bg-white rounded-full cursor-pointer flex items-center p-1 border-4 border-black">
            <div
              className={`w-5 h-5 bg-gray-300 rounded-full shadow-[3px_3px_0px_#000] transform transition ${
                isSignup ? "translate-x-7" : ""
              }`}></div>
          </div>

          <button
            onClick={() => setIsSignup(true)}
            className={`text-lg font-semibold rounded-3xl px-4 py-2 ${
              isSignup ? "underline text-black bg-green-500" : "text-gray-700"
            }`}>
            Sign up
          </button>
        </div>

        <div className="bg-gray-300 border-4 border-black rounded-xl w-[360px] p-8 shadow-[8px_8px_0px_#000]">
          <h2 className="text-3xl font-bold text-center mb-6">
            {isSignup ? "Sign up" : "Log in"}
          </h2>

          {!isSignup && (
            <div className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setEmailId(e.target.value)}
                value={emailId}
              />

              <div className="relative w-full">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full h-12 px-4 pr-12 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />

                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black">
                  {showLoginPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>

              <p className="text-red-600">{error}</p>

              <button
                onClick={handleLogin}
                className="w-40 mx-auto h-12 bg-white border-4 border-black rounded-lg font-semibold shadow-[5px_5px_0px_#000] hover:translate-y-1 transition">
                Login
              </button>
            </div>
          )}

          {isSignup && (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="First Name"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />

              <input
                type="text"
                placeholder="Last Name"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
              />

              <input
                type="email"
                placeholder="Email"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setEmailId(e.target.value)}
                value={emailId}
              />

              <div className="relative w-full">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full h-12 px-4 pr-12 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />

                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black">
                  {showSignupPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              <input
                type={showSignupPassword ? "text" : "password"}
                placeholder="Confirm Password"
                required
                className="w-full h-12 px-4 pr-12 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
              />

              <input
                required
                type="text"
                placeholder="Gender ex(male,female,other)"
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setGender(e.target.value)}
                value={gender}></input>
              <p className="text-red-600">{error}</p>

              <button
                onClick={handleSignup}
                className="w-40 mx-auto h-12 bg-white border-4 border-black rounded-lg font-semibold shadow-[5px_5px_0px_#000] hover:translate-y-1 transition">
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





