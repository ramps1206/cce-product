package org.cce.repo;

import org.cce.domain.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SchoolRepo extends JpaRepository<School, UUID> {
    Optional<School> findByUdise(String udise);
}
