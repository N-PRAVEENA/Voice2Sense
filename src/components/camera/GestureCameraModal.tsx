import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle, Sparkles, Hand, Volume2 } from 'lucide-react';
import { gestureService, GestureDetectionResult } from '../../services/gestureEngine';
import { SignVocabularyItem, SupportedLanguageCode } from '../../types';
import { SIGN_VOCABULARY } from '../../data/signVocabulary';
import { speechService } from '../../services/speech';

interface GestureCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGestureRecognized: (sign: SignVocabularyItem, confidence: number) => void;
  targetLanguage: SupportedLanguageCode;
  isHighContrast?: boolean;
}

export const GestureCameraModal: React.FC<GestureCameraModalProps> = ({
  isOpen,
  onClose,
  onGestureRecognized,
  targetLanguage,
  isHighContrast = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSignHint, setSelectedSignHint] = useState<string>('sign-hospital');
  const [detection, setDetection] = useState<GestureDetectionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Start Camera
  useEffect(() => {
    if (!isOpen) {
      gestureService.stopCamera();
      setIsCameraActive(false);
      return;
    }

    let isMounted = true;

    async function initCamera() {
      try {
        setErrorMsg(null);
        if (videoRef.current) {
          await gestureService.startCamera(videoRef.current, facingMode);
          if (isMounted) {
            setIsCameraActive(true);
            setIsAnalyzing(true);
            speechService.playTone('click');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Could not access camera. Please allow camera permissions.');
          setIsCameraActive(false);
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      gestureService.stopCamera();
    };
  }, [isOpen, facingMode]);

  // Frame processing loop
  useEffect(() => {
    if (!isOpen || !isCameraActive || !isAnalyzing) return;

    const interval = setInterval(() => {
      const result = gestureService.analyzeFrame(selectedSignHint);
      setDetection(result);
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, isCameraActive, isAnalyzing, selectedSignHint]);

  const handleFlipCamera = async () => {
    if (!videoRef.current) return;
    try {
      speechService.playTone('click');
      const nextMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(nextMode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch camera');
    }
  };

  const handleConfirmGesture = () => {
    if (detection?.recognized && detection.sign) {
      speechService.playTone('success');
      speechService.triggerHaptic(60);
      onGestureRecognized(detection.sign, detection.confidence);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border ${
          isHighContrast
            ? 'bg-black text-yellow-300 border-yellow-400'
            : 'bg-slate-900 text-white border-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sign / Gesture Camera</h2>
              <p className="text-xs text-white/60">Align hand inside the detection zone</p>
            </div>
          </div>
          <button
            onClick={() => {
              speechService.playTone('click');
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Close camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Silhouette Target Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className={`w-52 h-52 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-between p-4 ${
                detection?.recognized
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                  : 'border-white/30 bg-black/20'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-black/60 px-2 py-0.5 rounded">
                Hand Silhouette Zone
              </div>

              {/* Hand Icon representation inside guide */}
              <div className="opacity-30">
                <Hand className="w-20 h-20 text-white" />
              </div>

              <div className="text-[11px] text-white/70 bg-black/60 px-2.5 py-0.5 rounded text-center">
                {detection?.recognized ? 'Gesture Locked' : 'Hold hand steady'}
              </div>
            </div>
          </div>

          {/* Camera Controls Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={handleFlipCamera}
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition shadow-lg"
              title="Switch camera"
              aria-label="Switch front or back camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Live Confidence Gauge */}
          {detection?.recognized && (
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400">
                Confidence: {(detection.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Error Message banner */}
          {errorMsg && (
            <div className="absolute inset-x-4 top-4 p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Sign Target Preset Selector (Allows testing all supported accessibility signs) */}
        <div className="p-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60 font-medium">Select Vocabulary Sign to Practice:</span>
            <span className="text-xs font-mono text-emerald-400">{SIGN_VOCABULARY.length} Supported Signs</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {SIGN_VOCABULARY.map(sign => (
              <button
                key={sign.id}
                onClick={() => {
                  setSelectedSignHint(sign.id);
                  speechService.playTone('click');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition shrink-0 ${
                  selectedSignHint === sign.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {sign.name.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Recognized Output Footer */}
        <div className="p-4 space-y-3 bg-slate-900/90">
          {detection?.recognized && detection.sign ? (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Recognized: {detection.sign.name}
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  "{detection.sign.translations[targetLanguage] || detection.sign.translations['en']}"
                </div>
                <div className="text-[11px] text-white/60 mt-0.5">
                  {detection.sign.handShape}
                </div>
              </div>

              <button
                onClick={handleConfirmGesture}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Confirm</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-white/60">
              {detection?.message || 'Move hand into the camera frame to detect gesture'}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                speechService.playTone('click');
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            {detection?.recognized && detection.sign && (
              <button
                onClick={handleConfirmGesture}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Use Recognized Gesture</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
