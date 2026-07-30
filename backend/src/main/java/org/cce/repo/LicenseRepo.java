package org.cce.repo;

import org.cce.domain.License;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LicenseRepo extends JpaRepository<License, UUID> {
    List<License> findBySchoolId(UUID schoolId);
    Optional<License> findByKeyString(String keyString);
}
