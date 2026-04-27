package com.wd32._5.smart_campus.repository;

import com.wd32._5.smart_campus.entity.Booking;
import com.wd32._5.smart_campus.entity.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserId(String userId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByResourceIdAndDateAndTimeSlotAndStatusIn(
        String resourceId, String date, String timeSlot, List<BookingStatus> statuses);
}
