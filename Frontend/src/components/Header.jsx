export default function Header() {
  return (
    <header className="w-full py-4 px-8 flex justify-between items-center bg-black text-white shadow-lg border-b border-cyan-500">
      {/* Logo / Title */}
      <h1 className="text-3xl font-bold tracking-wide text-cyan-400 neon-text">
        DocBrief 🚀
      </h1>

      {/* Navigation Buttons */}
      <div className="flex gap-6">
        <button className="glowing-button">Login</button>
        <button className="glowing-button">Sign Up</button>
      </div>
    </header>
  );
}
