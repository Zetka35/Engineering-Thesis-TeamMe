package com.teamme.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtUtil {

  private final SecretKey key;
  private final String issuer;
  private final long accessTokenMinutes;

  public JwtUtil(
          @Value("${app.jwt.secret}") String secret,
          @Value("${app.jwt.issuer}") String issuer,
          @Value("${app.jwt.accessTokenMinutes}") long accessTokenMinutes
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.issuer = issuer;
    this.accessTokenMinutes = accessTokenMinutes;
  }

  public String generateToken(String username) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(accessTokenMinutes * 60);

    return Jwts.builder()
            .setIssuer(issuer)                 // <-- zamiast .issuer(...)
            .setSubject(username)
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(exp))
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
  }

  public String validateAndGetUsername(String token) {
    Claims claims = Jwts.parserBuilder()   // <-- zamiast Jwts.parser().verifyWith(...)
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();

    return claims.getSubject();
  }
}