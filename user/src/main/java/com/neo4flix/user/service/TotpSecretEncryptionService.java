package com.neo4flix.user.service;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TotpSecretEncryptionService {

    private static final int NONCE_LENGTH = 12;
    private static final int TAG_LENGTH = 128;

    private final SecretKeySpec key;
    private final SecureRandom secureRandom = new SecureRandom();

    public TotpSecretEncryptionService(
            @Value("${mfa.encryption-key}") String encodedKey) {
        byte[] keyBytes = Base64.getDecoder().decode(encodedKey);

        if (keyBytes.length != 32) {
            throw new IllegalArgumentException("MFA encryption key must be exactly 32 bytes");
        }

        this.key = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plainText) {
        try {
            byte[] nonce = new byte[NONCE_LENGTH];
            secureRandom.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH, nonce));

            byte[] ciphertext = cipher.doFinal(plainText.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            byte[] result = new byte[nonce.length + ciphertext.length];

            System.arraycopy(nonce, 0, result, 0, nonce.length);
            System.arraycopy(ciphertext, 0, result, nonce.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(result);

        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to encrypt TOTP secret", e);
        }
    }

    public String decrypt(String encrypted) {
        try {
            byte[] data = Base64.getDecoder().decode(encrypted);

            if (data.length <= NONCE_LENGTH) {
                throw new IllegalArgumentException("Invalid encypted secret");
            }

            byte[] nonce = java.util.Arrays.copyOfRange(data, 0, NONCE_LENGTH);
            byte[] ciphertext = java.util.Arrays.copyOfRange(data, NONCE_LENGTH, data.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH, nonce));

            byte[] plainText = cipher.doFinal(ciphertext);

            return new String(plainText, java.nio.charset.StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new IllegalStateException("Unable to decrypt TOTP secret", e);

        }
    }

}
