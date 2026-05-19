const curriculumModules = [
  {
    category: 'Hardware Fundamentals',
    items: [
      { title: 'Laptop disassembly & reassembly', desc: 'Master safe teardown techniques for all major brands' },
      { title: 'Hardware diagnosis & troubleshooting', desc: 'Identify and fix hardware issues systematically' },
      { title: 'Schematic reading & board analysis', desc: 'Read and understand complex circuit diagrams' },
    ],
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&h=300&fit=crop'
  },
  {
    category: 'Power & Circuit Repair',
    items: [
      { title: 'Power systems & charging circuits', desc: 'Repair power delivery and charging problems' },
      { title: 'Motherboard diagnostics & repair', desc: 'Component-level board repair techniques' },
      { title: 'Peripheral circuits & port repair', desc: 'Fix USB, HDMI, and other connectivity ports' },
    ],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=300&fit=crop'
  },
  {
    category: 'Firmware & Software',
    items: [
      { title: 'BIOS / UEFI firmware recovery', desc: 'Flash and recover firmware safely' },
      { title: 'Storage, RAM & data recovery', desc: 'Recover data from failed storage devices' },
      { title: 'Advanced testing & quality control', desc: 'Professional testing and verification methods' },
    ],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=300&fit=crop'
  },
  {
    category: 'Advanced Techniques',
    items: [
      { title: 'Soldering basics & component rework', desc: 'Precision soldering and component replacement' },
      { title: 'Display, GPU & video signal repair', desc: 'Fix screen and graphics output issues' },
      { title: 'Thermal management & fan systems', desc: 'Solve overheating and cooling problems' },
    ],
    image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=500&h=300&fit=crop'
  },
];

export default function CurriculumSection() {
  return (
    <section id="curriculum" className="bg-black py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What You Will Learn
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Comprehensive curriculum covering all aspects of board-level repair, from fundamentals to advanced techniques.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {curriculumModules.map((module, index) => (
            <div
              key={index}
              className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300"
            >
              {/* Module Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={module.image}
                  alt={module.category}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                <h3 className="absolute bottom-4 left-6 text-white font-bold text-xl">
                  {module.category}
                </h3>
              </div>

              {/* Module Topics */}
              <div className="p-6">
                <ul className="space-y-4">
                  {module.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-4">
                      <span className="text-white flex-shrink-0 mt-0.5">→</span>
                      <div>
                        <h4 className="text-white font-medium">{item.title}</h4>
                        <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Case Studies Section */}
        <div className="mt-8 bg-gray-900/30 border border-gray-800 rounded-xl p-6 md:p-8">
          <div className="flex items-start space-x-4">
            <span className="text-white flex-shrink-0 text-xl">→</span>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Real-world Repair Case Studies</h3>
              <p className="text-gray-400">
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