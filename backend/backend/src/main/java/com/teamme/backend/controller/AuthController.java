package com.teamme.backend.controller;

import com.teamme.backend.entity.User;
import com.teamme.backend.security.JwtUtil;
import com.teamme.backend.service.AuthService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final JwtUtil jwtUtil;

  public AuthController(AuthService authService, JwtUtil jwtUtil) {
    this.authService = authService;
    this.jwtUtil = jwtUtil;
  }

  public record RegisterRequest(@NotBlank String username, @NotBlank String password) {}
  public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
  public record UserDto(String username, String avatarUrl, String selectedRole) {}

  @PostMapping("/register")
  public UserDto register(@RequestBody RegisterRequest req) {
    User u = authService.register(req.username().trim(), req.password());
    // po rejestracji możesz od razu zalogować:
    String token = jwtUtil.generateToken(u.getUsername());
    return setCookieAndReturnDto(u, token);
  }

  @PostMapping("/login")
  public UserDto login(@RequestBody LoginRequest req) {
    User u = authService.authenticate(req.username().trim(), req.password());
    String token = jwtUtil.generateToken(u.getUsername());
    return setCookieAndReturnDto(u, token);
  }

  @PostMapping("/logout")
  public void logout() {
    // cookie czyszczone w przeglądarce
    ResponseCookie cookie = ResponseCookie.from("access_token", "")
        .httpOnly(true)
        .secure(false)
        .sameSite("Lax")
        .path("/")
        .maxAge(Duration.ZERO)
        .build();
    // Spring doda Set-Cookie przez nagłówek
    // (zwracamy void)
    // Uwaga: w @RestController można ustawić header przez ResponseEntity, ale prościej:
    throw new LogoutCookieException(cookie.toString());
  }

  @GetMapping("/me")
  public UserDto me(@RequestAttribute(name = "username", required = false) String ignored) {
    // username bierzemy z SecurityContext
    String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
        .getAuthentication().getName();
    User u = authService.loadByUsername(username);
    return new UserDto(u.getUsername(), u.getAvatarUrl(), u.getSelectedRole());
  }

  private UserDto setCookieAndReturnDto(User u, String token) {
    ResponseCookie cookie = ResponseCookie.from("access_token", token)
        .httpOnly(true)
        .secure(false)       // na produkcji true + HTTPS
        .sameSite("Lax")
        .path("/")
        .maxAge(Duration.ofHours(2))
        .build();
    throw new LoginCookieException(cookie.toString(), new UserDto(u.getUsername(), u.getAvatarUrl(), u.getSelectedRole()));
  }

  // --- małe wyjątki do ustawiania Set-Cookie bez rozbudowy ResponseEntity wszędzie ---
  @ResponseStatus(code = org.springframework.http.HttpStatus.OK)
  static class LoginCookieException extends RuntimeException {
    final String setCookie;
    final UserDto body;
    LoginCookieException(String setCookie, UserDto body) { this.setCookie = setCookie; this.body = body; }
  }

  @ResponseStatus(code = org.springframework.http.HttpStatus.OK)
  static class LogoutCookieException extends RuntimeException {
    final String setCookie;
    LogoutCookieException(String setCookie) { this.setCookie = setCookie; }
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(LoginCookieException.class)
  public org.springframework.http.ResponseEntity<UserDto> handleLoginCookie(LoginCookieException ex) {
    return org.springframework.http.ResponseEntity.ok()
        .header("Set-Cookie", ex.setCookie)
        .body(ex.body);
  }

  @org.springframework.web.bind.annotation.ExceptionHandler(LogoutCookieException.class)
  public org.springframework.http.ResponseEntity<Void> handleLogoutCookie(LogoutCookieException ex) {
    return org.springframework.http.ResponseEntity.ok()
        .header("Set-Cookie", ex.setCookie)
        .build();
  }
}