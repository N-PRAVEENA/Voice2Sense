package com.voice2send.android;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import java.util.Locale;

public class TextToSpeechManager implements TextToSpeech.OnInitListener {

    private static final String TAG = "TextToSpeechManager";

    private final Context context;
    private TextToSpeech tts;
    private boolean isInitialized = false;

    public TextToSpeechManager(Context context) {
        this.context = context;
        this.tts = new TextToSpeech(context, this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true;
            tts.setSpeechRate(0.95f);
            tts.setPitch(1.0f);
        } else {
            Log.e(TAG, "Initialization failed");
        }
    }

    public void speak(String text, String languageCode) {
        if (!isInitialized || tts == null) return;

        Locale locale;
        switch (languageCode.toLowerCase()) {
            case "ta":
                locale = new Locale("ta", "IN");
                break;
            case "te":
                locale = new Locale("te", "IN");
                break;
            case "hi":
                locale = new Locale("hi", "IN");
                break;
            default:
                locale = Locale.US;
                break;
        }

        int result = tts.setLanguage(locale);
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            tts.setLanguage(Locale.US);
        }

        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "voice2send_tts_" + System.currentTimeMillis());
    }

    public void stop() {
        if (tts != null) {
            tts.stop();
        }
    }

    public void destroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }
}
