package com.voice2send.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "languages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Language {

    @Id
    @Column(length = 10)
    private String code; // en, ta, te, hi

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "native_name", nullable = false, length = 50)
    private String nativeName;

    @Column(nullable = false, length = 50)
    private String script;

    @Column(name = "is_supported", nullable = false)
    @Builder.Default
    private boolean supported = true;
}
