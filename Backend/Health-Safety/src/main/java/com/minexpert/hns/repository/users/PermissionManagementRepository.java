package com.minexpert.hns.repository.users;

import com.minexpert.hns.entity.users.PermissionManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface PermissionManagementRepository extends JpaRepository<PermissionManagement, Long> {
    Optional<PermissionManagement> findByEmployeeId(Long employeeId);

    @Query("select distinct p.employeeId from PermissionManagement p")
    List<Long> findDistinctEmployeeIds();
}
