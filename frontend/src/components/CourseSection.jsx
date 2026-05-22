import { Link } from 'react-router-dom';

export default function CourseSection() {
  return (
    <section id="courses" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Complete Training Package
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            One comprehensive program covering laptop, MacBook, and mobile device repair at the board level.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-lg">
            {/* Course Image */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img
                src="https://images.pexels.com/photos-1714899927423-7cc9e9fef368?w=800&h=400&fit=crop"
                alt="Board Level Repair Training"
                className="w-full h-full object-cover hover:brightness-110 transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                <span className="inline-block bg-white text-black px-4 py-1 rounded-full text-sm font-medium mb-3">
                  All-Inclusive Program
                </span>
                <h3 className="text-white font-bold text-2xl md:text-3xl">
                  Board Level Repair Masterclass
                </h3>
              </div>
            </div>

            {/* Course Content */}
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-black font-semibold text-lg mb-4">What's Included</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <span className="text-gray-700">Laptop disassembly & component-level repair</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <span className="text-gray-700">MacBook logic board diagnostics & repair</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <span className="text-gray-700">Mobile device motherboard repair</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <span className="text-gray-700">Schematic reading & circuit analysis</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <span className="text-gray-700">BIOS/UEFI programming & recovery</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <span className="text-gray-700">Precision soldering & rework techniques</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <h4 className="text-black font-semibold text-lg mb-4">Program Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-700">Duration</span>
                        <span className="text-black font-medium">3 Months Intensive</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-700">Format</span>
                        <span className="text-black font-medium">Hands-on Practical</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-700">Certification</span>
                        <span className="text-black font-medium">Official Certificate</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="text-gray-700">Support</span>
                        <span className="text-black font-medium">Lifetime Access</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0">
                    <div className="mb-4">
                      <span className="text-gray-700 text-sm">Complete Training Fee</span>
                      <div className="text-3xl md:text-4xl font-bold text-black mt-1">
                        250,000 RWF
                      </div>
                    </div>
                    <Link
                      to="/register"
                      className="block w-full bg-black text-white text-center py-4 rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg"
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}