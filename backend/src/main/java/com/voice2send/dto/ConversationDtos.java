package com.voice2send.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class ConversationDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateConversationRequest {
        private String title;
        private ParticipantDto personA;
        private ParticipantDto personB;
        private Boolean smartMode = true;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipantDto {
        private String name;
        private String inputMethod;
        private String outputMethod;
        private String language;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationResponse {
        private String id;
        private String userId;
        private String title;
        private ParticipantDto personA;
        private ParticipantDto personB;
        private boolean smartMode;
        private int messageCount;
        private MessageSummaryDto lastMessage;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageSummaryDto {
        private String content;
        private String senderName;
        private Instant timestamp;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendMessageRequest {
        @NotBlank(message = "Message content is required")
        private String originalInput;

        private String inputType = "text"; // voice, text, gesture
        private String senderName;
        private String originalLanguage;
        private String targetLanguage;
        private String outputFormat = "text"; // text, voice, gesture
        private BigDecimal confidence;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        private String id;
        private String conversationId;
        private String senderId;
        private String senderName;
        private String originalInput;
        private String inputType;
        private String originalLanguage;
        private String targetLanguage;
        private String translatedContent;
        private String outputFormat;
        private List<String> signTokens;
        private BigDecimal confidence;
        private Instant createdAt;
    }
}
