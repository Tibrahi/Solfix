const benefits = [
  {
    title: 'Certificate after Training',
    desc: 'Receive an official certificate upon completion, validating your repair skills.',
    image: 'https://images.pexels.com/photos/3728092/pexels-photo-3728092.jpeg?w=400&h=250&fit=crop'
  },
  {
    title: 'Unlimited Sit-ins',
    desc: 'Attend multiple sessions at no extra cost until you master the material.',
    image: 'https://images.pexels.com/photos-1443890985614-41c1cffcca74?w=400&h=250&fit=crop'
  },
  {
    title: 'Exclusive Group Support',
    desc: 'Join our private community for ongoing help and networking with peers.',
    image: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?w=400&h=250&fit=crop'
  },
  {
    title: 'Professional Mentors',
    desc: 'Learn directly from experienced repair technicians with years of field experience.',
    image: 'https://images.pexels.com/photos-1438761681033-6461ffad8d80?w=400&h=250&fit=crop'
  },
  {
    title: 'Hands-on Diagnostics',
    desc: 'Work with real faulty boards and devices to build practical skills.',
    image: 'https://images.pexels.com/photos-1516321318423-f06143ca507e?w=400&h=250&fit=crop'
  },
  {
    title: 'Step-by-step Repair Guide',
    desc: 'Get comprehensive manuals and reference materials to take home.',
    image: 'https://images.pexels.com/photos-1481627834876-b7833e8f5570?w=400&h=250&fit=crop'
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