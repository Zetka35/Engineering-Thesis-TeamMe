package com.teamme.backend.controller;

import com.teamme.backend.service.UserProfileService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    public record UpdateSelectedRoleRequest(String selectedRole) {}

    @GetMapping("/me")
    public UserProfileService.UserProfileDto me() {
        return userProfileService.getMyProfile(currentUsername());
    }

    @PutMapping("/me")
    public UserProfileService.UserProfileDto updateProfile(
            @RequestBody UserProfileService.UpdateProfileRequest req
    ) {
        return userProfileService.updateMyProfile(currentUsername(), req);
    }

    @PutMapping("/me/selected-role")
    public UserProfileService.UserProfileDto updateSelectedRole(
            @RequestBody UpdateSelectedRoleRequest req
    ) {
        return userProfileService.updateSelectedRole(currentUsername(), req.selectedRole());
    }

    @GetMapping("/network")
    public List<UserProfileService.NetworkUserDto> network() {
        return userProfileService.getNetwork(currentUsername());
    }

    @GetMapping("/{username}")
    public UserProfileService.UserProfileDto getUser(@PathVariable String username) {
        return userProfileService.getPublicProfile(username);
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}