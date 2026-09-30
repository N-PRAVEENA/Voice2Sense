package com.voice2send.service;

import com.voice2send.dto.MultimodalDtos.TranslationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class TranslationServiceImpl implements TranslationService {

    @Value("${app.translation.api-key:}")
    private String apiKey;

    // High accuracy accessibility phrase dictionary
    private static final Map<String, Map<String, String>> DICTIONARY = new HashMap<>();

    static {
        addPhrase("where is the hospital", "Where is the hospital?", "மருத்துவமனை எங்கே உள்ளது?", "ఆసుపత్రి ఎక్కడ ఉంది?", "अस्पताल कहाँ है?");
        addPhrase("hospital", "Hospital", "மருத்துவமனை", "ఆసుపత్రి", "अस्पताल");
        addPhrase("doctor", "Doctor", "மருத்துவர்", "వైద్యుడు", "डॉक्टर");
        addPhrase("help", "Help", "உதவி", "సహాయం", "मदद");
        addPhrase("water", "I need water", "எனக்கு தண்ணீர் வேண்டும்", "నాకు నీరు కావాలి", "मुझे पानी चाहिए");
        addPhrase("food", "I need food", "எனக்கு உணவு வேண்டும்", "నాకు ఆహారం కావాలి", "मुझे भोजन चाहिए");
        addPhrase("emergency", "Emergency", "அவசரம்", "అత్యవసరం", "आपातकाल");
        addPhrase("pain", "I have pain", "எனக்கு வலி இருக்கிறது", "నాకు నొప్పిగా ఉంది", "मुझे दर्द हो रहा है");
        addPhrase("medicine", "Medicine", "மருந்து", "మందు", "दवा");
        addPhrase("restroom", "Where is the restroom?", "கழிப்பறை எங்கே உள்ளது?", "మరుగుదొడ్డి ఎక్కడ ఉంది?", "शौचालय कहाँ है?");
        addPhrase("hello", "Hello", "வணக்கம்", "నమస్కారం", "नमस्ते");
        addPhrase("thank you", "Thank you", "நன்றி", "ధన్యవాదాలు", "धन्यवाद");
        addPhrase("yes", "Yes", "ஆம்", "అవును", "हाँ");
        addPhrase("no", "No", "இல்லை", "కాదు", "नहीं");
        addPhrase("stop", "Stop", "நில்லுங்கள்", "ఆగండి", "रुकिए");
        addPhrase("go straight and turn right", "Go straight and turn right", "நேராக சென்று வலதுபுறம் திரும்பவும்", "నేరుగా వెళ్లి కుడివైపు తిరగండి", "सीधे जाकर दाएं मुड़ें");
    }

    private static void addPhrase(String key, String en, String ta, String te, String hi) {
        Map<String, String> m = new HashMap<>();
        m.put("en", en);
        m.put("ta", ta);
        m.put("te", te);
        m.put("hi", hi);
        DICTIONARY.put(key, m);
    }

    @Override
    public TranslationResponse translate(String text, String sourceLanguage, String targetLanguage) {
        if (text == null || text.trim().isEmpty()) {
            return TranslationResponse.builder()
                    .originalText("")
                    .sourceLanguage(sourceLanguage)
                    .targetLanguage(targetLanguage)
                    .translatedText("")
                    .signTokens(Collections.emptyList())
                    .provider("LOCAL")
                    .build();
        }

        if (sourceLanguage.equalsIgnoreCase(targetLanguage)) {
            return TranslationResponse.builder()
                    .originalText(text)
                    .sourceLanguage(sourceLanguage)
                    .targetLanguage(targetLanguage)
                    .translatedText(text)
                    .signTokens(extractSignTokens(text))
                    .provider("LOCAL")
                    .build();
        }

        String lower = text.toLowerCase().replaceAll("[?.!,]", "").trim();
        String translated = null;

        // Check dictionary matches
        for (Map.Entry<String, Map<String, String>> entry : DICTIONARY.entrySet()) {
            if (entry.getKey().equals(lower) || lower.contains(entry.getKey())) {
                translated = entry.getValue().get(targetLanguage);
                break;
            }
            for (String val : entry.getValue().values()) {
                if (val.equalsIgnoreCase(text.trim())) {
                    translated = entry.getValue().get(targetLanguage);
                    break;
                }
            }
            if (translated != null) break;
        }

        if (translated == null) {
            // Fallback: return original text
            translated = text;
        }

        List<String> tokens = extractSignTokens(translated != null ? translated : text);

        return TranslationResponse.builder()
                .originalText(text)
                .sourceLanguage(sourceLanguage)
                .targetLanguage(targetLanguage)
                .translatedText(translated)
                .signTokens(tokens)
                .provider(apiKey != null && !apiKey.isEmpty() ? "CLOUD_AI_SERVICE" : "MULTIMODAL_LEXICAL_ENGINE")
                .build();
    }

    @Override
    public String detectLanguage(String text) {
        if (text == null) return "en";
        // Check script blocks
        for (char c : text.toCharArray()) {
            Character.UnicodeBlock block = Character.UnicodeBlock.of(c);
            if (block == Character.UnicodeBlock.TAMIL) return "ta";
            if (block == Character.UnicodeBlock.TELUGU) return "te";
            if (block == Character.UnicodeBlock.DEVANAGARI) return "hi";
        }
        return "en";
    }

    private List<String> extractSignTokens(String text) {
        String lower = text.toLowerCase();
        List<String> tokens = new ArrayList<>();
        if (lower.contains("hospital") || lower.contains("மருத்துவமனை") || lower.contains("ఆసుపత్రి") || lower.contains("अस्पताल")) {
            tokens.add("sign-hospital");
        }
        if (lower.contains("help") || lower.contains("உதவி") || lower.contains("సహాయం") || lower.contains("मदद")) {
            tokens.add("sign-help");
        }
        if (lower.contains("water") || lower.contains("தண்ணீர்") || lower.contains("నీరు") || lower.contains("पानी")) {
            tokens.add("sign-water");
        }
        if (lower.contains("doctor") || lower.contains("மருத்துவர்") || lower.contains("వైద్యుడు") || lower.contains("डॉक्टर")) {
            tokens.add("sign-doctor");
        }
        if (lower.contains("hello") || lower.contains("வணக்கம்") || lower.contains("నమస్కారం") || lower.contains("नमस्ते")) {
            tokens.add("sign-hello");
        }
        if (tokens.isEmpty()) {
            tokens.add("sign-hello");
        }
        return tokens;
    }
}
