package com.wd32._5.smart_campus.dto;

import com.wd32._5.smart_campus.entity.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TechnicianUpdateRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    @NotBlank(message = "Update note is required")
    private String updateNote;

    private String resolutionNotes;
    private String rejectionReason;

    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }

    public String getUpdateNote() { return updateNote; }
    public void setUpdateNote(String updateNote) { this.updateNote = updateNote; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}