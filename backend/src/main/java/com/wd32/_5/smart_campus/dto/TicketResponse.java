package com.wd32._5.smart_campus.dto;

import com.wd32._5.smart_campus.entity.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private String location;
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

    // --- Static factory method ---
    public static TicketResponse from(IncidentTicket ticket) {
        TicketResponse r = new TicketResponse();
        r.id = ticket.getId();
        r.title = ticket.getTitle();
        r.description = ticket.getDescription();
        r.location = ticket.getLocation();
        r.category = ticket.getCategory();
        r.priority = ticket.getPriority();
        r.status = ticket.getStatus();
        r.preferredContactName = ticket.getPreferredContactName();
        r.preferredContactPhone = ticket.getPreferredContactPhone();
        r.preferredContactEmail = ticket.getPreferredContactEmail();
        r.resolutionNotes = ticket.getResolutionNotes();
        r.rejectionReason = ticket.getRejectionReason();
        r.createdAt = ticket.getCreatedAt();
        r.updatedAt = ticket.getUpdatedAt();
        r.createdBy = UserSummary.from(ticket.getCreatedBy());
        r.assignedTo = ticket.getAssignedTo() != null ? UserSummary.from(ticket.getAssignedTo()) : null;
        r.attachments = ticket.getAttachments().stream()
                .map(AttachmentSummary::from).collect(Collectors.toList());
        r.comments = ticket.getComments().stream()
                .map(CommentSummary::from).collect(Collectors.toList());
        return r;
    }

    // --- Inner summary classes ---
    public static class UserSummary {
        public Long id;
        public String name;
        public String email;

        public static UserSummary from(User u) {
            UserSummary s = new UserSummary();
            s.id = u.getId();
            s.name = u.getName();
            s.email = u.getEmail();
            return s;
        }
    }

    public static class AttachmentSummary {
        public Long id;
        public String fileName;
        public String fileType;
        public Long fileSize;
        public LocalDateTime uploadedAt;

        public static AttachmentSummary from(TicketAttachment a) {
            AttachmentSummary s = new AttachmentSummary();
            s.id = a.getId();
            s.fileName = a.getFileName();
            s.fileType = a.getFileType();
            s.fileSize = a.getFileSize();
            s.uploadedAt = a.getUploadedAt();
            return s;
        }
    }

    public static class CommentSummary {
        public Long id;
        public String content;
        public LocalDateTime createdAt;
        public LocalDateTime updatedAt;
        public UserSummary author;

        public static CommentSummary from(TicketComment c) {
            CommentSummary s = new CommentSummary();
            s.id = c.getId();
            s.content = c.getContent();
            s.createdAt = c.getCreatedAt();
            s.updatedAt = c.getUpdatedAt();
            s.author = UserSummary.from(c.getAuthor());
            return s;
        }
    }

    // --- Getters ---
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
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
}