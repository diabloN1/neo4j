package com.neo4flix.user.service;

import org.junit.jupiter.api.Test;

import java.util.OptionalLong;

import static org.junit.jupiter.api.Assertions.*;

class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    void shouldVerifyRfc6238TestVector() {
        // RFC 6238 SHA-1 test secret
        String secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

        // At timestamp 59, the expected six-digit OTP is 287082.
        OptionalLong result = totpService.verifyCode(
                secret, "287082", 59L, null);

        assertTrue(result.isPresent());
        assertEquals(1L, result.getAsLong());
    }

    @Test
    void shouldRejectReusedTotpCode() {
        String secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

        OptionalLong result = totpService.verifyCode(
                secret, "287082", 59L, 1L);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldRejectInvalidCodeFormat() {
        assertTrue(totpService.verifyCode(
                "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
                "12345",
                59L,
                null).isEmpty());
    }

    @Test
    void shouldGenerateValidBase32Secret() {
        String secret = totpService.generateSecret();

        assertEquals(32, secret.length());
        assertTrue(secret.matches("[A-Z2-7]+"));
    }
}