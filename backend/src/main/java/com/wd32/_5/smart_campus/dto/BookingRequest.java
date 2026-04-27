package com.wd32._5.smart_campus.dto;

public class BookingRequest {

    private String resourceId;
    private String date;
    private String timeSlot;
    private String purpose;
    private int attendees;

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public int getAttendees() { return attendees; }
    public void setAttendees(int attendees) { this.attendees = attendees; }
}
