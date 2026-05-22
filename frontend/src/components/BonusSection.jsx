const bonuses = [
  {
    title: 'Quick Reference Guide',
    desc: 'Pocket-sized troubleshooting reference for common faults and solutions.',
    image: 'https://media.istockphoto.com/id/2185114510/photo/process-diagram-with-3d-gear-icon-centered-among-sequential-circular-steps-3d-rendering.jpg?s=612x612&w=0&k=20&c=GmGbGxgEs5tDTT0l_Y-vGi2pIivAUNv--hFp6gX-Axs='
  },
  {
    title: 'Fault Finding Flowcharts',
    desc: 'Step-by-step diagnostic flowcharts for systematic problem-solving.',
    image: 'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29tcHV0ZXIlMjB0ZWNobmljaWFufGVufDB8fDB8fHww'
  },
  {
    title: 'Tools & Equipment Guide',
    desc: 'Complete list of essential tools and how to use them effectively.',
    image: 'https://plus.unsplash.com/premium_photo-1726863026105-b320133454e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29tcHV0ZXIlMjB0b29sc3xlbnwwfHwwfHx8MA%3D%3D'
  },
  {
    title: 'Component Identification Guide',
    desc: 'Visual guide to identify SMD components, ICs, and connectors.',
    image: 'https://plus.unsplash.com/premium_photo-1723921242867-42dbc213fbd1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29tcHV0ZXIlMjB0ZWNobmljaWFufGVufDB8fDB8fHww'
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