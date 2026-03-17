package com.teamme.backend.controller;

import com.teamme.backend.entity.User;
import com.teamme.backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record UpdateProfileRequest(String firstName, String lastName, String bio) {}
    public record UpdateSelectedRoleRequest(String selectedRole) {}

    public record UserProfileDto(
            String username,
            String avatarUrl,
            String selectedRole,
            String firstName,
            String lastName,
            String bio
    ) {}

    @GetMapping("/me")
    public UserProfileDto me() {
        User u = currentUser();
        return toDto(u);
    }

    @PutMapping("/me")
    public UserProfileDto updateProfile(@RequestBody UpdateProfileRequest req) {
        User u = currentUser();

        u.setFirstName(normalize(req.firstName(), 80));
        u.setLastName(normalize(req.lastName(), 80));
        u.setBio(normalize(req.bio(), 1000));

        return toDto(userRepository.save(u));
    }

    @PutMapping("/me/selected-role")
    public UserProfileDto updateSelectedRole(@RequestBody UpdateSelectedRoleRequest req) {
        User u = currentUser();
        u.setSelectedRole(normalize(req.selectedRole(), 60));
        return toDto(userRepository.save(u));
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow();
    }

    private UserProfileDto toDto(User u) {
        return new UserProfileDto(
                u.getUsername(),
                u.getAvatarUrl(),
                u.getSelectedRole(),
                u.getFirstName(),
                u.getLastName(),
                u.getBio()
        );
    }

    private String normalize(String value, int maxLen) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() > maxLen ? trimmed.substring(0, maxLen) : trimmed;
    }
}