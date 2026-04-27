import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Package, Users, Bell, LogOut, Menu, X,
  Plus, Pencil, Trash2, Search, AlertCircle, CheckCircle,
  Building2, FlaskConical, MonitorSmartphone, Video,
  Activity, ChevronRight, ToggleLeft, ToggleRight, GraduationCap,
  Calendar, Ticket, Settings, Clock, CalendarDays, Wrench,
  XCircle, Ban, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const BACKEND = 'http://localhost:8081';
const getToken = () => localStorage.getItem('token');

const RESOURCE_TYPES = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];
const RESOURCE_STATUSES = ['ACTIVE', 'OUT_OF_SERVICE'];

const TYPE_LABEL = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  EQUIPMENT: 'Equipment',
};

const TYPE_ICON = {
  LECTURE_HALL: <Building2 className="w-4 h-4" />,
  LAB: <FlaskConical className="w-4 h-4" />,
  MEETING_ROOM: <MonitorSmartphone className="w-4 h-4" />,
  EQUIPMENT: <Video className="w-4 h-4" />,
};

const TYPE_COLOR = {
  LECTURE_HALL: 'bg-blue-100 text-blue-700',
  LAB: 'bg-purple-100 text-purple-700',
  MEETING_ROOM: 'bg-emerald-100 text-emerald-700',
  EQUIPMENT: 'bg-orange-100 text-orange-700',
};

const EMPTY_FORM = {
  name: '', type: 'LECTURE_HALL', capacity: '', location: '',
  description: '', status: 'ACTIVE', availabilityWindows: [], maintenanceReturnDate: '',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in
      ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
}

// ─── Resource Form Modal ───────────────────────────────────────────────────────
function ResourceModal({ editingResource, existingResources = [], onClose, onSaved, showToast }) {
  const [form, setForm] = useState(
    editingResource
      ? {
          name: editingResource.name || '',
          type: editingResource.type || 'LECTURE_HALL',
          capacity: editingResource.capacity || '',
          location: editingResource.location || '',
          description: editingResource.description || '',
          status: editingResource.status || 'ACTIVE',
          availabilityWindows: editingResource.availabilityWindows || [],
          maintenanceReturnDate: editingResource.maintenanceReturnDate || '',
        }
      : { ...EMPTY_FORM }
  );
  const [newWindowDate, setNewWindowDate] = useState('');
  const [newWindowStart, setNewWindowStart] = useState('');
  const [newWindowEnd, setNewWindowEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!editingResource?.id;

  const addWindow = () => {
    if (!newWindowDate) return;
    const label = newWindowStart && newWindowEnd
      ? `${newWindowDate} ${newWindowStart}–${newWindowEnd}`
      : newWindowStart
        ? `${newWindowDate} from ${newWindowStart}`
        : newWindowDate;
    setForm((f) => ({ ...f, availabilityWindows: [...f.availabilityWindows, label] }));
    setNewWindowDate('');
    setNewWindowStart('');
    setNewWindowEnd('');
  };

  const removeWindow = (idx) => {
    setForm((f) => ({ ...f, availabilityWindows: f.availabilityWindows.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.location.trim()) {
      setError('Name and location are required.');
      return;
    }
    const cap = parseInt(form.capacity);
    if (form.capacity !== '' && (isNaN(cap) || cap < 0)) {
      setError('Capacity must be a positive number.');
      return;
    }
    const duplicate = existingResources.find(
      (r) => r.name.trim().toLowerCase() === form.name.trim().toLowerCase() && r.id !== editingResource?.id
    );
    if (duplicate) {
      setError('A resource with this name already exists.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      capacity: cap || 0,
      availabilityWindows: form.availabilityWindows,
      maintenanceReturnDate: form.status === 'OUT_OF_SERVICE' ? (form.maintenanceReturnDate || null) : null,
    };
    try {
      const url = isEdit
        ? `${BACKEND}/api/resources/${editingResource.id}`
        : `${BACKEND}/api/resources`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(isEdit ? 'Resource updated.' : 'Resource created.');
        onSaved();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.message || 'Failed to save resource.');
      }
    } catch {
      setError('Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#222222]">{isEdit ? 'Edit Resource' : 'Add New Resource'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Resource Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                placeholder="e.g. Main Lecture Hall A"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400 bg-white">
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Capacity</label>
              <input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Location *</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required
                placeholder="e.g. Block A, Floor 2"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400 bg-white">
                {RESOURCE_STATUSES.map((s) => <option key={s} value={s}>{s === 'ACTIVE' ? 'Active' : 'Out of Service'}</option>)}
              </select>
            </div>
            {form.status === 'OUT_OF_SERVICE' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Expected Return Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.maintenanceReturnDate}
                  onChange={(e) => setForm({ ...form, maintenanceReturnDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 border border-red-200 bg-red-50 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
                />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-2">Availability Windows</label>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={newWindowDate}
                    onChange={(e) => setNewWindowDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="col-span-3 sm:col-span-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
                  />
                  <input
                    type="time"
                    value={newWindowStart}
                    onChange={(e) => setNewWindowStart(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
                    title="Start time"
                  />
                  <input
                    type="time"
                    value={newWindowEnd}
                    onChange={(e) => setNewWindowEnd(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
                    title="End time"
                  />
                </div>
                <button
                  type="button"
                  onClick={addWindow}
                  disabled={!newWindowDate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-yellow-50 hover:text-yellow-700 text-gray-600 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Window
                </button>
                {form.availabilityWindows.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.availabilityWindows.map((w, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                        {w}
                        <button
                          type="button"
                          onClick={() => removeWindow(i)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} placeholder="Brief description of this resource..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-xl font-bold text-sm transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : isEdit ? 'Update Resource' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Schedule Modal ────────────────────────────────────────────────────────────
function ScheduleModal({ resource, onClose }) {
  const windows = resource.availabilityWindows || [];

  const parsed = windows.map((w) => {
    const idx = w.indexOf(' ');
    if (idx === -1) return { date: null, time: w };
    return { date: w.slice(0, idx), time: w.slice(idx + 1) };
  });

  const grouped = parsed.reduce((acc, w) => {
    const key = w.date || 'No Date';
    (acc[key] = acc[key] || []).push(w.time);
    return acc;
  }, {});

  const formatDate = (d) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-[#222222]">{resource.name}</h2>
            <p className="text-xs text-gray-400">Availability Schedule</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {resource.status === 'OUT_OF_SERVICE' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">Out of Service</span>
                {resource.maintenanceReturnDate && <span> — Expected return: <strong>{resource.maintenanceReturnDate}</strong></span>}
              </p>
            </div>
          )}
          {windows.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-semibold text-gray-400">No availability windows defined.</p>
              <p className="text-xs text-gray-300 mt-1">Add windows in the resource editor.</p>
            </div>
          ) : (
            Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, times]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="text-sm font-bold text-[#222222]">
                    {date === 'No Date' ? 'No Date' : formatDate(date)}
                  </span>
                </div>
                <div className="space-y-1.5 ml-6">
                  {times.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm text-gray-700 font-medium">{t}</span>
                      <span className="ml-auto text-xs font-semibold text-emerald-600">Available</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Maintenance Prompt ────────────────────────────────────────────────────────
function MaintenanceDatePrompt({ resource, onConfirm, onCancel }) {
  const [returnDate, setReturnDate] = useState('');
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <Wrench className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-bold text-[#222222] text-base mb-1">Set Maintenance Mode</h3>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{resource.name}</strong> will be marked as out of service. Enter the expected return date.
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Expected Return Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(returnDate || null)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resources Section ─────────────────────────────────────────────────────────
function ResourcesSection({ showToast }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalResource, setModalResource] = useState(undefined);
  const [scheduleResource, setScheduleResource] = useState(null);
  const [maintenancePrompt, setMaintenancePrompt] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/resources`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setResources(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.name?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q)) &&
      (!typeFilter || r.type === typeFilter) &&
      (!statusFilter || r.status === statusFilter)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BACKEND}/api/resources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
        showToast('Resource deleted.');
      } else {
        showToast('Failed to delete.', 'error');
      }
    } catch {
      showToast('Could not connect to server.', 'error');
    }
  };

  const handleStatusClick = (resource) => {
    if (resource.status === 'ACTIVE') {
      setMaintenancePrompt(resource);
    } else {
      applyToggleStatus(resource, null);
    }
  };

  const applyToggleStatus = async (resource, returnDate) => {
    const newStatus = resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    try {
      const res = await fetch(`${BACKEND}/api/resources/${resource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...resource,
          status: newStatus,
          availabilityWindows: resource.availabilityWindows || [],
          maintenanceReturnDate: newStatus === 'OUT_OF_SERVICE' ? returnDate : null,
        }),
      });
      if (res.ok) {
        setResources((prev) => prev.map((r) =>
          r.id === resource.id
            ? { ...r, status: newStatus, maintenanceReturnDate: newStatus === 'OUT_OF_SERVICE' ? returnDate : null }
            : r
        ));
        showToast(`Marked as ${newStatus === 'ACTIVE' ? 'Active' : 'Out of Service'}.`);
        setMaintenancePrompt(null);
      }
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const stats = {
    total: resources.length,
    active: resources.filter((r) => r.status === 'ACTIVE').length,
    oos: resources.filter((r) => r.status === 'OUT_OF_SERVICE').length,
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3 pb-1">
        <div className="w-10 h-10 rounded-xl bg-sliit-gold/10 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="font-bold text-[#222222] text-base leading-tight">Resources Management</h2>
          <p className="text-xs text-gray-400">Manage campus facilities and assets catalogue</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Resources', value: stats.total, color: 'text-[#222222]', bg: 'bg-white border border-gray-200', iconBg: 'bg-gray-100', icon: <Package className="w-4 h-4 text-gray-500" /> },
          { label: 'Active', value: stats.active, color: 'text-emerald-700', bg: 'bg-white border border-emerald-100', iconBg: 'bg-emerald-50', icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
          { label: 'Out of Service', value: stats.oos, color: 'text-red-700', bg: 'bg-white border border-red-100', iconBg: 'bg-red-50', icon: <AlertCircle className="w-4 h-4 text-red-500" /> },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm`}>
            <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-extrabold leading-tight ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or location..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 w-56" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-yellow-400">
            <option value="">All Types</option>
            {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-yellow-400">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>
        <button onClick={() => setModalResource(null)}
          className="flex items-center gap-2 bg-sliit-gold hover:bg-yellow-500 text-[#222222] px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Type', 'Cap.', 'Location', 'Availability', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-sliit-gold border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">Loading resources…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-10 h-10 text-gray-200" />
                      <p className="text-sm font-semibold text-gray-400">No resources found</p>
                      <p className="text-xs text-gray-300">Try a different search or add a new resource.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#222222] max-w-[160px] truncate">{r.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${TYPE_COLOR[r.type] || 'bg-gray-100 text-gray-700'}`}>
                      {TYPE_ICON[r.type]}{TYPE_LABEL[r.type] || r.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{r.capacity || '—'}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-[140px] truncate">{r.location}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs max-w-[160px] truncate">
                    {(r.availabilityWindows || []).join(', ') || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleStatusClick(r)}
                      title={`Click to mark as ${r.status === 'ACTIVE' ? 'Out of Service' : 'Active'}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border
                        ${r.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                    >
                      {r.status === 'ACTIVE'
                        ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                        : <><ToggleLeft className="w-3.5 h-3.5" /> Out of Service</>}
                    </button>
                    {r.status === 'OUT_OF_SERVICE' && r.maintenanceReturnDate && (
                      <p className="text-xs text-gray-400 mt-1 pl-1">
                        Returns: {r.maintenanceReturnDate}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setScheduleResource(r)}
                        title="View Schedule"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <CalendarDays className="w-4 h-4" />
                      </button>
                      <button onClick={() => setModalResource(r)}
                        title="Edit"
                        className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-sliit-gold transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {resources.length} resources
          </div>
        )}
      </div>

      {/* Resource create/edit modal */}
      {modalResource !== undefined && (
        <ResourceModal
          editingResource={modalResource}
          existingResources={resources}
          onClose={() => setModalResource(undefined)}
          onSaved={() => { setModalResource(undefined); fetchResources(); }}
          showToast={showToast}
        />
      )}

      {/* Schedule viewer */}
      {scheduleResource && (
        <ScheduleModal
          resource={scheduleResource}
          onClose={() => setScheduleResource(null)}
        />
      )}

      {/* Maintenance date prompt */}
      {maintenancePrompt && (
        <MaintenanceDatePrompt
          resource={maintenancePrompt}
          onConfirm={(date) => applyToggleStatus(maintenancePrompt, date)}
          onCancel={() => setMaintenancePrompt(null)}
        />
      )}
    </div>
  );
}

// ─── Bookings Section ──────────────────────────────────────────────────────────
const BOOKING_STATUS_STYLE = {
  PENDING:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const BOOKING_STATUS_ICON = {
  PENDING:   <Clock className="w-3 h-3" />,
  APPROVED:  <CheckCircle className="w-3 h-3" />,
  REJECTED:  <XCircle className="w-3 h-3" />,
  CANCELLED: <Ban className="w-3 h-3" />,
};

function RejectModal({ booking, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-bold text-[#222222] text-base mb-1">Reject Booking</h3>
        <p className="text-sm text-gray-500 mb-4">
          Rejecting booking for <strong>{booking.resourceName}</strong> by <strong>{booking.userName}</strong>.
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Provide a reason for rejection..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-400 resize-none"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingsSection({ showToast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`${BACKEND}/api/bookings${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try {
      const res = await fetch(`${BACKEND}/api/bookings/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'APPROVED' } : b));
        showToast('Booking approved.');
      } else {
        showToast('Failed to approve.', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, reason) => {
    setActionLoading(id + '_reject');
    setRejectTarget(null);
    try {
      const res = await fetch(`${BACKEND}/api/bookings/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'REJECTED', adminNote: reason } : b));
        showToast('Booking rejected.');
      } else {
        showToast('Failed to reject.', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter((b) => b.status === 'PENDING').length,
    approved:  bookings.filter((b) => b.status === 'APPROVED').length,
    rejected:  bookings.filter((b) => b.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3 pb-1">
        <div className="w-10 h-10 rounded-xl bg-sliit-gold/10 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="font-bold text-[#222222] text-base leading-tight">Bookings Management</h2>
          <p className="text-xs text-gray-400">Review and manage all resource booking requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, bg: 'bg-white border border-gray-200', iconBg: 'bg-gray-100', icon: <Calendar className="w-4 h-4 text-gray-500" />, color: 'text-[#222222]' },
          { label: 'Pending', value: stats.pending, bg: 'bg-white border border-yellow-100', iconBg: 'bg-yellow-50', icon: <Clock className="w-4 h-4 text-yellow-600" />, color: 'text-yellow-700' },
          { label: 'Approved', value: stats.approved, bg: 'bg-white border border-emerald-100', iconBg: 'bg-emerald-50', icon: <CheckCircle className="w-4 h-4 text-emerald-600" />, color: 'text-emerald-700' },
          { label: 'Rejected', value: stats.rejected, bg: 'bg-white border border-red-100', iconBg: 'bg-red-50', icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm`}>
            <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-extrabold leading-tight ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-yellow-400">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['User', 'Resource', 'Date', 'Time Slot', 'Attendees', 'Purpose', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-sliit-gold border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">Loading bookings…</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-10 h-10 text-gray-200" />
                      <p className="text-sm font-semibold text-gray-400">No bookings found</p>
                    </div>
                  </td>
                </tr>
              ) : bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#222222] max-w-[120px] truncate">{b.userName}</td>
                  <td className="py-3 px-4 font-semibold text-[#222222] max-w-[140px] truncate">{b.resourceName}</td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{b.date}</td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{b.timeSlot}</td>
                  <td className="py-3 px-4 text-gray-600">{b.attendees || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">{b.purpose || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${BOOKING_STATUS_STYLE[b.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {BOOKING_STATUS_ICON[b.status]}{b.status}
                    </span>
                    {b.status === 'REJECTED' && b.adminNote && (
                      <p className="text-xs text-gray-400 mt-1 max-w-[140px] truncate" title={b.adminNote}>
                        {b.adminNote}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {b.status === 'PENDING' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(b.id)}
                          disabled={!!actionLoading}
                          title="Approve"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === b.id + '_approve'
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <CheckCircle className="w-3 h-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(b)}
                          disabled={!!actionLoading}
                          title="Reject"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === b.id + '_reject'
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <XCircle className="w-3 h-3" />}
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          booking={rejectTarget}
          onConfirm={(reason) => handleReject(rejectTarget.id, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Placeholder section ───────────────────────────────────────────────────────
function PlaceholderSection({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-300">{icon}</div>
      <h3 className="text-lg font-bold text-[#222222] mb-1">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs">{description}</p>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewSection({ setActiveSection }) {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND}/api/resources`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setResources)
      .catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Resources', value: resources.length, icon: <Package className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active', value: resources.filter((r) => r.status === 'ACTIVE').length, icon: <Activity className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Out of Service', value: resources.filter((r) => r.status === 'OUT_OF_SERVICE').length, icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-50' },
    { label: 'Lecture Halls', value: resources.filter((r) => r.type === 'LECTURE_HALL').length, icon: <Building2 className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-[#222222]">{s.value}</p>
              <p className="text-xs text-gray-500 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#222222]">Recent Resources</h2>
          <button onClick={() => setActiveSection('resources')}
            className="text-sm text-sliit-gold font-semibold flex items-center gap-1 hover:underline">
            Manage all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {resources.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No resources yet. Add one from the Resources tab.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Type', 'Location', 'Status'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.slice(0, 6).map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-[#222222]">{r.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${TYPE_COLOR[r.type] || 'bg-gray-100 text-gray-700'}`}>
                        {TYPE_ICON[r.type]}{TYPE_LABEL[r.type] || r.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{r.location}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                        ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {r.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {r.status === 'ACTIVE' ? 'Active' : 'Out of Service'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const navItems = [
    { id: 'overview',       label: 'Overview',       icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'resources',      label: 'Resources',      icon: <Package className="w-5 h-5" /> },
    { id: 'bookings',       label: 'Bookings',       icon: <Calendar className="w-5 h-5" /> },
    { id: 'users',          label: 'Users',          icon: <Users className="w-5 h-5" /> },
    { id: 'notifications',  label: 'Notifications',  icon: <Bell className="w-5 h-5" /> },
    { id: 'tickets',        label: 'Tickets',        icon: <Ticket className="w-5 h-5" /> },
    { id: 'settings',       label: 'Settings',       icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-[#1a1a1a] flex flex-col transition-all duration-300 ease-in-out shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-sliit-gold" />
              <span className="font-bold text-white text-sm tracking-tight">
                SLIIT-HUB<span className="text-sliit-gold">.</span>
              </span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`text-gray-500 hover:text-white transition-colors ${!sidebarOpen ? 'mx-auto' : ''}`}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Admin badge */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2 rounded-xl bg-sliit-gold/10 border border-sliit-gold/20">
            <p className="text-xs text-sliit-gold font-bold uppercase tracking-wider">Admin Panel</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.name || user?.email || '—'}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium group
                ${activeSection === item.id
                  ? 'bg-sliit-gold text-[#1a1a1a]'
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
            <p className="text-xs text-gray-400">Smart Campus — Admin</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-medium text-gray-600">{user?.name || user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-sliit-gold flex items-center justify-center text-[#222222] font-bold text-sm">
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === 'overview' && <OverviewSection setActiveSection={setActiveSection} />}
          {activeSection === 'resources' && <ResourcesSection showToast={showToast} />}
          {activeSection === 'bookings' && <BookingsSection showToast={showToast} />}
          {activeSection === 'users' && (
            <PlaceholderSection icon={<Users className="w-8 h-8" />} title="Users" description="Manage registered users and their roles." />
          )}
          {activeSection === 'notifications' && (
            <PlaceholderSection icon={<Bell className="w-8 h-8" />} title="Notifications" description="Send and manage campus-wide notifications." />
          )}
          {activeSection === 'tickets' && (
            <PlaceholderSection icon={<Ticket className="w-8 h-8" />} title="Support Tickets" description="Review and respond to student support tickets." />
          )}
          {activeSection === 'settings' && (
            <PlaceholderSection icon={<Settings className="w-8 h-8" />} title="Settings" description="Configure system-wide settings and preferences." />
          )}
        </main>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
