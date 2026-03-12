package com.minexpert.hns.api;

import com.minexpert.hns.dto.planning.ThemeDTO;
import com.minexpert.hns.service.planning.ThemeService;
import com.minexpert.hns.exception.HSException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/theme")
@RequiredArgsConstructor
public class ThemeController {
    private final ThemeService themeService;

    @PostMapping("/create")
    public ResponseEntity<ThemeDTO> create(@RequestBody ThemeDTO dto) throws HSException {
        return ResponseEntity.ok(themeService.createTheme(dto));
    }

    @PutMapping("/update")
    public ResponseEntity<ThemeDTO> update(@RequestBody ThemeDTO dto) throws HSException {
        return ResponseEntity.ok(themeService.updateTheme(dto));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) throws HSException {
        themeService.deleteTheme(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ThemeDTO>> getAll() throws HSException {
        return ResponseEntity.ok(themeService.getAllThemes());
    }

    @GetMapping("/get/year/{year}")
    public ResponseEntity<List<ThemeDTO>> getAllByYear(@PathVariable int year) throws HSException {
        return ResponseEntity.ok(themeService.getAllThemesByYear(year));
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<ThemeDTO> getById(@PathVariable Long id) throws HSException {
        return ResponseEntity.ok(themeService.getThemeById(id));
    }
}
