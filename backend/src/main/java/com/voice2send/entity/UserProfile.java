package com.voice2send.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @Column(length = 36)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "preferred_language", nullable = false, length = 10)
    @Builder.Default
    private String preferredLanguage = "en";

    @Column(name = "communication_preference", nullable = false, length = 20)
    @Builder.Default
    private String communicationPreference = "text"; // text, voice, sign

    @Column(name = "output_preference", nullable = false, length = 20)
    @Builder.Default
    private String outputPreference = "text"; // text, voice, sign

    @Column(name = "input_method", nullable = false, length = 20)
    @Builder.Default
    private String inputMethod = "text"; // text, voice, sign

    @Column(name = "output_method", nullable = false, length = 20)
    @Builder.Default
    private String outputMethod = "text"; // text, voice, sign

    @Column(name = "profile_picture_url", columnDefinition = "TEXT")
    private String profilePictureUrl;

    @Column(name = "voice_pitch", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal voicePitch = new BigDecimal("1.00");

    @Column(name = "voice_speed", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal voiceSpeed = new BigDecimal("1.00");

    @Column(name = "high_contrast", nullable = false)
    @Builder.Default
    private boolean highContrast = false;

    @Column(name = "font_size", nullable = false, length = 20)
    @Builder.Default
    private String fontSize = "normal";

    @Column(name = "haptic_feedback", nullable = false)
    @Builder.Default
    private boolean hapticFeedback = true;

    @Column(name = "screen_reader_announce", nullable = false)
    @Builder.Default
    private boolean screenReaderAnnounce = true;

    @Column(name = "dark_mode", nullable = false)
    @Builder.Default
    private boolean darkMode = false;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
