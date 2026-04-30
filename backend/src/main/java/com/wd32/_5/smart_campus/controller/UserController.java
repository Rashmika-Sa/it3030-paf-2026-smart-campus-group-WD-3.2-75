package com.wd32._5.smart_campus.controller;

import com.wd32._5.smart_campus.dto.UserResponse;
import com.wd32._5.smart_campus.entity.Role;
import com.wd32._5.smart_campus.entity.User;
import com.wd32._5.smart_campus.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getSliitId(), user.getRole());
    }

    @GetMapping("/admin/users")
    public List<UserResponse> getAllUsers(@AuthenticationPrincipal User user) {
        requireAdmin(user);
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getSliitId(), u.getRole()))
                .collect(Collectors.toList());
    }

    @PutMapping("/admin/users/{id}")
    public UserResponse updateUser(@PathVariable String id,
                                   @RequestBody AdminUserUpdateRequest request,
                                   @AuthenticationPrincipal User user) {
        requireAdmin(user);

        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String email = normalizeEmail(request.getEmail());
        String sliitId = normalize(request.getSliitId());

        if (email == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and email are required");
        }

        userRepository.findByEmail(email)
                .filter(u -> !u.getId().equals(id))
                .ifPresent(u -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
                });

        if (sliitId != null) {
            userRepository.findBySliitId(sliitId)
                    .filter(u -> !u.getId().equals(id))
                    .ifPresent(u -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "SLIIT ID already in use");
                    });
        }

        target.setName(request.getName().trim());
        target.setEmail(email);
        target.setSliitId(sliitId);
        if (request.getRole() != null) {
            target.setRole(request.getRole());
        }

        User saved = userRepository.save(target);
        return new UserResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getSliitId(), saved.getRole());
    }

    @DeleteMapping("/admin/users/{id}")
    public void deleteUser(@PathVariable String id,
                           @AuthenticationPrincipal User user) {
        requireAdmin(user);
        if (user.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own admin account");
        }
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }

    @PutMapping("/admin/change-password")
    public void changeAdminPassword(@RequestBody ChangePasswordRequest request,
                                    @AuthenticationPrincipal User user) {
        requireAdmin(user);

        if (request.getCurrentPassword() == null || request.getNewPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current and new passwords are required");
        }
        if (request.getNewPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeEmail(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toLowerCase();
    }

    private void requireAdmin(User user) {
        if (user == null || user.getRole() == null || user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    public static class AdminUserUpdateRequest {
        private String name;
        private String email;
        private String sliitId;
        private Role role;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getSliitId() { return sliitId; }
        public void setSliitId(String sliitId) { this.sliitId = sliitId; }
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
    }

    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;

        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
