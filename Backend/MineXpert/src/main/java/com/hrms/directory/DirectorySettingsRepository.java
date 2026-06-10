package com.hrms.directory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DirectorySettingsRepository extends JpaRepository<DirectorySettings, Long> {
}
