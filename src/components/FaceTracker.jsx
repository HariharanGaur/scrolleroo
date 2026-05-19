import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export default function FaceTracker({ onGesture }) {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [activeGesture, setActiveGesture] = useState(null);
  const faceLandmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const debounceTimerRef = useRef(null);
  const gestureReadyRef = useRef(true);
  const onGestureRef = useRef(onGesture);

  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  useEffect(() => {
    let stream = null;
    let animationFrameId;

    const initializeTracker = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });

        setIsLoaded(true);

        // Get camera access
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }

      } catch (err) {
        console.error("Error initializing tracker:", err);
        setError("Camera permission denied or model failed to load.");
      }
    };

    const predictWebcam = async () => {
      if (!videoRef.current || !faceLandmarkerRef.current) return;

      const video = videoRef.current;
      let startTimeMs = performance.now();

      if (lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          const blendshapes = results.faceBlendshapes[0].categories;
          
          // Find browInnerUp and jawOpen scores
          const browInnerUp = blendshapes.find(shape => shape.categoryName === "browInnerUp")?.score || 0;
          const jawOpen = blendshapes.find(shape => shape.categoryName === "jawOpen")?.score || 0;

          // Thresholds
          const BROW_THRESHOLD = 0.5;
          const JAW_THRESHOLD = 0.3; // lowered for easier detection

          // Require returning to a somewhat neutral expression before allowing another scroll
          if (browInnerUp < 0.3 && jawOpen < 0.2) {
            gestureReadyRef.current = true;
          }

          if (!debounceTimerRef.current && gestureReadyRef.current) {
            if (jawOpen > JAW_THRESHOLD) {
              gestureReadyRef.current = false;
              triggerGesture('up');
            } else if (browInnerUp > BROW_THRESHOLD) {
              gestureReadyRef.current = false;
              triggerGesture('down');
            } else {
              setActiveGesture(null);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const triggerGesture = (direction) => {
      setActiveGesture(direction);
      onGestureRef.current(direction);
      
      // Debounce to prevent rapid double scrolling
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        setActiveGesture(null); // clear the UI feedback
      }, 700);
    };

    initializeTracker();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`face-tracker-ui ${activeGesture ? 'active-gesture' : ''}`}>
      {!isLoaded && !error && (
        <div className="tracker-status">Loading Model...</div>
      )}
      {error && (
        <div className="tracker-status" style={{color: 'red'}}>{error}</div>
      )}
      <video
        ref={videoRef}
        className="camera-feed"
        autoPlay
        playsInline
        muted
      />
      {isLoaded && !error && (
        <div className="tracker-status" style={{ backgroundColor: activeGesture ? 'var(--primary)' : 'rgba(0,0,0,0.6)' }}>
          {activeGesture === 'up' ? 'Scrolling Up...' : activeGesture === 'down' ? 'Scrolling Down...' : 'Tracking Active'}
        </div>
      )}
    </div>
  );
}
