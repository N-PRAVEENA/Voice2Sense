package com.voice2send.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "person_a_name", nullable = false, length = 100)
    @Builder.Default
    private String personAName = "Person A";

    @Column(name = "person_a_input_method", nullable = false, length = 20)
    @Builder.Default
    private String personAInputMethod = "voice";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "person_a_language", nullable = false)
    private Language personALanguage;

    @Column(name = "person_b_name", nullable = false, length = 100)
    @Builder.Default
    private String personBName = "Person B";

    @Column(name = "person_b_output_method", nullable = false, length = 20)
    @Builder.Default
    private String personBOutputMethod = "text";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "person_b_language", nullable = false)
    private Language personBLanguage;

    @Column(name = "smart_mode", nullable = false)
    @Builder.Default
    private boolean smartMode = true;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

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
