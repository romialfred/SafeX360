package com.minexpert.hns.clients;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.minexpert.hns.config.FeignClientInterceptor;
import com.minexpert.hns.dto.request.DepartmentNames;
import com.minexpert.hns.dto.request.EmpEmailPosResponse;
import com.minexpert.hns.dto.request.EmployeeDirection;
import com.minexpert.hns.dto.request.EmployeeNameDTO;
import com.minexpert.hns.dto.request.PositionResponse;

@FeignClient(name = "hrms", url = "${hrms.url}", configuration = FeignClientInterceptor.class)
public interface HrmsClient {
    @GetMapping("/hrms/employee/getByIds")
    List<EmployeeNameDTO> getEmployeeNameByIds(@RequestParam List<Long> ids);

    @GetMapping("/hrms/department/getByIds")
    List<DepartmentNames> getDepartmentNames(@RequestParam List<Long> ids);

    @GetMapping("/hrms/position/getAllPositionNames")
    List<PositionResponse> getAllPositionNames();

    @GetMapping("/hrms/position/getNameById/{id}")
    PositionResponse getPositionById(@PathVariable Long id);

    @GetMapping("/hrms/employee/getAllWithEmailAndPosition")
    List<EmpEmailPosResponse> getAllEmployeesWithEmailAndPosition();

    @GetMapping("/hrms/employee/getEmpEmailAndPosition/{employeeId}")
    EmpEmailPosResponse getEmployeeWithEmailAndPositionById(@PathVariable Long employeeId);

    @GetMapping("/hrms/employee/getEmployeeWithDirection")
    List<EmployeeDirection> getEmployeeWithDirection(@RequestParam List<Long> ids);

    @GetMapping("/hrms/employee/getEmailsByIds")
    List<EmployeeDirection> getEmailsByIds(@RequestParam List<Long> ids);
}
