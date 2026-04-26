package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.*;
import com.wd32._5.smart_campus.entity.*;
import com.wd32._5.smart_campus.service.IncidentTicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class IncidentTicketController {

    private final IncidentTicketService ticketService;

    public IncidentTicketController(IncidentTicketService ticketService) {
        this.ticketService = ticketService;
    }

    // Helper to get User from Spring Security context
    private User getUser(Object principal) {
        if (principal instanceof User) {
            return (User) principal;
        }
        throw new RuntimeException("Not authenticated");
    }

    // POST /api/tickets — Create ticket
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, getUser(principal)));
    }

    // GET /api/tickets — Get tickets with optional filters
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @AuthenticationPrincipal Object principal) {

        User currentUser = getUser(principal);

        if (status != null) {
            return ResponseEntity.ok(ticketService.getTicketsByStatus(
                    TicketStatus.valueOf(status.toUpperCase())));
        }
        if (category != null) {
            return ResponseEntity.ok(ticketService.getTicketsByCategory(
                    TicketCategory.valueOf(category.toUpperCase())));
        }
        if (priority != null) {
            return ResponseEntity.ok(ticketService.getTicketsByPriority(
                    TicketPriority.valueOf(priority.toUpperCase())));
        }

        List<TicketResponse> tickets = currentUser.getRole() == Role.ADMIN
                ? ticketService.getAllTickets()
                : ticketService.getMyTickets(currentUser);
        return ResponseEntity.ok(tickets);
    }

    // GET /api/tickets/assigned — Tickets assigned to me (Technician)
    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(ticketService.getAssignedTickets(getUser(principal)));
    }

    // GET /api/tickets/review — Tickets visible to technicians for review/reply
    @GetMapping("/review")
    public ResponseEntity<List<TicketResponse>> getTechnicianReviewTickets(
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(ticketService.getTechnicianReviewTickets(getUser(principal)));
    }

    // GET /api/tickets/{id} — Get single ticket
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    // PUT /api/tickets/{id}/status — Update status (Admin)
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(
                ticketService.updateTicketStatus(id, request, getUser(principal)));
    }

    // PUT /api/tickets/{id}/assign/{technicianId} — Assign technician (Admin)
    @PutMapping("/{id}/assign/{technicianId}")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable String id,
            @PathVariable String technicianId,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(
                ticketService.assignTechnician(id, technicianId, getUser(principal)));
    }

    // PUT /api/tickets/{id}/technician-update — Technician progress update
    @PutMapping("/{id}/technician-update")
    public ResponseEntity<TicketResponse> technicianUpdate(
            @PathVariable String id,
            @Valid @RequestBody TechnicianUpdateRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(
                ticketService.addTechnicianUpdate(id, request, getUser(principal)));
    }

    // PUT /api/tickets/{id}/mark-reviewed — Technician mark incident as reviewed
    @PutMapping("/{id}/mark-reviewed")
    public ResponseEntity<TicketResponse> markReviewed(
            @PathVariable String id,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(ticketService.markReviewed(id, getUser(principal)));
    }

    // DELETE /api/tickets/{id} — Delete ticket
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String id,
            @AuthenticationPrincipal Object principal) {
        ticketService.deleteTicket(id, getUser(principal));
        return ResponseEntity.noContent().build();
    }

    // POST /api/tickets/{id}/comments — Add comment
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.addComment(id, request, getUser(principal)));
    }

    // PUT /api/tickets/{ticketId}/comments/{commentId} — Edit comment
    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(
                ticketService.editComment(ticketId, commentId, request, getUser(principal)));
    }

    // DELETE /api/tickets/{ticketId}/comments/{commentId} — Delete comment
    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<TicketResponse> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(
                ticketService.deleteComment(ticketId, commentId, getUser(principal)));
    }

    // POST /api/tickets/{id}/attachments — Upload image
    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketResponse> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Object principal) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.uploadAttachment(id, file, getUser(principal)));
    }

    // DELETE /api/tickets/{ticketId}/attachments/{attachmentId} — Delete attachment
    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<TicketResponse> deleteAttachment(
            @PathVariable String ticketId,
            @PathVariable String attachmentId,
            @AuthenticationPrincipal Object principal) throws IOException {
        return ResponseEntity.ok(
                ticketService.deleteAttachment(ticketId, attachmentId, getUser(principal)));
    }
}