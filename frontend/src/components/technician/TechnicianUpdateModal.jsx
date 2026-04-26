import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ticketApi } from '../../hooks/useTickets';

const STATUSES = ['IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'];

export default function TechnicianUpdateModal({ ticket, onClose, onUpdate }) {
  const [status, setStatus] = useState(ticket.status);
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
      setError('Rejection reason is required');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-[#222222] text-lg">Update Ticket</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-2">
              New Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-gray-50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-2">
              Update Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              placeholder="Describe what you did..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none"
            />
          </div>

          {status === 'RESOLVED' && (
            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none"
              />
            </div>
          )}

          {status === 'REJECTED' && (
            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this incident is rejected..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-gray-50 resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}