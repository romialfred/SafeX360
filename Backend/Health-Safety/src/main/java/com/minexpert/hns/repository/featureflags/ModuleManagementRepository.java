package com.minexpert.hns.repository.featureflags;

import com.minexpert.hns.entity.featureflags.ModuleManagement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModuleManagementRepository extends JpaRepository<ModuleManagement, Long> {
    Optional<ModuleManagement> findByModule(String module);
}

