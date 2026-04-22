package com.wd32._5.smart_campus.service;

import com.wd32._5.smart_campus.dto.AuthResponse;
import com.wd32._5.smart_campus.dto.GoogleAuthRequest;
import com.wd32._5.smart_campus.dto.LoginRequest;
import com.wd32._5.smart_campus.dto.RegisterRequest;
import com.wd32._5.smart_campus.entity.Role;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.repository.UserRepository;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern SLIIT_EMAIL_PATTERN =
            Pattern.compile("^(IT|BM|EN)\\d+@my\\.sliit\\.lk$", Pattern.CASE_INSENSITIVE);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    // Simple in-memory token store for now
    private final ConcurrentHashMap<String, String> activeTokens = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (!isValidSliitEmail(normalizedEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email must be IT/BM/EN + numbers and end with @my.sliit.lk"
            );
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        String normalizedSliitId = normalizeText(request.getSliitId());
        if (normalizedSliitId != null && userRepository.findBySliitId(normalizedSliitId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SLIIT ID already exists");
        }

        User user = new User();
        user.setName(normalizeText(request.getFullName()));
        user.setEmail(normalizedEmail);
        user.setSliitId(normalizedSliitId);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setProvider("local");
        user.setProviderId(null);
        user.setRole(Role.USER);

        userRepository.save(user);

        String token = createToken(user.getEmail());
        return new AuthResponse(token, "Registration successful");
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (!isValidSliitEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email format");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

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

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google profile does not contain email");
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

        if (user.getProvider() == null) {
            user.setProvider("google");
        }
        if (user.getProviderId() == null) {
            user.setProviderId(sub);
        }

        userRepository.save(user);

        String token = createToken(user.getEmail());
        return new AuthResponse(token, "Google login successful");
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
        if (value == null) {
            return null;
        }
        return value.trim().toLowerCase();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }
}