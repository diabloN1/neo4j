
package com.neo4flix.user.service;

import org.junit.jupiter.api.Test;

import java.util.OptionalLong;

import static org.junit.jupiter.api.Assertions.*;

class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    private static final String RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    @Test
    void shouldVerifyRfc6238TestVector() {
        OptionalLong result = totpService.verifyCode(
                RFC_SECRET, "287082", 59L, null);

        assertTrue(result.isPresent());
        assertEquals(1L, result.getAsLong());
    }

    @Test
    void shouldRejectReusedTotpCode() {
        OptionalLong result = totpService.verifyCode(
                RFC_SECRET, "287082", 59L, 1L);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldRejectInvalidCodeFormat() {
        assertTrue(totpService.verifyCode(
                RFC_SECRET, "12345", 59L, null).isEmpty());

        assertTrue(totpService.verifyCode(
                RFC_SECRET, "abcdef", 59L, null).isEmpty());
    }

    @Test
    void shouldRejectNullCode() {
        assertTrue(totpService.verifyCode(
                RFC_SECRET, null, 59L, null).isEmpty());
    }

    @Test
    void shouldGenerateValidBase32Secret() {
        String secret = totpService.generateSecret();

        assertEquals(32, secret.length());
        assertTrue(secret.matches("[A-Z2-7]+"));
    }

    @Test
    void shouldGenerateUniqueSecrets() {
        String first = totpService.generateSecret();
        String second = totpService.generateSecret();

        assertNotEquals(first, second);
    }
}
