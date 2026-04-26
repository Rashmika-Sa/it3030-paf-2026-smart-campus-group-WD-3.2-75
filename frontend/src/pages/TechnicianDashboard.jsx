import { useState, useEffect } from 'react';
import {
  ClipboardList, Clock, CheckCircle, AlertCircle,
  RefreshCw, Search, MapPin, MessageSquare,
  Paperclip, ChevronRight, Wrench, Shield
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import { ticketApi } from '../hooks/useTickets';
import TicketDetail from '../components/technician/TicketDetail';

const statusColors = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-100',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  RESOLVED: 'bg-green-50 text-green-700 border-green-100',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
};

const priorityColors = {
  LOW: 'bg-green-50 text-green-700',
  MEDIUM: 'bg-yellow-50 text-yellow-700',
  HIGH: 'bg-orange-50 text-orange-700',
  CRITICAL: 'bg-red-50 text-red-700',
};

const priorityBar = {
  LOW: 'bg-green-400',
  MEDIUM: 'bg-yellow-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-500',
};

const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const SECTIONS = ['REVIEW_QUEUE', 'MY_REPLIES'];

export default function TechnicianDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('REVIEW_QUEUE');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const hasMyReply = (ticket) => {
    const hasMyComment = (ticket.comments || []).some(
      (c) => c.authorEmail === user?.email
    );
    const hasMyUpdate = (ticket.technicianUpdates || []).some(
      (u) => u.technicianName === user?.name
    );
    return hasMyComment || hasMyUpdate;
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketApi.getReviewQueue();
      setTickets(data);
    } catch (e) {
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const intervalId = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Keep section tabs predictable by clearing section-specific filters/search.
  useEffect(() => {
    setFilter('ALL');
    setSearch('');
  }, [activeSection]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const handleTicketUpdate = (updated) => {
    setTickets((prev) => {
      const exists = prev.some((t) => t.id === updated.id);
      if (!exists) return [updated, ...prev];
      return prev.map((t) => (t.id === updated.id ? updated : t));
    });
    if (updated.status === 'CLOSED') {
      setFilter('CLOSED');
    }
    setSelectedTicket(updated);
  };

  const handleMarkReviewed = async (e, ticketId) => {
    e.stopPropagation();
    try {
      const updated = await ticketApi.markReviewed(ticketId);
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === updated.id);
        if (!exists) return [updated, ...prev];
        return prev.map((t) => (t.id === updated.id ? updated : t));
      });
    } catch (err) {
      alert(err.message || 'Failed to mark incident as reviewed');
    }
  };

  const sectionTickets =
    activeSection === 'MY_REPLIES'
      ? tickets.filter(hasMyReply)
      : tickets;

  const filtered = sectionTickets
    .filter((t) => filter === 'ALL' || t.status === filter)
    .filter((t) =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    total: sectionTickets.length,
    open: sectionTickets.filter((t) => t.status === 'OPEN').length,
    inProgress: sectionTickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: sectionTickets.filter((t) => t.status === 'RESOLVED').length,
  };

  const categoryStats = sectionTickets.reduce((acc, ticket) => {
    const key = ticket.category || 'OTHER';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const priorityStats = sectionTickets.reduce((acc, ticket) => {
    const key = ticket.priority || 'LOW';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const firstName = user?.name?.split(' ')[0] || 'Technician';

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full">

        {/* Welcome Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 bg-[#222222] px-3 py-1 rounded-full">
                <Shield className="w-3 h-3 text-[#F5A623]" />
                <span className="text-[#F5A623] text-xs font-bold tracking-wide">
                  TECHNICIAN
                </span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#001f5b] mb-2 tracking-tight">
              Welcome back, <span className="text-[#F5A623]">{firstName}</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              Review student incidents, reply with comments, and resolve assigned tickets.
            </p>
          </div>

          {/* Refresh button — no create button for technician */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Review Queue', value: stats.total, icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
            { label: 'Open', value: stats.open, icon: AlertCircle, color: 'bg-blue-50 text-blue-600' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-orange-50 text-[#F5A623]' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
                <item.icon size={22} />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                {item.label}
              </p>
              <p className="text-3xl font-black text-[#222222]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Category + Priority Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
          <div className="bg-white border border-gray-100 rounded-3xl p-5">
            <h3 className="text-sm font-black text-[#222222] mb-4">Tickets by Category</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(categoryStats).length === 0 && (
                <span className="text-xs text-gray-400">No category data yet.</span>
              )}
              {Object.entries(categoryStats).map(([category, count]) => (
                <span
                  key={category}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700"
                >
                  {category}: {count}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-5">
            <h3 className="text-sm font-black text-[#222222] mb-4">Tickets by Priority</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(priorityStats).length === 0 && (
                <span className="text-xs text-gray-400">No priority data yet.</span>
              )}
              {Object.entries(priorityStats).map(([priority, count]) => (
                <span
                  key={priority}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${priorityColors[priority] || 'bg-gray-100 text-gray-700'}`}
                >
                  {priority}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 mb-6">
          {SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                activeSection === section
                  ? 'bg-[#222222] text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {section === 'REVIEW_QUEUE' ? 'Review Queue' : 'My Replies'}
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, location or category..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-yellow-100 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-[#222222] text-white shadow-sm'
                    : 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {f === 'ALL' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-600 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={fetchTickets} className="ml-auto underline font-bold">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="bg-[#222222] rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Wrench className="w-8 h-8 text-[#F5A623]" />
              </div>
              <h3 className="text-2xl font-black mb-2">No tickets found</h3>
              <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                {search
                  ? `No results for "${search}".`
                  : activeSection === 'MY_REPLIES'
                  ? 'You have not replied to any incidents yet.'
                  : filter === 'ALL'
                  ? 'No incidents available in the review queue.'
                  : `No ${filter.replace('_', ' ').toLowerCase()} tickets.`}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="bg-[#F5A623] text-[#222222] px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ticket List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 font-medium">
              Showing{' '}
              <span className="font-bold text-[#222222]">{filtered.length}</span>{' '}
              ticket{filtered.length !== 1 ? 's' : ''}
            </p>

            {filtered.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Priority bar */}
                <div className={`w-1.5 self-stretch rounded-full shrink-0 hidden sm:block ${priorityBar[ticket.priority]}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      {ticket.category}
                    </span>
                  </div>

                  <h3 className="font-black text-[#222222] text-base mb-1 line-clamp-1">
                    {ticket.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-1 mb-3">
                    {ticket.description}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{ticket.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />{ticket.comments?.length || 0} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />{ticket.attachments?.length || 0} files
                    </span>
                    {ticket.assignedTo && (
                      <span className="flex items-center gap-1 text-[#F5A623] font-semibold">
                        <Wrench className="w-3 h-3" />{ticket.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Technician action hint */}
                <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                  {ticket.status === 'OPEN' && (
                    <button
                      onClick={(e) => handleMarkReviewed(e, ticket.id)}
                      className="text-xs font-bold text-[#222222] bg-[#F5A623] px-3 py-1 rounded-full border border-yellow-200 hover:bg-yellow-400 transition-colors"
                    >
                      Mark Reviewed
                    </button>
                  )}
                  {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                    <span className="text-xs font-bold text-[#F5A623] bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                      Action needed
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Banner */}
        {!loading && tickets.length > 0 && (
          <div className="bg-[#222222] rounded-[2.5rem] p-8 md:p-10 text-white overflow-hidden relative mt-10">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Keep up the great work!</h2>
                <p className="text-gray-400 text-sm max-w-md">
                  You have{' '}
                  <span className="text-[#F5A623] font-bold">{stats.inProgress}</span>{' '}
                  ticket{stats.inProgress !== 1 ? 's' : ''} in progress and{' '}
                  <span className="text-[#F5A623] font-bold">{stats.open}</span>{' '}
                  waiting to be started.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#F5A623] text-[#222222] px-6 py-3 rounded-full font-bold shrink-0">
                <CheckCircle className="w-4 h-4" />
                {stats.resolved} Resolved
              </div>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
          </div>
        )}
      </main>

      <Footer />

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          currentUser={user}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </div>
  );
}