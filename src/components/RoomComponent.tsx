import React, { useEffect, useState, useCallback } from "react";
import {
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useConnectionState,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Button } from "primereact/button";
import CustomParticipantTile from "./CustomParticipantTile";
import SettingsDialog from "./SettingsDialog";

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

export default RoomComponent;
