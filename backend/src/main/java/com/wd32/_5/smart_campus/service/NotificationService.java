package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.entity.Notification;
import com.wd32._5.smart_campus.entity.NotificationType;
import com.wd32._5.smart_campus.entity.Role;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.repository.NotificationRepository;
import com.wd32._5.smart_campus.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void notifyUser(String recipientId, String message, NotificationType type, String relatedId) {
        Notification n = new Notification();
        n.setRecipientId(recipientId);
        n.setMessage(message);
        n.setType(type);
        n.setRelatedId(relatedId);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    public void notifyAllAdmins(String message, NotificationType type, String relatedId) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notifyUser(admin.getId(), message, type, relatedId);
        }
    }

    public List<Notification> getForUser(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markAsRead(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getRecipientId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    public void deleteNotification(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getRecipientId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized");
        }
        notificationRepository.delete(n);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        unread.stream().filter(n -> !n.isRead()).forEach(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}
