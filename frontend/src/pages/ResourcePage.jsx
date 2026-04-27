import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, FlaskConical, MonitorSmartphone, Video,
  Search, CheckCircle, AlertCircle, Users,
  MapPin, Clock, CalendarCheck, X, Loader2,
  BookOpen, CalendarDays, XCircle, Ban
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const BACKEND = 'http://localhost:8082';
const token = () => localStorage.getItem('token');

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'EQUIPMENT', label: 'Equipment' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

const typeIcon = {
  LECTURE_HALL: <Building2 className="w-5 h-5" />,
  LAB: <FlaskConical className="w-5 h-5" />,
  MEETING_ROOM: <MonitorSmartphone className="w-5 h-5" />,
  EQUIPMENT: <Video className="w-5 h-5" />,
};

const typeLabel = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  EQUIPMENT: 'Equipment',
};

const typeBg = {
  LECTURE_HALL: 'bg-blue-100 text-blue-700',
  LAB: 'bg-purple-100 text-purple-700',
  MEETING_ROOM: 'bg-emerald-100 text-emerald-700',
  EQUIPMENT: 'bg-orange-100 text-orange-700',
};

const typeGradient = {
  LECTURE_HALL: 'from-blue-500 to-blue-700',
  LAB: 'from-purple-500 to-purple-700',
  MEETING_ROOM: 'from-emerald-500 to-emerald-700',
  EQUIPMENT: 'from-orange-500 to-orange-700',
};

const BOOKING_STATUS_STYLE = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-emerald-100 text-emerald-700',
  REJECTED:  'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const BOOKING_STATUS_ICON = {
  PENDING:   <Clock className="w-3 h-3" />,
  APPROVED:  <CheckCircle className="w-3 h-3" />,
  REJECTED:  <XCircle className="w-3 h-3" />,
  CANCELLED: <Ban className="w-3 h-3" />,
};

// ─── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ resource, onBook }) {
  const isActive = resource.status === 'ACTIVE';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col group">
      <div className={`h-36 bg-gradient-to-br ${typeGradient[resource.type] || 'from-gray-400 to-gray-600'} relative overflow-hidden flex items-center justify-center`}>
        <div className="absolute top-[-12px] right-[-12px] w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute bottom-[-16px] left-[-8px] w-20 h-20 rounded-full bg-white/10" />
        <div className="text-white/80 relative z-10">
          {typeIcon[resource.type] && React.cloneElement(typeIcon[resource.type], { className: 'w-14 h-14' })}
        </div>
        <span className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md
          ${isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {isActive ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isActive ? 'Available' : 'Out of Service'}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2 self-start ${typeBg[resource.type] || 'bg-gray-100 text-gray-700'}`}>
          {typeIcon[resource.type]}{typeLabel[resource.type] || resource.type}
        </span>
        <h3 className="font-bold text-[#222222] text-base mb-1 leading-snug">{resource.name}</h3>
        {resource.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{resource.description}</p>
        )}

        <div className="space-y-1.5 mb-4 mt-auto">
          {resource.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {resource.location}
            </div>
          )}
          {resource.capacity > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              Capacity: <span className="font-semibold text-[#222222]">{resource.capacity}</span>
            </div>
          )}
          {resource.availabilityWindows?.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{resource.availabilityWindows.join(', ')}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onBook(resource)}
          disabled={!isActive}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
            ${isActive
              ? 'bg-sliit-gold hover:bg-yellow-500 text-[#222222] group-hover:shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          <CalendarCheck className="w-4 h-4" />
          {isActive ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ resource, onClose, onBooked }) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !timeSlot) { setError('Date and time slot are required.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BACKEND}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          resourceId: resource.id,
          date,
          timeSlot,
          purpose,
          attendees: parseInt(attendees) || 0,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        if (onBooked) onBooked();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Failed to submit booking.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-[#222222] text-lg">Book Resource</h2>
            <p className="text-sm text-gray-500">{resource.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-[#222222] mb-1">Booking Requested!</h3>
            <p className="text-gray-500 text-sm mb-6">Your booking for <strong>{resource.name}</strong> on {date} at {timeSlot} is pending approval.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-sliit-gold text-[#222222] rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time Slot *</label>
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold bg-white">
                <option value="">Select a time slot</option>
                {['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Expected Attendees</label>
              <input type="number" min="1" value={attendees} onChange={(e) => setAttendees(e.target.value)}
                placeholder="Number of attendees"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Purpose</label>
              <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3}
                placeholder="Briefly describe the purpose of booking..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── My Bookings Section ───────────────────────────────────────────────────────
function MyBookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      const res = await fetch(`${BACKEND}/api/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
      }
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4">
        <div className="w-12 h-12 border-4 border-sliit-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading your bookings…</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <CalendarDays className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="font-bold text-[#222222] text-lg mb-1">No bookings yet</h3>
        <p className="text-gray-500 text-sm">Browse resources and book one to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Resource', 'Date', 'Time Slot', 'Attendees', 'Purpose', 'Status', 'Action'].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-semibold text-[#222222] max-w-[160px] truncate">{b.resourceName}</td>
                <td className="py-3 px-4 text-gray-600">{b.date}</td>
                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{b.timeSlot}</td>
                <td className="py-3 px-4 text-gray-600">{b.attendees || '—'}</td>
                <td className="py-3 px-4 text-gray-500 max-w-[180px] truncate">{b.purpose || '—'}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${BOOKING_STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-500'}`}>
                    {BOOKING_STATUS_ICON[b.status]}{b.status}
                  </span>
                  {b.status === 'REJECTED' && b.adminNote && (
                    <p className="text-xs text-gray-400 mt-1 max-w-[160px] truncate" title={b.adminNote}>
                      Reason: {b.adminNote}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4">
                  {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancelling === b.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {cancelling === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
        {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ─── Main Resource Page ────────────────────────────────────────────────────────
export default function ResourcePage() {
  const [activeTab, setActiveTab] = useState('browse');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bookingResource, setBookingResource] = useState(null);
  const [availableNow, setAvailableNow] = useState(false);

  const isCurrentlyAvailable = (resource) => {
    if (resource.status !== 'ACTIVE') return false;
    const windows = resource.availabilityWindows || [];
    if (windows.length === 0) return true;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return windows.some((w) => {
      const spaceIdx = w.indexOf(' ');
      if (spaceIdx === -1) return true;
      const date = w.slice(0, spaceIdx);
      if (date !== todayStr) return false;
      const timePart = w.slice(spaceIdx + 1);
      const dashIdx = timePart.indexOf('–');
      if (dashIdx === -1) return true;
      const [sh, sm = 0] = timePart.slice(0, dashIdx).split(':').map(Number);
      const [eh, em = 0] = timePart.slice(dashIdx + 1).split(':').map(Number);
      return currentMin >= sh * 60 + sm && currentMin <= eh * 60 + em;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (minCapacity) params.set('minCapacity', minCapacity);
    if (locationFilter) params.set('location', locationFilter);

    fetch(`${BACKEND}/api/resources?${params}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [typeFilter, statusFilter, minCapacity, locationFilter]);

  const displayed = resources.filter((r) => {
    const matchesSearch = !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchesAvailableNow = !availableNow || isCurrentlyAvailable(r);
    return matchesSearch && matchesAvailableNow;
  });

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setMinCapacity('');
    setLocationFilter('');
    setSearch('');
    setAvailableNow(false);
  };

  const hasFilters = typeFilter || statusFilter || minCapacity || locationFilter || search || availableNow;

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-gray-50">

        {/* Hero strip */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] text-white py-12 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-sliit-gold/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-32 w-44 h-44 bg-sliit-gold/5 rounded-full translate-y-1/2 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <span className="inline-block px-3 py-1 bg-sliit-gold/20 text-sliit-gold text-xs font-bold rounded-full uppercase tracking-wider mb-3">
              Facilities &amp; Assets
            </span>
            <h1 className="text-3xl font-extrabold mb-2">Campus Resources</h1>
            <p className="text-gray-400 text-sm max-w-lg">Browse and book lecture halls, labs, meeting rooms, and equipment across the SLIIT campus.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Tab switcher */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-6 w-fit">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === 'browse' ? 'bg-sliit-gold text-[#222222] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Building2 className="w-4 h-4" /> Browse Resources
            </button>
            <button
              onClick={() => setActiveTab('mybookings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${activeTab === 'mybookings' ? 'bg-sliit-gold text-[#222222] shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <BookOpen className="w-4 h-4" /> My Bookings
            </button>
          </div>

          {activeTab === 'mybookings' ? (
            <MyBookingsSection />
          ) : (
            <>
              {/* Filter bar */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or location..."
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold bg-white">
                      {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold bg-white">
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <label className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl cursor-pointer transition-all text-sm font-medium select-none
                      ${availableNow ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" />
                      Available Now
                    </label>
                    <input
                      type="number" min="0" value={minCapacity}
                      onChange={(e) => setMinCapacity(e.target.value)}
                      placeholder="Min capacity"
                      className="w-32 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold"
                    />
                    <input
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="Location..."
                      className="w-36 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold"
                    />
                    {hasFilters && (
                      <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl hover:border-red-200 transition-colors">
                        <X className="w-4 h-4" /> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results summary */}
              {!loading && (
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-500 font-medium">
                    Showing <span className="text-[#222222] font-bold">{displayed.length}</span> resource{displayed.length !== 1 ? 's' : ''}
                    {hasFilters && <span className="text-sliit-gold"> (filtered)</span>}
                  </p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Cards grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-28 gap-4">
                  <div className="w-12 h-12 border-4 border-sliit-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400 font-medium">Loading resources…</p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                    <Building2 className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-[#222222] text-lg mb-1">No resources found</h3>
                  <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters.</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="px-5 py-2 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-xl font-bold text-sm transition-colors">
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayed.map((r) => (
                    <ResourceCard key={r.id} resource={r} onBook={setBookingResource} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      {bookingResource && (
        <BookingModal
          resource={bookingResource}
          onClose={() => setBookingResource(null)}
          onBooked={() => {}}
        />
      )}
    </>
  );
}
