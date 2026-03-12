package com.hrms.utility;

import java.util.Base64;

public class Base64Util {
    public static String encode(byte[] data) {
        return data != null ? Base64.getEncoder().encodeToString(data) : null;
    }

    public static byte[] decode(String data) {
        return data != null ? Base64.getDecoder().decode(data) : null;
    }
}
