import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Plus, Clock, CheckCircle,
  AlertCircle, X, Loader2, MapPin, MessageSquare,
  Paperclip, ChevronRight, Search,
  Wrench, Bell, Calendar, BookOpen
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import { ticketApi } from '../hooks/useTickets';
import TicketDetail from '../components/technician/TicketDetail';

export default function StudentDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketApi.getAll();
        setTickets(data);
      } catch {}
      setLoading(false);
    };

    fetchTickets();
  }, []);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col relative overflow-hidden">

      {/* subtle futuristic glow */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#F5A623]/10 blur-[120px] rounded-full" />

      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full">

        {/* HEADER */}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black text-[#001f5b]">
              Hello, <span className="text-[#F5A623]">{firstName}</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Smart campus insights & services at your fingertips
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#222] text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition shadow-lg"
          >
            + Report Issue
          </button>
        </div>

        {/* SMART ALERT BAR */}
        <div className="mb-8 p-4 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center gap-3">
          <Bell className="text-[#F5A623]" />
          <p className="text-sm text-gray-600">
            2 new campus notifications • Lab maintenance scheduled today
          </p>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          {/* STATS */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: 'Tickets', value: stats.total },
              { label: 'Open Issues', value: stats.open },
              { label: 'Resolved', value: stats.resolved },
              { label: 'Bookings', value: 3 },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-lg transition"
              >
                <p className="text-gray-400 text-xs">{item.label}</p>
                <h2 className="text-3xl font-black text-[#222]">
                  {item.value}
                </h2>
              </div>
            ))}
          </div>

          {/* NOTIFICATIONS PANEL */}
          <div className="p-6 rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="text-[#F5A623]" />
              <h3 className="font-bold">Notifications</h3>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-500">• WiFi maintenance tonight</p>
              <p className="text-gray-500">• New lab opened</p>
              <p className="text-gray-500">• Event tomorrow</p>
            </div>
          </div>
        </div>

        {/* RESOURCE BOOKING */}
        <div className="mb-10 p-6 rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-xl shadow-sm">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar /> Resource Booking
            </h3>
            <button className="text-sm text-[#F5A623] font-semibold">
              View All
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {['Study Room A', 'Lab 2', 'Conference Hall'].map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-gray-100 hover:shadow-md transition cursor-pointer"
              >
                <BookOpen className="mb-2 text-[#F5A623]" />
                <p className="font-semibold">{r}</p>
                <p className="text-xs text-gray-400">Available now</p>
              </div>
            ))}
          </div>
        </div>

        {/* TICKETS */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg mb-2">Recent Tickets</h3>

          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-5 rounded-3xl border border-gray-100 bg-white hover:shadow-lg transition cursor-pointer flex justify-between"
              >
                <div>
                  <h4 className="font-bold">{ticket.title}</h4>
                  <p className="text-gray-400 text-sm">
                    {ticket.location}
                  </p>
                </div>

                <ChevronRight />
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 p-10 rounded-[2rem] bg-[#222] text-white relative overflow-hidden">
          <div className="absolute right-[-50px] top-[-50px] w-[200px] h-[200px] bg-[#F5A623]/20 blur-3xl rounded-full" />

          <h2 className="text-2xl font-bold mb-3">
            Need help or resources?
          </h2>
          <p className="text-gray-400 mb-4">
            Report issues or book facilities instantly.
          </p>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#F5A623] px-6 py-3 rounded-xl font-bold text-black"
          >
            Create Ticket
          </button>
        </div>
      </main>

      <Footer />

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          currentUser={user}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}