package com.hrms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.dto.ContractDTO;
import com.hrms.entity.Contract;
import com.hrms.entity.Employee;
import com.hrms.exception.HRMSException;
import com.hrms.repository.ContractRepository;
import com.hrms.repository.EmployeeRepository;

@Service
public class ContractServiceImpl implements ContractService {

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public ContractDTO getContract(Long id) throws HRMSException {
        return contractRepository.findById(id).orElseThrow(() -> new HRMSException("CONTRACT_NOT_FOUND")).toDTO();
    }

    @Override
    public void addContract(ContractDTO contractDTO) throws HRMSException {
        Employee employee = employeeRepository.findById(contractDTO.getEmployee().getId())
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
        employee.setEffectiveEndDate(contractDTO.getEffectiveDate());
        employeeRepository.save(employee);
        contractRepository.save(contractDTO.toEntity());
    }

    @Override
    public void updateContract(ContractDTO contractDTO) throws HRMSException {
        Optional<Contract> opt = contractRepository.findById(contractDTO.getId());
        if (opt.isEmpty())
            throw new HRMSException("CONTRACT_NOT_FOUND");
        Employee employee = employeeRepository.findById(contractDTO.getEmployee().getId())
                .orElseThrow(() -> new HRMSException("EMPLOYEE_NOT_FOUND"));
                if (contractDTO.getHrDecision().equals("Rejected")) {
                    employee.setEffectiveEndDate(null);
                } else {
                    employee.setEffectiveEndDate(contractDTO.getEffectiveDate());
                }
        employeeRepository.save(employee);
        contractRepository.save(contractDTO.toEntity());
    }

    @Override
    public void deleteContract(Long id) throws HRMSException {
        Contract contract = contractRepository.findById(id).orElseThrow(()->new HRMSException("CONTRACT_NOT_FOUND"));
        Employee employee = contract.getEmployee();
        employee.setEffectiveEndDate(null);
        employeeRepository.save(employee);
        contractRepository.deleteById(id);
    }

    @Override
    public List<ContractDTO> getAllContracts() {
        return ((List<Contract>) contractRepository.findAll()).stream().map(Contract::toDTO).toList();
    }

    @Override
    public List<Object[]> getSeparationData() {
        return contractRepository.getContractStatusCountsByYear();
    }

}
