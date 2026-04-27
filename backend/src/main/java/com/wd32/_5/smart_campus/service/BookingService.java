package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.dto.BookingRequest;
import com.wd32._5.smart_campus.entity.Booking;
import com.wd32._5.smart_campus.entity.BookingStatus;
import com.wd32._5.smart_campus.entity.Resource;
import com.wd32._5.smart_campus.entity.ResourceStatus;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.repository.BookingRepository;
import com.wd32._5.smart_campus.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final WhatsAppNotificationService whatsAppNotificationService;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository,
                          WhatsAppNotificationService whatsAppNotificationService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.whatsAppNotificationService = whatsAppNotificationService;
    }

    public Booking create(BookingRequest req, User currentUser) {
        if (req.getResourceId() == null || req.getDate() == null || req.getTimeSlot() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resourceId, date, and timeSlot are required");
        }

        Resource resource = resourceRepository.findById(req.getResourceId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource is not available for booking");
        }

        List<Booking> conflicts = bookingRepository.findByResourceIdAndDateAndTimeSlotAndStatusIn(
            req.getResourceId(), req.getDate(), req.getTimeSlot(),
            List.of(BookingStatus.PENDING, BookingStatus.APPROVED));
        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This time slot is already booked for the selected resource");
        }

        Booking booking = new Booking();
        booking.setResourceId(req.getResourceId());
        booking.setResourceName(resource.getName());
        booking.setUserId(currentUser.getId());
        booking.setUserName(currentUser.getName() != null ? currentUser.getName() : currentUser.getEmail());
        booking.setDate(req.getDate());
        booking.setTimeSlot(req.getTimeSlot());
        booking.setPurpose(req.getPurpose());
        booking.setAttendees(req.getAttendees());
        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        Booking saved = bookingRepository.save(booking);
        whatsAppNotificationService.sendBookingCreated(resource.getName(), req.getDate(), req.getTimeSlot());
        return saved;
    }

    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getAll(BookingStatus status) {
        if (status != null) {
            return bookingRepository.findByStatus(status);
        }
        return bookingRepository.findAll();
    }

    public Booking approve(String id) {
        Booking booking = getById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING bookings can be approved");
        }
        booking.setStatus(BookingStatus.APPROVED);
        return bookingRepository.save(booking);
    }

    public Booking reject(String id, String reason) {
        Booking booking = getById(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminNote(reason);
        return bookingRepository.save(booking);
    }

    public Booking cancel(String id, User currentUser) {
        Booking booking = getById(id);
        boolean isOwner = booking.getUserId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole().name().equals("ADMIN");
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own bookings");
        }
        if (booking.getStatus() != BookingStatus.APPROVED && booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only APPROVED or PENDING bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    private Booking getById(String id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }
}
