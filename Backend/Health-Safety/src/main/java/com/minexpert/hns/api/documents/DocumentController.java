package com.minexpert.hns.api.documents;

import com.minexpert.hns.dto.documents.DocumentDTO;
import com.minexpert.hns.entity.documents.Document.DocumentStatus;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.documents.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    @PostMapping("/create")
    public ResponseEntity<DocumentDTO> create(@RequestBody DocumentDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        // Cloisonnement : la mine appelante validee prime sur le payload.
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(documentService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<DocumentDTO> update(@RequestBody DocumentDTO dto,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.update(dto, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DocumentDTO> getById(@PathVariable Long id,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.getById(id, companyId));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DocumentDTO>> getAll(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.getAll(companyId));
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<DocumentDTO>> getActive(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.getActive(companyId));
    }

    @GetMapping("/approved")
    public ResponseEntity<List<DocumentDTO>> getApproved(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.getApproved(companyId));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<DocumentDTO> changeStatus(@PathVariable Long id,
            @RequestParam DocumentStatus status,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.changeStatus(id, status, reason, companyId));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<DocumentDTO>> getLatest(
            @RequestParam(required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(documentService.getLatest(companyId));
    }
}
