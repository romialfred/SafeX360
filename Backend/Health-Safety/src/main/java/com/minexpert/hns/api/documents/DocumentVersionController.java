package com.minexpert.hns.api.documents;

import com.minexpert.hns.dto.documents.DocumentVersionDTO;
import com.minexpert.hns.dto.documents.DocumentVersionDetails;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.dto.MediaDTO;
import com.minexpert.hns.service.documents.DocumentVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/document-versions")
@RequiredArgsConstructor
public class DocumentVersionController {
    private final DocumentVersionService versionService;

    @PostMapping("/create")
    public ResponseEntity<DocumentVersionDTO> create(@RequestBody DocumentVersionDTO dto) throws HSException {
        return ResponseEntity.ok(versionService.create(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<DocumentVersionDTO> update(@RequestBody DocumentVersionDTO dto) throws HSException {
        return ResponseEntity.ok(versionService.update(dto));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<DocumentVersionDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(versionService.getById(id));
    }

    @GetMapping("/by-document/{docId}")
    public ResponseEntity<List<DocumentVersionDetails>> getByDocumentId(@PathVariable Long docId) throws HSException {
        return ResponseEntity.ok(versionService.getByDocumentId(docId));
    }

    @GetMapping("/media/{id}")
    public ResponseEntity<MediaDTO> getMediaByVersion(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(versionService.getMediaByVersionId(id));
    }

    @GetMapping("/latest-media/{docId}")
    public ResponseEntity<MediaDTO> getLatestMediaByDocument(@PathVariable Long docId) throws HSException {
        return ResponseEntity.ok(versionService.getLatestMediaByDocumentId(docId));
    }
}
