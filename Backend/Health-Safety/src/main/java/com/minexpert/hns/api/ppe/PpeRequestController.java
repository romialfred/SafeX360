package com.minexpert.hns.api.ppe;

import com.minexpert.hns.dto.ppe.PpeRequestDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.ppe.PpeRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/ppe-request")
@RequiredArgsConstructor
public class PpeRequestController {
    private final PpeRequestService requestService;

    @PostMapping("/create")
    public ResponseEntity<PpeRequestDTO> create(@RequestBody PpeRequestDTO dto) throws HSException {
        return ResponseEntity.ok(requestService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<PpeRequestDTO> update(@RequestBody PpeRequestDTO dto) throws HSException {
        return ResponseEntity.ok(requestService.update(dto));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<PpeRequestDTO> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String comment) throws HSException {
        return ResponseEntity.ok(requestService.approveRequest(id, comment));
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<PpeRequestDTO> reject(
            @PathVariable Long id,
            @RequestParam String comment) throws HSException {
        return ResponseEntity.ok(requestService.rejectRequest(id, comment));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<PpeRequestDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(requestService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<PpeRequestDTO>> getAll() throws HSException {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    // @GetMapping("/getByEmp/{empId}")
    // public ResponseEntity<List<PpeRequestDTO>> getByEmp(@PathVariable Long empId)
    // throws HSException {
    // return ResponseEntity.ok(requestService.getByEmpId(empId));
    // }
}
