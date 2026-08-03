package org.cce.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Request/response payloads for the auth + licensing endpoints. */
public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String schoolName,
            String udise,
            String deviceId,
            String platform) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            String deviceId,
            String platform) {}

    public record SetPinRequest(@NotBlank String pin) {}

    /** Change the logged-in user's login email (current password confirms identity). */
    public record UpdateEmailRequest(
            @Email @NotBlank String newEmail,
            @NotBlank String password) {}

    /** Change the logged-in user's password. */
    public record UpdatePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword) {}

    /** Start a password reset: email a one-time link. */
    public record ForgotPasswordRequest(@Email @NotBlank String email) {}

    /** Complete a password reset using the emailed token. */
    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank String newPassword) {}

    public record PinLoginRequest(
            @Email @NotBlank String email,
            @NotBlank String pin,
            String deviceId) {}

    public record AuthResponse(
            String token,
            String userId,
            String email,
            String schoolId,
            String role,
            String tier,
            String status,
            long trialDaysLeft) {}
}
