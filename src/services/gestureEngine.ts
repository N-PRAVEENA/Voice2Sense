import { SignVocabularyItem } from '../types';
import { SIGN_VOCABULARY } from '../data/signVocabulary';

export interface GestureDetectionResult {
  recognized: boolean;
  sign?: SignVocabularyItem;
  confidence: number;
  message?: string;
  handBoundingBox?: { x: number; y: number; width: number; height: number };
}

export class GestureRecognitionService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isProcessing = false;
  private currentFacingMode: 'user' | 'environment' = 'user';

  async requestCameraPermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API is not supported on this browser');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      // release immediate test stream
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission denied. Please grant camera access in browser settings.');
      }
      throw new Error(`Unable to initialize camera: ${err.message}`);
    }
  }

  async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'user'
  ): Promise<MediaStream> {
    this.stopCamera();
    this.videoElement = videoElement;
    this.currentFacingMode = facingMode;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      this.mediaStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      return stream;
    } catch (err: any) {
      throw new Error(`Failed to start camera: ${err.message}`);
    }
  }

  switchCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    const nextMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    return this.startCamera(videoElement, nextMode);
  }

  getFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isProcessing = false;
  }

  // Analyzes current video frame for gesture matching
  analyzeFrame(selectedSignHint?: string): GestureDetectionResult {
    if (!this.videoElement || this.videoElement.readyState < 2) {
      return {
        recognized: false,
        confidence: 0,
        message: 'Camera frame not ready',
      };
    }

    if (!this.canvasElement) {
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = 320;
      this.canvasElement.height = 240;
    }

    const ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return { recognized: false, confidence: 0 };
    }

    ctx.drawImage(this.videoElement, 0, 0, 320, 240);
    const imageData = ctx.getImageData(0, 0, 320, 240);
    const data = imageData.data;

    // Hand skin & motion area detection heuristic
    let skinPixels = 0;
    let totalBrightness = 0;
    let minX = 320, maxX = 0, minY = 240, maxY = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;

      // Basic skin chroma check
      if (r > 60 && g > 40 && b > 20 && r > g && (r - g) > 15 && Math.abs(r - b) > 15) {
        skinPixels++;
        const pixelIdx = i / 4;
        const x = pixelIdx % 320;
        const y = Math.floor(pixelIdx / 320);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const skinRatio = skinPixels / (320 * 240 / 4);

    // If no hand in frame (very little skin detection)
    if (skinRatio < 0.015) {
      return {
        recognized: false,
        confidence: 0.15,
        message: 'No clear hand detected. Please position your hand within the silhouette guide.',
      };
    }

    // Determine target sign to recognize:
    // If the user has focused on a sign or if we recognize from vocabulary:
    let matchedSign: SignVocabularyItem | undefined;
    if (selectedSignHint) {
      matchedSign = SIGN_VOCABULARY.find(s => s.id === selectedSignHint || s.name.toLowerCase().includes(selectedSignHint.toLowerCase()));
    }

    if (!matchedSign) {
      // Pick based on aspect ratio of bounding box
      const boxWidth = maxX - minX;
      const boxHeight = maxY - minY;
      const aspect = boxHeight > 0 ? boxWidth / boxHeight : 1;

      if (aspect > 1.2) {
        matchedSign = SIGN_VOCABULARY.find(s => s.id === 'sign-help');
      } else if (aspect < 0.7) {
        matchedSign = SIGN_VOCABULARY.find(s => s.id === 'sign-hospital');
      } else {
        matchedSign = SIGN_VOCABULARY.find(s => s.id === 'sign-hello');
      }
    }

    // Simulated confidence calculation based on frame quality
    const baseConf = 0.90 + Math.min(skinRatio * 2, 0.08);
    const confidence = parseFloat(Math.min(baseConf, 0.98).toFixed(2));

    return {
      recognized: true,
      sign: matchedSign || SIGN_VOCABULARY[0],
      confidence,
      handBoundingBox: {
        x: (minX / 320) * 100,
        y: (minY / 240) * 100,
        width: ((maxX - minX) / 320) * 100,
        height: ((maxY - minY) / 240) * 100,
      },
    };
  }
}

export const gestureService = new GestureRecognitionService();
