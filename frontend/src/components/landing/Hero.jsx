import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import heroImage from '../../assets/hero-student.png.jpg'; 

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sliit-gold/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sliit-navy/5 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          
          {/* LEFT SIDE: Animated Text and Buttons */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start gap-y-6">
            
            {/* Headline animates first */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] text-sliit-deep animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Seamless Campus Management, <br className="hidden lg:block" />
              <span className="text-sliit-gold">Unified in One Hub.</span>
            </h1>
            
            {/* Paragraph animates second */}
            <p className="text-gray-600 text-lg md:text-xl font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed pt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Empower your academic journey with real-time scheduling, collaborative tools, and smart resource allocation designed for modern universities.
            </p>
            
            {/* Buttons animate*/}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
              
              <a 
                href="#features"
                className="h-14 w-full sm:w-auto px-10 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 cursor-pointer"
              >
                Features <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/auth" state={{ isRegister: true }} className="h-14 w-full sm:w-auto px-10 bg-[#003087] hover:bg-[#002060] text-white rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center cursor-pointer">
                Register
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: 3D Image and Card */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none relative mt-12 lg:mt-0">
            <div className="w-full h-[550px] relative z-10">
                <div className="w-[480px] h-[520px] absolute inset-0 m-auto animate-pop-in-3d group" style={{ animationDelay: '0.5s' }}>
                    <img 
                      src={heroImage} 
                      alt="Student" 
                      className="w-full h-full object-cover rounded-3xl shadow-2xl scale-[1.05] transition-all duration-700 ease-out group-hover:scale-[1.08] group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]" 
                    />
                </div>
            </div>

            {/* Card pops in last */}
            <div className="absolute top-[60%] right-[5%] bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 z-20 flex flex-col gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.08)] animate-pop-in-3d hover:-translate-y-2 transition-transform duration-500 cursor-pointer" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-3 z-10">
                    <img src="https://i.pravatar.cc/150?img=1" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm z-10" />
                    <img src="https://i.pravatar.cc/150?img=2" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm z-20" />
                    <img src="https://i.pravatar.cc/150?img=3" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm z-30" />
                  </div>
                    <div className="w-10 h-10 rounded-full bg-sliit-navy flex items-center justify-center text-white text-xs font-semibold z-0 border border-white shadow-sm">+30</div>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold text-sliit-deep">Connect with Experts</p>
                    <p className="text-sm text-gray-500">Available to help you succeed.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}