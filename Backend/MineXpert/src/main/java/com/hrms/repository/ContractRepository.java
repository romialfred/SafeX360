package com.hrms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import com.hrms.entity.Contract;

public interface ContractRepository extends CrudRepository<Contract, Long> {
     @Query("""
    SELECT 
        EXTRACT(YEAR FROM cs.effectiveDate) AS year,
        SUM(CASE WHEN cs.contractStatus = 'Laid' THEN 1 ELSE 0 END) AS Laid,
        SUM(CASE WHEN cs.contractStatus = 'Resignation' THEN 1 ELSE 0 END) AS Resignation,
        SUM(CASE WHEN cs.contractStatus = 'Retirement' THEN 1 ELSE 0 END) AS Retired,
        SUM(CASE WHEN cs.contractStatus = 'Suspend' THEN 1 ELSE 0 END) AS Suspend
    FROM Contract cs
    GROUP BY EXTRACT(YEAR FROM cs.effectiveDate)
    ORDER BY year DESC
""")
List<Object[]> getContractStatusCountsByYear();
}
