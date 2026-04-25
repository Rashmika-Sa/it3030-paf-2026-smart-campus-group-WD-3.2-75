package com.wd32._5.smart_campus.dto;

import com.wd32._5.smart_campus.entity.Role;

public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String sliitId;
    private Role role;

    public UserResponse(String id, String name, String email, String sliitId, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.sliitId = sliitId;
        this.role = role;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getSliitId() { return sliitId; }
    public Role getRole() { return role; }
}
