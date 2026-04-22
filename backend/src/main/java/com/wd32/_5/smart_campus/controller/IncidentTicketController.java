package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.*;
import com.wd32._5.smart_campus.entity.User;
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

    // Helper to get current User entity from OAuth2 principal
    private User getCurrentUser(OAuth2User principal) {
        String email = principal.getAttribute("email");
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── POST /api/tickets ──────────────────────────────────────
    // Create a new incident ticket
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        TicketResponse response = ticketService.createTicket(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── GET /api/tickets ───────────────────────────────────────
    // Admin: get all tickets | User: get their own tickets
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);

        List<TicketResponse> tickets;
        if (currentUser.getRole().name().equals("ADMIN")) {
            tickets = ticketService.getAllTickets();
        } else {
            tickets = ticketService.getMyTickets(currentUser);
        }
        return ResponseEntity.ok(tickets);
    }

    // ── GET /api/tickets/assigned ──────────────────────────────
    // Get tickets assigned to current technician/user
    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.ok(ticketService.getAssignedTickets(currentUser));
    }

    // ── GET /api/tickets/{id} ──────────────────────────────────
    // Get single ticket by ID
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    // ── PUT /api/tickets/{id}/status ───────────────────────────
    // Update ticket status (Admin/Technician)
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, request, currentUser));
    }

    // ── PUT /api/tickets/{id}/assign/{technicianId} ────────────
    // Assign a technician to a ticket (Admin only)
    @PutMapping("/{id}/assign/{technicianId}")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable Long id,
            @PathVariable Long technicianId) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }

    // ── DELETE /api/tickets/{id} ───────────────────────────────
    // Delete a ticket
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        ticketService.deleteTicket(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ── POST /api/tickets/{id}/comments ───────────────────────
    // Add a comment to a ticket
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, currentUser));
    }

    // ── PUT /api/tickets/{ticketId}/comments/{commentId} ──────
    // Edit a comment (owner only)
    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> editComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.ok(ticketService.editComment(ticketId, commentId, request, currentUser));
    }

    // ── DELETE /api/tickets/{ticketId}/comments/{commentId} ───
    // Delete a comment (owner or admin)
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal OAuth2User principal) {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.ok(ticketService.deleteComment(ticketId, commentId, currentUser));
    }

    // ── POST /api/tickets/{id}/attachments ─────────────────────
    // Upload image attachment (max 3)
    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketResponse> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.uploadAttachment(id, file, currentUser));
    }

    // ── DELETE /api/tickets/{ticketId}/attachments/{attachmentId}
    // Delete an attachment
    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<TicketResponse> deleteAttachment(
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal OAuth2User principal) throws IOException {
        User currentUser = getCurrentUser(principal);
        return ResponseEntity.ok(ticketService.deleteAttachment(ticketId, attachmentId, currentUser));
    }
}