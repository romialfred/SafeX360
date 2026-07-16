package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ThemeDTO;
import com.minexpert.hns.exception.HSException;

import java.util.List;

public interface ThemeService {
    ThemeDTO createTheme(ThemeDTO dto) throws HSException;

    ThemeDTO updateTheme(ThemeDTO dto, Long companyId) throws HSException;

    void deleteTheme(Long id, Long companyId) throws HSException;

    List<ThemeDTO> getAllThemes(Long companyId) throws HSException;

    List<ThemeDTO> getAllThemesByYear(int year, Long companyId) throws HSException;

    ThemeDTO getThemeById(Long id, Long companyId) throws HSException;
}
