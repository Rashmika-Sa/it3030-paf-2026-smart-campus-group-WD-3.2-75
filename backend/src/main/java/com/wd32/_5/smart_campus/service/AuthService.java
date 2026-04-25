package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.dto.AuthResponse;
import com.wd32._5.smart_campus.dto.GoogleAuthRequest;
import com.wd32._5.smart_campus.dto.LoginRequest;
import com.wd32._5.smart_campus.dto.OtpVerifyRequest;
import com.wd32._5.smart_campus.dto.RegisterRequest;
import com.wd32._5.smart_campus.entity.Role;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern SLIIT_EMAIL_PATTERN =
            Pattern.compile("^(IT|BM|EN)\\d+@my\\.sliit\\.lk$", Pattern.CASE_INSENSITIVE);

    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate = new RestTemplate();

    private final ConcurrentHashMap<String, String> activeTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, OtpRecord> otpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    public AuthResponse requestRegisterOtp(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (!isValidSliitEmail(normalizedEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email must be IT/BM/EN + numbers and end with @my.sliit.lk"
            );
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
        }

        String normalizedSliitId = normalizeText(request.getSliitId());
        if (normalizedSliitId != null && userRepository.findBySliitId(normalizedSliitId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SLIIT ID already exists");
        }

        pendingRegistrations.put(normalizedEmail, new PendingRegistration(
                normalizeText(request.getFullName()),
                normalizedSliitId,
                request.getPassword()
        ));

        issueOtp(normalizedEmail, OtpPurpose.REGISTER);
        return new AuthResponse(null, "OTP sent to your email");
    }

    public AuthResponse requestLoginOtp(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (!isValidSliitEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email format");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        issueOtp(normalizedEmail, OtpPurpose.LOGIN);
        return new AuthResponse(null, "OTP sent to your email");
    }

    public AuthResponse verifyOtp(OtpVerifyRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String otp = normalizeText(request.getOtp());

        if (normalizedEmail == null || otp == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and OTP are required");
        }

        OtpRecord record = otpStore.get(normalizedEmail);
        if (record == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP request found");
        }

        if (Instant.now().isAfter(record.expiresAt())) {
            otpStore.remove(normalizedEmail);
            pendingRegistrations.remove(normalizedEmail);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired");
        }

        if (!record.otp().equals(otp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }

        otpStore.remove(normalizedEmail);

        if (record.purpose() == OtpPurpose.REGISTER) {
            PendingRegistration pending = pendingRegistrations.remove(normalizedEmail);
            if (pending == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending registration found");
            }

            User user = new User();
            user.setName(pending.fullName());
            user.setEmail(normalizedEmail);
            user.setSliitId(pending.sliitId());
            user.setPassword(passwordEncoder.encode(pending.rawPassword()));
            user.setProvider("local");
            user.setProviderId(null);
            user.setRole(Role.USER);
            userRepository.save(user);

            String token = createToken(user.getEmail());
            return new AuthResponse(token, "Registration successful");
        }

        // LOGIN flow
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        String token = createToken(user.getEmail());
        return new AuthResponse(token, "Login successful");
    }

    public AuthResponse googleLogin(GoogleAuthRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google token is required");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(request.getToken());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response;
        try {
            response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }

        Map<?, ?> profile = response.getBody();
        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Failed to fetch Google profile");
        }

        String email = normalizeEmail(asString(profile.get("email")));
        String name = normalizeText(asString(profile.get("name")));
        String sub = normalizeText(asString(profile.get("sub")));
        Object emailVerifiedObj = profile.get("email_verified");
        boolean emailVerified = emailVerifiedObj != null && Boolean.parseBoolean(emailVerifiedObj.toString());

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google profile does not contain email");
        }

        if (!emailVerified) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        if (!isValidSliitEmail(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only SLIIT email addresses are allowed");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName((name == null || name.isBlank()) ? "Google User" : name);
            newUser.setProvider("google");
            newUser.setProviderId(sub);
            newUser.setRole(Role.USER);
            return newUser;
        });

        if (user.getProvider() == null) user.setProvider("google");
        if (user.getProviderId() == null) user.setProviderId(sub);

        userRepository.save(user);

        String token = createToken(user.getEmail());
        return new AuthResponse(token, "Google login successful");
    }

    public Map<String, Object> getCurrentUserByToken(String token) {
        String normalizedToken = normalizeText(token);
        if (normalizedToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization token is required");
        }

        String email = activeTokens.get(normalizedToken);
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("sliitId", user.getSliitId());
        response.put("provider", user.getProvider());
        response.put("role", user.getRole() != null ? user.getRole().name() : null);
        return response;
    }

    private void issueOtp(String email, OtpPurpose purpose) {
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        otpStore.put(email, new OtpRecord(otp, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS), purpose));
        sendOtpEmail(email, otp);
    }

    private void sendOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SLIIT-HUB OTP Verification");
            message.setText("Your OTP is: " + otp + "\nThis OTP expires in 5 minutes.");
            mailSender.send(message);
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to send OTP email. Check MAIL_USERNAME and MAIL_PASSWORD in backend/.env"
            );
        }
    }

    private boolean isValidSliitEmail(String email) {
        return email != null && SLIIT_EMAIL_PATTERN.matcher(email).matches();
    }

    private String createToken(String email) {
        String token = UUID.randomUUID().toString();
        activeTokens.put(token, email);
        return token;
    }

    private String normalizeEmail(String value) {
        if (value == null) return null;
        return value.trim().toLowerCase();
    }

    private String normalizeText(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    public String getEmailByToken(String token) {
        return activeTokens.get(token);
    }

    private record OtpRecord(String otp, Instant expiresAt, OtpPurpose purpose) {}
    private record PendingRegistration(String fullName, String sliitId, String rawPassword) {}
    private enum OtpPurpose { REGISTER, LOGIN }
}