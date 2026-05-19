import React, { useEffect, useRef, useState } from 'react';
import { videos } from '../videos';

export default function VideoFeed({ onScrollEvent }) {
  const feedRef = useRef(null);
  const currentVideoIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const iframeRefs = useRef([]);

  useEffect(() => {
    if (!onScrollEvent) return;

    const direction = onScrollEvent.split('-')[0];
    const feed = feedRef.current;
    if (!feed) return;

    const videoHeight = feed.clientHeight;

    if (direction === 'up') {
      if (currentVideoIndex.current > 0) {
        feed.scrollBy({ top: -videoHeight, behavior: 'smooth' });
      } else {
        feed.scrollTo({ top: (videos.length - 1) * videoHeight, behavior: 'smooth' });
      }
    } else if (direction === 'down') {
      if (currentVideoIndex.current < videos.length - 1) {
        feed.scrollBy({ top: videoHeight, behavior: 'smooth' });
      } else {
        feed.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [onScrollEvent]);

  // Update index on manual scroll or programmatic scroll so gestures stay in sync
  const handleScroll = (e) => {
    const feed = e.target;
    const index = Math.round(feed.scrollTop / feed.clientHeight);
    currentVideoIndex.current = index;
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // Manage iframe audio states
  useEffect(() => {
    iframeRefs.current.forEach((iframe, i) => {
      if (iframe && iframe.contentWindow) {
        if (i === activeIndex && hasInteracted) {
          // Play and unmute the active video
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
        } else {
          // Mute and pause non-active videos to save bandwidth and prevent overlapping sound
          iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
          if (i !== activeIndex) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
          }
        }
      }
    });
  }, [activeIndex, hasInteracted]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <div className="video-feed" ref={feedRef} onScroll={handleScroll} onClick={handleInteraction}>
      {!hasInteracted && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)', padding: '15px 25px', borderRadius: '30px', 
          color: 'white', zIndex: 100, pointerEvents: 'none', fontWeight: 'bold'
        }}>
          Tap anywhere to enable sound 🔊
        </div>
      )}
      {videos.map((vid, index) => (
        <div key={vid.id} className="video-container">
          <iframe
            ref={(el) => iframeRefs.current[index] = el}
            className="video-player"
            src={`https://www.youtube.com/embed/${vid.youtubeId}?enablejsapi=1&autoplay=1&mute=1&loop=1&playlist=${vid.youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ pointerEvents: 'none', border: 'none' }}
          />
          <div className="video-overlay">
            <h2 className="video-message">{vid.message}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}
