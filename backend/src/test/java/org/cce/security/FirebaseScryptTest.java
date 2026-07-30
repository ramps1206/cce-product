package org.cce.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validates the Firebase SCRYPT verifier against Firebase's official published
 * test vector. If this passes, migrated Firebase passwords will verify.
 */
class FirebaseScryptTest {

    // Canonical Firebase Auth scrypt test vector.
    private static final String SIGNER_KEY =
            "jxspr8Ki0RYycVU8zykbdLGjFQ3McFUH0uiiTvC8pVMXAn210wjLNmdZJzxUECKbm0QsEmYUSDzZvpjeJ9WmXA==";
    private static final String SALT_SEP = "Bw==";
    private static final int ROUNDS = 8;
    private static final int MEM_COST = 14;

    private static final String PASSWORD = "user1password";
    private static final String SALT = "42xEC+ixf3L2lw==";
    // Verified independently against Node's OpenSSL scrypt + AES-256-CTR
    // (both produce this byte-for-byte), confirming the algorithm.
    private static final String KNOWN_HASH =
            "lSrfV15cpx95/sZS2W9c9Kp6i/LVgQNDNC/qzrCnh1SAyZvqmZqAjTdn3aoItz+VHjoZilo78198JAdRuid5lQ==";

    @Test
    void verifiesCorrectPassword() {
        assertTrue(FirebaseScrypt.verify(
                PASSWORD, SALT, KNOWN_HASH, SIGNER_KEY, SALT_SEP, ROUNDS, MEM_COST));
    }

    @Test
    void rejectsWrongPassword() {
        assertFalse(FirebaseScrypt.verify(
                "wrongpassword", SALT, KNOWN_HASH, SIGNER_KEY, SALT_SEP, ROUNDS, MEM_COST));
    }
}
