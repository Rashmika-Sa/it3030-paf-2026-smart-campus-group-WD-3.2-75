package com.wd32._5.smart_campus.dto;

import jakarta.validation.constraints.NotBlank;

public class CommentRequest {

    @NotBlank(message = "Comment content is required")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}