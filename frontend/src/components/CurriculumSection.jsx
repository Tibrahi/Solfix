const curriculumModules = [
  {
    category: 'Hardware Fundamentals',
    items: [
      { title: 'Laptop disassembly & reassembly', desc: 'Master safe teardown techniques for all major brands' },
      { title: 'Hardware diagnosis & troubleshooting', desc: 'Identify and fix hardware issues systematically' },
      { title: 'Schematic reading & board analysis', desc: 'Read and understand complex circuit diagrams' },
    ],
    image: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?w=500&h=300&fit=crop'
  },
  {
    category: 'Power & Circuit Repair',
    items: [
      { title: 'Power systems & charging circuits', desc: 'Repair power delivery and charging problems' },
      { title: 'Motherboard diagnostics & repair', desc: 'Component-level board repair techniques' },
      { title: 'Peripheral circuits & port repair', desc: 'Fix USB, HDMI, and other connectivity ports' },
    ],
    image: 'https://images.pexels.com/photos/3721471/pexels-photo-3721471.jpeg?w=500&h=300&fit=crop'
  },
  {
    category: 'Firmware & Software',
    items: [
      { title: 'BIOS / UEFI firmware recovery', desc: 'Flash and recover firmware safely' },
      { title: 'Storage, RAM & data recovery', desc: 'Recover data from failed storage devices' },
      { title: 'Advanced testing & quality control', desc: 'Professional testing and verification methods' },
    ],
    image: 'https://images.pexels.com/photos/3726875/pexels-photo-3726875.jpeg?w=500&h=300&fit=crop'
  },
  {
    category: 'Advanced Techniques',
    items: [
      { title: 'Soldering basics & component rework', desc: 'Precision soldering and component replacement' },
      { title: 'Display, GPU & video signal repair', desc: 'Fix screen and graphics output issues' },
      { title: 'Thermal management & fan systems', desc: 'Solve overheating and cooling problems' },
    ],
    image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?w=500&h=300&fit=crop'
  },
];

export default function CurriculumSection() {
  return (
    <section id="curriculum" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            What You Will Learn
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Comprehensive curriculum covering all aspects of board-level repair, from fundamentals to advanced techniques.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {curriculumModules.map((module, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 rounded-xl overflow-hidden hover:border-gray-500 shadow-md hover:shadow-lg transition-all duration-300"
            >
              {/* Module Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={module.image}
                  alt={module.category}
                  className="w-full h-full object-cover hover:brightness-110 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                <h3 className="absolute bottom-4 left-6 text-white font-bold text-xl">
                  {module.category}
                </h3>
              </div>

              {/* Module Topics */}
              <div className="p-6">
                <ul className="space-y-4">
                  {module.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-4">
                      <span className="text-black flex-shrink-0 mt-0.5">→</span>
                      <div>
                        <h4 className="text-black font-medium">{item.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Case Studies Section */}
        <div className="mt-8 bg-white border border-gray-300 rounded-xl p-6 md:p-8 shadow-md">
          <div className="flex items-start space-x-4">
            <span className="text-black flex-shrink-0 text-xl">→</span>
            <div>
              <h3 className="text-black font-bold text-lg mb-2">Real-world Repair Case Studies</h3>
              <p className="text-gray-700">
                Learn from actual repair scenarios encountered in professional repair shops. 
                Analyze real faults, diagnostic processes, and solutions used by experienced technicians.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}