package com.wd32._5.smart_campus.repository;

import com.wd32._5.smart_campus.entity.Resource;
import com.wd32._5.smart_campus.entity.ResourceStatus;
import com.wd32._5.smart_campus.entity.ResourceType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {

    List<Resource> findByType(ResourceType type);

    List<Resource> findByStatus(ResourceStatus status);

    List<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status);

    List<Resource> findByCapacityGreaterThanEqual(int minCapacity);

    @Query("{ $and: [ " +
           "  { $or: [ { 'type': ?0 }, { ?0: null } ] }, " +
           "  { $or: [ { 'status': ?1 }, { ?1: null } ] }, " +
           "  { $or: [ { 'capacity': { $gte: ?2 } }, { ?2: 0 } ] }, " +
           "  { $or: [ { 'location': { $regex: ?3, $options: 'i' } }, { ?3: '' } ] } " +
           "] }")
    List<Resource> findWithFilters(ResourceType type, ResourceStatus status, int minCapacity, String location);
}
