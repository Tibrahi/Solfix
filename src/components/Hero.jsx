import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-black py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-6">
              <span className="text-white text-sm font-medium">Limited Seats Available</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Professional Laptop &{' '}
              <span className="text-gray-400">Motherboard</span> Repair Training
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0">
              Master board-level repair skills with hands-on training from industry experts. 
              Learn to diagnose, troubleshoot, and repair laptops, MacBooks, and mobile devices 
              at the component level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="bg-white text-black px-8 py-4 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 font-semibold text-lg"
              >
                Register Now
              </Link>
              <a
                href="#curriculum"
                className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-black transition-all font-semibold text-lg"
              >
                View Curriculum
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-white">✓</span>
                <span>Hands-on Training</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white">✓</span>
                <span>Certificate Included</span>
              </div>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=400&fit=crop"
              alt="Laptop motherboard repair training"
              className="w-full h-auto rounded-xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}