package com.teamme.backend.service;

import com.teamme.backend.entity.User;
import com.teamme.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User register(String username, String password) {
    if (userRepository.existsByUsername(username)) {
      throw new IllegalArgumentException("Użytkownik o tej nazwie już istnieje");
    }
    User u = new User();
    u.setUsername(username);
    u.setPasswordHash(encoder.encode(password));
    return userRepository.save(u);
  }

  public User authenticate(String username, String password) {
    User u = userRepository.findByUsername(username)
            .orElseThrow(() -> new java.util.NoSuchElementException("NO_SUCH_USER"));

    if (!encoder.matches(password, u.getPasswordHash())) {
      throw new IllegalArgumentException("BAD_PASSWORD");
    }
    return u;
  }

  public User loadByUsername(String username) {
    return userRepository.findByUsername(username)
            .orElseThrow(() -> new java.util.NoSuchElementException("NO_SUCH_USER"));
  }
}