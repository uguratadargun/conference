import React, { useEffect, useState, useRef, useCallback } from "react";
import { Track, Participant } from "livekit-client";

// Custom Video Component using refs for track attachment
const CustomVideoTrack: React.FC<{
  participant: Participant;
  source: Track.Source;
}> = ({ participant, source }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackAttached, setTrackAttached] = useState(false);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const audioTrackRef = useRef<Track | null>(null);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudioContext = () => {
      if (audioContextInitialized) return;

      // Create and resume audio context
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        audioContext.resume().then(() => {
          setAudioContextInitialized(true);
          // Don't try to play all audio elements - this can cause issues
          // when elements are being added/removed from DOM
        });
      }

      // Remove event listeners after initialization
      document.removeEventListener("click", initAudioContext);
      document.removeEventListener("touchstart", initAudioContext);
    };

    // Add event listeners for user interaction
    document.addEventListener("click", initAudioContext);
    document.addEventListener("touchstart", initAudioContext);

    return () => {
      document.removeEventListener("click", initAudioContext);
      document.removeEventListener("touchstart", initAudioContext);
    };
  }, [audioContextInitialized]);

  // Attach video/audio track helper function
  const attachTrack = useCallback(
    (
      element: HTMLVideoElement | HTMLAudioElement | null,
      trackSource: Track.Source
    ) => {
      if (!element || !participant) return false;

      const publication = participant.getTrackPublication(trackSource);

      if (publication?.track && publication.isSubscribed) {
        try {
          publication.track.attach(element);

          // Store audio track reference for reattachment if needed
          if (
            element instanceof HTMLAudioElement &&
            trackSource === Track.Source.Microphone
          ) {
            audioTrackRef.current = publication.track;
          }

          // For audio elements, try to play them
          if (element instanceof HTMLAudioElement) {
            // Use a silent version to avoid console errors
            const playPromise = element.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Ignore errors here - we'll retry on user interaction
              });
            }
          }

          return true;
        } catch (error) {
          console.warn(`Failed to attach ${trackSource} track:`, error);
        }
      }

      return false;
    },
    [participant]
  );

  // Detach track helper function
  const detachTrack = useCallback(
    (
      element: HTMLVideoElement | HTMLAudioElement | null,
      trackSource: Track.Source
    ) => {
      if (!element || !participant) return;

      const publication = participant.getTrackPublication(trackSource);

      if (publication?.track) {
        try {
          publication.track.detach(element);
        } catch (error) {
          console.warn(`Failed to detach ${trackSource} track:`, error);
        }
      }
    },
    [participant]
  );

  // Video track management
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !participant) return;

    const success = attachTrack(videoElement, source);
    setTrackAttached(success);

    return () => {
      detachTrack(videoElement, source);
      setTrackAttached(false);
    };
  }, [
    participant,
    source,
    participant?.isCameraEnabled,
    attachTrack,
    detachTrack,
  ]);

  // Audio track management (for remote participants only)
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !participant || participant.isLocal) return;

    // Attach the audio track initially
    attachTrack(audioElement, Track.Source.Microphone);

    // Helper function to safely play audio
    const safePlayAudio = () => {
      if (audioElement && document.contains(audioElement)) {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.log("Error playing audio:", err);
            // If we get an error, we'll try to reattach the track
            if (audioTrackRef.current && document.contains(audioElement)) {
              try {
                audioTrackRef.current.attach(audioElement);
                audioElement.play().catch(() => {
                  // Silence final errors to avoid console spam
                });
              } catch (e) {
                // Last resort failed, we'll try again on next user interaction
              }
            }
          });
        }
      }
    };

    // Create a more robust fullscreen handler
    const handleVisibilityOrFullscreenChange = () => {
      // Small delay to allow DOM to stabilize
      setTimeout(() => {
        // Check if the audio element exists and is in the document
        if (audioElement && document.contains(audioElement)) {
          // If we have the track reference, reattach it to be safe
          if (audioTrackRef.current) {
            try {
              // Detach and reattach to ensure clean state
              audioTrackRef.current.detach(audioElement);
              audioTrackRef.current.attach(audioElement);
              safePlayAudio();
            } catch (e) {
              console.log("Error reattaching audio track:", e);
            }
          } else {
            // Just try to play if we don't have the track ref
            safePlayAudio();
          }
        }
      }, 300);
    };

    // Listen for events that might affect audio playback
    document.addEventListener(
      "fullscreenchange",
      handleVisibilityOrFullscreenChange
    );
    document.addEventListener(
      "visibilitychange",
      handleVisibilityOrFullscreenChange
    );
    window.addEventListener("focus", handleVisibilityOrFullscreenChange);

    // Also set up an interval to check audio playback periodically
    const audioCheckInterval = setInterval(() => {
      if (
        audioElement &&
        document.contains(audioElement) &&
        audioElement.paused &&
        audioTrackRef.current
      ) {
        safePlayAudio();
      }
    }, 2000);

    return () => {
      // Clean up all event listeners
      document.removeEventListener(
        "fullscreenchange",
        handleVisibilityOrFullscreenChange
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityOrFullscreenChange
      );
      window.removeEventListener("focus", handleVisibilityOrFullscreenChange);
      clearInterval(audioCheckInterval);

      if (audioElement) {
        detachTrack(audioElement, Track.Source.Microphone);
      }
    };
  }, [participant, participant?.isMicrophoneEnabled, attachTrack, detachTrack]);

  // Handle track publications and subscriptions
  useEffect(() => {
    if (!participant) return;

    const handleTrackEvent = () => {
      // Small delay to ensure track is ready
      setTimeout(() => {
        if (videoRef.current && !trackAttached) {
          const success = attachTrack(videoRef.current, source);
          if (success) {
            setTrackAttached(true);
            console.log(`${source} track attached successfully`);
          }
        }

        // Handle audio track for remote participants
        if (audioRef.current && !participant.isLocal) {
          attachTrack(audioRef.current, Track.Source.Microphone);
        }
      }, 100);
    };

    // Listen for track events
    participant.on("trackPublished", handleTrackEvent);
    participant.on("trackSubscribed", handleTrackEvent);

    return () => {
      participant.off("trackPublished", handleTrackEvent);
      participant.off("trackSubscribed", handleTrackEvent);
    };
  }, [participant, source, trackAttached, attachTrack]);

  return (
    <div>
      <video
        ref={videoRef}
        className="participant-video"
        autoPlay
        playsInline
        muted={participant.isLocal}
        style={{
          display: participant.isCameraEnabled ? "block" : "none",
        }}
      />
      {!participant.isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          style={{ display: "none" }}
        />
      )}
    </div>
  );
};

export default CustomVideoTrack;
