package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeEmpDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeEmpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.minexpert.hns.dto.ppe.EmpPpeCountDTO;

@RestController
@CrossOrigin
@RequestMapping("/ppeEmp")
@RequiredArgsConstructor
public class PpeEmpController {
    private final PpeEmpService empService;

    @PostMapping("/create")
    public ResponseEntity<PpeEmpDTO> create(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeEmpDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(empService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeEmpDTO> update(@RequestParam(required = false) Long companyId,
            @Valid @RequestBody PpeEmpDTO dto) throws HSException {
        if (companyId != null)
            dto.setCompanyId(companyId);
        return ResponseEntity.ok(empService.update(dto, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeEmpDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(empService.getById(id, companyId));
    }

    @GetMapping("/by-emp/{empId}")
    public ResponseEntity<List<PpeEmpDTO>> getByEmp(@PathVariable Long empId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(empService.getByEmpId(empId, companyId));
    }

    @GetMapping("/by-ppe/{ppeId}")
    public ResponseEntity<List<PpeEmpDTO>> getByPpe(@PathVariable Long ppeId,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(empService.getByPpeId(ppeId, companyId));
    }

    @GetMapping("/by-status")
    public ResponseEntity<List<PpeEmpDTO>> getByStatus(@RequestParam String status,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(empService.getByStatus(status, companyId));
    }

    /**
     * Return all employees with their active PPE assignment counts
     */
    @GetMapping("/counts")
    public ResponseEntity<List<EmpPpeCountDTO>> getAllAssignmentCounts(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(empService.getAllEmployeeAssignmentCounts(companyId));
    }
}
