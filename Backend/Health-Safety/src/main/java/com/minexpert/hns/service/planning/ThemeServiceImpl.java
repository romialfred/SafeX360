
package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ThemeDTO;
import com.minexpert.hns.entity.planning.Theme;
import com.minexpert.hns.repository.planning.ThemeRepository;
import lombok.RequiredArgsConstructor;
import com.minexpert.hns.exception.HSException;
import java.util.stream.StreamSupport;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ThemeServiceImpl implements ThemeService {
    private final ThemeRepository themeRepository;

    @Override
    public ThemeDTO createTheme(ThemeDTO dto) throws HSException {
        Theme theme = dto.toEntity();
        theme.setId(null);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        theme.setCreatedAt(now);
        theme.setUpdatedAt(now);
        return themeRepository.save(theme).toDTO();
    }

    @Override
    public ThemeDTO updateTheme(ThemeDTO dto) throws HSException {
        Theme theme = themeRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("THEME_NOT_FOUND"));
        theme.setMonth(dto.getMonth());
        theme.setCategory(dto.getCategory());
        theme.setType(dto.getType());
        theme.setTitle(dto.getTitle());
        theme.setDescription(dto.getDescription());
        theme.setUpdatedAt(java.time.LocalDateTime.now());
        return themeRepository.save(theme).toDTO();
    }

    @Override
    public void deleteTheme(Long id) throws HSException {
        if (!themeRepository.existsById(id)) {
            throw new HSException("THEME_NOT_FOUND");
        }
        themeRepository.deleteById(id);
    }

    @Override
    public List<ThemeDTO> getAllThemes() throws HSException {
        return StreamSupport.stream(themeRepository.findAll().spliterator(), false)
                .map(Theme::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ThemeDTO> getAllThemesByYear(int year) throws HSException {
        return StreamSupport.stream(themeRepository.findAll().spliterator(), false)
                .filter(t -> t.getMonth() != null && t.getMonth().getYear() == year)
                .map(Theme::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ThemeDTO getThemeById(Long id) throws HSException {
        return themeRepository.findById(id)
                .map(Theme::toDTO)
                .orElseThrow(() -> new HSException("THEME_NOT_FOUND"));
    }

    // Conversion methods moved to entity and DTO classes
}
