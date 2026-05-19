import React, { useState } from 'react';
import VideoFeed from './components/VideoFeed';
import FaceTracker from './components/FaceTracker';
import './index.css';

function App() {
  const [scrollEvent, setScrollEvent] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleGesture = (direction) => {
    // Generate a unique string to ensure the effect triggers even if direction is same
    setScrollEvent(`${direction}-${Date.now()}`);
  };

  const getDirection = () => {
    if (!scrollEvent) return null;
    return scrollEvent.split('-')[0];
  };

  const requestCamera = async () => {
    try {
      // Just test if we can get it, FaceTracker will request it again but it will be cached
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionGranted(true);
    } catch (err) {
      alert("Camera permission is required to use face gestures.");
    }
  };

  return (
    <div className="app-container">
      {!permissionGranted && (
        <div className="permission-banner">
          <span>Enable camera to scroll with your face!</span>
          <button onClick={requestCamera}>Allow Camera</button>
        </div>
      )}

      {permissionGranted && (
        <div className="controls-hint">
          <div className="hint-item">
            <span className="hint-icon">😲</span> Open Mouth: Scroll Up
          </div>
          <div className="hint-item">
            <span className="hint-icon">🤨</span> Raise Eyebrows: Scroll Down
          </div>
        </div>
      )}

      {permissionGranted && (
        <FaceTracker onGesture={handleGesture} />
      )}
      
      <VideoFeed onScrollEvent={scrollEvent} />
    </div>
  );
}

export default App;
