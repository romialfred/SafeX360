package com.hrms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.hrms.DataInterface.DepartmentNames;
import com.hrms.entity.Department;

public interface DepartmentRepository extends CrudRepository<Department, Long> {
    List<Department> findByCompanyId(Long companyId);

    Optional<Department> findByNameIgnoreCaseAndCompany_Id(String name, Long id);

    @Query("SELECT d.id AS id, d.name AS name FROM Department d ")
    List<DepartmentNames> findDepartmentNames();

    @Query("SELECT d.id AS id, d.name AS name FROM Department d WHERE d.id in ?1")
    List<DepartmentNames> findDepartmentNamesByIds(List<Long> ids);
}
