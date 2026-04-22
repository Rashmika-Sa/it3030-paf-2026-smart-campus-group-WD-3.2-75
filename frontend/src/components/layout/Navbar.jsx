import React, { useState } from 'react';
import { Menu, X, Lock, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRestrictedClick = (e) => {
    e.preventDefault();
    alert("Please Login or Register to access the Student Portal.");
  };

  const navLinks = [
    { name: 'About', restricted: false, href: '#about' },
    { name: 'Bookings', restricted: true, href: '#bookings' },
    { name: 'Resources', restricted: true, href: '#resources' },
    { name: 'Tickets', restricted: true, href: '#tickets' },
    { name: 'Notifications', restricted: true, href: '#notifications' },
    { name: 'Facilities', restricted: true, href: '#facilities' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#222222]/95 border-b border-sliit-gold/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/sliit-logo.jpg" alt="SLIIT logo" className="h-9 w-9 rounded-full object-cover bg-white p-1 shadow-sm" />
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white">
              SLIIT-HUB<span className="text-sliit-gold">.</span>
            </span>
          </div>

          {/* Center/Right: Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                onClick={link.restricted ? handleRestrictedClick : undefined}
                className="flex items-center gap-1 text-gray-300 hover:text-sliit-gold transition-colors font-medium text-sm"
              >
                {link.restricted && <Lock className="h-3 w-3 text-gray-500" />}
                {link.name}
              </a>
            ))}
            
            {/* Action Buttons & Forgot Password */}
            <div className="flex items-center gap-4 pl-4 border-l border-gray-700">
              <a href="#forgot-password" className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-sliit-gold transition-colors underline underline-offset-2">
                <KeyRound className="h-3 w-3" />
                Forgot Password?
              </a>
              
              <Link to="/auth" className="text-white font-bold hover:text-sliit-gold transition-colors px-2">
                Login
              </Link>
              <Link to="/auth" state={{ isRegister: true }} className="bg-sliit-gold text-[#222222] hover:bg-yellow-500 px-6 py-2 rounded-full font-bold transition-all duration-300 shadow-md hover:-translate-y-0.5">
                Register
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-sliit-gold transition-colors"
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#222222] border-b border-sliit-gold/30 absolute w-full shadow-2xl">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                onClick={link.restricted ? handleRestrictedClick : undefined}
                className="flex items-center gap-2 px-3 py-3 text-base font-medium text-gray-300 hover:bg-[#333333] hover:text-sliit-gold rounded-lg transition-colors"
              >
                {link.restricted && <Lock className="h-4 w-4 text-gray-500" />}
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-800">
              <a href="#forgot-password" className="text-sm font-medium text-gray-400 hover:text-sliit-gold transition-colors text-center underline mb-2">
                Forgotten your password?
              </a>
              
              {/* UPDATED: React Router Links for Mobile View */}
              <Link to="/auth" className="w-full border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-xl font-bold transition-all text-center block">
                Login
              </Link>
              <Link to="/auth" state={{ isRegister: true }}className="w-full bg-sliit-gold text-[#222222] hover:bg-yellow-500 px-6 py-3 rounded-xl font-bold transition-all shadow-md text-center block">
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}