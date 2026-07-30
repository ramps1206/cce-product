package org.cce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long ttlMillis;

    public JwtService(
            @Value("${cce.jwt.secret}") String secret,
            @Value("${cce.jwt.access-token-minutes}") long minutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMillis = minutes * 60_000L;
    }

    public String issue(String userId, String email, String schoolId, String role, String tier) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId)
                .claims(Map.of(
                        "email", email == null ? "" : email,
                        "schoolId", schoolId == null ? "" : schoolId,
                        "role", role == null ? "" : role,
                        "tier", tier == null ? "" : tier))
                .issuedAt(new Date(now))
                .expiration(new Date(now + ttlMillis))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
