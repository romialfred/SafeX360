package com.minexpert.hns.api;

import com.minexpert.hns.dto.planning.ThemeDTO;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.service.planning.ThemeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/theme")
@RequiredArgsConstructor
@CrossOrigin
public class ThemeController {
    private final ThemeService themeService;

    @PostMapping("/create")
    public ResponseEntity<ThemeDTO> create(@Valid @RequestBody ThemeDTO dto,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        // Cloisonnement : la mine appelante validee prime sur le payload.
        if (companyId != null) {
            dto.setCompanyId(companyId);
        }
        return ResponseEntity.ok(themeService.createTheme(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ThemeDTO> update(@Valid @RequestBody ThemeDTO dto,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(themeService.updateTheme(dto, companyId));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        themeService.deleteTheme(id, companyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ThemeDTO>> getAll(
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(themeService.getAllThemes(companyId));
    }

    @GetMapping("/get/year/{year}")
    public ResponseEntity<List<ThemeDTO>> getAllByYear(@PathVariable int year,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(themeService.getAllThemesByYear(year, companyId));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ThemeDTO> getById(@PathVariable Long id,
            @RequestParam(value = "companyId", required = false) Long companyId) throws HSException {
        return ResponseEntity.ok(themeService.getThemeById(id, companyId));
    }
}
