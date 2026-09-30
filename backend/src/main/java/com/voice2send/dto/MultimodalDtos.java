package com.voice2send.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class MultimodalDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TranslationRequest {
        @NotBlank(message = "Text is required")
        private String text;
        private String sourceLanguage = "en";
        private String targetLanguage = "ta";
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TranslationResponse {
        private String originalText;
        private String sourceLanguage;
        private String targetLanguage;
        private String translatedText;
        private List<String> signTokens;
        private String provider;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GestureRecognitionRequest {
        private String gestureId;
        private String targetLanguage = "en";
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GestureRecognitionResponse {
        private boolean recognized;
        private String signId;
        private String name;
        private BigDecimal confidence;
        private String text;
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SignVocabularyDto {
        private String id;
        private String name;
        private String category;
        private String gestureHint;
        private String handShape;
        private String movementDescription;
        private String iconName;
        private Map<String, String> translations;
    }
}
