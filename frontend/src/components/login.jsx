import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      

      setMessage("Login successful!");
      window.location.href = "/home";
    } catch (err) {
      setMessage(err.message);
    }

    setLoading(false);
  }

async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    localStorage.setItem("user", JSON.stringify(data.user));  

    setMessage("Login successful!");
    window.location.href = "/home";
  } catch (err) {
    setMessage(err.message);
  }

  setLoading(false);
}
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
            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <div className="relative w-full">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full h-12 px-4 pr-12 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black">
                  {showLoginPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>

              <button
                disabled={loading}
                className="w-40 mx-auto h-12 bg-white border-4 border-black rounded-lg font-semibold shadow-[5px_5px_0px_#000] hover:translate-y-1 transition">
                {loading ? "Logging in..." : "Let`s go!"}
              </button>
            </form>
          )}

          {isSignup && (
            <form className="flex flex-col gap-4" onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="First Name"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Last Name"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />

              <input
                type="email"
                placeholder="Email"
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <div className="relative w-full">
                <input
                  type={showSignupPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full h-12 px-4 pr-12 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-black">
                  {showSignupPassword ? (
                    <EyeOff size={22} />
                  ) : (
                    <Eye size={22} />
                  )}
                </button>
              </div>

              <select
                required
                className="w-full h-12 px-4 text-lg border-4 border-black rounded-lg bg-white shadow-[5px_5px_0px_#000]"
                onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <button
                disabled={loading}
                className="w-40 mx-auto h-12 bg-white border-4 border-black rounded-lg font-semibold shadow-[5px_5px_0px_#000] hover:translate-y-1 transition">
                {loading ? "Creating..." : "Confirm!"}
              </button>
            </form>
          )}

          {message && (
            <p className="text-center text-red-600 font-semibold mt-4">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
