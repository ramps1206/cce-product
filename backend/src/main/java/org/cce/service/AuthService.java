package org.cce.service;

import org.cce.domain.*;
import org.cce.repo.*;
import org.cce.security.JwtService;
import org.cce.web.dto.AuthDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private static final int TRIAL_DAYS = 15;

    private final SchoolRepo schools;
    private final AppUserRepo users;
    private final LicenseRepo licenses;
    private final DeviceRepo devices;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(SchoolRepo schools, AppUserRepo users, LicenseRepo licenses,
                       DeviceRepo devices, PasswordEncoder encoder, JwtService jwt) {
        this.schools = schools;
        this.users = users;
        this.licenses = licenses;
        this.devices = devices;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }
        School school = new School();
        school.setName(req.schoolName());
        school.setUdise(req.udise());
        school = schools.save(school);

        AppUser user = new AppUser();
        user.setEmail(req.email().toLowerCase());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setSchool(school);
        user.setRole("HEADMASTER");            // first user of a school
        user = users.save(user);

        License lic = new License();
        lic.setSchool(school);
        lic.setTier("trial");
        lic.setStatus("active");
        lic.setPlatform(req.platform() == null ? "both" : req.platform());
        lic.setMaxDevices(5);
        lic.setTrialEndsAt(OffsetDateTime.now().plusDays(TRIAL_DAYS));
        lic = licenses.save(lic);

        registerDevice(lic, req.deviceId(), req.platform());

        return toResponse(user, lic);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        AppUser user = users.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }
        License lic = activeLicense(user);
        enforcePlatform(lic, req.platform());
        registerDevice(lic, req.deviceId(), req.platform());
        return toResponse(user, lic);
    }

    @Transactional
    public AuthResponse pinLogin(PinLoginRequest req) {
        AppUser user = users.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid pin"));
        if (user.getPinHash() == null || !encoder.matches(req.pin(), user.getPinHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid pin");
        }
        License lic = activeLicense(user);
        return toResponse(user, lic);
    }

    @Transactional
    public void setPin(String userId, String pin) {
        AppUser user = users.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));
        user.setPinHash(encoder.encode(pin));
        users.save(user);
    }

    // --- helpers -----------------------------------------------------------

    private License activeLicense(AppUser user) {
        if (user.getSchool() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no school linked");
        }
        List<License> list = licenses.findBySchoolId(user.getSchool().getId());
        License lic = list.stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "no license"));
        // Expire trials past their end date.
        if ("trial".equals(lic.getTier()) && lic.getTrialEndsAt() != null
                && lic.getTrialEndsAt().isBefore(OffsetDateTime.now())) {
            lic.setStatus("expired");
            licenses.save(lic);
        }
        if (!"active".equals(lic.getStatus())) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "license " + lic.getStatus());
        }
        return lic;
    }

    private void enforcePlatform(License lic, String platform) {
        if (platform == null || "both".equals(lic.getPlatform())) return;
        if (!lic.getPlatform().equals(platform)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "license restricted to platform: " + lic.getPlatform());
        }
    }

    private void registerDevice(License lic, String deviceId, String platform) {
        if (deviceId == null || deviceId.isBlank()) return;
        var existing = devices.findByLicenseIdAndDeviceId(lic.getId(), deviceId);
        if (existing.isPresent()) {
            existing.get().setLastSeen(OffsetDateTime.now());
            devices.save(existing.get());
            return;
        }
        // At the device cap: rotate out the least-recently-seen device rather
        // than hard-blocking the login. Enforces the concurrent-device count
        // without ever locking a legitimate user out of their own school.
        List<Device> existingDevices = devices.findByLicenseIdOrderByLastSeenAscNullsFirst(lic.getId());
        int overBy = existingDevices.size() - lic.getMaxDevices() + 1;
        for (int i = 0; i < overBy && i < existingDevices.size(); i++) {
            devices.delete(existingDevices.get(i));
        }
        Device d = new Device();
        d.setLicense(lic);
        d.setDeviceId(deviceId);
        d.setPlatform(platform == null ? "both" : platform);
        d.setLastSeen(OffsetDateTime.now());
        devices.save(d);
    }

    private AuthResponse toResponse(AppUser user, License lic) {
        String schoolId = user.getSchool() == null ? "" : user.getSchool().getId().toString();
        String token = jwt.issue(user.getId().toString(), user.getEmail(), schoolId,
                user.getRole(), lic.getTier());
        long trialDaysLeft = 0;
        if ("trial".equals(lic.getTier()) && lic.getTrialEndsAt() != null) {
            trialDaysLeft = Math.max(0, ChronoUnit.DAYS.between(OffsetDateTime.now(), lic.getTrialEndsAt()));
        }
        return new AuthResponse(token, user.getId().toString(), user.getEmail(), schoolId,
                user.getRole(), lic.getTier(), lic.getStatus(), trialDaysLeft);
    }
}
