package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.dto.*;
import com.wd32._5.smart_campus.entity.*;
import com.wd32._5.smart_campus.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentTicketService {

    private final IncidentTicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public IncidentTicketService(IncidentTicketRepository ticketRepository,
                                  TicketCommentRepository commentRepository,
                                  TicketAttachmentRepository attachmentRepository,
                                  UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
    }

    // ── CREATE TICKET ──────────────────────────────────────────
    public TicketResponse createTicket(TicketRequest request, User currentUser) {
        IncidentTicket ticket = new IncidentTicket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(request.getPriority());
        ticket.setPreferredContactName(request.getPreferredContactName());
        ticket.setPreferredContactPhone(request.getPreferredContactPhone());
        ticket.setPreferredContactEmail(request.getPreferredContactEmail());
        ticket.setCreatedBy(currentUser);
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── GET ALL TICKETS (Admin) ────────────────────────────────
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET MY TICKETS (User) ──────────────────────────────────
    public List<TicketResponse> getMyTickets(User currentUser) {
        return ticketRepository.findByCreatedBy(currentUser)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET TICKETS ASSIGNED TO ME (Technician) ────────────────
    public List<TicketResponse> getAssignedTickets(User currentUser) {
        return ticketRepository.findByAssignedTo(currentUser)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    // ── GET TICKET BY ID ───────────────────────────────────────
    public TicketResponse getTicketById(Long id) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
        return TicketResponse.from(ticket);
    }

    // ── UPDATE TICKET STATUS ───────────────────────────────────
    public TicketResponse updateTicketStatus(Long id, TicketStatusUpdateRequest request, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));

        ticket.setStatus(request.getStatus());

        if (request.getResolutionNotes() != null) {
            ticket.setResolutionNotes(request.getResolutionNotes());
        }
        if (request.getRejectionReason() != null) {
            ticket.setRejectionReason(request.getRejectionReason());
        }

        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── ASSIGN TECHNICIAN ──────────────────────────────────────
    public TicketResponse assignTechnician(Long ticketId, Long technicianId) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + technicianId));

        ticket.setAssignedTo(technician);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── DELETE TICKET ──────────────────────────────────────────
    public void deleteTicket(Long id, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));

        // Only creator or admin can delete
        if (!ticket.getCreatedBy().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("You are not authorized to delete this ticket");
        }

        ticketRepository.delete(ticket);
    }

    // ── ADD COMMENT ────────────────────────────────────────────
    public TicketResponse addComment(Long ticketId, CommentRequest request, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        TicketComment comment = new TicketComment();
        comment.setContent(request.getContent());
        comment.setTicket(ticket);
        comment.setAuthor(currentUser);
        commentRepository.save(comment);

        // reload ticket to include new comment
        return TicketResponse.from(ticketRepository.findById(ticketId).get());
    }

    // ── EDIT COMMENT ───────────────────────────────────────────
    public TicketResponse editComment(Long ticketId, Long commentId,
                                       CommentRequest request, User currentUser) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        commentRepository.save(comment);
        return TicketResponse.from(ticketRepository.findById(ticketId).get());
    }

    // ── DELETE COMMENT ─────────────────────────────────────────
    public TicketResponse deleteComment(Long ticketId, Long commentId, User currentUser) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthor().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        commentRepository.delete(comment);
        return TicketResponse.from(ticketRepository.findById(ticketId).get());
    }

    // ── UPLOAD ATTACHMENT ──────────────────────────────────────
    public TicketResponse uploadAttachment(Long ticketId, MultipartFile file, User currentUser)
            throws IOException {

        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));

        // Max 3 attachments
        long existingCount = attachmentRepository.countByTicketId(ticketId);
        if (existingCount >= 3) {
            throw new RuntimeException("Maximum 3 attachments allowed per ticket");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        // Save file to disk
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Save attachment record
        TicketAttachment attachment = new TicketAttachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFilePath(filePath.toString());
        attachment.setFileType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setTicket(ticket);
        attachment.setUploadedBy(currentUser);
        attachmentRepository.save(attachment);

        return TicketResponse.from(ticketRepository.findById(ticketId).get());
    }

    // ── DELETE ATTACHMENT ──────────────────────────────────────
    public TicketResponse deleteAttachment(Long ticketId, Long attachmentId, User currentUser)
            throws IOException {

        TicketAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        if (!attachment.getUploadedBy().getId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized to delete this attachment");
        }

        // Delete file from disk
        Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        attachmentRepository.delete(attachment);

        return TicketResponse.from(ticketRepository.findById(ticketId).get());
    }
}