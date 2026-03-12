package com.minexpert.hns.service.planning;

import com.minexpert.hns.dto.planning.ThemeDTO;
import java.util.List;

import com.minexpert.hns.exception.HSException;

public interface ThemeService {
    ThemeDTO createTheme(ThemeDTO dto) throws HSException;

    ThemeDTO updateTheme(ThemeDTO dto) throws HSException;

    void deleteTheme(Long id) throws HSException;

    List<ThemeDTO> getAllThemes() throws HSException;

    List<ThemeDTO> getAllThemesByYear(int year) throws HSException;

    ThemeDTO getThemeById(Long id) throws HSException;
}
