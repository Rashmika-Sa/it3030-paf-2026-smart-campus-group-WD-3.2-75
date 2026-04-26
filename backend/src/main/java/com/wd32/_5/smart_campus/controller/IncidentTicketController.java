package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.*;
import com.wd32._5.smart_campus.entity.*;
import com.wd32._5.smart_campus.repository.UserRepository;
import com.wd32._5.smart_campus.service.IncidentTicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class IncidentTicketController {

    private final IncidentTicketService ticketService;
    private final UserRepository userRepository;

    public IncidentTicketController(IncidentTicketService ticketService,
                                     UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(OAuth2User principal) {
        String email = principal.getAttribute("email");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // POST /api/tickets
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, getCurrentUser(principal)));
    }

    // GET /api/tickets
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @AuthenticationPrincipal OAuth2User principal) {

        User currentUser = getCurrentUser(principal);

        // Filter by status
        if (status != null) {
            return ResponseEntity.ok(
                ticketService.getTicketsByStatus(TicketStatus.valueOf(status.toUpperCase())));
        }

        // Filter by category
        if (category != null) {
            return ResponseEntity.ok(
                ticketService.getTicketsByCategory(TicketCategory.valueOf(category.toUpperCase())));
        }

        // Filter by priority
        if (priority != null) {
            return ResponseEntity.ok(
                ticketService.getTicketsByPriority(TicketPriority.valueOf(priority.toUpperCase())));
        }

        // Default: admin gets all, user gets own
        List<TicketResponse> tickets = currentUser.getRole().name().equals("ADMIN")
                ? ticketService.getAllTickets()
                : ticketService.getMyTickets(currentUser);
        return ResponseEntity.ok(tickets);
    }

    // GET /api/tickets/assigned
    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(
                ticketService.getAssignedTickets(getCurrentUser(principal)));
    }

    // GET /api/tickets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    // PUT /api/tickets/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(
                ticketService.updateTicketStatus(id, request, getCurrentUser(principal)));
    }

    // PUT /api/tickets/{id}/technician-update
    @PutMapping("/{id}/technician-update")
    public ResponseEntity<TicketResponse> technicianUpdate(
            @PathVariable String id,
            @Valid @RequestBody TechnicianUpdateRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(
                ticketService.addTechnicianUpdate(id, request, getCurrentUser(principal)));
    }

    // PUT /api/tickets/{id}/assign/{technicianId}
    @PutMapping("/{id}/assign/{technicianId}")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable String id,
            @PathVariable String technicianId) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }

    // DELETE /api/tickets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal) {
        ticketService.deleteTicket(id, getCurrentUser(principal));
        return ResponseEntity.noContent().build();
    }

    // POST /api/tickets/{id}/comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, getCurrentUser(principal)));
    }

    // PUT /api/tickets/{ticketId}/comments/{commentId}
    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(
                ticketService.editComment(ticketId, commentId, request, getCurrentUser(principal)));
    }

    // DELETE /api/tickets/{ticketId}/comments/{commentId}
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(
                ticketService.deleteComment(ticketId, commentId, getCurrentUser(principal)));
    }

    // POST /api/tickets/{id}/attachments
    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketResponse> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.uploadAttachment(id, file, getCurrentUser(principal)));
    }

    // DELETE /api/tickets/{ticketId}/attachments/{attachmentId}
    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<TicketResponse> deleteAttachment(
            @PathVariable String ticketId,
            @PathVariable String attachmentId,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        return ResponseEntity.ok(
                ticketService.deleteAttachment(ticketId, attachmentId, getCurrentUser(principal)));
    }
}