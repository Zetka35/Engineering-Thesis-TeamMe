package com.teamme.backend.controller;

import com.teamme.backend.entity.User;
import com.teamme.backend.service.UserService;
import com.teamme.backend.security.JwtUtil;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    record RegisterRequest(String email, String password, String firstName, String lastName) {}
    record LoginRequest(String email, String password) {}

    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        return userService.registerUser(
                request.email(),
                request.password(),
                request.firstName(),
                request.lastName()
        );
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        User user = userService.authenticate(request.email(), request.password());
        String token = jwtUtil.generateToken(user.getEmail());
        return Map.of(
                "token", token,
                "email", user.getEmail()
        );
    }
}
