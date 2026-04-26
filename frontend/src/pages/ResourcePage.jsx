import React, { useState, useEffect } from 'react';
import {
  Building2, FlaskConical, MonitorSmartphone, Video,
  Search, CheckCircle, AlertCircle, Users,
  MapPin, Clock, CalendarCheck, X, Loader2
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

function ResourceCard({ resource, onBook }) {
  const isActive = resource.status === 'ACTIVE';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Coloured header */}
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

      {/* Body */}
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

function BookingModal({ resource, onClose }) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !timeSlot) { setError('Date and time slot are required.'); return; }
    setSubmitting(true);
    // Simulate booking (booking module to be implemented)
    await new Promise((r) => setTimeout(r, 800));
    setSuccess(true);
    setSubmitting(false);
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
            <p className="text-gray-500 text-sm mb-6">Your booking for <strong>{resource.name}</strong> on {date} at {timeSlot} has been submitted.</p>
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
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time Slot *</label>
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold bg-white">
                <option value="">Select a time slot</option>
                {['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Purpose</label>
              <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="Briefly describe the purpose of booking..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sliit-gold resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-xl font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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

export default function ResourcePage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [bookingResource, setBookingResource] = useState(null);

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

  const displayed = resources.filter((r) =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase())
  );

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setMinCapacity('');
    setLocationFilter('');
    setSearch('');
  };

  const hasFilters = typeFilter || statusFilter || minCapacity || locationFilter || search;

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
          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              {/* Search */}
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
        </div>
      </main>
      <Footer />

      {bookingResource && (
        <BookingModal resource={bookingResource} onClose={() => setBookingResource(null)} />
      )}
    </>
  );
}
