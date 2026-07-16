
package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ThemeDTO;
import com.minexpert.hns.entity.planning.Theme;
import com.minexpert.hns.exception.HSException;
import com.minexpert.hns.repository.planning.ThemeRepository;

import lombok.RequiredArgsConstructor;

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
    public ThemeDTO updateTheme(ThemeDTO dto, Long companyId) throws HSException {
        Theme theme = themeRepository.findById(dto.getId())
                .orElseThrow(() -> new HSException("THEME_NOT_FOUND"));
        verifyCompany(theme, companyId);
        theme.setMonth(dto.getMonth());
        theme.setCategory(dto.getCategory());
        theme.setType(dto.getType());
        theme.setTitle(dto.getTitle());
        theme.setDescription(dto.getDescription());
        theme.setUpdatedAt(java.time.LocalDateTime.now());
        return themeRepository.save(theme).toDTO();
    }

    @Override
    public void deleteTheme(Long id, Long companyId) throws HSException {
        Theme theme = themeRepository.findById(id)
                .orElseThrow(() -> new HSException("THEME_NOT_FOUND"));
        verifyCompany(theme, companyId);
        themeRepository.deleteById(id);
    }

    @Override
    public List<ThemeDTO> getAllThemes(Long companyId) throws HSException {
        return themeRepository.findAllByCompany(companyId)
                .stream()
                .map(Theme::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ThemeDTO> getAllThemesByYear(int year, Long companyId) throws HSException {
        return themeRepository.findAllByMonthYearAndCompany(year, companyId)
                .stream()
                .map(Theme::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ThemeDTO getThemeById(Long id, Long companyId) throws HSException {
        Theme theme = themeRepository.findById(id)
                .orElseThrow(() -> new HSException("THEME_NOT_FOUND"));
        verifyCompany(theme, companyId);
        return theme.toDTO();
    }

    /**
     * Verifie l'appartenance d'un theme a la mine appelante. companyId null
     * (systeme/allMines) = pas de controle. Les themes GLOBAUX (companyId null)
     * restent editables/consultables par toutes les mines (repli retrocompat).
     * Non-appartenance : THEME_NOT_FOUND.
     */
    private void verifyCompany(Theme theme, Long companyId) throws HSException {
        if (companyId == null || theme == null || theme.getCompanyId() == null) {
            return;
        }
        if (!companyId.equals(theme.getCompanyId())) {
            throw new HSException("THEME_NOT_FOUND");
        }
    }

    // Conversion methods moved to entity and DTO classes
}
