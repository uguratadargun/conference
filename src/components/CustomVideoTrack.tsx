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
          console.log("AudioContext initialized by user interaction");

          // Try to play any audio elements
          document.querySelectorAll("audio").forEach((audio) => {
            audio
              .play()
              .catch((err) => console.log("Still could not play audio:", err));
          });
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
      trackSource: Track.Source,
      isLocal: boolean
    ) => {
      if (!element || !participant) return false;

      const publication = participant.getTrackPublication(trackSource);

      console.log("Attach Track is local", isLocal);

      if (publication?.track && publication.isSubscribed) {
        try {
          publication.track.attach(element);

          // For audio elements, try to play them
          if (element instanceof HTMLAudioElement) {
            element.play().catch((error) => {
              console.log("Audio autoplay prevented:", error);
            });
          }

          return true;
        } catch (error) {
          console.warn(`Failed to attach ${trackSource} track:`, error);
        }
      }

      return false;
    },
    []
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

    const success = attachTrack(videoElement, source, participant.isLocal);
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

    attachTrack(audioElement, Track.Source.Microphone, false);

    return () => {
      detachTrack(audioElement, Track.Source.Microphone);
    };
  }, [participant, participant?.isMicrophoneEnabled, attachTrack, detachTrack]);

  // Handle track publications and subscriptions
  useEffect(() => {
    if (!participant) return;

    const handleTrackEvent = () => {
      // Small delay to ensure track is ready
      setTimeout(() => {
        if (videoRef.current && !trackAttached) {
          const success = attachTrack(
            videoRef.current,
            source,
            participant.isLocal
          );
          if (success) {
            setTrackAttached(true);
            console.log(`${source} track attached successfully`);
          }
        }

        // Handle audio track for remote participants
        if (audioRef.current && !participant.isLocal) {
          attachTrack(audioRef.current, Track.Source.Microphone, false);
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
    <>
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
    </>
  );
};

export default CustomVideoTrack;
