package com.minexpert.hns.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.minexpert.hns.dto.ResponseDTO;
import com.minexpert.hns.dto.parameters.InternalAuditorDTO;
import com.minexpert.hns.dto.parameters.InternalAuditorResponse;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.parameters.InternalAuditorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auditors")
@CrossOrigin
@Validated
@RequiredArgsConstructor
public class InternalAuditorAPI {
    private final InternalAuditorService internalAuditorService;

    @PostMapping("/create")
    public ResponseEntity<Long> createInternalAuditor(@RequestBody InternalAuditorDTO internalAuditorDTO)
            throws HSException {
        Long id = internalAuditorService.createInternalAuditor(internalAuditorDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(id);
    }

    @PutMapping("/update")
    public ResponseEntity<ResponseDTO> updateInternalAuditor(@RequestBody InternalAuditorDTO internalAuditorDTO)
            throws HSException {
        internalAuditorService.updateInternalAuditor(internalAuditorDTO);
        return ResponseEntity.ok(new ResponseDTO("Internal Auditor updated successfully."));
    }

    @PutMapping("/activate/{id}")
    public ResponseEntity<ResponseDTO> activateInternalAuditor(@PathVariable Long id) throws HSException {
        internalAuditorService.activateInternalAuditor(id);
        return ResponseEntity.ok(new ResponseDTO("Internal Auditor activated successfully."));
    }

    @PutMapping("/deactivate/{id}")
    public ResponseEntity<ResponseDTO> deactivateInternalAuditor(@PathVariable Long id) throws HSException {
        internalAuditorService.deactivateInternalAuditor(id);
        return ResponseEntity.ok(new ResponseDTO("Internal Auditor deactivated successfully."));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<InternalAuditorResponse>> getAllInternalAuditors() throws HSException {
        List<InternalAuditorResponse> auditors = internalAuditorService.getAllInternalAuditors();
        return ResponseEntity.ok(auditors);
    }

}
