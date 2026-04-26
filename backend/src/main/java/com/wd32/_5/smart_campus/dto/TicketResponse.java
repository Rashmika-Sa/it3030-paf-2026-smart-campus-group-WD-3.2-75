package com.wd32._5.smart_campus.dto;

import com.wd32._5.smart_campus.entity.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class TicketResponse {

    private String id;
    private String title;
    private String description;
    private String location;
    private String resourceId;
    private TicketCategory category;
    private TicketPriority priority;
    private TicketStatus status;
    private String preferredContactName;
    private String preferredContactPhone;
    private String preferredContactEmail;
    private String resolutionNotes;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserSummary createdBy;
    private UserSummary assignedTo;
    private List<AttachmentSummary> attachments;
    private List<CommentSummary> comments;
    private List<TechnicianUpdateSummary> technicianUpdates;

    public static TicketResponse from(IncidentTicket t) {
        TicketResponse r = new TicketResponse();
        r.id = t.getId();
        r.title = t.getTitle();
        r.description = t.getDescription();
        r.location = t.getLocation();
        r.resourceId = t.getResourceId();
        r.category = t.getCategory();
        r.priority = t.getPriority();
        r.status = t.getStatus();
        r.preferredContactName = t.getPreferredContactName();
        r.preferredContactPhone = t.getPreferredContactPhone();
        r.preferredContactEmail = t.getPreferredContactEmail();
        r.resolutionNotes = t.getResolutionNotes();
        r.rejectionReason = t.getRejectionReason();
        r.createdAt = t.getCreatedAt();
        r.updatedAt = t.getUpdatedAt();
        r.createdBy = new UserSummary(t.getCreatedById(), t.getCreatedByName(), t.getCreatedByEmail());
        r.assignedTo = t.getAssignedToId() != null
                ? new UserSummary(t.getAssignedToId(), t.getAssignedToName(), t.getAssignedToEmail())
                : null;
        r.attachments = t.getAttachments().stream()
                .map(AttachmentSummary::from).collect(Collectors.toList());
        r.comments = t.getComments().stream()
                .map(CommentSummary::from).collect(Collectors.toList());
        r.technicianUpdates = t.getTechnicianUpdates().stream()
                .map(TechnicianUpdateSummary::from).collect(Collectors.toList());
        return r;
    }

    public static class UserSummary {
        public String id;
        public String name;
        public String email;
        public UserSummary(String id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }
    }

    public static class AttachmentSummary {
        public String id;
        public String fileName;
        public String fileType;
        public Long fileSize;
        public LocalDateTime uploadedAt;
        public String uploadedById;
        public String uploadedByName;

        public static AttachmentSummary from(TicketAttachment a) {
            AttachmentSummary s = new AttachmentSummary();
            s.id = a.getId();
            s.fileName = a.getFileName();
            s.fileType = a.getFileType();
            s.fileSize = a.getFileSize();
            s.uploadedAt = a.getUploadedAt();
            s.uploadedById = a.getUploadedById();
            s.uploadedByName = a.getUploadedByName();
            return s;
        }
    }

    public static class CommentSummary {
        public String id;
        public String content;
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public String authorName;
        public String authorEmail;

        public static CommentSummary from(TicketComment c) {
            CommentSummary s = new CommentSummary();
            s.id = c.getId();
            s.content = c.getContent();
            s.createdAt = c.getCreatedAt();
            s.updatedAt = c.getUpdatedAt();
            s.authorName = c.getAuthorName();
            s.authorEmail = c.getAuthorEmail();
            return s;
        }
    }

    public static class TechnicianUpdateSummary {
        public String id;
        public String technicianName;
        public TicketStatus statusChanged;
        public String updateNote;
        public String resolutionNotes;
        public String rejectionReason;
        public LocalDateTime updatedAt;

        public static TechnicianUpdateSummary from(TechnicianUpdate u) {
            TechnicianUpdateSummary s = new TechnicianUpdateSummary();
            s.id = u.getId();
            s.technicianName = u.getTechnicianName();
            s.statusChanged = u.getStatusChanged();
            s.updateNote = u.getUpdateNote();
            s.resolutionNotes = u.getResolutionNotes();
            s.rejectionReason = u.getRejectionReason();
            s.updatedAt = u.getUpdatedAt();
            return s;
        }
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public String getResourceId() { return resourceId; }
    public TicketCategory getCategory() { return category; }
    public TicketPriority getPriority() { return priority; }
    public TicketStatus getStatus() { return status; }
    public String getPreferredContactName() { return preferredContactName; }
    public String getPreferredContactPhone() { return preferredContactPhone; }
    public String getPreferredContactEmail() { return preferredContactEmail; }
    public String getResolutionNotes() { return resolutionNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public UserSummary getCreatedBy() { return createdBy; }
    public UserSummary getAssignedTo() { return assignedTo; }
    public List<AttachmentSummary> getAttachments() { return attachments; }
    public List<CommentSummary> getComments() { return comments; }
    public List<TechnicianUpdateSummary> getTechnicianUpdates() { return technicianUpdates; }
}