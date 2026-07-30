package org.cce.security;

import org.bouncycastle.crypto.generators.SCrypt;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

/**
 * Verifies a password against a Firebase Authentication SCRYPT hash, so users
 * migrated from the old Firebase project can keep logging in with their
 * existing passwords (Firebase never exposes plaintext).
 *
 * Firebase's scheme: derivedKey = scrypt(password, salt || saltSeparator,
 * N=2^memCost, r=8, p=1, dkLen=64); hash = AES-256-CTR(key=derivedKey[0:32],
 * iv=0) applied to the project signerKey. The project-level parameters
 * (signerKey, saltSeparator, rounds, memCost) come from the Firebase Auth
 * hash config; the per-user salt + hash come from the Auth export.
 */
public final class FirebaseScrypt {
    private FirebaseScrypt() {}

    public static boolean verify(
            String password,
            String saltB64,
            String knownHashB64,
            String signerKeyB64,
            String saltSeparatorB64,
            int rounds,
            int memCost) {
        try {
            byte[] salt = Base64.getDecoder().decode(saltB64);
            byte[] saltSep = Base64.getDecoder().decode(saltSeparatorB64);
            byte[] signer = Base64.getDecoder().decode(signerKeyB64);
            byte[] known = Base64.getDecoder().decode(knownHashB64);

            byte[] fullSalt = new byte[salt.length + saltSep.length];
            System.arraycopy(salt, 0, fullSalt, 0, salt.length);
            System.arraycopy(saltSep, 0, fullSalt, salt.length, saltSep.length);

            int n = 1 << memCost;
            byte[] derived = SCrypt.generate(
                    password.getBytes(StandardCharsets.UTF_8), fullSalt, n, 8, 1, 64);
            byte[] key = Arrays.copyOfRange(derived, 0, 32);

            Cipher cipher = Cipher.getInstance("AES/CTR/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"),
                    new IvParameterSpec(new byte[16]));
            byte[] out = cipher.doFinal(signer);

            // Firebase compares over the length of the stored hash.
            byte[] candidate = out.length == known.length ? out : Arrays.copyOf(out, known.length);
            return MessageDigest.isEqual(candidate, known);
        } catch (Exception e) {
            return false;
        }
    }
}
