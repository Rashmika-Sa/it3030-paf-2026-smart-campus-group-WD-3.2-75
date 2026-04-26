package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.dto.*;
import com.wd32._5.smart_campus.entity.*;
import com.wd32._5.smart_campus.repository.IncidentTicketRepository;
import com.wd32._5.smart_campus.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentTicketService {

    public static class AttachmentFile {
        private final Path filePath;
        private final String contentType;
        private final String fileName;

        public AttachmentFile(Path filePath, String contentType, String fileName) {
            this.filePath = filePath;
            this.contentType = contentType;
            this.fileName = fileName;
        }

        public Path getFilePath() { return filePath; }
        public String getContentType() { return contentType; }
        public String getFileName() { return fileName; }
    }

    private final IncidentTicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads/tickets}")
    private String uploadDir;

    public IncidentTicketService(IncidentTicketRepository ticketRepository,
                                  UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    // ── CREATE ─────────────────────────────────────────────────
    public TicketResponse createTicket(TicketRequest request, User currentUser) {
        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setResourceId(request.getResourceId());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setPreferredContactName(request.getPreferredContactName());
        ticket.setPreferredContactPhone(request.getPreferredContactPhone());
        ticket.setPreferredContactEmail(request.getPreferredContactEmail());
        ticket.setCreatedById(currentUser.getId());
        ticket.setCreatedByName(currentUser.getName());
        ticket.setCreatedByEmail(currentUser.getEmail());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── GET ALL ────────────────────────────────────────────────
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET MY TICKETS ─────────────────────────────────────────
    public List<TicketResponse> getMyTickets(User currentUser) {
        return ticketRepository.findByCreatedById(currentUser.getId())
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET ASSIGNED ───────────────────────────────────────────
    public List<TicketResponse> getAssignedTickets(User currentUser) {
        return ticketRepository.findByAssignedToId(currentUser.getId())
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET REVIEW QUEUE (Technician/Admin) ───────────────────
    public List<TicketResponse> getTechnicianReviewTickets(User currentUser) {
        if (currentUser.getRole() != Role.TECHNICIAN && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized: technician or admin access only");
        }
        return ticketRepository.findAll()
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET BY ID ──────────────────────────────────────────────
    public TicketResponse getTicketById(String id) {
        return TicketResponse.from(ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id)));
    }

    // ── FILTER BY STATUS ───────────────────────────────────────
    public List<TicketResponse> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatus(status)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── FILTER BY CATEGORY ─────────────────────────────────────
    public List<TicketResponse> getTicketsByCategory(TicketCategory category) {
        return ticketRepository.findByCategory(category)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── FILTER BY PRIORITY ─────────────────────────────────────
    public List<TicketResponse> getTicketsByPriority(TicketPriority priority) {
        return ticketRepository.findByPriority(priority)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── UPDATE STATUS (Admin) ──────────────────────────────────
    public TicketResponse updateTicketStatus(String id, TicketStatusUpdateRequest request,
                                              User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
        ticket.setStatus(request.getStatus());
        if (request.getResolutionNotes() != null)
            ticket.setResolutionNotes(request.getResolutionNotes());
        if (request.getRejectionReason() != null)
            ticket.setRejectionReason(request.getRejectionReason());
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── TECHNICIAN UPDATE ──────────────────────────────────────
    public TicketResponse addTechnicianUpdate(String ticketId,
                                               TechnicianUpdateRequest request,
                                               User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        // ✅ Any TECHNICIAN or ADMIN can update — no assigned check
        if (currentUser.getRole() != Role.TECHNICIAN && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized");
        }

        if (request.getStatus() == TicketStatus.REJECTED
                && (request.getRejectionReason() == null || request.getRejectionReason().isBlank())) {
            throw new RuntimeException("Rejection reason is required when rejecting a ticket");
        }

        ticket.setStatus(request.getStatus());

        if (request.getStatus() == TicketStatus.RESOLVED || request.getStatus() == TicketStatus.CLOSED) {
            ticket.setResolutionNotes(request.getResolutionNotes());
            ticket.setRejectionReason(null);
        }
        if (request.getStatus() == TicketStatus.REJECTED) {
            ticket.setRejectionReason(request.getRejectionReason());
            ticket.setResolutionNotes(null);
        }

        TechnicianUpdate update = new TechnicianUpdate();
        update.setTechnicianId(currentUser.getId());
        update.setTechnicianName(currentUser.getName());
        update.setStatusChanged(request.getStatus());
        update.setUpdateNote(request.getUpdateNote());
        update.setResolutionNotes(request.getResolutionNotes());
        update.setRejectionReason(request.getRejectionReason());
        update.setUpdatedAt(LocalDateTime.now());
        ticket.getTechnicianUpdates().add(update);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── MARK REVIEWED (Technician/Admin) ─────────────────────
    public TicketResponse markReviewed(String ticketId, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        boolean technicianOrAdmin = currentUser.getRole() == Role.TECHNICIAN
                || currentUser.getRole() == Role.ADMIN;
        if (!technicianOrAdmin) {
            throw new RuntimeException("Not authorized: technician or admin access only");
        }

        // Auto-assign to the reviewer when ticket is unassigned
        if (ticket.getAssignedToId() == null || ticket.getAssignedToId().isBlank()) {
            ticket.setAssignedToId(currentUser.getId());
            ticket.setAssignedToName(currentUser.getName());
            ticket.setAssignedToEmail(currentUser.getEmail());
        }

        boolean assignedToOtherTech = ticket.getAssignedToId() != null
                && !ticket.getAssignedToId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN;
        if (assignedToOtherTech) {
            throw new RuntimeException("Not authorized: ticket is assigned to another technician");
        }

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        TechnicianUpdate update = new TechnicianUpdate();
        update.setTechnicianId(currentUser.getId());
        update.setTechnicianName(currentUser.getName());
        update.setStatusChanged(ticket.getStatus());
        update.setUpdateNote("Incident reviewed by technician");
        update.setUpdatedAt(LocalDateTime.now());
        ticket.getTechnicianUpdates().add(update);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── ASSIGN TECHNICIAN ──────────────────────────────────────
    public TicketResponse assignTechnician(String ticketId, String technicianId,
                                            User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only admins can assign technicians");
        }
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("User not found: " + technicianId));
        ticket.setAssignedToId(technician.getId());
        ticket.setAssignedToName(technician.getName());
        ticket.setAssignedToEmail(technician.getEmail());
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── DELETE TICKET ──────────────────────────────────────────
    public void deleteTicket(String id, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
        if (!ticket.getCreatedById().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized to delete this ticket");
        }
        ticketRepository.delete(ticket);
    }

    // ── ADD COMMENT ────────────────────────────────────────────
    public TicketResponse addComment(String ticketId, CommentRequest request,
                                      User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketComment comment = new TicketComment();
        comment.setContent(request.getContent());
        comment.setAuthorId(currentUser.getId());
        comment.setAuthorName(currentUser.getName());
        comment.setAuthorEmail(currentUser.getEmail());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        ticket.getComments().add(comment);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── EDIT COMMENT ───────────────────────────────────────────
    public TicketResponse editComment(String ticketId, String commentId,
                                       CommentRequest request, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId)).findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        if (!comment.getAuthorId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized: you can only edit your own comments");
        }
        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── DELETE COMMENT ─────────────────────────────────────────
    public TicketResponse deleteComment(String ticketId, String commentId,
                                         User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId)).findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        if (!comment.getAuthorId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized to delete this comment");
        }
        ticket.getComments().remove(comment);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── UPLOAD ATTACHMENT ──────────────────────────────────────
    public TicketResponse uploadAttachment(String ticketId, MultipartFile file,
                                            User currentUser) throws IOException {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        if (ticket.getAttachments().size() >= 3) {
            throw new RuntimeException("Maximum 3 attachments allowed per ticket");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        TicketAttachment attachment = new TicketAttachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(filePath.toString());
        attachment.setFileType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setUploadedById(currentUser.getId());
        attachment.setUploadedByName(currentUser.getName());
        attachment.setUploadedAt(LocalDateTime.now());
        ticket.getAttachments().add(attachment);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── VIEW ATTACHMENT ────────────────────────────────────────
    public AttachmentFile getAttachmentFile(String ticketId, String attachmentId,
                                             User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        boolean canAccess = currentUser.getRole() == Role.ADMIN
                || currentUser.getRole() == Role.TECHNICIAN
                || ticket.getCreatedById().equals(currentUser.getId())
                || (ticket.getAssignedToId() != null
                    && ticket.getAssignedToId().equals(currentUser.getId()));
        if (!canAccess) {
            throw new RuntimeException("Not authorized to view this attachment");
        }

        TicketAttachment attachment = ticket.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId)).findFirst()
                .orElseThrow(() -> new RuntimeException("Attachment not found: " + attachmentId));

        Path filePath = Paths.get(attachment.getFilePath());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("Attachment file not found on server");
        }

        return new AttachmentFile(filePath, attachment.getFileType(), attachment.getFileName());
    }

    // ── DELETE ATTACHMENT ──────────────────────────────────────
    public TicketResponse deleteAttachment(String ticketId, String attachmentId,
                                            User currentUser) throws IOException {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketAttachment attachment = ticket.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId)).findFirst()
                .orElseThrow(() -> new RuntimeException("Attachment not found: " + attachmentId));
        if (!attachment.getUploadedById().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized to delete this attachment");
        }
        Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        ticket.getAttachments().remove(attachment);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }
}