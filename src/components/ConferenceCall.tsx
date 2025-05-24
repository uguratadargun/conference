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
import { Track, RoomEvent } from "livekit-client";
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

// New simplified VideoParticipant component
const VideoParticipant = React.memo(
  ({ participant }: { participant: Participant }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement || !participant.participant) return;

      // Get all track publications and find the video track
      const trackPublications = participant.participant.getTrackPublications();
      const videoPublication = trackPublications.find(
        (pub) => pub.kind === Track.Kind.Video
      );

      console.log(`Video track check for ${participant.id}:`, {
        hasVideoPublication: !!videoPublication,
        hasTrack: !!videoPublication?.track,
        isMuted: videoPublication?.isMuted,
        isSubscribed: videoPublication?.isSubscribed,
        isLocal: participant.isLocal,
      });

      if (videoPublication?.track) {
        const track = videoPublication.track;

        // For remote participants, check if the track is subscribed
        // For local participants, the track should be available immediately
        const shouldAttach =
          participant.isLocal || videoPublication.isSubscribed;

        if (shouldAttach && !videoPublication.isMuted) {
          console.log(`Attaching video track for ${participant.id}`);
          track.attach(videoElement);

          return () => {
            console.log(`Detaching video track for ${participant.id}`);
            track.detach(videoElement);
          };
        }
      } else {
        console.log(`No video track available for ${participant.id}`);
      }

      // Check again in a short delay for newly subscribed tracks
      const timeoutId = setTimeout(() => {
        const updatedTrackPublications =
          participant.participant.getTrackPublications();
        const updatedVideoPublication = updatedTrackPublications.find(
          (pub) => pub.kind === Track.Kind.Video
        );

        if (
          updatedVideoPublication?.track &&
          updatedVideoPublication.isSubscribed &&
          !updatedVideoPublication.isMuted
        ) {
          console.log(`Delayed attaching video track for ${participant.id}`);
          updatedVideoPublication.track.attach(videoElement);
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }, [
      participant.participant,
      participant.isVideoEnabled,
      participant.id,
      participant.lastUpdated,
    ]);

    return (
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
    const [audioDevices, setAudioDevices] = useState<{ deviceId: string; label: string }[]>([]);
    const [videoDevices, setVideoDevices] = useState<{ deviceId: string; label: string }[]>([]);
    const [audioOutputDevices, setAudioOutputDevices] = useState<{ deviceId: string; label: string }[]>([]);
    
    const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
    const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
    const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');

    const fetchDevices = useCallback(async () => {
      const devices = await getAvailableDevices();
      setAudioDevices(devices.audioInputs);
      setVideoDevices(devices.videoInputs);
      setAudioOutputDevices(devices.audioOutputs);
      
      // Get current devices and set as selected
      const currentDevices = await getCurrentDevices();
      
      // Set current devices as selected, or default to first device if available
      setSelectedAudioInput(currentDevices.audioInput || (devices.audioInputs.length > 0 ? devices.audioInputs[0].deviceId : ''));
      setSelectedVideoInput(currentDevices.videoInput || (devices.videoInputs.length > 0 ? devices.videoInputs[0].deviceId : ''));
      setSelectedAudioOutput(currentDevices.audioOutput || (devices.audioOutputs.length > 0 ? devices.audioOutputs[0].deviceId : ''));
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
        style={{ width: '600px' }}
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
                audioDevices.map(device => (
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
                videoDevices.map(device => (
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
                audioOutputDevices.map(device => (
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
            <Button
              label="Kapat"
              onClick={onHide}
              className="close-button"
            />
          </div>
        </div>
      </Dialog>
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
    error,
    isRetrying,
    getAvailableDevices,
    getCurrentDevices,
    changeAudioInput,
    changeVideoInput,
    changeAudioOutput,
  } = useLiveKit();

  const [audioLevels, setAudioLevels] = useState<{ [key: string]: number }>({});
  const [fullScreenParticipant, setFullScreenParticipant] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const prevAudioLevelsRef = useRef<{ [key: string]: number }>({});
  const hasConnectedRef = useRef(false);

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
      const bars = 10;
      const isActive = audioLevel > AUDIO_THRESHOLD;

      return (
        <div
          className={`voice-indicator ${isActive ? "active" : ""}`}
          style={{ opacity: isActive ? 0.3 + audioLevel * 0.7 : 0.3 }}
        >
          {Array.from({ length: bars }, (_, i) => {
            let height = 4; // baseHeight

            if (isActive) {
              // Create a bell curve shape with middle being highest
              const middleIndex = (bars - 1) / 2;
              const distanceFromMiddle = Math.abs(i - middleIndex);
              const normalizedDistance = 1 - distanceFromMiddle / middleIndex;

              // Use the distance from middle to determine height (bell curve)
              const maxHeight = 150;
              height =
                4 +
                (maxHeight - 4) * audioLevel * Math.pow(normalizedDistance, 2);
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
            key={`${participant.id}-video-${participant.isVideoEnabled}`}
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

  // Audio level monitoring
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
            icon={
              isRetrying ? (
                <span className="material-icons rotating">refresh</span>
              ) : (
                <span className="material-icons">refresh</span>
              )
            }
            onClick={retry}
            disabled={isRetrying}
            className="error-button"
          />
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
