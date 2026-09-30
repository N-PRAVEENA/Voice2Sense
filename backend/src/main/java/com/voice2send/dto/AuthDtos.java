package com.voice2send.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

public class AuthDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must have at least 6 characters")
        private String password;

        private String confirmPassword;
        private String preferredLanguage = "en";
        private String communicationPreference = "text";
        private String outputPreference = "text";
        private String inputMethod = "text";
        private String outputMethod = "text";
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreferencesRequest {
        @NotBlank(message = "inputMethod is required (text, voice, sign)")
        private String inputMethod;

        @NotBlank(message = "outputMethod is required (text, voice, sign)")
        private String outputMethod;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PreferencesResponse {
        private String inputMethod;
        private String outputMethod;
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String message;
        private String token;
        private String refreshToken;
        private UserDto user;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefreshTokenRequest {
        @NotBlank
        private String refreshToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForgotPasswordRequest {
        @NotBlank
        @Email
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResetPasswordRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String resetCode;

        @NotBlank
        @Size(min = 6)
        private String newPassword;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private String id;
        private String fullName;
        private String email;
        private String preferredLanguage;
        private String communicationPreference;
        private String outputPreference;
        private String inputMethod;
        private String outputMethod;
        private String profilePicture;
        private BigDecimal voicePitch;
        private BigDecimal voiceSpeed;
        private boolean highContrast;
        private String fontSize;
        private boolean hapticFeedback;
        private boolean screenReaderAnnounce;
        private boolean darkMode;
    }
}
