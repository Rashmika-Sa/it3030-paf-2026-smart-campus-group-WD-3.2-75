import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Plus, Clock, CheckCircle,
  AlertCircle, X, Loader2, MapPin, MessageSquare,
  Paperclip, ChevronRight, Search, Calendar,
  Wrench,
  BookOpen, Bell
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
    const intervalId = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalId);
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

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 px-6 max-w-7xl mx-auto w-full">

        {/* Welcome Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-[#001f5b] mb-2 tracking-tight">
              Welcome back, <span className="text-[#F5A623]">{firstName}</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg">
              Here is what's happening on campus today.
            </p>
          </div>
            <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#222222] text-white px-6 py-3.5 rounded-2xl font-bold hover:scale-105 transition-transform shadow-md shrink-0"
          >
            <Plus className="w-5 h-5" />
            Create Ticket
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'My Tickets', value: stats.total, icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
            { label: 'Open', value: stats.open, icon: AlertCircle, color: 'bg-blue-50 text-blue-600' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-orange-50 text-[#F5A623]' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
                <item.icon size={22} />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-3xl font-black text-[#222222]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Ticket Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 mb-6">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-[#222222] text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab === 'MY_INCIDENTS' ? 'My Tickets' : 'Complete'}
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
              placeholder="Search tickets by title or location..."
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
            <button onClick={fetchTickets} className="ml-auto underline font-bold">Retry</button>
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
                <ClipboardList className="w-8 h-8 text-[#F5A623]" />
              </div>
              <h3 className="text-2xl font-black mb-2">No tickets found</h3>
              <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                {search
                  ? `No results for "${search}".`
                  : activeTab === 'COMPLETE'
                  ? 'No technician replies available yet.'
                  : 'You have not reported any tickets yet.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#F5A623] text-[#222222] px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform"
              >
                Create Your First Ticket
              </button>
            </div>
          </div>
        )}

        {/* Ticket List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 font-medium">
              Showing <span className="font-bold text-[#222222]">{filtered.length}</span> ticket{filtered.length !== 1 ? 's' : ''}
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

                  <h3 className="font-black text-[#222222] text-base mb-1 line-clamp-1">{ticket.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-1 mb-3">{ticket.description}</p>

                  {ticket.status === 'REJECTED' && ticket.rejectionReason && (
                    <div className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-700 mb-1">
                        Rejection Reason
                      </p>
                      <p className="text-xs text-red-800 line-clamp-2">
                        {ticket.rejectionReason}
                      </p>
                    </div>
                  )}

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
                    {hasTechnicianReply(ticket) && (
                      <span className="flex items-center gap-1 text-[#F5A623] font-semibold">
                        <Wrench className="w-3 h-3" />Technician replied
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />{ticket.attachments?.length || 0} files
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* CTA Banner — always show */}
        {!loading && (
          <div className="bg-[#222222] rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden relative mt-10">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
                <p className="text-gray-400 max-w-md mb-0">
                  Access your personalized student services, book study spaces, or connect with campus support.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#F5A623] text-[#222222] px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shrink-0"
              >
                Create Ticket
              </button>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[#F5A623]/10 rounded-full blur-3xl" />
          </div>
        )}
      </main>

      <Footer />

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[999] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-black text-[#222222] text-xl">Create a Ticket</h3>
                <p className="text-gray-400 text-sm">Fill in the details below</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#222222] mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Projector not working in Lab 3"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-yellow-100 bg-gray-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#222222] mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#222222] mb-1.5">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Lab 3, Block A, Ground Floor"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-yellow-100 bg-gray-50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#222222] mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] bg-gray-50 transition-all"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#222222] mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] bg-gray-50 transition-all"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 space-y-3">
                <p className="text-sm font-bold text-[#222222]">Preferred Contact (optional)</p>
                <input
                  value={form.preferredContactName}
                  onChange={(e) => setForm({ ...form, preferredContactName: e.target.value })}
                  placeholder="Contact name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] bg-white transition-all"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.preferredContactPhone}
                    onChange={(e) => setForm({ ...form, preferredContactPhone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] bg-white transition-all"
                  />
                  <input
                    value={form.preferredContactEmail}
                    onChange={(e) => setForm({ ...form, preferredContactEmail: e.target.value })}
                    placeholder="Email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F5A623] bg-white transition-all"
                  />
                </div>
              </div>

              <div className="border border-dashed border-gray-200 rounded-2xl p-4 bg-white">
                <label className="block text-sm font-bold text-[#222222] mb-2">
                  Screenshot / Image attachment
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
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-[#F5A623] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#222222] hover:file:bg-yellow-400"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Optional. Add one screenshot so the technician can review it with the report.
                </p>
                {createScreenshot && (
                  <p className="text-xs font-semibold text-[#222222] mt-2 truncate">
                    Selected: {createScreenshot.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                    setCreateScreenshot(null);
                    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
                  }}
                  className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3.5 bg-[#F5A623] hover:bg-yellow-500 text-[#222222] rounded-2xl text-sm font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md"
                >
                  {creating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Submit Report'
                  }
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