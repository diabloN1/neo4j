package com.neo4flix.user.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.OptionalLong;

@Service
public class TotpService {

    private static final int SECRET_LENGTH = 20;
    private static final int CODE_LENGTH = 6;
    private static final long TIME_STEP_SECONDS = 30;
    private static final int ALLOWED_WINDOW = 1;

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateSecret() {
        byte[] secret = new byte[SECRET_LENGTH];
        secureRandom.nextBytes(secret);
        return base32Encode(secret);
    }

    public String generateProvisioningUri(String email, String secret) {
        String issuer = "Neo4flix";

        String label = URLEncoder.encode(
                issuer + ":" + email, StandardCharsets.UTF_8)
                .replace("+", "%20");

        String encodedIssuer = URLEncoder.encode(
                issuer, StandardCharsets.UTF_8);

        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1"
                + "&digits=6"
                + "&period=30";
    }

    public OptionalLong verifyCode(
            String secret,
            String code,
            long currentEpochSeconds,
            Long lastUsedStep) {

        if (code == null || !code.matches("\\d{6}")) {
            return OptionalLong.empty();
        }

        long currentStep = currentEpochSeconds / TIME_STEP_SECONDS;

        for (int offset = -ALLOWED_WINDOW; offset <= ALLOWED_WINDOW; offset++) {
            long step = currentStep + offset;

            if (step < 0 || (lastUsedStep != null && step <= lastUsedStep)) {
                continue;
            }

            String expectedCode = generateCode(secret, step);

            if (MessageDigest.isEqual(
                    expectedCode.getBytes(StandardCharsets.US_ASCII),
                    code.getBytes(StandardCharsets.US_ASCII))) {
                return OptionalLong.of(step);
            }
        }

        return OptionalLong.empty();
    }

    private String generateCode(String secret, long counter) {
        try {
            byte[] key = base32Decode(secret);

            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));

            byte[] hash = mac.doFinal(
                    java.nio.ByteBuffer.allocate(8).putLong(counter).array());

            int offset = hash[hash.length - 1] & 0x0F;

            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % 1_000_000;

            return String.format("%0" + CODE_LENGTH + "d", otp);

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid TOTP secret", e);
        }
    }

    private String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;

        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;

            while (bitsLeft >= 5) {
                result.append(BASE32_ALPHABET.charAt(
                        (buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }

        if (bitsLeft > 0) {
            result.append(BASE32_ALPHABET.charAt(
                    (buffer << (5 - bitsLeft)) & 0x1F));
        }

        return result.toString();
    }

    private byte[] base32Decode(String input) {
        String secret = input.replace("=", "").toUpperCase();
        byte[] result = new byte[secret.length() * 5 / 8];

        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;

        for (char c : secret.toCharArray()) {
            int value = BASE32_ALPHABET.indexOf(c);

            if (value < 0) {
                throw new IllegalArgumentException("Invalid Base32 secret");
            }

            buffer = (buffer << 5) | value;
            bitsLeft += 5;

            if (bitsLeft >= 8) {
                result[index++] = (byte) (buffer >> (bitsLeft - 8));
                bitsLeft -= 8;
            }
        }

        return result;
    }
}