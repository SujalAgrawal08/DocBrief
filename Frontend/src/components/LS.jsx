import { useState } from "react";
import { supabase } from "../supabaseClient"; // Import the client
import { useNavigate } from "react-router-dom"; // For redirecting after login

const LS = () => {
  const [isActive, setIsActive] = useState(false);
  const [formData, setFormData] = useState({
    username: "", // We will treat this as 'Display Name' if needed, or ignore for Auth
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, isLogin) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.username, // Using the 'username' field input for Email
          password: formData.password,
        });

        if (error) throw error;
        
        // Success! Redirect to Workspace
        navigate("/work"); 
      } else {
        // --- SIGNUP LOGIC ---
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        setMessage("Success! Check your email for the confirmation link.");
      }
    } catch (error) {
      setMessage(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center h-screen bg-gray-100 transition-all duration-500 ${
        isActive ? "bg-blue-200" : "bg-white"
      }`}
    >
      {/* Login Form */}
      <div
        className={`absolute w-96 p-6 bg-white rounded-lg shadow-lg transition-all duration-500 ${
          isActive ? "-translate-x-full opacity-0" : "opacity-100"
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
        <form onSubmit={(e) => handleSubmit(e, true)}>
          {/* We use the 'username' input field for Email to match your CSS/Layout, but treat it as email */}
          <div className="mb-4 relative">
            <input
              type="email" // Changed to email type for validation
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-xs bg-white px-1 -mt-2">
              Email
            </label>
          </div>
          <div className="mb-4 relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-xs bg-white px-1 -mt-2">
              Password
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition"
          >
            {loading ? "Verifying..." : "Login"}
          </button>
          <p
            className="mt-4 text-center text-gray-600 cursor-pointer hover:text-blue-500"
            onClick={() => {
                setMessage("");
                setIsActive(true);
            }}
          >
            Don't have an account?{" "}
            <span className="text-blue-500 font-bold">Sign Up</span>
          </p>
          {message && <div className="mt-3 p-2 bg-red-50 text-red-600 text-sm rounded text-center">{message}</div>}
        </form>
      </div>

      {/* Register Form */}
      <div
        className={`absolute w-96 p-6 bg-white rounded-lg shadow-lg transition-all duration-500 ${
          isActive ? "opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="mb-4 relative">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-xs bg-white px-1 -mt-2">
              Username (Optional)
            </label>
          </div>
          <div className="mb-4 relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-xs bg-white px-1 -mt-2">Email</label>
          </div>
          <div className="mb-4 relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
            <label className="absolute left-4 top-2 text-gray-500 text-xs bg-white px-1 -mt-2">
              Password
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 transition"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
          <p
            className="mt-4 text-center text-gray-600 cursor-pointer hover:text-green-500"
            onClick={() => {
                setMessage("");
                setIsActive(false);
            }}
          >
            Already have an account?{" "}
            <span className="text-green-500 font-bold">Login</span>
          </p>
          {message && <div className="mt-3 p-2 bg-blue-50 text-blue-600 text-sm rounded text-center">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default LS;