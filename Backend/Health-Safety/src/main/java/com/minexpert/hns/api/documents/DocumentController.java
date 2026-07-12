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
    public ResponseEntity<DocumentDTO> create(@RequestBody DocumentDTO dto) throws HSException {
        return ResponseEntity.ok(documentService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<DocumentDTO> update(@RequestBody DocumentDTO dto) throws HSException {
        return ResponseEntity.ok(documentService.update(dto));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DocumentDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(documentService.getById(id));
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<DocumentDTO>> getAll() throws HSException {
        return ResponseEntity.ok(documentService.getAll());
    }

    @GetMapping("/getActive")
    public ResponseEntity<List<DocumentDTO>> getActive() throws HSException {
        return ResponseEntity.ok(documentService.getActive());
    }

    @GetMapping("/approved")
    public ResponseEntity<List<DocumentDTO>> getApproved() throws HSException {
        return ResponseEntity.ok(documentService.getApproved());
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<DocumentDTO> changeStatus(@PathVariable Long id,
            @RequestParam DocumentStatus status,
            @RequestParam(required = false) String reason) throws HSException {
        return ResponseEntity.ok(documentService.changeStatus(id, status, reason));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<DocumentDTO>> getLatest() throws HSException {
        return ResponseEntity.ok(documentService.getLatest());
    }
}
