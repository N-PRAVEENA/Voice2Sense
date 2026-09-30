package com.voice2send.controller;

import com.voice2send.entity.Language;
import com.voice2send.repository.LanguageRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/languages")
@RequiredArgsConstructor
@Tag(name = "Languages", description = "Supported multilingual language configurations")
public class LanguageController {

    private final LanguageRepository languageRepository;

    @GetMapping
    @Operation(summary = "Get list of all supported languages")
    public ResponseEntity<List<Language>> getLanguages() {
        return ResponseEntity.ok(languageRepository.findBySupportedTrue());
    }
}
