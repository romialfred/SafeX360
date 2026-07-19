package com.hrms.Jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtHelperTest {

    @Test
    void exposesConfiguredSessionDurationForCookieAlignment() {
        JwtHelper helper = new JwtHelper();
        ReflectionTestUtils.setField(helper, "expirationHours", 8L);

        assertThat(helper.getExpirationMillis()).isEqualTo(8L * 60L * 60L * 1000L);
    }

    @Test
    void rejectsUnsafeSessionDurations() {
        JwtHelper helper = new JwtHelper();
        ReflectionTestUtils.setField(helper, "expirationHours", 25L);

        assertThatThrownBy(helper::getExpirationMillis)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("1 et 24");
    }
}

