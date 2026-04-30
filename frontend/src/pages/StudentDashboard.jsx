import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Plus, Clock, CheckCircle,
  AlertCircle, X, Loader2, MapPin, MessageSquare,
  Paperclip, ChevronRight, Search, Calendar, Zap,
  Wrench, User, LogOut, Settings, Mail, Phone,
  BookOpen, Beaker, Monitor, Grid3x3, Sparkles,
  TrendingUp, Users, Bell, ArrowRight
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import { ticketApi } from '../hooks/useTickets';
import TicketDetail from '../components/technician/TicketDetail';

const CATEGORIES = ['ELECTRICAL','PLUMBING','HVAC','EQUIPMENT','NETWORK','FURNITURE','SECURITY','CLEANING','OTHER'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];

const statusColors = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-100',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  RESOLVED: 'bg-green-50 text-green-700 border-green-100',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
};

const statusBadgeColor = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-700',
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

const VIEW_TABS = ['MY_INCIDENTS', 'COMPLETE'];
const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function StudentDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('MY_INCIDENTS');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createScreenshot, setCreateScreenshot] = useState(null);
  const screenshotInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', location: '',
    category: 'EQUIPMENT', priority: 'MEDIUM',
    preferredContactName: '', preferredContactPhone: '', preferredContactEmail: ''
  });

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ticketApi.getAll();
      setTickets(data);
    } catch (e) {
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Only refresh if user manually requests it via a button - removed auto-refresh
  }, []);

  // Keep tabs predictable by clearing previous tab filters/search.
  useEffect(() => {
    setFilter('ALL');
    setSearch('');
  }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      setCreateError('Title, description and location are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const newTicket = await ticketApi.create(form);
      const createdTicket = createScreenshot
        ? await ticketApi.uploadAttachment(newTicket.id, createScreenshot)
        : newTicket;

      setTickets((prev) => [createdTicket, ...prev]);
      setShowCreateModal(false);
      setForm({
        title: '', description: '', location: '',
        category: 'EQUIPMENT', priority: 'MEDIUM',
        preferredContactName: '', preferredContactPhone: '', preferredContactEmail: ''
      });
      setCreateScreenshot(null);
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    } catch (e) {
      setCreateError(e.message || 'Failed to create ticket. Please try again.');
    } finally {
      setCreating(false);
    }
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

  const hasTechnicianReply = (ticket) => {
    const hasUpdate = (ticket.technicianUpdates || []).length > 0;
    const hasTechComment = (ticket.comments || []).some(
      (c) => c.authorEmail && c.authorEmail === ticket.assignedTo?.email
    );
    return hasUpdate || hasTechComment;
  };

  const tabTickets =
    activeTab === 'COMPLETE'
      ? tickets.filter(hasTechnicianReply)
      : tickets;

  const filtered = tabTickets
    .filter((t) => filter === 'ALL' || t.status === filter)
    .filter((t) =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
  };

  const firstName = user?.name?.split(' ')[0] || 'Student';

  // Mock data for resources
  const mockResources = [
    { id: 1, name: 'Study Room A', type: 'Study Room', available: true, icon: BookOpen, color: 'from-blue-400 to-blue-600' },
    { id: 2, name: 'Lab 1 - Chemistry', type: 'Lab', available: true, icon: Beaker, color: 'from-purple-400 to-purple-600' },
    { id: 3, name: 'Computer Lab', type: 'Equipment', available: false, icon: Monitor, color: 'from-cyan-400 to-blue-600' },
  ];

  // Mock notifications
  const mockNotifications = [
    { id: 1, title: 'Lab Maintenance', desc: 'Chemistry lab will be closed tomorrow', time: '2h ago' },
    { id: 2, title: 'Booking Confirmed', desc: 'Your study room booking for tomorrow is confirmed', time: '4h ago' },
    { id: 3, title: 'Equipment Update', desc: 'New projectors installed in Lecture Hall A', time: '1d ago' },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 1. HEADER / WELCOME AREA */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden">
            {/* Subtle background gradient effect */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-sliit-gold/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-sliit-navy/3 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-2">
              <div>
                <h1 className="text-5xl md:text-6xl font-black text-sliit-deep mb-3 leading-tight">
                  Welcome back, <span className="text-sliit-gold">{firstName}</span>
                </h1>
                <p className="text-lg text-gray-600 font-medium">Stay on top of your campus facilities and support requests</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-sliit-deep text-sliit-deep rounded-2xl font-bold hover:bg-sliit-deep/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-sliit-gold to-yellow-400 hover:shadow-xl hover:-translate-y-0.5 text-sliit-deep rounded-2xl font-bold transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Ticket</span>
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 2. SMART ALERT / NOTIFICATION STRIP */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-sliit-navy/10 to-sliit-gold/10 border border-sliit-gold/30 rounded-2xl p-5 flex items-start gap-4 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-sliit-gold/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-sliit-gold animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sliit-deep mb-1">Campus Update</h3>
              <p className="text-sm text-gray-600">Library renovation in progress. Some study areas unavailable. <a href="#" className="text-sliit-gold font-semibold hover:underline">Learn more →</a></p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 3. QUICK STATS GRID */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Tickets */}
            <div className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-sliit-gold/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Tickets</h3>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-4xl font-black text-sliit-deep">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-2">All reported issues</p>
              </div>
            </div>

            {/* Open Issues */}
            <div className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-sliit-gold/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Open</h3>
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-4xl font-black text-sliit-deep">{stats.open}</p>
                <p className="text-xs text-gray-500 mt-2">Awaiting attention</p>
              </div>
            </div>

            {/* In Progress */}
            <div className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-sliit-gold/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">In Progress</h3>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-4xl font-black text-sliit-deep">{stats.inProgress}</p>
                <p className="text-xs text-gray-500 mt-2">Being worked on</p>
              </div>
            </div>

            {/* Resolved */}
            <div className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-sliit-gold/50 hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Resolved</h3>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-4xl font-black text-sliit-deep">{stats.resolved}</p>
                <p className="text-xs text-gray-500 mt-2">Completed successfully</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 4. RESOURCE BOOKING SECTION */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-sliit-deep flex items-center gap-3">
                  <Grid3x3 className="w-6 h-6 text-sliit-gold" />
                  Available Resources
                </h2>
                <p className="text-sm text-gray-600 mt-1">Book your campus facilities instantly</p>
              </div>
              <button className="hidden md:flex items-center gap-2 text-sliit-gold font-bold hover:gap-3 transition-all">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {mockResources.map((resource) => {
                const IconComponent = resource.icon;
                return (
                  <div
                    key={resource.id}
                    className={`group relative overflow-hidden rounded-2xl border border-gray-200 hover:border-sliit-gold/50 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                      resource.available ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {/* Gradient overlay on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${resource.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    ></div>

                    <div className="relative z-10 p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            resource.available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {resource.available ? '✓ Available' : '✗ Booked'}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sliit-deep mb-1">{resource.name}</h3>
                        <p className="text-sm text-gray-600">{resource.type}</p>
                      </div>

                      <button
                        className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                          resource.available
                            ? 'bg-sliit-gold/20 text-sliit-gold hover:bg-sliit-gold hover:text-sliit-deep'
                            : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={!resource.available}
                      >
                        {resource.available ? 'Book Now' : 'Not Available'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 5. NOTIFICATIONS PANEL */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-sliit-deep flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-sliit-gold" />
                  Your Tickets
                </h2>
                <p className="text-sm text-gray-600 mt-1">Track and manage your reported issues</p>
              </div>

              {/* Tabs and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-2">
                  {VIEW_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        activeTab === tab
                          ? 'bg-sliit-deep text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'MY_INCIDENTS' ? 'My Tickets' : 'Complete'}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      filter === f
                        ? 'bg-sliit-deep text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button onClick={fetchTickets} className="font-bold hover:text-red-900">Retry</button>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-sliit-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading your tickets...</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && filtered.length === 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-sliit-deep mb-2">No tickets found</h3>
                  <p className="text-gray-600 mb-8">
                    {search ? `No results for "${search}".` : 'Create your first ticket to report an issue.'}
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-sliit-gold hover:bg-yellow-500 text-sliit-deep px-8 py-3 rounded-xl font-bold transition-all hover:shadow-lg"
                  >
                    Create Your First Ticket
                  </button>
                </div>
              )}

              {/* Tickets List */}
              {!loading && filtered.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-bold text-sliit-deep">{filtered.length}</span> ticket{filtered.length !== 1 ? 's' : ''}
                  </p>

                  {filtered.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-sliit-gold/50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-sliit-gold/0 to-sliit-gold/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Priority Bar */}
                        <div className={`w-1 rounded-full h-auto hidden sm:block shrink-0 ${priorityBar[ticket.priority]}`} />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${statusBadgeColor[ticket.status]}`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${priorityColors[ticket.priority]}`}>
                              {ticket.priority}
                            </span>
                            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                              {ticket.category}
                            </span>
                          </div>

                          {/* Title and Description */}
                          <div>
                            <h3 className="font-bold text-lg text-sliit-deep mb-1 line-clamp-1">{ticket.title}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
                          </div>

                          {/* Rejection Reason */}
                          {ticket.status === 'REJECTED' && ticket.rejectionReason && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-1">Rejection Reason</p>
                              <p className="text-xs text-red-700 line-clamp-2">{ticket.rejectionReason}</p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {ticket.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(ticket.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-4 h-4" />
                              {ticket.comments?.length || 0} comments
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Paperclip className="w-4 h-4" />
                              {ticket.attachments?.length || 0} files
                            </span>
                            {hasTechnicianReply(ticket) && (
                              <span className="flex items-center gap-1.5 text-sliit-gold font-bold">
                                <Wrench className="w-4 h-4" />
                                Technician replied
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 hidden sm:block group-hover:text-sliit-gold transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* NOTIFICATIONS PANEL (RIGHT SIDEBAR) */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-sliit-deep flex items-center gap-3">
                  <Bell className="w-6 h-6 text-sliit-gold" />
                  Notifications
                </h2>
                <p className="text-sm text-gray-600 mt-1">Recent updates</p>
              </div>

              <div className="space-y-3">
                {mockNotifications.map((notif) => (
                  <div key={notif.id} className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-sliit-gold/50 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sliit-gold/20 flex items-center justify-center shrink-0 group-hover:bg-sliit-gold/30 transition-colors">
                        <Sparkles className="w-4 h-4 text-sliit-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-sliit-deep mb-0.5">{notif.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{notif.desc}</p>
                        <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-2.5 text-center text-sm font-bold text-sliit-gold hover:text-sliit-deep transition-colors">
                View All Notifications →
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 7. CALL-TO-ACTION SECTION */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sliit-deep to-sliit-navy p-12 md:p-16">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sliit-gold/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-sliit-gold/5 rounded-full blur-3xl -ml-36 -mb-36"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Left: Text Content */}
              <div className="flex flex-col justify-center space-y-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                    Make Campus Life <span className="text-sliit-gold">Seamless</span>
                  </h2>
                  <p className="text-lg text-gray-200 font-medium">
                    Report issues instantly, book resources effortlessly, and stay connected with real-time updates from your smart campus hub.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-sliit-gold hover:bg-yellow-400 text-sliit-deep rounded-xl font-bold transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Zap className="w-5 h-5" />
                    Report Issue Now
                  </button>
                  <button className="flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-sliit-gold text-sliit-gold hover:bg-sliit-gold/10 rounded-xl font-bold transition-all">
                    Browse Resources
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right: Stats / Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-black text-sliit-gold mb-2">{stats.total}</div>
                  <p className="text-sm font-bold text-gray-200">Tickets Tracked</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-black text-sliit-light mb-2">24/7</div>
                  <p className="text-sm font-bold text-gray-200">Support Access</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-black text-sliit-gold mb-2">{mockResources.length}</div>
                  <p className="text-sm font-bold text-gray-200">Facilities Available</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-black text-sliit-light mb-2">{((stats.resolved / (stats.total || 1)) * 100).toFixed(0)}%</div>
                  <p className="text-sm font-bold text-gray-200">Resolution Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-sliit-deep to-sliit-navy">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">My Profile</h2>
                  <p className="text-gray-200 text-sm">Manage your account</p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Profile Picture and Info */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-sliit-gold to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <User className="w-10 h-10 text-sliit-deep" />
                </div>
                <h3 className="text-2xl font-black text-sliit-deep mb-1">{user?.name || 'Student'}</h3>
                <p className="text-gray-600 font-medium">{user?.email || 'student@sliit.lk'}</p>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sliit-gold" />
                    {user?.email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Role</p>
                  <p className="text-gray-700 font-medium">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
                      {user?.role || 'Student'}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Account Status</p>
                  <p className="text-gray-700 font-medium">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-bold">
                      Active
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <button className="w-full flex items-center justify-center gap-2 bg-sliit-gold hover:bg-yellow-500 text-sliit-deep px-6 py-3 rounded-lg font-bold transition-all">
                  <Settings className="w-5 h-5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[999] p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0 bg-gradient-to-r from-sliit-deep to-sliit-navy">
              <div>
                <h3 className="font-black text-2xl text-white">Create Ticket</h3>
                <p className="text-gray-200 text-sm mt-1">Report a new issue on campus</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 p-6 space-y-5">
              {createError && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-sliit-deep mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Projector not working in Lab 3"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 bg-gray-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-sliit-deep mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-sliit-deep mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Lab 3, Block A, Ground Floor"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 bg-gray-50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-sliit-deep mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold bg-gray-50 transition-all"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-sliit-deep mb-2">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold bg-gray-50 transition-all"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-5 space-y-4">
                <p className="text-sm font-bold text-sliit-deep">Preferred Contact <span className="text-gray-500 font-normal">(optional)</span></p>
                <input
                  value={form.preferredContactName}
                  onChange={(e) => setForm({ ...form, preferredContactName: e.target.value })}
                  placeholder="Contact name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-sliit-gold bg-white transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.preferredContactPhone}
                    onChange={(e) => setForm({ ...form, preferredContactPhone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-sliit-gold bg-white transition-all"
                  />
                  <input
                    value={form.preferredContactEmail}
                    onChange={(e) => setForm({ ...form, preferredContactEmail: e.target.value })}
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-sliit-gold bg-white transition-all"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-dashed border-gray-400 rounded-lg p-5">
                <label className="block text-sm font-bold text-sliit-deep mb-3">
                  Screenshot / Image
                </label>
                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && !file.type.startsWith('image/')) {
                      alert('Only image files are allowed');
                      e.target.value = '';
                      setCreateScreenshot(null);
                      return;
                    }
                    setCreateScreenshot(file);
                  }}
                  className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sliit-gold file:px-4 file:py-2 file:text-sm file:font-bold file:text-sliit-deep hover:file:bg-yellow-500 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-3">Optional. Add a screenshot for reference.</p>
                {createScreenshot && (
                  <p className="text-xs font-bold text-sliit-deep mt-3 truncate">
                    ✓ {createScreenshot.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                    setCreateScreenshot(null);
                    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-sliit-gold hover:bg-yellow-500 text-sliit-deep rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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