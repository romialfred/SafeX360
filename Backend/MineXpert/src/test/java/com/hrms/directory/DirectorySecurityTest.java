package com.hrms.directory;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import com.hrms.repository.AccountRepository;

class DirectorySecurityTest {

    private DirectoryService service;
    private DirectorySettings settings;
    private String generatedPassword;

    @BeforeEach
    void setUp() {
        generatedPassword = UUID.randomUUID().toString();
        settings = DirectorySettings.defaults();
        settings.setEnabled(true);
        settings.setDemoMode(true);

        DirectorySettingsRepository settingsRepository = mock(DirectorySettingsRepository.class);
        when(settingsRepository.findAll()).thenReturn(List.of(settings));

        service = new DirectoryService();
        ReflectionTestUtils.setField(service, "settingsRepository", settingsRepository);
        ReflectionTestUtils.setField(service, "accountRepository", mock(AccountRepository.class));
        ReflectionTestUtils.setField(service, "demoDirectoryPassword", generatedPassword);
    }

    @Test
    void demoDirectoryFailsClosedOutsideDevAndTestProfiles() {
        MockEnvironment production = new MockEnvironment();
        production.setActiveProfiles("prod");
        ReflectionTestUtils.setField(service, "environment", production);
        String login = DemoDirectory.search("").get(0).getLogin();

        assertFalse(service.authenticate(login, generatedPassword));
        assertThrows(IllegalStateException.class, () -> service.search(""));
        assertThrows(IllegalStateException.class, () -> service.testConnection(settings, null));
    }

    @Test
    void demoDirectoryRequiresInjectedPasswordEvenInDev() {
        MockEnvironment development = new MockEnvironment();
        development.setActiveProfiles("dev");
        ReflectionTestUtils.setField(service, "environment", development);
        String login = DemoDirectory.search("").get(0).getLogin();

        assertTrue(service.authenticate(login, generatedPassword));
        assertFalse(service.authenticate(login, generatedPassword + "x"));
        ReflectionTestUtils.setField(service, "demoDirectoryPassword", "");
        assertFalse(service.authenticate(login, generatedPassword));
    }

    @Test
    void demoIdentitiesAreSyntheticAndNonRoutable() {
        List<DirectoryUserDTO> users = DemoDirectory.search("");

        assertFalse(users.isEmpty());
        assertTrue(users.stream().allMatch(user -> user.getEmail().endsWith("@example.invalid")));
        assertTrue(users.stream().allMatch(user -> user.getLogin().startsWith("safex-demo-")));
    }
}
