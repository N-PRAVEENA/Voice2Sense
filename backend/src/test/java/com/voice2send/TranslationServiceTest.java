package com.voice2send;

import com.voice2send.dto.MultimodalDtos.TranslationResponse;
import com.voice2send.service.TranslationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class TranslationServiceTest {

    private TranslationServiceImpl translationService;

    @BeforeEach
    void setUp() {
        translationService = new TranslationServiceImpl();
    }

    @Test
    @DisplayName("Should accurately translate 'Where is the hospital?' from English to Tamil")
    void testHospitalTranslationEnglishToTamil() {
        TranslationResponse response = translationService.translate("Where is the hospital?", "en", "ta");

        assertNotNull(response);
        assertEquals("Where is the hospital?", response.getOriginalText());
        assertEquals("en", response.getSourceLanguage());
        assertEquals("ta", response.getTargetLanguage());
        assertEquals("மருத்துவமனை எங்கே உள்ளது?", response.getTranslatedText());
        assertTrue(response.getSignTokens().contains("sign-hospital"));
    }

    @Test
    @DisplayName("Should accurately translate 'Help' from English to Telugu and Hindi")
    void testHelpTranslation() {
        TranslationResponse teResponse = translationService.translate("Help", "en", "te");
        assertEquals("సహాయం", teResponse.getTranslatedText());

        TranslationResponse hiResponse = translationService.translate("Help", "en", "hi");
        assertEquals("मदद", hiResponse.getTranslatedText());
    }

    @Test
    @DisplayName("Should detect script correctly for Tamil, Telugu, and Hindi")
    void testScriptDetection() {
        assertEquals("ta", translationService.detectLanguage("மருத்துவமனை"));
        assertEquals("te", translationService.detectLanguage("ఆసుపత్రి"));
        assertEquals("hi", translationService.detectLanguage("अस्पताल"));
        assertEquals("en", translationService.detectLanguage("Hospital"));
    }
}
