package com.wd32._5.smart_campus.repository;

import com.wd32._5.smart_campus.entity.IncidentTicket;
import com.wd32._5.smart_campus.entity.TicketCategory;
import com.wd32._5.smart_campus.entity.TicketPriority;
import com.wd32._5.smart_campus.entity.TicketStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncidentTicketRepository extends MongoRepository<IncidentTicket, String> {
    List<IncidentTicket> findByCreatedById(String userId);
    List<IncidentTicket> findByAssignedToId(String userId);
    List<IncidentTicket> findByStatus(TicketStatus status);
    List<IncidentTicket> findByCategory(TicketCategory category);
    List<IncidentTicket> findByPriority(TicketPriority priority);
    List<IncidentTicket> findByStatusAndCreatedById(TicketStatus status, String userId);
    List<IncidentTicket> findByResourceId(String resourceId);
}