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

    private final IncidentTicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public IncidentTicketService(IncidentTicketRepository ticketRepository,
                                  UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

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

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    public List<TicketResponse> getMyTickets(User currentUser) {
        return ticketRepository.findByCreatedById(currentUser.getId())
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    public List<TicketResponse> getAssignedTickets(User currentUser) {
        return ticketRepository.findByAssignedToId(currentUser.getId())
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    public TicketResponse getTicketById(String id) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
        return TicketResponse.from(ticket);
    }

    public List<TicketResponse> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatus(status)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByCategory(TicketCategory category) {
        return ticketRepository.findByCategory(category)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByPriority(TicketPriority priority) {
        return ticketRepository.findByPriority(priority)
                .stream().map(TicketResponse::from).collect(Collectors.toList());
    }

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

    public TicketResponse addTechnicianUpdate(String ticketId,
                                               TechnicianUpdateRequest request,
                                               User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        if (!currentUser.getId().equals(ticket.getAssignedToId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized: only assigned technician can update");
        }
        ticket.setStatus(request.getStatus());
        if (request.getResolutionNotes() != null) {
            ticket.setResolutionNotes(request.getResolutionNotes());
        }
        TechnicianUpdate update = new TechnicianUpdate();
        update.setTechnicianId(currentUser.getId());
        update.setTechnicianName(currentUser.getName());
        update.setStatusChanged(request.getStatus());
        update.setUpdateNote(request.getUpdateNote());
        update.setUpdatedAt(LocalDateTime.now());
        ticket.getTechnicianUpdates().add(update);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    public TicketResponse assignTechnician(String ticketId, String technicianId) {
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

    public void deleteTicket(String id, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + id));
        if (!ticket.getCreatedById().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized to delete this ticket");
        }
        ticketRepository.delete(ticket);
    }

    public TicketResponse addComment(String ticketId, CommentRequest request, User currentUser) {
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

    public TicketResponse editComment(String ticketId, String commentId,
                                       CommentRequest request, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        if (!comment.getAuthorId().equals(currentUser.getId())) {
            throw new RuntimeException("Not authorized: you can only edit your own comments");
        }
        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    public TicketResponse deleteComment(String ticketId, String commentId, User currentUser) {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
        if (!comment.getAuthorId().equals(currentUser.getId())
                && currentUser.getRole() != Role.ADMIN) {
            throw new RuntimeException("Not authorized to delete this comment");
        }
        ticket.getComments().remove(comment);
        ticket.setUpdatedAt(LocalDateTime.now());
        return TicketResponse.from(ticketRepository.save(ticket));
    }

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

    public TicketResponse deleteAttachment(String ticketId, String attachmentId,
                                            User currentUser) throws IOException {
        IncidentTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        TicketAttachment attachment = ticket.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
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