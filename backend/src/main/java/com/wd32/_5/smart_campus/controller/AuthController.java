package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.AuthResponse;
import com.wd32._5.smart_campus.dto.GoogleAuthRequest;
import com.wd32._5.smart_campus.dto.LoginRequest;
import com.wd32._5.smart_campus.dto.RegisterRequest;
import com.wd32._5.smart_campus.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse google(@RequestBody GoogleAuthRequest request) {
        return authService.googleLogin(request);
    }
}