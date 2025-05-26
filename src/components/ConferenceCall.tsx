import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useConnectionState,
  useMediaDeviceSelect,
  useRoomContext,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
import type { Participant } from "livekit-client";
import { useLiveKit } from "../context/LiveKitContext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
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
];

// Grid layout helpers
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

// Custom Video Component using refs for track attachment
const CustomVideoTrack: React.FC<{
  participant: Participant;
  source: Track.Source;
}> = ({ participant, source }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackAttached, setTrackAttached] = useState(false);

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

// Custom Participant Component
const CustomParticipantTile: React.FC<{
  participant: Participant;
  idx: number;
  onMaximize?: () => void;
}> = ({ participant, idx, onMaximize }) => {
  const borderColor = BORDER_COLORS[idx % BORDER_COLORS.length];
  const nameColor = NAME_COLORS[idx % NAME_COLORS.length];

  const displayName = participant.isLocal
    ? "You"
    : participant.name?.startsWith("user_")
    ? `User ${
        participant.name.split("_")[2]?.slice(0, 4) ||
        participant.name.slice(-4)
      }`
    : participant.name || "Anonymous";

  const initials = displayName
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div
      className={`size-full participant ${
        participant.isSpeaking ? "speaking" : ""
      }`}
      style={{
        borderColor: participant.isSpeaking ? borderColor : "transparent",
        cursor: onMaximize ? "pointer" : "default",
      }}
      onClick={onMaximize}
    >
      <CustomVideoTrack
        participant={participant}
        source={Track.Source.Camera}
      />

      <div className="participant-name" style={{ color: nameColor }}>
        <div className="name-container">{displayName}</div>
      </div>

      {!participant.isCameraEnabled && (
        <div className="avatar-container" style={{ display: "flex" }}>
          <span className="avatar-initials" style={{ color: nameColor }}>
            {initials}
          </span>
        </div>
      )}

      {participant.isMicrophoneEnabled && participant.isSpeaking && (
        <div className="voice-indicator-container">
          <div className="voice-indicator">
            <span className="wave wave1"></span>
            <span className="wave wave2"></span>
            <span className="wave wave3"></span>
            <span className="wave wave4"></span>
            <span className="wave wave5"></span>
          </div>
        </div>
      )}

      {!participant.isMicrophoneEnabled && (
        <div className="audio-muted-indicator">
          <span className="material-icons">mic_off</span>
        </div>
      )}
    </div>
  );
};

// Settings Dialog Component
const SettingsDialog: React.FC<{
  visible: boolean;
  onHide: () => void;
}> = ({ visible, onHide }) => {
  const {
    devices: audioInputs,
    activeDeviceId: activeAudioInput,
    setActiveMediaDevice: setAudioInput,
  } = useMediaDeviceSelect({ kind: "audioinput" });

  const {
    devices: videoInputs,
    activeDeviceId: activeVideoInput,
    setActiveMediaDevice: setVideoInput,
  } = useMediaDeviceSelect({ kind: "videoinput" });

  const {
    devices: audioOutputs,
    activeDeviceId: activeAudioOutput,
    setActiveMediaDevice: setAudioOutput,
  } = useMediaDeviceSelect({ kind: "audiooutput" });

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      className="settings-dialog"
      header="Device Settings"
      style={{ width: "600px" }}
    >
      <div className="settings-content">
        <div className="device-section">
          <h4>
            <span className="material-icons">mic</span>
            Microphone
          </h4>
          <select
            className="device-select"
            value={activeAudioInput || ""}
            onChange={(e) => setAudioInput(e.target.value)}
          >
            {audioInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        <div className="device-section">
          <h4>
            <span className="material-icons">videocam</span>
            Camera
          </h4>
          <select
            className="device-select"
            value={activeVideoInput || ""}
            onChange={(e) => setVideoInput(e.target.value)}
          >
            {videoInputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        <div className="device-section">
          <h4>
            <span className="material-icons">volume_up</span>
            Speaker
          </h4>
          <select
            className="device-select"
            value={activeAudioOutput || ""}
            onChange={(e) => setAudioOutput(e.target.value)}
          >
            {audioOutputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-actions">
          <Button label="Close" onClick={onHide} className="close-button" />
        </div>
      </div>
    </Dialog>
  );
};

// Main Room Component that uses LiveKit hooks
const RoomComponent: React.FC = () => {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const [fullScreenParticipant, setFullScreenParticipant] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);

  const enterFullScreen = useCallback((participantId: string) => {
    setFullScreenParticipant(participantId);
  }, []);

  const exitFullScreen = useCallback(() => {
    setFullScreenParticipant(null);
  }, []);

  // ESC key listener for exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullScreenParticipant) {
        exitFullScreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullScreenParticipant, exitFullScreen]);

  const toggleVideo = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(
        !localParticipant.isCameraEnabled
      );
    }
  }, [localParticipant]);

  const toggleAudio = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(
        !localParticipant.isMicrophoneEnabled
      );
    }
  }, [localParticipant]);

  const room = useRoomContext();

  const disconnect = useCallback(() => {
    // The LiveKitRoom component handles disconnection
    if (room) {
      room.disconnect();
    }
  }, [room]);

  const gridClassName = getGridClassName(participants.length);
  const fullscreenParticipant = participants.find(
    (p) => p.identity === fullScreenParticipant
  );
  const otherParticipants = participants.filter(
    (p) => p.identity !== fullScreenParticipant
  );

  return (
    <div className="conference-container">
      {/* Top Status Bar */}
      <div className="top-status-bar">
        <div className="status-item">
          <span className="material-icons">people</span>
          <span>
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div
          className={`status-item connection-status ${
            connectionState === ConnectionState.Connected
              ? "connected"
              : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? "connecting"
              : "disconnected"
          }`}
        >
          <span className="material-icons">
            {connectionState === ConnectionState.Connected
              ? "wifi"
              : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? "sync"
              : "wifi_off"}
          </span>
          <span>
            {connectionState === ConnectionState.Connected
              ? "Connected"
              : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Main Video Area */}
      {fullscreenParticipant ? (
        <div className="fullscreen-container">
          <CustomParticipantTile participant={fullscreenParticipant} idx={0} />
          <Button
            icon={<span className="material-icons">close</span>}
            onClick={exitFullScreen}
            className="exit-fullscreen-button"
            title="Exit fullscreen"
          />
          {otherParticipants.length > 0 && (
            <div className="thumbnails-container">
              {otherParticipants.map((participant, idx) => (
                <div key={participant.identity} className="thumbnail-wrapper">
                  <CustomParticipantTile
                    participant={participant}
                    idx={idx + 1}
                    onMaximize={() => enterFullScreen(participant.identity)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`participants-grid ${gridClassName}`}>
          {participants.map((participant, idx) => (
            <div key={participant.identity} className="size-full">
              <CustomParticipantTile
                participant={participant}
                idx={idx}
                onMaximize={() => enterFullScreen(participant.identity)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="controls-container">
        <div className="controls-panel">
          <div className="control-group">
            <Button
              icon={
                localParticipant?.isMicrophoneEnabled ? (
                  <span className="material-icons">mic</span>
                ) : (
                  <span className="material-icons">mic_off</span>
                )
              }
              onClick={toggleAudio}
              className={`control-button audio-button ${
                !localParticipant?.isMicrophoneEnabled ? "disabled" : ""
              }`}
              tooltip={
                localParticipant?.isMicrophoneEnabled
                  ? "Mute Audio"
                  : "Unmute Audio"
              }
              tooltipOptions={{ position: "top" }}
            />
          </div>

          <div className="control-group">
            <Button
              icon={
                localParticipant?.isCameraEnabled ? (
                  <span className="material-icons">videocam</span>
                ) : (
                  <span className="material-icons">videocam_off</span>
                )
              }
              onClick={toggleVideo}
              className={`control-button video-button ${
                !localParticipant?.isCameraEnabled ? "disabled" : ""
              }`}
              tooltip={
                localParticipant?.isCameraEnabled
                  ? "Turn Off Camera"
                  : "Turn On Camera"
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

      {/* Audio Renderer for spatial audio */}
      <RoomAudioRenderer />

      {/* Settings Dialog */}
      <SettingsDialog
        visible={showSettings}
        onHide={() => setShowSettings(false)}
      />
    </div>
  );
};

// Main ConferenceCall Component with LiveKitRoom wrapper
const ConferenceCall: React.FC = () => {
  const { generateToken } = useLiveKit();
  const [connectionData, setConnectionData] = useState<{
    url: string;
    token: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await generateToken();
        setConnectionData(data);
      } catch (err) {
        console.error("Failed to get connection data:", err);
        setError("Failed to connect to the room. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    connectToRoom();
  }, [generateToken]);

  if (isLoading) {
    return (
      <div className="conference-container">
        <div className="loading-container">
          <span className="material-icons rotating">sync</span>
          <span>Connecting to room...</span>
        </div>
      </div>
    );
  }

  if (error || !connectionData) {
    return (
      <div className="conference-container">
        <div className="error-container">
          <span className="material-icons">error</span>
          <span>{error || "Failed to get connection data"}</span>
          <Button
            label="Retry"
            onClick={() => window.location.reload()}
            className="retry-button"
          />
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connectionData.url}
      token={connectionData.token}
      connectOptions={{
        autoSubscribe: true,
      }}
      options={{
        publishDefaults: {
          videoCodec: "h264",
        },
      }}
    >
      <RoomComponent />
    </LiveKitRoom>
  );
};

export default ConferenceCall;
