package org.cce.web;

import jakarta.validation.Valid;
import org.cce.security.CcePrincipal;
import org.cce.service.AuthService;
import org.cce.web.dto.AuthDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/pin-login")
    public AuthResponse pinLogin(@Valid @RequestBody PinLoginRequest req) {
        return auth.pinLogin(req);
    }

    @PostMapping("/set-pin")
    public ResponseEntity<Void> setPin(@Valid @RequestBody SetPinRequest req) {
        CcePrincipal me = CcePrincipal.current();
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        auth.setPin(me.userId(), req.pin());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/update-email")
    public AuthResponse updateEmail(@Valid @RequestBody UpdateEmailRequest req) {
        CcePrincipal me = CcePrincipal.current();
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return auth.updateEmail(me.userId(), req);
    }

    @PostMapping("/update-password")
    public ResponseEntity<Void> updatePassword(@Valid @RequestBody UpdatePasswordRequest req) {
        CcePrincipal me = CcePrincipal.current();
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        auth.updatePassword(me.userId(), req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        auth.forgotPassword(req.email());
        return ResponseEntity.noContent().build();   // always 204 — never reveal if the email exists
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        auth.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public CcePrincipal me() {
        CcePrincipal me = CcePrincipal.current();
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return me;
    }
}
