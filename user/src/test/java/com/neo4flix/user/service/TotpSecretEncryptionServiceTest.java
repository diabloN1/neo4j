package com.neo4flix.user.service;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class TotpSecretEncryptionServiceTest {

    private final String testKey = Base64.getEncoder()
            .encodeToString(new byte[32]);

    @Test
    void shouldEncryptAndDecryptSecret() {
        var encryptionService = new TotpSecretEncryptionService(testKey);

        String original = "MY_TEST_TOTP_SECRET";

        String encrypted = encryptionService.encrypt(original);

        assertNotEquals(original, encrypted);
        assertEquals(original, encryptionService.decrypt(encrypted));
    }

    @Test
    void shouldUseDifferentCiphertextForEachEncryption() {
        var encryptionService = new TotpSecretEncryptionService(testKey);

        String first = encryptionService.encrypt("SAME_SECRET");
        String second = encryptionService.encrypt("SAME_SECRET");

        assertNotEquals(first, second);
    }

    @Test
    void shouldRejectTamperedCiphertext() {
        var encryptionService = new TotpSecretEncryptionService(testKey);

        String encrypted = encryptionService.encrypt("MY_SECRET");

        byte[] data = Base64.getDecoder().decode(encrypted);
        data[data.length - 1] ^= 1;

        String tampered = Base64.getEncoder().encodeToString(data);

        assertThrows(
                IllegalStateException.class,
                () -> encryptionService.decrypt(tampered));
    }
}