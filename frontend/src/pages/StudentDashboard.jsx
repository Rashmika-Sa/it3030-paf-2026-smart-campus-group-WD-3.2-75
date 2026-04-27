import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, BookOpen, Bell, 
  Settings, LogOut, User as UserIcon, Clock, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mock data - replace these with real API calls later
  const [stats, setStats] = useState({
    activeBookings: 0,
    notifications: 5,
    upcomingClasses: 2
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetching the real user data from your backend
        const res = await fetch('http://localhost:8081/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          // Example: If you had a bookings endpoint, you'd fetch it here
          // const bookingRes = await fetch('.../api/bookings/count');
          // setStats(prev => ({...prev, activeBookings: await bookingRes.json()}));
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-poppins">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-12 px-6 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#001f5b] tracking-tight">
              Welcome back, <span className="text-[#F5A623]">{user?.name || 'Student'}</span> 👋
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Your campus life at a glance.
            </p>
          </div>
          
          {/* Account Quick View Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-[250px]">
            <div className="w-12 h-12 bg-[#001f5b] rounded-full flex items-center justify-center text-white">
              <UserIcon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#222222]">{user?.email}</p>
              <button 
                onClick={() => navigate('/profile')}
                className="text-xs text-[#F5A623] font-bold hover:underline flex items-center"
              >
                View Account <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            label="Active Bookings" 
            value={stats.activeBookings} 
            icon={Calendar} 
            color="text-blue-600" 
            bgColor="bg-blue-50" 
          />
          <StatCard 
            label="Pending Tasks" 
            value="3" 
            icon={Clock} 
            color="text-purple-600" 
            bgColor="bg-purple-50" 
          />
          <StatCard 
            label="Resources" 
            value="12" 
            icon={BookOpen} 
            color="text-emerald-600" 
            bgColor="bg-emerald-50" 
          />
          <StatCard 
            label="Notifications" 
            value={stats.notifications} 
            icon={Bell} 
            color="text-[#F5A623]" 
            bgColor="bg-orange-50" 
          />
        </div>

        {/* Action & Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Action Card */}
          <div className="lg:col-span-2 bg-[#222222] rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <span className="bg-[#F5A623] text-[#222222] text-xs font-black px-3 py-1 rounded-full uppercase mb-4 inline-block">
                Smart Campus
              </span>
              <h2 className="text-3xl font-bold mb-4">Book a Resource</h2>
              <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                Need a study room, lab equipment, or a sports facility? Quick book your spot now.
              </p>
              <button className="bg-white text-[#222222] px-8 py-4 rounded-xl font-bold hover:bg-[#F5A623] hover:text-[#222222] transition-all duration-300 shadow-lg">
                Find Facilities
              </button>
            </div>
            {/* Background pattern */}
            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[#F5A623]/20 rounded-full blur-[80px] group-hover:bg-[#F5A623]/30 transition-colors"></div>
          </div>

          {/* Side Info Panel */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#001f5b] mb-6 flex items-center gap-2">
              <Clock className="text-[#F5A623]" size={20} /> Upcoming
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="min-w-[50px] h-[50px] bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Apr</span>
                  <span className="text-lg font-black text-[#001f5b]">28</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-[#222222]">Main Lab Reservation</p>
                  <p className="text-xs text-gray-500">09:00 AM - 11:00 AM</p>
                </div>
              </div>
              <p className="text-center text-sm text-gray-400 py-4 italic">No more bookings today</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

// Sub-component for clean code
function StatCard({ label, value, icon: Icon, color, bgColor }) {
  return (
    <div className="p-6 rounded-[2rem] border border-white bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
      </div>
      <p className="text-gray-400 text-xs font-black uppercase tracking-[0.1em] mb-1">{label}</p>
      <p className="text-4xl font-black text-[#222222]">{value}</p>
    </div>
  );
}