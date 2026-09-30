package com.voice2send.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(name = "sender_id", nullable = false, length = 36)
    private String senderId;

    @Column(name = "sender_name", nullable = false, length = 100)
    private String senderName;

    @Column(name = "original_input", nullable = false, columnDefinition = "TEXT")
    private String originalInput;

    @Column(name = "input_type", nullable = false, length = 20)
    private String inputType; // voice, text, gesture

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "original_language", nullable = false)
    private Language originalLanguage;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "target_language", nullable = false)
    private Language targetLanguage;

    @Column(name = "translated_content", nullable = false, columnDefinition = "TEXT")
    private String translatedContent;

    @Column(name = "output_format", nullable = false, length = 20)
    private String outputFormat; // text, voice, gesture

    @Column(precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal confidence = new BigDecimal("0.950");

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
