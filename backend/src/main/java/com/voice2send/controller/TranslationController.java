package com.voice2send.controller;

import com.voice2send.dto.MultimodalDtos.TranslationRequest;
import com.voice2send.dto.MultimodalDtos.TranslationResponse;
import com.voice2send.service.TranslationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/translate")
@RequiredArgsConstructor
@Tag(name = "Translation", description = "Real-time multilingual translation across English, Tamil, Telugu, and Hindi")
public class TranslationController {

    private final TranslationService translationService;

    @PostMapping
    @Operation(summary = "Translate text between supported languages and extract sign language tokens")
    public ResponseEntity<TranslationResponse> translate(@Valid @RequestBody TranslationRequest request) {
        return ResponseEntity.ok(translationService.translate(
                request.getText(),
                request.getSourceLanguage(),
                request.getTargetLanguage()
        ));
    }
}
