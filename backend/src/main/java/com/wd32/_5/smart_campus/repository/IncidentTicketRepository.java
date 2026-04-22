package com.wd32._5.smart_campus.repository;

import com.wd32._5.smart_campus.entity.IncidentTicket;
import com.wd32._5.smart_campus.entity.TicketStatus;
import com.wd32._5.smart_campus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTicketRepository extends JpaRepository<IncidentTicket, Long> {

    // Get all tickets created by a specific user
    List<IncidentTicket> findByCreatedBy(User user);

    // Get all tickets assigned to a specific technician
    List<IncidentTicket> findByAssignedTo(User user);

    // Get all tickets by status (Admin use)
    List<IncidentTicket> findByStatus(TicketStatus status);

    // Get tickets by user and status
    List<IncidentTicket> findByCreatedByAndStatus(User user, TicketStatus status);
}