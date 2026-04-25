package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.dto.ResourceRequest;
import com.wd32._5.smart_campus.entity.Resource;
import com.wd32._5.smart_campus.entity.ResourceStatus;
import com.wd32._5.smart_campus.entity.ResourceType;
import com.wd32._5.smart_campus.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAll(ResourceType type, ResourceStatus status, Integer minCapacity, String location) {
        boolean hasType = type != null;
        boolean hasStatus = status != null;
        boolean hasCapacity = minCapacity != null && minCapacity > 0;
        boolean hasLocation = location != null && !location.isBlank();

        if (!hasType && !hasStatus && !hasCapacity && !hasLocation) {
            return resourceRepository.findAll();
        }

        return resourceRepository.findAll().stream()
            .filter(r -> !hasType || r.getType() == type)
            .filter(r -> !hasStatus || r.getStatus() == status)
            .filter(r -> !hasCapacity || r.getCapacity() >= minCapacity)
            .filter(r -> !hasLocation || (r.getLocation() != null &&
                r.getLocation().toLowerCase().contains(location.toLowerCase())))
            .toList();
    }

    public Resource getById(String id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    public Resource create(ResourceRequest req) {
        Resource resource = new Resource();
        mapRequest(req, resource);
        return resourceRepository.save(resource);
    }

    public Resource update(String id, ResourceRequest req) {
        Resource resource = getById(id);
        mapRequest(req, resource);
        return resourceRepository.save(resource);
    }

    public void delete(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        resourceRepository.deleteById(id);
    }

    private void mapRequest(ResourceRequest req, Resource resource) {
        resource.setName(req.getName());
        resource.setType(req.getType());
        resource.setCapacity(req.getCapacity());
        resource.setLocation(req.getLocation());
        resource.setDescription(req.getDescription());
        resource.setImageUrl(req.getImageUrl());
        resource.setStatus(req.getStatus() != null ? req.getStatus() : ResourceStatus.ACTIVE);
        resource.setAvailabilityWindows(req.getAvailabilityWindows());
    }
}
