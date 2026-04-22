package com.wd32._5.smart_campus.dto;

import com.wd32._5.smart_campus.entity.TicketCategory;
import com.wd32._5.smart_campus.entity.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TicketRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    private String preferredContactName;
    private String preferredContactPhone;
    private String preferredContactEmail;

    // --- Getters and Setters ---

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public TicketCategory getCategory() { return category; }
    public void setCategory(TicketCategory category) { this.category = category; }

    public TicketPriority getPriority() { return priority; }
    public void setPriority(TicketPriority priority) { this.priority = priority; }

    public String getPreferredContactName() { return preferredContactName; }
    public void setPreferredContactName(String preferredContactName) { this.preferredContactName = preferredContactName; }

    public String getPreferredContactPhone() { return preferredContactPhone; }
    public void setPreferredContactPhone(String preferredContactPhone) { this.preferredContactPhone = preferredContactPhone; }

    public String getPreferredContactEmail() { return preferredContactEmail; }
    public void setPreferredContactEmail(String preferredContactEmail) { this.preferredContactEmail = preferredContactEmail; }
}