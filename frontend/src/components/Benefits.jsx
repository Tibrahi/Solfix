const benefits = [
  {
    title: 'Certificate after Training',
    desc: 'Receive an official certificate upon completion, validating your repair skills.',
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGNvbXB1dGVyJTIwcmVwYWlyfGVufDB8fDB8fHww'
  },
  {
    title: 'Unlimited Sit-ins',
    desc: 'Attend multiple sessions at no extra cost until you master the material.',
    image: 'https://plus.unsplash.com/premium_photo-1726862557521-000a02f0a156?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZWxlY3Ryb25pYyUyMHJlcGFpcnxlbnwwfHwwfHx8MA%3D%3D'
  },
  {
    title: 'Exclusive Group Support',
    desc: 'Join our private community for ongoing help and networking with peers.',
    image: 'https://images.unsplash.com/photo-1646821804389-9778ce2a4fd7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZWxlY3Ryb25pYyUyMHJlcGFpcnxlbnwwfHwwfHx8MA%3D%3D'
  },
  {
    title: 'Professional Mentors',
    desc: 'Learn directly from experienced repair technicians with years of field experience.',
    image: 'https://media.istockphoto.com/id/898644098/photo/man-fixing-electronic-circuit.webp?a=1&b=1&s=612x612&w=0&k=20&c=WN8cfTgcE8-qhg85JDNOkpajIhp99XKflNIEGR5CTNk='
  },
  {
    title: 'Hands-on Diagnostics',
    desc: 'Work with real faulty boards and devices to build practical skills.',
    image: 'https://images.unsplash.com/photo-1654687790317-e0edff2e8196?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNvbXB1dGVyJTIwcmVwYWlyfGVufDB8fDB8fHww'
  },
  {
    title: 'Step-by-step Repair Guide',
    desc: 'Get comprehensive manuals and reference materials to take home.',
    image: 'https://images.unsplash.com/photo-1768633647910-7e6fb53e5b0f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8dGVjaCUyMHJlcGFpcnxlbnwwfHwwfHx8MA%3D%3D'
  },
];

export default function Benefits() {
  return (
    <section id="benefits" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Why Choose Solfix?
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            We provide more than just training — we build your career in electronics repair.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 rounded-xl overflow-hidden hover:border-gray-500 shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              {/* Benefit Image */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={benefit.image}
                  alt={benefit.title}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              </div>

              {/* Benefit Content */}
              <div className="p-5">
                <h3 className="text-black font-semibold text-lg mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-700 text-sm">
                  {benefit.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}