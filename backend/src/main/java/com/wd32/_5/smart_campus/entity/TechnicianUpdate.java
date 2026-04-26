package com.wd32._5.smart_campus.entity;

import java.time.LocalDateTime;
import java.util.UUID;

public class TechnicianUpdate {

    private String id = UUID.randomUUID().toString();
    private String technicianId;
    private String technicianName;
    private TicketStatus statusChanged;
    private String updateNote;
    private String resolutionNotes;
    private String rejectionReason;
    private LocalDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTechnicianId() { return technicianId; }
    public void setTechnicianId(String technicianId) { this.technicianId = technicianId; }

    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }

    public TicketStatus getStatusChanged() { return statusChanged; }
    public void setStatusChanged(TicketStatus statusChanged) { this.statusChanged = statusChanged; }

    public String getUpdateNote() { return updateNote; }
    public void setUpdateNote(String updateNote) { this.updateNote = updateNote; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}