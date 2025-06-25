import { useState } from "react";
import axios from "axios";

const LS = () => {
  const [isActive, setIsActive] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, isLogin) => {
    e.preventDefault();
    setMessage("");

    const endpoint = isLogin ? "/login" : "/register";
    try {
      const response = await axios.post(
        `http://localhost:5000${endpoint}`,
        formData
      );
      setMessage(response.data.message);
      if (isLogin && response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "Something went wrong");
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
          <div className="mb-4 relative">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200"
            />
            <label className="absolute left-4 top-2 text-gray-500">
              Username
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
            <label className="absolute left-4 top-2 text-gray-500">
              Password
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Login
          </button>
          <p
            className="mt-4 text-center text-gray-600 cursor-pointer"
            onClick={() => setIsActive(true)}
          >
            Don't have an account?{" "}
            <span className="text-blue-500">Sign Up</span>
          </p>
          {message && <p className="text-red-500 mt-2">{message}</p>}
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
            <label className="absolute left-4 top-2 text-gray-500">
              Username
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
            <label className="absolute left-4 top-2 text-gray-500">Email</label>
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
            <label className="absolute left-4 top-2 text-gray-500">
              Password
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Sign Up
          </button>
          <p
            className="mt-4 text-center text-gray-600 cursor-pointer"
            onClick={() => setIsActive(false)}
          >
            Already have an account?{" "}
            <span className="text-green-500">Login</span>
          </p>
          {message && <p className="text-red-500 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default LS;
