package com.voice2send.service;

import com.voice2send.dto.MultimodalDtos.TranslationResponse;

public interface TranslationService {

    TranslationResponse translate(String text, String sourceLanguage, String targetLanguage);

    String detectLanguage(String text);
}
