import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ticketApi } from '../../hooks/useTickets';

const STATUSES = ['IN_PROGRESS', 'RESOLVED', 'REJECTED'];

const statusLabels = {
  IN_PROGRESS: 'In Progress — start working on this ticket',
  RESOLVED: 'Resolved — issue has been fixed',
  REJECTED: 'Rejected — cannot be resolved',
};

export default function TechnicianUpdateModal({ ticket, onClose, onUpdate }) {
  const [status, setStatus] = useState('IN_PROGRESS');
  const [updateNote, setUpdateNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updateNote.trim()) {
      setError('Update note is required');
      return;
    }
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setError('Rejection reason is required when rejecting a ticket');
      return;
    }
    if (status === 'RESOLVED' && !resolutionNotes.trim()) {
      setError('Resolution notes are required when resolving a ticket');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await ticketApi.technicianUpdate(ticket.id, {
        status,
        updateNote: updateNote.trim(),
        resolutionNotes: resolutionNotes.trim() || null,
        rejectionReason: rejectionReason.trim() || null,
      });
      onUpdate(updated);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-black text-[#222222] text-lg">Update Ticket</h3>
            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{ticket.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="block text-sm font-bold text-[#222222] mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                    status === s
                      ? s === 'REJECTED'
                        ? 'border-red-400 bg-red-50'
                        : s === 'RESOLVED'
                        ? 'border-green-400 bg-green-50'
                        : 'border-[#F5A623] bg-yellow-50'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    s === 'REJECTED' ? 'bg-red-400' :
                    s === 'RESOLVED' ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-[#222222]">
                      {s.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400">{statusLabels[s]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Update note */}
          <div>
            <label className="block text-sm font-bold text-[#222222] mb-2">
              Update Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              placeholder="Describe what you did or observed..."
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none transition-all"
            />
          </div>

          {/* Resolution notes — only for RESOLVED */}
          {status === 'RESOLVED' && (
            <div>
              <label className="block text-sm font-bold text-[#222222] mb-2">
                Resolution Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe exactly how the issue was fixed..."
                rows={3}
                className="w-full border border-green-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-green-50 resize-none transition-all"
              />
            </div>
          )}

          {/* Rejection reason — only for REJECTED */}
          {status === 'REJECTED' && (
            <div>
              <label className="block text-sm font-bold text-[#222222] mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain clearly why this incident cannot be resolved..."
                rows={3}
                className="w-full border border-red-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50 resize-none transition-all"
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 shrink-0 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm ${
              status === 'REJECTED'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : status === 'RESOLVED'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-[#F5A623] hover:bg-yellow-500 text-[#222222]'
            }`}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : `Submit — ${status.replace('_', ' ')}`
            }
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}