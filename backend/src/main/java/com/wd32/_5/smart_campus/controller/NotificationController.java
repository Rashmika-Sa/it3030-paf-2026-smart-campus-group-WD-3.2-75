package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.entity.Notification;
import com.wd32._5.smart_campus.entity.Role;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> getMyNotifications(@AuthenticationPrincipal User user) {
        return notificationService.getForUser(user.getId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal User user) {
        return Map.of("count", notificationService.getUnreadCount(user.getId()));
    }

    @GetMapping("/admin/all")
    public List<Notification> getAllNotifications(@AuthenticationPrincipal User user) {
        requireAdmin(user);
        return notificationService.getAllNotifications();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id,
                                           @AuthenticationPrincipal User user) {
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id,
                                                   @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }

    private void requireAdmin(User user) {
        if (user == null || user.getRole() != Role.ADMIN) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
