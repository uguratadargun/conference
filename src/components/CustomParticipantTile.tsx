import React from "react";
import { Participant, Track } from "livekit-client";
import CustomVideoTrack from "./CustomVideoTrack";

// Define the color arrays
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

// CustomParticipantTile Component
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

      {participant.isMicrophoneEnabled &&
        participant.isSpeaking &&
        !participant.isCameraEnabled && (
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

export default CustomParticipantTile;
