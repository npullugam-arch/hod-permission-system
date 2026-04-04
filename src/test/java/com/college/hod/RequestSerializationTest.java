package com.college.hod;

import com.college.hod.entity.Certificate;
import com.college.hod.entity.Request;
import com.college.hod.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestSerializationTest {

    @Test
    void requestCertificateAssociationHasJsonLoopProtection() throws Exception {
        Field certificateField = Request.class.getDeclaredField("certificate");
        JsonIgnoreProperties requestCertificateAnnotation = certificateField.getAnnotation(JsonIgnoreProperties.class);

        assertNotNull(requestCertificateAnnotation);
        assertTrue(containsValue(requestCertificateAnnotation.value(), "request"));
    }

    @Test
    void certificateRequestAssociationHasJsonLoopProtection() throws Exception {
        Field requestField = Certificate.class.getDeclaredField("request");
        JsonIgnoreProperties certificateRequestAnnotation = requestField.getAnnotation(JsonIgnoreProperties.class);

        assertNotNull(certificateRequestAnnotation);
        assertTrue(containsValue(certificateRequestAnnotation.value(), "certificate"));
    }

    @Test
    void userPasswordIsIgnoredInApiResponses() throws Exception {
        Field passwordField = User.class.getDeclaredField("password");

        assertNotNull(passwordField.getAnnotation(JsonIgnore.class));
    }

    private boolean containsValue(String[] values, String expected) {
        for (String value : values) {
            if (expected.equals(value)) {
                return true;
            }
        }

        return false;
    }
}
