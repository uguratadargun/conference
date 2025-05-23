import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useLiveKit } from "../context/LiveKitContext";
import { Button } from "primereact/button";
import type { Participant } from "../types/livekit";
import { AccessToken } from "livekit-server-sdk";
import { Track } from "livekit-client";
import "./ConferenceCall.css";

// Participant name colors
const BORDER_COLORS = [
  "#FFB199",
  "#A3FFB1",
  "#FFD699",
  "#B1C6FF",
  "#FFB1E1",
  "#B1FFD6",
  "#FFF7B1",
  "#B1E1FF",
  "#FF9999",
  "#99FFB3",
  "#FFE599",
  "#99B3FF",
  "#FF99E5",
  "#99FFE5",
  "#FFFF99",
  "#99E5FF",
  "#FFCC99",
  "#CCFF99",
  "#FFBF99",
  "#99FFCC",
  "#FFB3CC",
  "#B3FFCC",
  "#FFCCB3",
  "#CCB3FF",
  "#E6B3FF",
  "#B3E6FF",
  "#FFE6B3",
  "#B3FFE6",
  "#F0B3FF",
  "#B3F0FF",
  "#FFB3F0",
  "#C299FF",
  "#99FFC2",
  "#FFC299",
  "#C2FF99",
  "#FF99C2",
  "#99C2FF",
  "#FFD9B3",
  "#D9FFB3",
  "#B3FFD9",
  "#B3D9FF",
  "#FFB3D9",
  "#D9B3FF",
  "#87CEEB",
  "#98FB98",
  "#F0E68C",
  "#DDA0DD",
  "#F5DEB3",
  "#FFE4E1",
];
const NAME_COLORS = [
  "#FFB199",
  "#A3FFB1",
  "#FFD699",
  "#B1C6FF",
  "#FFB1E1",
  "#B1FFD6",
  "#FFF7B1",
  "#B1E1FF",
  "#FF9999",
  "#99FFB3",
  "#FFE599",
  "#99B3FF",
  "#FF99E5",
  "#99FFE5",
  "#FFFF99",
  "#99E5FF",
  "#FFCC99",
  "#CCFF99",
  "#FFBF99",
  "#99FFCC",
  "#FFB3CC",
  "#B3FFCC",
  "#FFCCB3",
  "#CCB3FF",
  "#E6B3FF",
  "#B3E6FF",
  "#FFE6B3",
  "#B3FFE6",
  "#F0B3FF",
  "#B3F0FF",
  "#FFB3F0",
  "#C299FF",
  "#99FFC2",
  "#FFC299",
  "#C2FF99",
  "#FF99C2",
  "#99C2FF",
  "#FFD9B3",
  "#D9FFB3",
  "#B3FFD9",
  "#B3D9FF",
  "#FFB3D9",
  "#D9B3FF",
  "#87CEEB",
  "#98FB98",
  "#F0E68C",
  "#DDA0DD",
  "#F5DEB3",
  "#FFE4E1",
];

// Audio level threshold (0-1)
const AUDIO_THRESHOLD = 0.1;

// Move grid class calculation outside component
const getGridClassName = (count: number) => {
  if (count === 1) return "grid-1";
  if (count === 2) return "grid-2";
  if (count === 3) return "grid-3";
  if (count === 4) return "grid-4";
  if (count <= 6) return "grid-6";
  if (count <= 9) return "grid-9";
  if (count <= 12) return "grid-12";
  if (count <= 20) return "grid-default";
  return "grid-scroll";
};

const getSizeClassName = (count: number) => {
  if (count > 20) return "size-scroll";
  return "size-full";
};

const FullscreenParticipantView = React.memo(
  ({
    participant,
    idx,
    renderParticipant,
    exitFullScreen,
    otherParticipants,
  }: {
    participant: Participant;
    idx: number;
    renderParticipant: (p: Participant, idx: number) => React.ReactNode;
    exitFullScreen: () => void;
    otherParticipants: Participant[];
  }) => (
    <div className="fullscreen-container">
      {renderParticipant(participant, idx)}
      <Button
        icon="pi pi-times"
        onClick={exitFullScreen}
        className="exit-fullscreen-button"
        title="Exit fullscreen"
      />
      {otherParticipants.length > 0 && (
        <div className="thumbnails-container">
          {otherParticipants.map((participant, idx) => (
            <div key={participant.id} className="thumbnail-wrapper">
              {renderParticipant(participant, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
);

const ConferenceCall: React.FC = () => {
  const { roomState, connect, disconnect, toggleVideo, toggleAudio } =
    useLiveKit();
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const isConnecting = useRef(false);
  const [audioLevels, setAudioLevels] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fullScreenParticipant, setFullScreenParticipant] = useState<
    string | null
  >(null);
  // Use ref to store previous audio levels to avoid unnecessary updates
  const prevAudioLevelsRef = useRef<{ [key: string]: number }>({});

  const generateToken = useCallback(async () => {
    if (isConnecting.current || roomState.isConnected) {
      return;
    }

    try {
      isConnecting.current = true;
      setError(null);
      setIsRetrying(true);

      const apiKey = "APItrVwR79fsfN6";
      const apiSecret = "0sbQLRiGbRSTBpAlKUJO7hdniYfGCCfANlv5rUMK8ib";
      const projectName = "ugurdargun-w5ph6ze0";
      const roomName = "test-room";
      const username = `user${Math.floor(Math.random() * 1000)}`;

      const at = new AccessToken(apiKey, apiSecret, { identity: username });
      at.addGrant({ roomJoin: true, room: roomName });
      const token = await at.toJwt();

      const url = `wss://${projectName}.livekit.cloud`;
      await connect(url, token);
    } catch (error) {
      console.error("Connection error:", error);
      if (error instanceof Error) {
        // Don't prevent app from starting if it's just a media permission issue
        if (
          error.message.includes("camera and microphone") ||
          error.message.includes("Permission denied") ||
          error.message.includes("NotAllowedError")
        ) {
          console.warn("Continuing without media permissions:", error.message);
          // Try to connect again without requiring media permissions
          try {
            const apiKey = "APItrVwR79fsfN6";
            const apiSecret = "0sbQLRiGbRSTBpAlKUJO7hdniYfGCCfANlv5rUMK8ib";
            const projectName = "ugurdargun-w5ph6ze0";
            const roomName = "test-room";
            const username = `user${Math.floor(Math.random() * 1000)}`;

            const at = new AccessToken(apiKey, apiSecret, {
              identity: username,
            });
            at.addGrant({ roomJoin: true, room: roomName });
            const token = await at.toJwt();

            const url = `wss://${projectName}.livekit.cloud`;
            await connect(url, token);
            return; // Successfully connected without media permissions
          } catch (retryError) {
            // If retry fails, show a different error
            setError("Connected without camera/microphone access.");
          }
        } else {
          setError(error.message);
        }
      } else {
        setError("Failed to connect to the room. Please try again.");
      }
    } finally {
      isConnecting.current = false;
      setIsRetrying(false);
    }
  }, [roomState.isConnected, connect]);

  const handleRetry = useCallback(async () => {
    // Reset any existing connections
    if (roomState.isConnected) {
      disconnect();
    }
    // Wait a bit before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));
    generateToken();
  }, [roomState.isConnected, disconnect, generateToken]);

  const enterFullScreen = useCallback((participantId: string) => {
    setFullScreenParticipant(participantId);
  }, []);

  const exitFullScreen = useCallback(() => {
    setFullScreenParticipant(null);
  }, []);

  // Memoize the voice indicator to avoid recreating on every render
  const renderVoiceIndicator = useCallback(
    (color: string, audioLevel: number) => {
      // Create a wave-like animation effect
      const bars = 5;
      const isActive = audioLevel > AUDIO_THRESHOLD;

      return (
        <div
          className={`voice-indicator ${isActive ? "active" : ""}`}
          style={{ opacity: isActive ? 0.3 + audioLevel * 0.7 : 0.3 }}
        >
          {Array.from({ length: bars }, (_, i) => {
            let height = 4; // baseHeight

            if (isActive) {
              // Create a wave pattern using sine wave
              const waveOffset = (i / (bars - 1)) * Math.PI;
              const waveFactor = Math.sin(waveOffset);

              // Combine wave pattern with audio level
              const maxHeight = 16;
              height =
                4 + (maxHeight - 4) * (audioLevel * (0.5 + 0.5 * waveFactor));
              height = Math.max(4, Math.min(maxHeight, height));
            }

            return (
              <div
                key={i}
                className={`voice-bar ${isActive ? "animated" : ""}`}
                style={{
                  height,
                  backgroundColor: color,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            );
          })}
        </div>
      );
    },
    []
  );

  const renderParticipant = useCallback(
    (participant: Participant, idx: number) => {
      const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
      const nameColor = NAME_COLORS[idx % NAME_COLORS.length];
      const isLocal = participant.isLocal;
      const audioLevel = audioLevels[participant.id] || 0;
      const isSpeaking = audioLevel > AUDIO_THRESHOLD;
      const isFullScreen = fullScreenParticipant === participant.id;
      // Placeholder image URLs or initials
      const profileUrl = undefined; // No avatar in model
      const initials = participant.name
        .split(" ")
        .map((n) => n[0]?.toUpperCase())
        .join("")
        .slice(0, 2);

      const sizeClass = fullScreenParticipant
        ? "size-fullscreen"
        : getSizeClassName(roomState.participants.length);

      return (
        <div
          key={participant.id}
          className={`participant ${
            isSpeaking ? "speaking" : ""
          } ${sizeClass} ${isFullScreen ? "fullscreen" : ""}`}
          style={{ borderColor: isSpeaking ? borderColor : "transparent" }}
          onClick={() => !isFullScreen && enterFullScreen(participant.id)}
        >
          <video
            ref={(el) => {
              if (el) {
                videoRefs.current[participant.id] = el;
              }
            }}
            className="participant-video"
          />
          <div className="participant-name" style={{ color: nameColor }}>
            {isLocal ? "You" : participant.name}
          </div>
          <div className="avatar-container">
            {profileUrl ? (
              <img
                src={profileUrl}
                alt={participant.name}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <span className="avatar-initials" style={{ color: nameColor }}>
                {initials}
              </span>
            )}
          </div>
          {renderVoiceIndicator(nameColor, audioLevel)}
        </div>
      );
    },
    [
      audioLevels,
      fullScreenParticipant,
      roomState.participants.length,
      enterFullScreen,
      renderVoiceIndicator,
    ]
  );

  useEffect(() => {
    generateToken();

    return () => {
      if (roomState.isConnected) {
        disconnect();
      }
    };
  }, []);

  useEffect(() => {
    roomState.participants.forEach((participant) => {
      const videoElement = videoRefs.current[participant.id];
      if (videoElement && participant.participant) {
        // Get the video track from the participant
        const videoTrack = participant.participant
          .getTrackPublications()
          .find((pub) => pub.kind === Track.Kind.Video);

        if (videoTrack?.track) {
          videoTrack.track.attach(videoElement);
        }
      }

      // Create audio element if it doesn't exist
      if (!audioRefs.current[participant.id] && participant.participant) {
        audioRefs.current[participant.id] = document.createElement("audio");
      }

      // Attach audio track
      const audioElement = audioRefs.current[participant.id];
      if (audioElement && participant.participant) {
        const audioTrack = participant.participant
          .getTrackPublications()
          .find((pub) => pub.kind === Track.Kind.Audio);

        if (audioTrack?.track) {
          audioTrack.track.attach(audioElement);
        }
      }
    });
  }, [roomState.participants]);

  useEffect(() => {
    const updateAudioLevels = () => {
      const newAudioLevels: { [key: string]: number } = {};
      let hasChanges = false;

      roomState.participants.forEach((participant) => {
        if (participant.participant) {
          // Get audio level directly from the participant and ensure it's a valid number
          const level = participant.participant.audioLevel;
          // Only set audio level if it's a valid number and above threshold
          const audioLevel =
            typeof level === "number" &&
            !isNaN(level) &&
            level > AUDIO_THRESHOLD
              ? level
              : 0;

          newAudioLevels[participant.id] = audioLevel;

          // Check if this level has changed significantly to avoid unnecessary updates
          const prevLevel = prevAudioLevelsRef.current[participant.id] || 0;
          if (Math.abs(audioLevel - prevLevel) > 0.05) {
            hasChanges = true;
          }
        }
      });

      // Only update state if there are meaningful changes
      if (hasChanges) {
        prevAudioLevelsRef.current = newAudioLevels;
        setAudioLevels(newAudioLevels);
      }
    };

    const interval = setInterval(updateAudioLevels, 100);
    return () => clearInterval(interval);
  }, [roomState.participants]);

  // Memoize the fullscreen component props to avoid unnecessary re-renders
  const fullscreenParticipantData = useMemo(() => {
    if (!fullScreenParticipant) return null;

    const participant = roomState.participants.find(
      (p) => p.id === fullScreenParticipant
    );
    const idx = roomState.participants.findIndex(
      (p) => p.id === fullScreenParticipant
    );
    const otherParticipants = roomState.participants.filter(
      (p) => p.id !== fullScreenParticipant
    );

    return { participant, idx, otherParticipants };
  }, [fullScreenParticipant, roomState.participants]);

  // Memoize the grid class name
  const gridClassName = useMemo(
    () => getGridClassName(roomState.participants.length),
    [roomState.participants.length]
  );

  return (
    <div className="conference-container">
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <Button
            icon={isRetrying ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
            onClick={handleRetry}
            disabled={isRetrying}
            className="error-button"
          />
        </div>
      )}

      <div className="call-info">
        <div className="participants-count">
          <i className="pi pi-users"></i>
          <span>{roomState.participants.length}</span>
        </div>
        {roomState.isConnected && (
          <div className="connection-status">
            <div className="status-indicator connected"></div>
            <span>Connected</span>
          </div>
        )}
      </div>

      {fullscreenParticipantData?.participant ? (
        <FullscreenParticipantView
          participant={fullscreenParticipantData.participant}
          idx={fullscreenParticipantData.idx}
          renderParticipant={renderParticipant}
          exitFullScreen={exitFullScreen}
          otherParticipants={fullscreenParticipantData.otherParticipants}
        />
      ) : (
        // Grid view
        <div className={`participants-grid ${gridClassName}`}>
          {roomState.participants.map((participant, idx) => {
            return (
              <div className={"size-full"} key={participant.id}>
                {renderParticipant(participant, idx)}
              </div>
            );
          })}
        </div>
      )}

      <div className="controls-container">
        <div className="controls-panel">
          <div className="control-group">
            <Button
              icon={
                roomState.isAudioEnabled
                  ? "pi pi-microphone"
                  : "pi pi-microphone"
              }
              onClick={toggleAudio}
              className={`control-button audio-button ${
                !roomState.isAudioEnabled ? "disabled" : ""
              }`}
              tooltip={roomState.isAudioEnabled ? "Mute Audio" : "Unmute Audio"}
              tooltipOptions={{ position: "top" }}
            />
          </div>

          <div className="control-group">
            <Button
              icon={roomState.isVideoEnabled ? "pi pi-video" : "pi pi-video"}
              onClick={toggleVideo}
              className={`control-button video-button ${
                !roomState.isVideoEnabled ? "disabled" : ""
              }`}
              tooltip={
                roomState.isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"
              }
              tooltipOptions={{ position: "top" }}
            />
          </div>

          <div className="control-group">
            <Button
              icon="pi pi-phone"
              onClick={disconnect}
              className="control-button hang-up-button"
              tooltip="Leave Call"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConferenceCall;
