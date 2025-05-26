import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useLiveKit } from "../context/LiveKitContext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import type { Participant } from "../types/livekit";
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

// New simplified VideoParticipant component
const VideoParticipant = React.memo(
  ({ participant }: { participant: Participant }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const attachedTracksRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      const videoElement = videoRef.current;
      const audioElement = audioRef.current;
      if (!participant.participant) return;

      // Get all track publications
      const trackPublications = participant.participant.getTrackPublications();
      const videoPublication = trackPublications.find(
        (pub) => pub.kind === Track.Kind.Video
      );
      const audioPublication = trackPublications.find(
        (pub) => pub.kind === Track.Kind.Audio
      );

      console.log(`Track check for ${participant.id}:`, {
        hasVideoPublication: !!videoPublication,
        hasAudioPublication: !!audioPublication,
        hasVideoTrack: !!videoPublication?.track,
        hasAudioTrack: !!audioPublication?.track,
        videoSubscribed: videoPublication?.isSubscribed,
        audioSubscribed: audioPublication?.isSubscribed,
        isLocal: participant.isLocal,
      });

      const cleanupCallbacks: (() => void)[] = [];

      // Handle video track - only attach/detach when track actually changes
      if (videoElement && videoPublication?.track) {
        const track = videoPublication.track;
        const trackKey = `video-${track.sid}`;
        const shouldAttach =
          participant.isLocal || videoPublication.isSubscribed;

        if (shouldAttach && !videoPublication.isMuted) {
          // Only attach if not already attached
          if (!attachedTracksRef.current.has(trackKey)) {
            console.log(`Attaching video track for ${participant.id}`);
            track.attach(videoElement);
            attachedTracksRef.current.add(trackKey);

            cleanupCallbacks.push(() => {
              console.log(`Detaching video track for ${participant.id}`);
              track.detach(videoElement);
              attachedTracksRef.current.delete(trackKey);
            });
          }
        } else {
          // Detach if currently attached but should not be
          if (attachedTracksRef.current.has(trackKey)) {
            console.log(
              `Detaching video track for ${participant.id} (muted or unsubscribed)`
            );
            track.detach(videoElement);
            attachedTracksRef.current.delete(trackKey);
          }
        }
      }

      // Handle audio track (only for remote participants)
      if (audioElement && audioPublication?.track && !participant.isLocal) {
        const track = audioPublication.track;
        const trackKey = `audio-${track.sid}`;
        const shouldAttach = audioPublication.isSubscribed;

        if (shouldAttach && !audioPublication.isMuted) {
          // Only attach if not already attached
          if (!attachedTracksRef.current.has(trackKey)) {
            console.log(`Attaching audio track for ${participant.id}`);
            track.attach(audioElement);
            attachedTracksRef.current.add(trackKey);

            cleanupCallbacks.push(() => {
              console.log(`Detaching audio track for ${participant.id}`);
              track.detach(audioElement);
              attachedTracksRef.current.delete(trackKey);
            });
          }
        } else {
          // Detach if currently attached but should not be
          if (attachedTracksRef.current.has(trackKey)) {
            console.log(
              `Detaching audio track for ${participant.id} (muted or unsubscribed)`
            );
            track.detach(audioElement);
            attachedTracksRef.current.delete(trackKey);
          }
        }
      }

      // Check again in a short delay for newly subscribed tracks
      const timeoutId = setTimeout(() => {
        const updatedTrackPublications =
          participant.participant.getTrackPublications();
        const updatedVideoPublication = updatedTrackPublications.find(
          (pub) => pub.kind === Track.Kind.Video
        );
        const updatedAudioPublication = updatedTrackPublications.find(
          (pub) => pub.kind === Track.Kind.Audio
        );

        // Delayed video attachment
        if (
          videoElement &&
          updatedVideoPublication?.track &&
          updatedVideoPublication.isSubscribed &&
          !updatedVideoPublication.isMuted
        ) {
          const track = updatedVideoPublication.track;
          const trackKey = `video-${track.sid}`;
          if (!attachedTracksRef.current.has(trackKey)) {
            console.log(`Delayed attaching video track for ${participant.id}`);
            track.attach(videoElement);
            attachedTracksRef.current.add(trackKey);
          }
        }

        // Delayed audio attachment (only for remote participants)
        if (
          audioElement &&
          updatedAudioPublication?.track &&
          updatedAudioPublication.isSubscribed &&
          !updatedAudioPublication.isMuted &&
          !participant.isLocal
        ) {
          const track = updatedAudioPublication.track;
          const trackKey = `audio-${track.sid}`;
          if (!attachedTracksRef.current.has(trackKey)) {
            console.log(`Delayed attaching audio track for ${participant.id}`);
            track.attach(audioElement);
            attachedTracksRef.current.add(trackKey);
          }
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        cleanupCallbacks.forEach((cleanup) => cleanup());
      };
    }, [
      participant.participant,
      participant.isVideoEnabled,
      participant.isAudioEnabled,
      participant.id,
    ]);

    return (
      <>
        <video
          ref={videoRef}
          className="participant-video"
          autoPlay
          playsInline
          muted={participant.isLocal}
          style={{
            display: participant.isVideoEnabled ? "block" : "none",
          }}
        />
        {/* Audio element for remote participants only */}
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.participant.id === nextProps.participant.id &&
      prevProps.participant.isVideoEnabled ===
        nextProps.participant.isVideoEnabled &&
      prevProps.participant.isAudioEnabled ===
        nextProps.participant.isAudioEnabled &&
      prevProps.participant.participant === nextProps.participant.participant
    );
  }
);

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
        icon={<span className="material-icons">close</span>}
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

const SettingsDialog = React.memo(
  ({
    visible,
    onHide,
    getAvailableDevices,
    getCurrentDevices,
    changeAudioInput,
    changeVideoInput,
    changeAudioOutput,
  }: {
    visible: boolean;
    onHide: () => void;
    getAvailableDevices: () => Promise<{
      audioInputs: { deviceId: string; label: string }[];
      videoInputs: { deviceId: string; label: string }[];
      audioOutputs: { deviceId: string; label: string }[];
    }>;
    getCurrentDevices: () => Promise<{
      audioInput: string;
      videoInput: string;
      audioOutput: string;
    }>;
    changeAudioInput: (deviceId: string) => Promise<void>;
    changeVideoInput: (deviceId: string) => Promise<void>;
    changeAudioOutput: (deviceId: string) => Promise<void>;
  }) => {
    const [audioDevices, setAudioDevices] = useState<
      { deviceId: string; label: string }[]
    >([]);
    const [videoDevices, setVideoDevices] = useState<
      { deviceId: string; label: string }[]
    >([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<
      { deviceId: string; label: string }[]
    >([]);

    const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
    const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
    const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

    const fetchDevices = useCallback(async () => {
      const devices = await getAvailableDevices();
      setAudioDevices(devices.audioInputs);
      setVideoDevices(devices.videoInputs);
      setAudioOutputDevices(devices.audioOutputs);

      // Get current devices and set as selected
      const currentDevices = await getCurrentDevices();

      // Set current devices as selected, or default to first device if available
      setSelectedAudioInput(
        currentDevices.audioInput ||
          (devices.audioInputs.length > 0
            ? devices.audioInputs[0].deviceId
            : "")
      );
      setSelectedVideoInput(
        currentDevices.videoInput ||
          (devices.videoInputs.length > 0
            ? devices.videoInputs[0].deviceId
            : "")
      );
      setSelectedAudioOutput(
        currentDevices.audioOutput ||
          (devices.audioOutputs.length > 0
            ? devices.audioOutputs[0].deviceId
            : "")
      );
    }, [getAvailableDevices, getCurrentDevices]);

    useEffect(() => {
      if (visible) {
        fetchDevices();
      }
    }, [visible, fetchDevices]);

    const handleAudioInputChange = async (deviceId: string) => {
      setSelectedAudioInput(deviceId);
      await changeAudioInput(deviceId);
    };

    const handleVideoInputChange = async (deviceId: string) => {
      setSelectedVideoInput(deviceId);
      await changeVideoInput(deviceId);
    };

    const handleAudioOutputChange = async (deviceId: string) => {
      setSelectedAudioOutput(deviceId);
      await changeAudioOutput(deviceId);
    };

    return (
      <Dialog
        visible={visible}
        onHide={onHide}
        className="settings-dialog"
        header="Cihaz Ayarları"
        style={{ width: "600px" }}
      >
        <div className="settings-content">
          <div className="device-section">
            <h4>
              <span className="material-icons">mic</span>
              Mikrofon
            </h4>
            <select
              className="device-select"
              value={selectedAudioInput}
              onChange={(e) => handleAudioInputChange(e.target.value)}
            >
              {audioDevices.length === 0 ? (
                <option value="">Mikrofon bulunamadı</option>
              ) : (
                audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="device-section">
            <h4>
              <span className="material-icons">videocam</span>
              Kamera
            </h4>
            <select
              className="device-select"
              value={selectedVideoInput}
              onChange={(e) => handleVideoInputChange(e.target.value)}
            >
              {videoDevices.length === 0 ? (
                <option value="">Kamera bulunamadı</option>
              ) : (
                videoDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="device-section">
            <h4>
              <span className="material-icons">volume_up</span>
              Hoparlör
            </h4>
            <select
              className="device-select"
              value={selectedAudioOutput}
              onChange={(e) => handleAudioOutputChange(e.target.value)}
            >
              {audioOutputDevices.length === 0 ? (
                <option value="">Hoparlör bulunamadı</option>
              ) : (
                audioOutputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="settings-actions">
            <Button
              icon={<span className="material-icons">refresh</span>}
              onClick={fetchDevices}
              className="refresh-button"
              label="Yenile"
            />
            <Button label="Kapat" onClick={onHide} className="close-button" />
          </div>
        </div>
      </Dialog>
    );
  }
);

// Grid'deki her participant için memoized wrapper
const MemoizedParticipantWrapper = React.memo(
  ({
    participant,
    idx,
    renderParticipant,
  }: {
    participant: Participant;
    idx: number;
    renderParticipant: (p: Participant, idx: number) => React.ReactNode;
  }) => {
    return (
      <div className={"size-full"} key={participant.id}>
        {renderParticipant(participant, idx)}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Sadece önemli değişiklikler varsa re-render et
    return (
      prevProps.participant.id === nextProps.participant.id &&
      prevProps.participant.isVideoEnabled ===
        nextProps.participant.isVideoEnabled &&
      prevProps.participant.isAudioEnabled ===
        nextProps.participant.isAudioEnabled &&
      prevProps.participant.isSpeaking === nextProps.participant.isSpeaking &&
      prevProps.idx === nextProps.idx
    );
  }
);

const ConferenceCall: React.FC = () => {
  const {
    roomState,
    autoConnect,
    disconnect,
    toggleVideo,
    toggleAudio,
    retry,
    clearError,
    error,
    isRetrying,
    connectionState,
    getAvailableDevices,
    getCurrentDevices,
    changeAudioInput,
    changeVideoInput,
    changeAudioOutput,
  } = useLiveKit();

  const [fullScreenParticipant, setFullScreenParticipant] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isErrorExiting, setIsErrorExiting] = useState(false);
  const hasConnectedRef = useRef(false);
  const errorTimeoutRef = useRef<number | null>(null);

  // Function to handle error dismissal with animation
  const dismissError = useCallback(() => {
    setIsErrorExiting(true);
    setTimeout(() => {
      clearError();
      setIsErrorExiting(false);
    }, 300); // Match animation duration
  }, [clearError]);

  // Auto-dismiss general errors after 5 seconds
  useEffect(() => {
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    // Reset exit state when error changes
    setIsErrorExiting(false);

    // If there's a general error (not connection error), set timeout to dismiss it
    if (error && error.type === "general") {
      errorTimeoutRef.current = setTimeout(() => {
        dismissError();
      }, 5000);
    }

    // Cleanup timeout on unmount or error change
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
  }, [error, dismissError]);

  const enterFullScreen = useCallback((participantId: string) => {
    setFullScreenParticipant(participantId);
  }, []);

  const exitFullScreen = useCallback(() => {
    setFullScreenParticipant(null);
  }, []);

  // Audio level monitoring - throttled for better performance
  useEffect(() => {
    // KALDIRILIYOR: Audio level monitoring interval'ı gereksiz
    // ActiveSpeakersChanged event'i zaten isSpeaking bilgisini veriyor
    // Sadece voice indicator için audioLevel gerekiyor ama bu da LiveKit'in kendi audioLevel property'si ile alınabilir

    // Manual audio level polling artık gerekli değil
    return () => {}; // Cleanup function
  }, []); // Dependency array simplified

  // Memoize the voice indicator to avoid recreating on every render
  const renderVoiceIndicator = useCallback(
    (color: string, audioLevel: number, isSpeaking: boolean) => {
      // Create a wave-like animation effect
      const bars = 10;
      // Use isSpeaking from ActiveSpeakersChanged event instead of audioLevel threshold
      const isActive = isSpeaking;

      // Only log when speaking state is active
      if (isActive) {
        console.log(
          `🎵 Voice indicator ACTIVE: isSpeaking=${isSpeaking}, audioLevel=${audioLevel.toFixed(
            3
          )}`
        );
      }

      return (
        <div
          className={`voice-indicator ${isActive ? "active" : ""}`}
          style={{ opacity: isActive ? 0.8 + audioLevel * 0.2 : 0.3 }}
        >
          {Array.from({ length: bars }, (_, i) => {
            let height = 4; // baseHeight

            if (isActive) {
              // Create a bell curve shape with middle being highest
              const middleIndex = (bars - 1) / 2;
              const distanceFromMiddle = Math.abs(i - middleIndex);
              const normalizedDistance = 1 - distanceFromMiddle / middleIndex;

              // Use audioLevel for animation intensity, but only when actually speaking
              const effectiveLevel = Math.max(audioLevel, 0.3); // Minimum level for visibility
              const maxHeight = 100;
              height =
                4 +
                (maxHeight - 4) *
                  effectiveLevel *
                  Math.pow(normalizedDistance, 2);
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

      // Use the new isSpeaking property from ActiveSpeakersChanged event
      // This is more reliable than manual audio level polling
      const isSpeaking = participant.isSpeaking || false;

      // Get audio level directly from participant instead of state
      const audioLevel = participant.participant?.audioLevel || 0;

      // Debug speaking state changes only
      if (isSpeaking || audioLevel > 0.01) {
        console.log(
          `🔊 Participant ${
            participant.name
          }: isSpeaking=${isSpeaking}, audioLevel=${audioLevel.toFixed(3)}`
        );
      }

      const isFullScreen = fullScreenParticipant === participant.id;

      // Get connection status indicators
      const hasConnectionIssues = participant.hasConnectionIssues || false;
      const streamState = participant.streamState;

      // Generate a user-friendly display name from the username
      const displayName = isLocal
        ? "You"
        : participant.name.startsWith("user_")
        ? `User ${
            participant.name.split("_")[2]?.slice(0, 4) ||
            participant.name.slice(-4)
          }`
        : participant.name;

      // Placeholder image URLs or initials
      const profileUrl = undefined; // No avatar in model
      const initials = displayName
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
          <VideoParticipant
            participant={participant}
            key={`${participant.id}-video`}
          />

          <div className="participant-name" style={{ color: nameColor }}>
            {displayName}
          </div>

          {/* Audio mute indicator */}
          {!participant.isAudioEnabled && (
            <div className="audio-muted-indicator">
              <span className="material-icons">mic_off</span>
            </div>
          )}

          {/* Connection issues indicator */}
          {hasConnectionIssues && (
            <div className="connection-issues-indicator">
              <span className="material-icons">warning</span>
            </div>
          )}

          {/* Stream buffering indicator */}
          {streamState === "buffering" && (
            <div className="buffering-indicator">
              <span className="material-icons rotating">sync</span>
            </div>
          )}

          <div
            className="avatar-container"
            style={{
              display: participant.isVideoEnabled ? "none" : "flex",
            }}
          >
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
          {renderVoiceIndicator(nameColor, audioLevel, isSpeaking)}
        </div>
      );
    },
    [
      fullScreenParticipant,
      roomState.participants.length,
      enterFullScreen,
      renderVoiceIndicator,
    ]
  );

  useEffect(() => {
    if (!hasConnectedRef.current) {
      hasConnectedRef.current = true;
      autoConnect();
    }

    return () => {
      if (roomState.isConnected) {
        disconnect();
      }
    };
  }, []);

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
      {/* Top Status Bar */}
      <div className="top-status-bar">
        <div className="status-item">
          <span className="material-icons">people</span>
          <span>
            {roomState.participants.length} participant
            {roomState.participants.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div
          className={`status-item connection-status ${
            connectionState === "connected"
              ? "connected"
              : connectionState === "connecting"
              ? "connecting"
              : "disconnected"
          }`}
        >
          <span className="material-icons">
            {connectionState === "connected"
              ? "wifi"
              : connectionState === "connecting"
              ? "sync"
              : "wifi_off"}
          </span>
          <span>
            {connectionState === "connected"
              ? "Connected"
              : connectionState === "connecting"
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Error Notification - Floating in top-right */}
      {error && (
        <div className={`error-notification ${isErrorExiting ? "exit" : ""}`}>
          <div className="error-content">
            <div className="error-header">
              <span className="material-icons">error_outline</span>
              <span className="error-title">
                {error.type === "connection" ? "Connection Error" : "Error"}
              </span>
              <Button
                icon={<span className="material-icons">close</span>}
                onClick={dismissError}
                className="error-close-button"
                size="small"
                tooltip="Close"
                tooltipOptions={{ position: "left" }}
              />
            </div>
            <div className="error-message">{error.message}</div>
            {error.type === "connection" && (
              <div className="error-actions">
                <Button
                  icon={
                    isRetrying ? (
                      <span className="material-icons rotating">refresh</span>
                    ) : (
                      <span className="material-icons">refresh</span>
                    )
                  }
                  onClick={retry}
                  disabled={isRetrying}
                  className="error-retry-button"
                  label={isRetrying ? "Retrying..." : "Retry"}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>
      )}

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
              <MemoizedParticipantWrapper
                key={participant.id}
                participant={participant}
                idx={idx}
                renderParticipant={renderParticipant}
              />
            );
          })}
        </div>
      )}

      <div className="controls-container">
        <div className="controls-panel">
          {/* Status items moved to top status bar - hiding this */}
          {/* <div className="control-group status-group">
            ... (commented out - moved to top)
          </div> */}

          <div className="control-group">
            <Button
              icon={
                roomState.isAudioEnabled ? (
                  <span className="material-icons">mic</span>
                ) : (
                  <span className="material-icons">mic_off</span>
                )
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
              icon={
                roomState.isVideoEnabled ? (
                  <span className="material-icons">videocam</span>
                ) : (
                  <span className="material-icons">videocam_off</span>
                )
              }
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
              icon={<span className="material-icons">call_end</span>}
              onClick={disconnect}
              className="control-button hang-up-button"
              tooltip="Leave Call"
              tooltipOptions={{ position: "top" }}
            />
          </div>

          <div className="control-group">
            <Button
              icon={<span className="material-icons">settings</span>}
              onClick={() => setShowSettings(true)}
              className="control-button settings-button"
              tooltip="Settings"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        visible={showSettings}
        onHide={() => setShowSettings(false)}
        getAvailableDevices={getAvailableDevices}
        getCurrentDevices={getCurrentDevices}
        changeAudioInput={changeAudioInput}
        changeVideoInput={changeVideoInput}
        changeAudioOutput={changeAudioOutput}
      />
    </div>
  );
};

export default ConferenceCall;
