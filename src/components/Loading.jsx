import { useState, useEffect } from 'react';
import logo from '../assets/sol_fix.png';

export default function Loading() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center transition-opacity duration-500">
      <div className="text-center">
        <img src={logo} alt="Solfix" className="h-16 w-auto mx-auto mb-6 animate-pulse" />
        <div className="w-12 h-1 mx-auto bg-white/50 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
}