'use client'

// ✅ EXTRACTED: Success stats section
export default function SuccessStatsSection() {
  return (
    <section className="py-32 bg-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-18-13c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-36-26c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <span className="text-white/90 text-sm font-bold">
              🏆 Trusted by Champions
            </span>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
            Trusted by the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Best
            </span>
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Join the growing community of successful studios and passionate fitness enthusiasts
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div className="group text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              50K+
            </div>
            <div className="text-white/70 text-lg font-medium">Classes Booked</div>
          </div>
          
          <div className="group text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              1.2K+
            </div>
            <div className="text-white/70 text-lg font-medium">Studio Partners</div>
          </div>
          
          <div className="group text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              85+
            </div>
            <div className="text-white/70 text-lg font-medium">Cities</div>
          </div>
          
          <div className="group text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              4.9★
            </div>
            <div className="text-white/70 text-lg font-medium">Studio Rating</div>
          </div>
        </div>

        {/* Studio Logos */}
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 hover:opacity-70 transition-opacity duration-300">
          <div className="text-3xl font-bold text-white/80 hover:text-white transition-colors px-6 py-4 bg-white/5 rounded-2xl backdrop-blur-sm">
            YogaWorks
          </div>
          <div className="text-3xl font-bold text-white/80 hover:text-white transition-colors px-6 py-4 bg-white/5 rounded-2xl backdrop-blur-sm">
            SoulCycle
          </div>
          <div className="text-3xl font-bold text-white/80 hover:text-white transition-colors px-6 py-4 bg-white/5 rounded-2xl backdrop-blur-sm">
            CorePower
          </div>
          <div className="text-3xl font-bold text-white/80 hover:text-white transition-colors px-6 py-4 bg-white/5 rounded-2xl backdrop-blur-sm">
            Barry's
          </div>
        </div>
      </div>
    </section>
  )
}