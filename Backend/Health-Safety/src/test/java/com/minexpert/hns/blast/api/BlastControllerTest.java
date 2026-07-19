package com.minexpert.hns.blast.api;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.minexpert.hns.blast.config.BlastRBACConfig;
import com.minexpert.hns.blast.dto.BlastUpdateDTO;
import com.minexpert.hns.blast.service.BlastService;

@ExtendWith(MockitoExtension.class)
class BlastControllerTest {

    @Mock
    private BlastService service;

    @InjectMocks
    private BlastController controller;

    @Test
    void confirmedOverrideCannotBeGrantedByClientFlagAlone() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "planner", "n/a",
                List.of(new SimpleGrantedAuthority(BlastRBACConfig.BLAST_PLAN)));
        var dto = BlastUpdateDTO.builder().id(42L).version(0)
                .reason("Operational change").build();

        assertThatThrownBy(() -> controller.update(
                42L, dto, true, 10L, 7L, authentication))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("BLAST_ADMIN");

        verifyNoInteractions(service);
    }

    @Test
    void confirmedOverrideUsesVerifiedAdminAuthority() {
        var authentication = new UsernamePasswordAuthenticationToken(
                "administrator", "n/a",
                List.of(new SimpleGrantedAuthority(BlastRBACConfig.BLAST_ADMIN)));
        var dto = BlastUpdateDTO.builder().id(42L).version(0)
                .reason("Operational change").build();

        controller.update(42L, dto, true, 10L, 7L, authentication);

        verify(service).update(dto, 7L, true, 10L);
    }
}
