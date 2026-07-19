package com.minexpert.hns.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class DemoFixtureIsolationTest {

    private static final Path PRODUCTION_MIGRATIONS = Path.of("src/main/resources/db/migration");
    private static final Path FIXTURES = Path.of("src/test/resources/db/fixtures/dosimetry");

    @Test
    void productionArtifactContainsNoDemoOrTestSeedMigration() throws IOException {
        try (var files = Files.list(PRODUCTION_MIGRATIONS)) {
            List<String> names = files.map(path -> path.getFileName().toString().toLowerCase()).toList();
            assertFalse(names.stream().anyMatch(name -> name.contains("seed_demo") || name.contains("seed_test")));
        }
    }

    @Test
    void canonicalFixtureIsVersionedSyntheticAndDeterministic() throws IOException {
        String fixture = Files.readString(FIXTURES.resolve("dosimetry_demo_v1.sql"));
        assertTrue(fixture.contains("DATASET_SAFEX_DOSIMETRY_V1"));
        assertTrue(fixture.contains("990001"));
        assertTrue(fixture.contains("synthétique"));
        assertFalse(fixture.contains("RAND("));
        assertFalse(fixture.contains("NOW("));
        assertFalse(fixture.contains("CURRENT_DATE"));
    }

    @Test
    void historicalFixturesAreQuarantinedOutsideMainResources() throws IOException {
        try (var files = Files.list(FIXTURES.resolve("legacy"))) {
            assertEquals(4, files.filter(path -> path.getFileName().toString().endsWith(".sql")).count());
        }
    }
}
