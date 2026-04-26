import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, BookOpen, Bell, Settings, LogOut } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function StudentDashboard() {
  
  const [user, setUser] = useState({ fullName: "Student" });

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full">
        {/* Modern Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-[#001f5b] mb-2 tracking-tight">
            Welcome back, <span className="text-[#F5A623]">{user.fullName}</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Here is what's happening on campus today.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Active Bookings', value: '4', icon: Calendar, color: 'bg-blue-50 text-blue-600' },
            { label: 'New Resources', value: '12', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Notifications', value: '7', icon: Bell, color: 'bg-orange-50 text-[#F5A623]' },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
                <item.icon size={24} />
              </div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-3xl font-black text-[#222222]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-[#222222] rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
            <p className="text-gray-400 max-w-md mb-8">
              Access your personalized student services, book study spaces, or connect with campus support.
            </p>
            <button className="bg-[#F5A623] text-[#222222] px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform">
              Explore Facilities
            </button>
          </div>
          {/* Decorative Circle matching your landing page style */}
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl"></div>
        </div>
      </main>

      <Footer />
    </div>
  );
}