import React, { useEffect, useState, useRef } from "react";
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
          const audioElements = document.querySelectorAll("audio");
          audioElements.forEach((audio) => {
            audio
              .play()
              .catch((err) => console.log("Still could not play audio:", err));
          });
        });
      }

      // Remove event listener after initialization
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

  // Video track effect - only depends on camera state
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!participant) return;

    const videoPublication = participant.getTrackPublication(source);

    // Attach video track
    if (
      videoElement &&
      videoPublication?.track &&
      videoPublication.isSubscribed
    ) {
      try {
        videoPublication.track.attach(videoElement);
        setTrackAttached(true);
      } catch (error) {
        console.warn("Failed to attach video track:", error);
        setTrackAttached(false);
      }
    } else if (
      videoElement &&
      videoPublication?.track &&
      !videoPublication.isSubscribed
    ) {
      // If track exists but not subscribed, try to subscribe
      console.log("Video track exists but not subscribed, waiting...");
      setTrackAttached(false);
    } else {
      setTrackAttached(false);
    }

    return () => {
      // Cleanup video track
      try {
        if (videoElement && videoPublication?.track) {
          videoPublication.track.detach(videoElement);
        }
      } catch (error) {
        console.warn("Failed to detach video track:", error);
      }
      setTrackAttached(false);
    };
  }, [participant, source, participant.isCameraEnabled, trackAttached]);

  // Audio track effect - separate from video, only for remote participants
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!participant || participant.isLocal) return;

    const audioPublication = participant.getTrackPublication(
      Track.Source.Microphone
    );

    // Attach audio track (only for remote participants)
    if (
      audioElement &&
      audioPublication?.track &&
      audioPublication.isSubscribed
    ) {
      try {
        audioPublication.track.attach(audioElement);

        // Try to play audio - will succeed if user has already interacted with the page
        audioElement.play().catch((error) => {
          console.log("Audio autoplay prevented:", error);

          // Add a one-time click handler to the document to start audio playback
          const playAudioOnInteraction = () => {
            audioElement
              .play()
              .then(() => {
                console.log("Audio playback started after user interaction");
              })
              .catch((err) => console.warn("Still could not play audio:", err));

            // Remove the event listeners after first interaction
            document.removeEventListener("click", playAudioOnInteraction);
            document.removeEventListener("touchstart", playAudioOnInteraction);
          };

          document.addEventListener("click", playAudioOnInteraction);
          document.addEventListener("touchstart", playAudioOnInteraction);
        });
      } catch (error) {
        console.warn("Failed to attach audio track:", error);
      }
    }

    return () => {
      // Cleanup audio track
      try {
        if (audioElement && audioPublication?.track) {
          audioPublication.track.detach(audioElement);
        }
      } catch (error) {
        console.warn("Failed to detach audio track:", error);
      }
    };
  }, [participant, participant.isMicrophoneEnabled]);

  // Additional effect to handle track publication changes
  useEffect(() => {
    if (!participant) return;

    const handleTrackPublished = (publication: any) => {
      console.log(
        "Track published:",
        publication.source,
        "attempting to attach..."
      );
      // Only handle camera track publications
      if (publication.source !== source) return;

      // Trigger re-render to attempt attachment
      setTimeout(() => {
        const videoElement = videoRef.current;
        const videoPublication = participant.getTrackPublication(source);

        if (
          videoElement &&
          videoPublication?.track &&
          videoPublication.isSubscribed &&
          !trackAttached
        ) {
          try {
            videoPublication.track.attach(videoElement);
            setTrackAttached(true);
            console.log("Video track attached successfully on publication");
          } catch (error) {
            console.warn("Failed to attach video track on publication:", error);
          }
        }
      }, 100);
    };

    const handleTrackSubscribed = (track: any, publication: any) => {
      console.log(
        "Track subscribed:",
        publication.source,
        "attempting to attach...",
        track,
        publication
      );
      // Only handle camera track subscriptions
      if (publication.source !== source) return;

      // Trigger re-render to attempt attachment
      setTimeout(() => {
        const videoElement = videoRef.current;
        const videoPublication = participant.getTrackPublication(source);

        if (
          videoElement &&
          videoPublication?.track &&
          videoPublication.isSubscribed &&
          !trackAttached
        ) {
          try {
            videoPublication.track.attach(videoElement);
            setTrackAttached(true);
            console.log("Video track attached successfully on subscription");
          } catch (error) {
            console.warn(
              "Failed to attach video track on subscription:",
              error
            );
          }
        }
      }, 100);
    };

    // Listen for track events
    participant.on("trackPublished", handleTrackPublished);
    participant.on("trackSubscribed", handleTrackSubscribed);

    return () => {
      participant.off("trackPublished", handleTrackPublished);
      participant.off("trackSubscribed", handleTrackSubscribed);
    };
  }, [participant, source, trackAttached]);

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
