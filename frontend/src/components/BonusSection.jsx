const bonuses = [
  {
    title: 'Quick Reference Guide',
    desc: 'Pocket-sized troubleshooting reference for common faults and solutions.',
    image: 'https://images.pexels.com/photos-1427351714076-e47e0062267d?w=300&h=200&fit=crop'
  },
  {
    title: 'Fault Finding Flowcharts',
    desc: 'Step-by-step diagnostic flowcharts for systematic problem-solving.',
    image: 'https://images.pexels.com/photos-1552664730-d8ca884ca280?w=300&h=200&fit=crop'
  },
  {
    title: 'Tools & Equipment Guide',
    desc: 'Complete list of essential tools and how to use them effectively.',
    image: 'https://images.pexels.com/photos-1536633482257-38c049eaf81a?w=300&h=200&fit=crop'
  },
  {
    title: 'Component Identification Guide',
    desc: 'Visual guide to identify SMD components, ICs, and connectors.',
    image: 'https://images.pexels.com/photos-3735188-d9a2e39dc16e?w=300&h=200&fit=crop'
  },
];

export default function BonusSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Free Bonuses
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Enroll in the training program and receive these exclusive resources at no extra cost.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bonuses.map((bonus, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 rounded-xl overflow-hidden hover:border-gray-500 shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              {/* Bonus Image */}
              <div className="relative h-28 overflow-hidden">
                <img
                  src={bonus.image}
                  alt={bonus.title}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              </div>

              {/* Bonus Content */}
              <div className="p-4 text-center">
                <h3 className="text-black font-semibold mb-2">{bonus.title}</h3>
                <p className="text-gray-700 text-sm">{bonus.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}