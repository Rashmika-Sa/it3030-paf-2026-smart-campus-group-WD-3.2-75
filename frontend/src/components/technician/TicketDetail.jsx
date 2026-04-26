import { useState } from 'react';
import {
  X, MapPin, Clock, User, Wrench,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { ticketApi } from '../../hooks/useTickets';
import CommentSection from './CommentSection';
import AttachmentUpload from './AttachmentUpload';
import TechnicianUpdateModal from './TechnicianUpdateModal';

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

export default function TicketDetail({ ticket, currentUser, onClose, onUpdate }) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [localTicket, setLocalTicket] = useState(ticket);
  const [closing, setClosing] = useState(false);

  const handleUpdate = (updated) => {
    setLocalTicket(updated);
    onUpdate(updated);
  };

  const isTechnician = currentUser?.role === 'TECHNICIAN';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Technician can update ANY ticket — no assigned check
  const canUpdateStatus = isTechnician || isAdmin;
  const ticketOpen = localTicket.status !== 'CLOSED' && localTicket.status !== 'REJECTED';

  const timelineItems = [
    {
      id: `created-${localTicket.id}`,
      timestamp: localTicket.createdAt,
      title: 'Incident reported',
      detail: `Reported by ${localTicket.createdBy?.name || 'Student'}`,
      status: 'OPEN',
      actor: localTicket.createdBy?.name || 'Student',
    },
    ...(localTicket.technicianUpdates || []).map((u) => ({
      id: `update-${u.id}`,
      timestamp: u.updatedAt,
      title: `Status changed to ${(u.statusChanged || '').replace('_', ' ')}`,
      detail: u.updateNote,
      status: u.statusChanged,
      actor: u.technicianName,
      resolutionNotes: u.resolutionNotes,
      rejectionReason: u.rejectionReason,
    })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const handleCloseIncident = async () => {
    if (!confirm('Are you sure you want to close this incident?')) return;
    setClosing(true);
    try {
      const updated = await ticketApi.technicianUpdate(localTicket.id, {
        status: 'CLOSED',
        updateNote: 'Incident closed by technician',
        resolutionNotes: localTicket.resolutionNotes || null,
      });
      handleUpdate(updated);
    } catch (e) {
      alert(e.message || 'Failed to close incident');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[999] p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors[localTicket.status]}`}>
                {localTicket.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${priorityColors[localTicket.priority]}`}>
                {localTicket.priority}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                {localTicket.category}
              </span>
            </div>
            <h2 className="font-black text-[#222222] text-lg leading-snug">
              {localTicket.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed">
            {localTicket.description}
          </p>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location
              </p>
              <p className="text-sm font-bold text-[#222222]">{localTicket.location}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Reported by
              </p>
              <p className="text-sm font-bold text-[#222222]">{localTicket.createdBy?.name}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Assigned to
              </p>
              <p className="text-sm font-bold text-[#222222]">
                {localTicket.assignedTo?.name || 'Not assigned'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Created
              </p>
              <p className="text-sm font-bold text-[#222222]">
                {new Date(localTicket.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Contact info */}
          {localTicket.preferredContactName && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2">Preferred Contact</p>
              <p className="text-sm font-bold text-blue-900">{localTicket.preferredContactName}</p>
              {localTicket.preferredContactPhone && (
                <p className="text-sm text-blue-700">{localTicket.preferredContactPhone}</p>
              )}
              {localTicket.preferredContactEmail && (
                <p className="text-sm text-blue-700">{localTicket.preferredContactEmail}</p>
              )}
            </div>
          )}

          {/* Resolution notes */}
          {localTicket.resolutionNotes && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-green-700 mb-2">Resolution Notes</p>
              <p className="text-sm text-green-900">{localTicket.resolutionNotes}</p>
            </div>
          )}

          {/* Rejection reason */}
          {localTicket.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-700 mb-2">Rejection Reason</p>
              <p className="text-sm text-red-900">{localTicket.rejectionReason}</p>
            </div>
          )}

          {/* Status timeline */}
          <div className="border border-gray-100 rounded-2xl p-4">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="flex items-center gap-2 text-sm font-bold text-[#222222] w-full"
            >
              <Clock className="w-4 h-4 text-[#F5A623]" />
              Ticket Timeline
              {showTimeline
                ? <ChevronUp className="w-4 h-4 ml-auto" />
                : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
            {showTimeline && (
              <div className="mt-4 space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-[#222222]">{item.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[item.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {(item.status || '').replace('_', ' ')}
                      </span>
                    </div>
                    {item.detail && (
                      <p className="text-xs text-gray-600 mb-1">{item.detail}</p>
                    )}
                    {item.resolutionNotes && (
                      <p className="text-xs text-green-700">Resolution: {item.resolutionNotes}</p>
                    )}
                    {item.rejectionReason && (
                      <p className="text-xs text-red-700">Reason: {item.rejectionReason}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {item.actor} · {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technician update history */}
          {localTicket.technicianUpdates?.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm font-bold text-[#222222] mb-3 w-full"
              >
                <Wrench className="w-4 h-4 text-[#F5A623]" />
                Update History ({localTicket.technicianUpdates.length})
                {showHistory
                  ? <ChevronUp className="w-4 h-4 ml-auto" />
                  : <ChevronDown className="w-4 h-4 ml-auto" />}
              </button>
              {showHistory && (
                <div className="space-y-2">
                  {localTicket.technicianUpdates.map((u) => (
                    <div key={u.id} className="bg-yellow-50 border border-yellow-100 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-yellow-800">{u.technicianName}</span>
                        <span className="text-xs text-yellow-600">
                          {new Date(u.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-yellow-900">{u.updateNote}</p>
                      <span className="text-xs font-bold text-yellow-700 mt-1 block">
                        → {u.statusChanged?.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          <div className="border-t border-gray-100 pt-5">
            <AttachmentUpload
              ticket={localTicket}
              currentUser={currentUser}
              onUpdate={handleUpdate}
            />
          </div>

          {/* Comments */}
          <div className="border-t border-gray-100 pt-5">
            <CommentSection
              ticket={localTicket}
              currentUser={currentUser}
              onUpdate={handleUpdate}
            />
          </div>
        </div>

        {/* ── FOOTER ── fixed padding, clean layout */}
        <div className="p-4 border-t border-gray-100 shrink-0">

          {/* Technician/Admin action buttons */}
          {canUpdateStatus && ticketOpen && (
            <div className="flex gap-2 mb-2">
              {/* Update Status — opens modal */}
              <button
                onClick={() => setShowUpdateModal(true)}
                className="flex-1 py-3 bg-[#F5A623] hover:bg-yellow-500 text-[#222222] rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                Update Status
              </button>

              {/* Close Incident — direct action */}
              {/* {localTicket.status === 'RESOLVED' && (
                <button
                  onClick={handleCloseIncident}
                  disabled={closing}
                  className="flex-1 py-3 bg-[#222222] hover:bg-black text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {closing ? 'Closing...' : 'Close Incident'}
                </button>
              )} */}
            </div>
          )}

          {/* Cancel — always full width at bottom */}
          <button
            onClick={onClose}
            className="w-full py-3 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Technician update modal */}
      {showUpdateModal && (
        <TechnicianUpdateModal
          ticket={localTicket}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}