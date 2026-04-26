import { useState, useRef } from 'react';
import { Upload, Trash2, Image } from 'lucide-react';
import { ticketApi } from '../../hooks/useTickets';

export default function AttachmentUpload({ ticket, currentUser, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed');
      return;
    }
    if (ticket.attachments?.length >= 3) {
      alert('Maximum 3 attachments allowed');
      return;
    }
    setUploading(true);
    try {
      const updated = await ticketApi.uploadAttachment(ticket.id, file);
      onUpdate(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      const updated = await ticketApi.deleteAttachment(ticket.id, attachmentId);
      onUpdate(updated);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h4 className="font-semibold text-[#222222] mb-3">
        Attachments ({ticket.attachments?.length || 0}/3)
      </h4>

      <div className="space-y-2 mb-3">
        {ticket.attachments?.length === 0 && (
          <p className="text-gray-400 text-sm">No attachments yet.</p>
        )}
        {ticket.attachments?.map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <Image className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-[#222222] flex-1 truncate">{a.fileName}</span>
            <span className="text-xs text-gray-400">
              {(a.fileSize / 1024).toFixed(1)} KB
            </span>
            {a.uploadedById === currentUser?.id && (
              <button
                onClick={() => handleDelete(a.id)}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {ticket.attachments?.length < 3 && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-yellow-400 hover:text-yellow-600 transition-all w-full justify-center disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload image'}
          </button>
        </>
      )}
    </div>
  );
}