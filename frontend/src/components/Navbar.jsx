import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/sol_fix.png';
import { config } from '../config';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (sectionId) => {
    setIsOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Check if user is logged in on component mount and listen for storage events
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');
      
      if (token && user) {
        setIsLoggedIn(true);
        setAdminUser(JSON.parse(user));
      } else {
        setIsLoggedIn(false);
        setAdminUser(null);
      }
    };

    checkAuth();

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        await fetch(config.endpoints.adminLogout, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {}); // Ignore errors
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsLoggedIn(false);
      setAdminUser(null);
      setShowDropdown(false);
      navigate('/');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.charAt(0).toUpperCase();
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
            {isLoggedIn ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(adminUser?.username)}
                    </span>
                  </div>
                  <span className="text-white font-medium">{adminUser?.username}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-white font-medium">{adminUser?.username}</p>
                      <p className="text-gray-400 text-sm truncate">{adminUser?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/admin/dashboard');
                        }}
                        className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-700"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Login
              </Link>
            )}
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
            {isLoggedIn ? (
              <>
                {/* Mobile User Info */}
                <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {getInitials(adminUser?.username)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{adminUser?.username}</p>
                    <p className="text-gray-400 text-sm">{adminUser?.email}</p>
                  </div>
                </div>
                <Link
                  to="/admin/dashboard"
                  className="block text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left text-red-400 hover:text-red-300 transition-colors py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                className="block bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
