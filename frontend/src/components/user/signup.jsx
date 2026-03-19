import { useState } from "react";

const AUTH_API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  `${import.meta.env.VITE_API_BASE || "http://localhost:5000"}/api/auth`;

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
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
        credentials: "include",
        body: JSON.stringify(form),
      });

      const text = await res.text();

      if (!res.ok) throw new Error(text);

      setMessage("Signup successful! You can log in now.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-8"
      >
        <h1 className="text-3xl font-bold mb-4 text-center">Create Account</h1>

        <div className="grid grid-cols-2 gap-4">
          <input
            required
            placeholder="First Name"
            className="input"
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            required
            placeholder="Last Name"
            className="input"
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        <input
          required
          type="email"
          placeholder="Email"
          className="input mt-4"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          required
          type="password"
          placeholder="Password"
          className="input mt-4"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          required
          className="input mt-4"
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        >
          <option value="">Choose Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <div className="mt-6">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Choose Avatar</p>
          <div className="grid grid-cols-6 gap-2">
            {avatars.map((url) => (
              <img
                key={url}
                src={url}
                alt="Avatar"
                className={`w-10 h-10 rounded-full cursor-pointer border-2 transition-all ${
                  form.photoUrl === url ? "border-green-500 scale-110 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-transparent hover:border-white/20"
                }`}
                onClick={() => setForm({ ...form, photoUrl: url })}
              />
            ))}
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg mt-6"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-red-400 mt-4">{message}</p>
      </form>
    </div>
  );
}
