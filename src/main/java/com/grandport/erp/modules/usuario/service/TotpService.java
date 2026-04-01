package com.grandport.erp.modules.usuario.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;

@Service
public class TotpService {

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateSecret() {
        byte[] buffer = new byte[20];
        RANDOM.nextBytes(buffer);
        return encodeBase32(buffer);
    }

    public String buildOtpAuthUri(String issuer, String accountName, String secret) {
        String normalizedIssuer = issuer.replace(" ", "%20");
        String normalizedAccount = accountName.replace(" ", "%20");
        return "otpauth://totp/" + normalizedIssuer + ":" + normalizedAccount +
                "?secret=" + secret +
                "&issuer=" + normalizedIssuer +
                "&algorithm=SHA1&digits=6&period=30";
    }

    public String buildQrCodeDataUrl(String value, int size) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            BitMatrix matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, size, size);
            BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = image.createGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, size, size);
            graphics.setColor(Color.BLACK);
            for (int x = 0; x < size; x++) {
                for (int y = 0; y < size; y++) {
                    if (matrix.get(x, y)) {
                        graphics.fillRect(x, y, 1, 1);
                    }
                }
            }
            graphics.dispose();

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (WriterException | java.io.IOException e) {
            return null;
        }
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || !code.matches("\\d{6}")) {
            return false;
        }
        long timeWindow = Instant.now().getEpochSecond() / 30;
        for (long offset = -1; offset <= 1; offset++) {
            if (generateCode(secret, timeWindow + offset).equals(code)) {
                return true;
            }
        }
        return false;
    }

    private String generateCode(String base32Secret, long counter) {
        try {
            byte[] key = decodeBase32(base32Secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);
            int otp = binary % 1_000_000;
            return String.format(Locale.ROOT, "%06d", otp);
        } catch (Exception e) {
            return "";
        }
    }

    private String encodeBase32(byte[] data) {
        StringBuilder output = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;
        for (byte datum : data) {
            buffer <<= 8;
            buffer |= datum & 0xFF;
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                output.append(BASE32_ALPHABET.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            output.append(BASE32_ALPHABET.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        return output.toString();
    }

    private byte[] decodeBase32(String value) {
        String normalized = value.replace("=", "").replace(" ", "").toUpperCase(Locale.ROOT);
        ByteBuffer buffer = ByteBuffer.allocate(normalized.length() * 5 / 8 + 8);
        int bitsLeft = 0;
        int current = 0;
        for (char c : normalized.toCharArray()) {
            int index = BASE32_ALPHABET.indexOf(c);
            if (index < 0) {
                continue;
            }
            current = (current << 5) | index;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                buffer.put((byte) ((current >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }
        byte[] out = new byte[buffer.position()];
        buffer.flip();
        buffer.get(out);
        return out;
    }
}
