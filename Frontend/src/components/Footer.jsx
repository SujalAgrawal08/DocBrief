export default function Footer() {
  return (
    <footer className="w-full py-6 bg-black text-center text-gray-300 border-t border-cyan-500 shadow-inner">
      <p className="text-sm">
        © {new Date().getFullYear()} DocBrief. All rights reserved.
      </p>

      {/* Social Media Links */}
      <div className="flex justify-center gap-6 mt-2">
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="glowing-link"
        >
          Twitter
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="glowing-link"
        >
          GitHub
        </a>
        <a
          href="https://linkedin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="glowing-link"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
