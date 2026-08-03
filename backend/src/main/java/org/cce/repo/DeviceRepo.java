package org.cce.repo;

import org.cce.domain.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRepo extends JpaRepository<Device, UUID> {
    Optional<Device> findByLicenseIdAndDeviceId(UUID licenseId, String deviceId);
    long countByLicenseId(UUID licenseId);

    /** All devices for a license (ordering / LRU selection done in the service). */
    List<Device> findByLicenseId(UUID licenseId);
}
