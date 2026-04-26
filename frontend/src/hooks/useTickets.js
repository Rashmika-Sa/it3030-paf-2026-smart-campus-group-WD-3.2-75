const BACKEND = 'http://localhost:8082';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const parseError = async (res, fallback) => {
  let message = fallback;
  try {
    const data = await res.json();
    message = data?.message || data?.error || fallback;
  } catch {
    // Ignore parse errors and keep fallback.
  }
  throw new Error(message);
};

export const ticketApi = {

  // Get assigned tickets (technician)
  getAssigned: async () => {
    const res = await fetch(`${BACKEND}/api/tickets/assigned`, { headers: headers() });
    if (!res.ok) await parseError(res, 'Failed to fetch assigned tickets');
    return res.json();
  },

  // Get review queue (technician/admin)
  getReviewQueue: async () => {
    const res = await fetch(`${BACKEND}/api/tickets/review`, { headers: headers() });
    if (!res.ok) await parseError(res, 'Failed to fetch review queue');
    return res.json();
  },

  // Get all tickets (admin view)
  getAll: async () => {
    const res = await fetch(`${BACKEND}/api/tickets`, { headers: headers() });
    if (!res.ok) await parseError(res, 'Failed to fetch tickets');
    return res.json();
  },

  // Get single ticket
  getById: async (id) => {
    const res = await fetch(`${BACKEND}/api/tickets/${id}`, { headers: headers() });
    if (!res.ok) await parseError(res, 'Failed to fetch ticket');
    return res.json();
  },

  // Create ticket
  create: async (data) => {
    const res = await fetch(`${BACKEND}/api/tickets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await parseError(res, 'Failed to create ticket');
    return res.json();
  },

  // Update status (admin)
  updateStatus: async (id, data) => {
    const res = await fetch(`${BACKEND}/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await parseError(res, 'Failed to update status');
    return res.json();
  },

  // Technician update
  technicianUpdate: async (id, data) => {
    const res = await fetch(`${BACKEND}/api/tickets/${id}/technician-update`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await parseError(res, 'Failed to update ticket');
    return res.json();
  },

  // Technician mark reviewed
  markReviewed: async (id) => {
    const res = await fetch(`${BACKEND}/api/tickets/${id}/mark-reviewed`, {
      method: 'PUT',
      headers: headers(),
    });
    if (!res.ok) await parseError(res, 'Failed to mark incident as reviewed');
    return res.json();
  },

  // Add comment
  addComment: async (id, content) => {
    const res = await fetch(`${BACKEND}/api/tickets/${id}/comments`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) await parseError(res, 'Failed to add comment');
    return res.json();
  },

  // Edit comment
  editComment: async (ticketId, commentId, content) => {
    const res = await fetch(`${BACKEND}/api/tickets/${ticketId}/comments/${commentId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) await parseError(res, 'Failed to edit comment');
    return res.json();
  },

  // Delete comment
  deleteComment: async (ticketId, commentId) => {
    const res = await fetch(`${BACKEND}/api/tickets/${ticketId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) await parseError(res, 'Failed to delete comment');
    return res.json();
  },

  // Upload attachment
  uploadAttachment: async (ticketId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BACKEND}/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    if (!res.ok) await parseError(res, 'Failed to upload attachment');
    return res.json();
  },

  // Delete attachment
  deleteAttachment: async (ticketId, attachmentId) => {
    const res = await fetch(`${BACKEND}/api/tickets/${ticketId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) await parseError(res, 'Failed to delete attachment');
    return res.json();
  },

  // Delete ticket
  delete: async (id) => {
    const res = await fetch(`${BACKEND}/api/tickets/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) await parseError(res, 'Failed to delete ticket');
  },
};