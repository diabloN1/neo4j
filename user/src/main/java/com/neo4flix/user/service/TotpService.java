
package com.neo4flix.user.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.OptionalLong;

import org.karabela.totp.code.CodeGenerator;
import org.karabela.totp.code.DefaultCodeGenerator;
import org.karabela.totp.code.HashingAlgorithm;
import org.karabela.totp.exceptions.CodeGenerationException;
import org.karabela.totp.qr.QrData;
import org.karabela.totp.secret.DefaultSecretGenerator;
import org.karabela.totp.secret.SecretGenerator;
import org.springframework.stereotype.Service;

@Service
public class TotpService {

    private static final int CODE_LENGTH = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int ALLOWED_WINDOW = 1;
    private static final String ISSUER = "Neo4flix";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();

    private final CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, CODE_LENGTH);

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String generateProvisioningUri(String email, String secret) {
        return new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(CODE_LENGTH)
                .period(TIME_STEP_SECONDS)
                .build()
                .getUri();
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

            if (step < 0 ||
                    (lastUsedStep != null && step <= lastUsedStep)) {
                continue;
            }

            try {
                String expectedCode = codeGenerator.generate(secret, step);

                if (MessageDigest.isEqual(
                        expectedCode.getBytes(StandardCharsets.US_ASCII),
                        code.getBytes(StandardCharsets.US_ASCII))) {
                    return OptionalLong.of(step);
                }

            } catch (CodeGenerationException e) {
                throw new IllegalArgumentException(
                        "Could not generate TOTP code", e);
            }
        }

        return OptionalLong.empty();
    }
}
