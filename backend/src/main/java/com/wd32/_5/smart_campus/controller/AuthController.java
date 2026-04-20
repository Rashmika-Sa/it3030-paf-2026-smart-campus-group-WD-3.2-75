package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.AuthResponse;
import com.wd32._5.smart_campus.dto.GoogleAuthRequest;
import com.wd32._5.smart_campus.dto.LoginRequest;
import com.wd32._5.smart_campus.dto.OtpVerifyRequest;
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

    @PostMapping("/register/request-otp")
    public AuthResponse requestRegisterOtp(@RequestBody RegisterRequest request) {
        return authService.requestRegisterOtp(request);
    }

    @PostMapping("/login/request-otp")
    public AuthResponse requestLoginOtp(@RequestBody LoginRequest request) {
        return authService.requestLoginOtp(request);
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@RequestBody OtpVerifyRequest request) {
        return authService.verifyOtp(request);
    }

    @PostMapping("/google")
    public AuthResponse google(@RequestBody GoogleAuthRequest request) {
        return authService.googleLogin(request);
    }
}