package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.ResourceRequest;
import com.wd32._5.smart_campus.entity.Resource;
import com.wd32._5.smart_campus.entity.ResourceStatus;
import com.wd32._5.smart_campus.entity.ResourceType;
import com.wd32._5.smart_campus.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<Resource> getAll(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        return resourceService.getAll(type, status, minCapacity, location);
    }

    @GetMapping("/{id}")
    public Resource getById(@PathVariable String id) {
        return resourceService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Resource> create(@RequestBody ResourceRequest req) {
        requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.create(req));
    }

    @PutMapping("/{id}")
    public Resource update(@PathVariable String id, @RequestBody ResourceRequest req) {
        requireAdmin();
        return resourceService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        requireAdmin();
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
