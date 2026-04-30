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

  return (
    <div className="min-h-screen bg-gray-50 font-poppins flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Welcome Header */}
          <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-sliit-deep mb-2 tracking-tight">
                Dashboard
              </h1>
              <p className="text-gray-600 font-medium text-base">
                Welcome back, <span className="font-bold text-sliit-deep">{firstName}</span>
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-sliit-gold hover:bg-yellow-500 text-sliit-deep px-8 py-3.5 rounded-lg font-bold transition-all duration-200 shadow-sm hover:shadow-md shrink-0"
            >
              <Plus className="w-5 h-5" />
              New Ticket
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Tickets', value: stats.total, icon: ClipboardList, color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'Open', value: stats.open, icon: AlertCircle, color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-700' },
            ].map((item, i) => (
              <div key={i} className={`p-6 rounded-lg border-2 bg-white ${item.color} shadow-sm hover:shadow-md transition-all duration-200`}>
                <div className="flex items-center justify-between mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">{item.label}</p>
                <p className="text-3xl font-black text-sliit-deep">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex gap-2">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-sliit-deep text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tab === 'MY_INCIDENTS' ? 'My Tickets' : 'Complete'}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-sliit-deep text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={fetchTickets} className="font-semibold hover:text-red-900">Retry</button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-sliit-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Loading your tickets...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-sliit-deep mb-2">No tickets found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {search
                  ? `No results for "${search}".`
                  : activeTab === 'COMPLETE'
                  ? 'No technician replies yet.'
                  : 'You have not created any tickets yet.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-sliit-gold hover:bg-yellow-500 text-sliit-deep px-8 py-3 rounded-lg font-bold transition-all"
              >
                Create First Ticket
              </button>
            </div>
          )}

          {/* Tickets List */}
          {!loading && filtered.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-medium px-1">
                Showing <span className="font-bold text-sliit-deep">{filtered.length}</span> ticket{filtered.length !== 1 ? 's' : ''}
              </p>

              {filtered.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:border-sliit-gold transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-6"
                >
                  {/* Priority Indicator */}
                  <div className={`w-2 h-auto rounded-full shrink-0 hidden sm:block ${priorityBar[ticket.priority]}`} style={{height: '60px'}} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-md border-2 ${statusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-md ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {ticket.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-sliit-deep mb-2 line-clamp-1">{ticket.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{ticket.description}</p>

                    {ticket.status === 'REJECTED' && ticket.rejectionReason && (
                      <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 mb-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-xs text-red-700 line-clamp-2">{ticket.rejectionReason}</p>
                      </div>
                    )}

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
                        <span className="flex items-center gap-1.5 text-sliit-gold font-semibold">
                          <Wrench className="w-4 h-4" />
                          Technician replied
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 hidden sm:block" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[999] p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0 bg-gray-50">
              <div>
                <h3 className="font-bold text-2xl text-sliit-deep">Create Ticket</h3>
                <p className="text-gray-600 text-sm mt-1">Report an issue on campus</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 p-6 space-y-5">
              {createError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 bg-gray-50 transition-all"
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none transition-all"
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 bg-gray-50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-sliit-deep mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold bg-gray-50 transition-all"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-sliit-deep mb-2">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-sliit-gold bg-gray-50 transition-all"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-4">
                <p className="text-sm font-bold text-sliit-deep">Preferred Contact <span className="text-gray-500 font-normal">(optional)</span></p>
                <input
                  value={form.preferredContactName}
                  onChange={(e) => setForm({ ...form, preferredContactName: e.target.value })}
                  placeholder="Contact name"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-sliit-gold bg-white transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.preferredContactPhone}
                    onChange={(e) => setForm({ ...form, preferredContactPhone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-sliit-gold bg-white transition-all"
                  />
                  <input
                    value={form.preferredContactEmail}
                    onChange={(e) => setForm({ ...form, preferredContactEmail: e.target.value })}
                    placeholder="Email"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-sliit-gold bg-white transition-all"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-5">
                <label className="block text-sm font-bold text-sliit-deep mb-3">
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
                  className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-sliit-gold file:px-4 file:py-2 file:text-sm file:font-bold file:text-sliit-deep hover:file:bg-yellow-500 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-3">
                  Optional. Add one screenshot so the technician can review it.
                </p>
                {createScreenshot && (
                  <p className="text-xs font-semibold text-sliit-deep mt-3 truncate">
                    ✓ Selected: {createScreenshot.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                    setCreateScreenshot(null);
                    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-sliit-gold hover:bg-yellow-500 text-sliit-deep rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
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