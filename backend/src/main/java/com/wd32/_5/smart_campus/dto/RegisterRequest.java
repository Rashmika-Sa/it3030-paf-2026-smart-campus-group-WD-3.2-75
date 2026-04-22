package com.wd32._5.smart_campus.dto;

public class RegisterRequest {
    private String fullName;
    private String sliitId;
    private String email;
    private String password;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getSliitId() {
        return sliitId;
    }

    public void setSliitId(String sliitId) {
        this.sliitId = sliitId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}