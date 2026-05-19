import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/sol_fix.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = (sectionId) => {
    setIsOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Solfix" className="h-10 w-auto" />
            <span className="text-white font-semibold text-lg hidden sm:block">SOLFIX</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <a
              href="#curriculum"
              onClick={(e) => {
                e.preventDefault();
                if (location.pathname === '/') {
                  handleNavClick('curriculum');
                } else {
                  window.location.href = '/#curriculum';
                }
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Curriculum
            </a>
            <a
              href="#benefits"
              onClick={(e) => {
                e.preventDefault();
                if (location.pathname === '/') {
                  handleNavClick('benefits');
                } else {
                  window.location.href = '/#benefits';
                }
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Benefits
            </a>
            <Link
              to="/register"
              className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-black border-t border-gray-800">
          <div className="px-4 py-4 space-y-4">
            <Link
              to="/"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <a
              href="#curriculum"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => handleNavClick('curriculum')}
            >
              Curriculum
            </a>
            <a
              href="#benefits"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => handleNavClick('benefits')}
            >
              Benefits
            </a>
            <Link
              to="/register"
              className="block bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
              onClick={() => setIsOpen(false)}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}