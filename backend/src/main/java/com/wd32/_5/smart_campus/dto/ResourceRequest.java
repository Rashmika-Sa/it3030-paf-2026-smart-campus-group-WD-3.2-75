package com.wd32._5.smart_campus.dto;

import com.wd32._5.smart_campus.entity.ResourceStatus;
import com.wd32._5.smart_campus.entity.ResourceType;

import java.util.List;

public class ResourceRequest {
    private String name;
    private ResourceType type;
    private int capacity;
    private String location;
    private String description;
    private String imageUrl;
    private ResourceStatus status;
    private List<String> availabilityWindows;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }

    public List<String> getAvailabilityWindows() { return availabilityWindows; }
    public void setAvailabilityWindows(List<String> availabilityWindows) { this.availabilityWindows = availabilityWindows; }
}
