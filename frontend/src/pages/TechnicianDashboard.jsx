import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  AlertCircle, 
  CheckCircle, 
  Menu, 
  X, 
  LogOut, 
  ClipboardList,
  GraduationCap
} from 'lucide-react';

// Make sure to import your useAuth hook and any other needed context
// import { useAuth } from '../context/AuthContext'; 

// ─── Placeholder section ───────────────────────────────────────────────────────
function PlaceholderSection({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-300">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#222222] mb-1">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs">{description}</p>
    </div>
  );
}

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection() {
  const stats = [
    { label: 'Pending Repairs', value: 12, icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50' },
    { label: 'In Progress', value: 5, icon: <Wrench className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Resolved Today', value: 8, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-[#222222]">{s.value}</p>
              <p className="text-xs text-gray-500 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-[#222222] mb-4">Recent Maintenance Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Resource', 'Issue', 'Reported', 'Status'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-3 font-medium text-[#222222]">Projector - Lab 402</td>
                <td className="py-2.5 px-3 text-gray-500">Not displaying colors correctly</td>
                <td className="py-2.5 px-3 text-gray-500">2 hours ago</td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    Pending
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-3 font-medium text-[#222222]">AC Unit - Main Hall</td>
                <td className="py-2.5 px-3 text-gray-500">Leaking water</td>
                <td className="py-2.5 px-3 text-gray-500">Yesterday</td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    In Progress
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Technician Dashboard ────────────────────────────────────────────────
export default function TechnicianDashboard() {
  const navigate = useNavigate();
  // Uncomment this when you link up your AuthContext
  // const { user } = useAuth(); 
  
  // Mock user for testing until auth is connected
  const user = { name: 'Lab Technician', email: 'technician@my.sliit.lk' };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth'); // Change this to your actual login route
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'maintenance', label: 'Maintenance Tasks', icon: <Wrench className="w-5 h-5" /> },
    { id: 'inventory', label: 'Equipment Inventory', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-[#1a1a1a] flex flex-col transition-all duration-300 ease-in-out shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
              <span className="font-bold text-white text-sm tracking-tight">
                SLIIT-HUB<span className="text-emerald-500">.</span>
              </span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`text-gray-500 hover:text-white transition-colors ${!sidebarOpen ? 'mx-auto' : ''}`}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Technician badge */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Technician Panel</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.name || user?.email}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium group
                ${activeSection === item.id
                  ? 'bg-emerald-500 text-[#1a1a1a]'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-white/10 pt-3">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-base font-bold text-[#222222] capitalize">
              {navItems.find((n) => n.id === activeSection)?.label || activeSection}
            </h1>
            <p className="text-xs text-gray-400">Smart Campus — Technical Support</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-medium text-gray-600">{user?.name || user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              {(user?.name || user?.email || 'T')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'maintenance' && (
            <PlaceholderSection icon={<Wrench className="w-8 h-8" />} title="Maintenance Tasks" description="View and update the status of broken resources." />
          )}
          {activeSection === 'inventory' && (
            <PlaceholderSection icon={<ClipboardList className="w-8 h-8" />} title="Equipment Inventory" description="Manage spare parts and technical inventory." />
          )}
        </main>
      </div>
    </div>
  );
}