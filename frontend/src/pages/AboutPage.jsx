import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, ShieldCheck, Sparkles, Users, Building2, BookOpenCheck } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const stats = [
  { label: 'Active Students', value: '10K+' },
  { label: 'Smart Facilities', value: '40+' },
  { label: 'Daily Bookings', value: '2.5K+' },
  { label: 'Support Tickets Resolved', value: '95%' }
];

const values = [
  {
    title: 'Student-First Design',
    description: 'Every feature is designed around real student workflows, from lecture day planning to service requests.',
    icon: Users
  },
  {
    title: 'Trusted & Secure',
    description: 'Secure authentication and role-aware access keep personal data and campus operations protected.',
    icon: ShieldCheck
  },
  {
    title: 'Innovation Culture',
    description: 'We continuously modernize the platform with feedback-driven improvements for a better campus experience.',
    icon: Sparkles
  }
];

const timeline = [
  {
    title: 'Unified Campus Experience',
    description: 'SLIIT-HUB began with one goal: reduce friction between students and campus services.'
  },
  {
    title: 'Smart Operations Layer',
    description: 'Booking, ticketing, notifications, and resource access were integrated into one platform.'
  },
  {
    title: 'Secure Digital Identity',
    description: 'SLIIT credential verification and multi-step authentication improved trust and safety.'
  },
  {
    title: 'Always Improving',
    description: 'The roadmap continues with faster workflows, better analytics, and smarter student support.'
  }
];

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20 bg-gray-50 min-h-screen">
        <section className="relative overflow-hidden bg-[#222222] text-white">
          <div className="absolute top-[-120px] right-[-80px] w-[360px] h-[360px] rounded-full bg-sliit-gold/20 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] w-[420px] h-[420px] rounded-full bg-sliit-gold/10 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-sliit-gold/10 border border-sliit-gold/30 px-4 py-2 rounded-full text-sm font-semibold text-sliit-gold mb-6">
                <GraduationCap className="h-4 w-4" />
                About SLIIT-HUB
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                Building a smarter, simpler, and more connected campus experience.
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-2xl">
                SLIIT-HUB is the digital backbone of student life at SLIIT, bringing services, communication, and support into one modern platform.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/auth"
                  state={{ isRegister: true }}
                  className="inline-flex items-center gap-2 bg-sliit-gold text-[#222222] hover:bg-yellow-500 px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-md"
                >
                  Join The Platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 border border-gray-500 hover:border-sliit-gold hover:text-sliit-gold px-6 py-3 rounded-full font-semibold transition-all duration-300"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-3xl font-extrabold text-[#222222]">{item.value}</p>
                <p className="text-sm text-gray-500 mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#222222] mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                We simplify campus life by centralizing critical student services into one secure and intuitive experience.
              </p>
              <p className="text-gray-600 leading-relaxed">
                From resource booking to updates and issue resolution, SLIIT-HUB helps students spend less time navigating systems and more time learning, building, and growing.
              </p>

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                  <Building2 className="h-5 w-5 text-sliit-gold mb-2" />
                  <p className="font-semibold text-[#222222]">Campus-Wide Coverage</p>
                  <p className="text-sm text-gray-500">One platform across key services and facilities.</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                  <BookOpenCheck className="h-5 w-5 text-sliit-gold mb-2" />
                  <p className="font-semibold text-[#222222]">Academic Support</p>
                  <p className="text-sm text-gray-500">Clearer access to resources and student tools.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#222222] rounded-3xl border border-sliit-gold/30 p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-white mb-6">Journey</h2>
              <div className="space-y-5">
                {timeline.map((item, index) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-sliit-gold text-[#222222] text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                      {index !== timeline.length - 1 && <div className="w-px flex-1 bg-sliit-gold/30 mt-2" />}
                    </div>
                    <div className="pb-2">
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-[#222222] mb-6">What We Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-sliit-gold/20 text-[#222222] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-[#222222] mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
