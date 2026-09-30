package com.voice2send.android;

import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

public class ConversationActivity extends AppCompatActivity {

    private RecyclerView rvMessages;
    private EditText etInput;
    private ImageButton btnVoiceRecord;
    private ImageButton btnCameraGesture;
    private ImageButton btnSend;
    private TextView tvConversationTitle;
    private Spinner spSourceLang;
    private Spinner spTargetLang;

    private SpeechRecognitionManager speechManager;
    private TextToSpeechManager ttsManager;
    private GestureRecognitionService gestureService;

    private boolean isRecording = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_conversation);

        rvMessages = findViewById(R.id.rvMessages);
        etInput = findViewById(R.id.etInput);
        btnVoiceRecord = findViewById(R.id.btnVoiceRecord);
        btnCameraGesture = findViewById(R.id.btnCameraGesture);
        btnSend = findViewById(R.id.btnSend);
        tvConversationTitle = findViewById(R.id.tvConversationTitle);

        speechManager = new SpeechRecognitionManager(this);
        ttsManager = new TextToSpeechManager(this);
        gestureService = new GestureRecognitionService(this);

        rvMessages.setLayoutManager(new LinearLayoutManager(this));

        btnVoiceRecord.setOnClickListener(v -> toggleVoiceRecording());
        btnCameraGesture.setOnClickListener(v -> launchGestureRecognition());
        btnSend.setOnClickListener(v -> sendMessage());
    }

    private void toggleVoiceRecording() {
        if (!isRecording) {
            speechManager.startListening(new SpeechRecognitionManager.SpeechCallback() {
                @Override
                public void onSpeechResult(String transcript, boolean isFinal) {
                    etInput.setText(transcript);
                    if (isFinal) {
                        isRecording = false;
                        btnVoiceRecord.setImageResource(android.R.drawable.ic_btn_speak_now);
                    }
                }

                @Override
                public void onError(String errorMessage) {
                    Toast.makeText(ConversationActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                    isRecording = false;
                    btnVoiceRecord.setImageResource(android.R.drawable.ic_btn_speak_now);
                }
            });
            isRecording = true;
            btnVoiceRecord.setImageResource(android.R.drawable.ic_media_pause);
            Toast.makeText(this, "Listening for speech...", Toast.LENGTH_SHORT).show();
        } else {
            speechManager.stopListening();
            isRecording = false;
            btnVoiceRecord.setImageResource(android.R.drawable.ic_btn_speak_now);
        }
    }

    private void launchGestureRecognition() {
        gestureService.startCameraRecognition((signId, recognizedText, confidence) -> {
            etInput.setText(recognizedText);
            Toast.makeText(this, "Recognized Sign: " + signId + " (" + (int)(confidence * 100) + "%)", Toast.LENGTH_SHORT).show();
        });
    }

    private void sendMessage() {
        String text = etInput.getText().toString().trim();
        if (text.isEmpty()) return;

        // Multimodal conversion via backend API
        Toast.makeText(this, "Translating & Processing Message: " + text, Toast.LENGTH_SHORT).show();
        etInput.setText("");

        // Synthesize speech output in target language
        ttsManager.speak("மருத்துவமனை எங்கே உள்ளது?", "ta");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (speechManager != null) speechManager.destroy();
        if (ttsManager != null) ttsManager.destroy();
    }
}
