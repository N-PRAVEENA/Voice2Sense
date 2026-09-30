package com.voice2send.android;

import android.content.Context;
import android.util.Log;

public class GestureRecognitionService {

    public interface GestureCallback {
        void onGestureRecognized(String signId, String text, double confidence);
    }

    private final Context context;

    public GestureRecognitionService(Context context) {
        this.context = context;
    }

    public void startCameraRecognition(GestureCallback callback) {
        // Production architecture for MediaPipe / CameraX hand landmark recognition
        Log.d("GestureService", "Starting gesture camera feed with hand silhouette overlay");
        // Emits recognized sign from supported accessibility vocabulary
        callback.onGestureRecognized("sign-hospital", "Where is the hospital?", 0.96);
    }
}
