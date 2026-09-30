package com.voice2send.android;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 101;

    private TextView tvStatus;
    private Button btnStartConversation;
    private Button btnSignGlossary;
    private Button btnAccessibilitySettings;
    private FloatingActionButton fabNewChat;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        tvStatus = findViewById(R.id.tvStatus);
        btnStartConversation = findViewById(R.id.btnStartConversation);
        btnSignGlossary = findViewById(R.id.btnSignGlossary);
        btnAccessibilitySettings = findViewById(R.id.btnAccessibilitySettings);
        fabNewChat = findViewById(R.id.fabNewChat);

        checkAndRequestPermissions();

        btnStartConversation.setOnClickListener(v -> launchConversation());
        fabNewChat.setOnClickListener(v -> launchConversation());

        btnSignGlossary.setOnClickListener(v -> {
            Toast.makeText(this, "Opening Sign Language Vocabulary (16+ Signs)", Toast.LENGTH_SHORT).show();
        });

        btnAccessibilitySettings.setOnClickListener(v -> {
            Toast.makeText(this, "High Contrast & Screen Reader Preferences", Toast.LENGTH_SHORT).show();
        });
    }

    private void launchConversation() {
        Intent intent = new Intent(MainActivity.this, ConversationActivity.class);
        startActivity(intent);
    }

    private void checkAndRequestPermissions() {
        String[] permissions = new String[]{
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.CAMERA,
                Manifest.permission.VIBRATE
        };

        boolean allGranted = true;
        for (String perm : permissions) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
        } else {
            tvStatus.setText("Accessibility Sensors Ready (Mic & Camera Active)");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean granted = true;
            for (int res : grantResults) {
                if (res != PackageManager.PERMISSION_GRANTED) {
                    granted = false;
                    break;
                }
            }
            if (granted) {
                tvStatus.setText("Accessibility Sensors Ready (Mic & Camera Active)");
                Toast.makeText(this, "Camera and Microphone permissions granted", Toast.LENGTH_SHORT).show();
            } else {
                tvStatus.setText("Limited Mode: Permissions needed for Speech & Gesture input");
            }
        }
    }
}
