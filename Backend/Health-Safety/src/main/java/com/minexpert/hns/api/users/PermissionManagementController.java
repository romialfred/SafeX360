package com.minexpert.hns.api.users;

import com.minexpert.hns.dto.users.PermissionManagementDTO;
import com.minexpert.hns.enums.Status;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.users.PermissionManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/permissions")
@RequiredArgsConstructor
public class PermissionManagementController {
    private final PermissionManagementService permissionService;

    @PostMapping("/create")
    public ResponseEntity<PermissionManagementDTO> create(@RequestBody PermissionManagementDTO dto) throws HSException {
        return ResponseEntity.ok(permissionService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PermissionManagementDTO> update(@RequestBody PermissionManagementDTO dto) throws HSException {
        return ResponseEntity.ok(permissionService.update(dto));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<PermissionManagementDTO> updateStatus(@PathVariable Long id, @RequestParam Status status)
            throws HSException {
        return ResponseEntity.ok(permissionService.updateStatus(id, status));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PermissionManagementDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(permissionService.getById(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<PermissionManagementDTO> getByEmployeeId(@PathVariable Long employeeId) throws HSException {
        return ResponseEntity.ok(permissionService.getByEmployeeId(employeeId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PermissionManagementDTO>> getAll() throws HSException {
        return ResponseEntity.ok(permissionService.getAll());
    }

    @GetMapping("/employees/registered")
    public ResponseEntity<List<Long>> getRegisteredEmployeeIds() throws HSException {
        return ResponseEntity.ok(permissionService.getRegisteredEmployeeIds());
    }
}
