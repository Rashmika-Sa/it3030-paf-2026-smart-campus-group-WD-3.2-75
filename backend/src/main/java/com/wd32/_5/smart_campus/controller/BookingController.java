package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.BookingRequest;
import com.wd32._5.smart_campus.entity.Booking;
import com.wd32._5.smart_campus.entity.BookingStatus;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> create(@RequestBody BookingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(req, currentUser()));
    }

    @GetMapping("/my")
    public List<Booking> getMyBookings() {
        return bookingService.getMyBookings(currentUser().getId());
    }

    @GetMapping
    public List<Booking> getAll(@RequestParam(required = false) BookingStatus status) {
        requireAdmin();
        return bookingService.getAll(status);
    }

    @PutMapping("/{id}/approve")
    public Booking approve(@PathVariable String id) {
        requireAdmin();
        return bookingService.approve(id);
    }

    @PutMapping("/{id}/reject")
    public Booking reject(@PathVariable String id, @RequestBody Map<String, String> body) {
        requireAdmin();
        return bookingService.reject(id, body.getOrDefault("reason", ""));
    }

    @PutMapping("/{id}/cancel")
    public Booking cancel(@PathVariable String id) {
        return bookingService.cancel(id, currentUser());
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return (User) auth.getPrincipal();
    }

    private void requireAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
