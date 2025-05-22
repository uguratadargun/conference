import React, { useEffect, useRef } from "react";
import { useLiveKit } from "../context/LiveKitContext";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import type { Participant } from "../types/livekit";

// Participant name colors
const NAME_COLORS = ["#A78BFA", "#F472B6", "#34D399"];

const ConferenceCall: React.FC = () => {
  const { roomState, connect, disconnect, toggleVideo, toggleAudio } =
    useLiveKit();
  const [projectName, setProjectName] = React.useState("ugurdargun-w5ph6ze0");
  const [roomName, setRoomName] = React.useState("test-room");
  const [token, setToken] = React.useState(
    "eyJhbGciOiJIUzI1NiJ9.eyJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6InRlc3Qtcm9vbSJ9LCJpc3MiOiJBUEl0clZ3Ujc5ZnNmTjYiLCJleHAiOjE3NDc5MTg0MTEsIm5iZiI6MCwic3ViIjoidXNlcjEifQ.fZ4q4SlfKZvudBknBuVWrax5kPG5WMfx2KOVBs_55y4"
  );
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    roomState.participants.forEach((participant) => {
      const videoElement = videoRefs.current[participant.id];
      if (videoElement && participant.participant) {
        if (participant.isLocal) {
          participant.participant.camera?.attach(videoElement);
        } else {
          participant.participant.camera?.attach(videoElement);
        }
      }
    });
  }, [roomState.participants]);

  const handleConnect = async () => {
    if (projectName && roomName && token) {
      const url = `wss://${projectName}.livekit.cloud`;
      await connect(url, token);
    }
  };

  const getParticipantColor = (index: number) => {
    return NAME_COLORS[index % NAME_COLORS.length];
  };

  const getGridStyles = (participantCount: number) => {
    if (participantCount === 1) {
      return {
        flex: "1 1 100%",
        maxWidth: "100%",
        minHeight: "calc(100vh - 150px)",
      };
    } else if (participantCount === 2) {
      return {
        flex: "1 1 calc(50% - 12px)",
        maxWidth: "calc(50% - 12px)",
        minHeight: "calc(100vh - 150px)",
      };
    } else {
      return {
        flex: "1 1 calc(33.333% - 16px)",
        maxWidth: "calc(33.333% - 16px)",
        minHeight: "400px",
      };
    }
  };

  const renderParticipant = (participant: Participant) => {
    return (
      <div
        key={participant.id}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "#1A1A1A",
          borderRadius: "16px",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#A78BFA",
            fontSize: "24px",
            marginBottom: "32px",
            fontWeight: "500",
          }}
        >
          {participant.name}
        </div>
        <div
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: "#2A2A2A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          {participant.participant?.isCameraEnabled ? (
            <video
              ref={(el) => {
                videoRefs.current[participant.id] = el;
              }}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "72px",
                color: "#A78BFA",
              }}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "#333333",
            position: "absolute",
            bottom: "80px",
          }}
        />
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {!roomState.isConnected ? (
        <div
          style={{
            maxWidth: "400px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "24px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: "32px",
              fontSize: "28px",
              fontWeight: "500",
              color: "#FFFFFF",
            }}
          >
            Join Meeting
          </h2>
          <div style={{ width: "100%", marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                color: "#FFFFFF",
              }}
            >
              Project Name
            </label>
            <InputText
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "12px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
              }}
              placeholder="your-project-name"
            />
          </div>
          <div style={{ width: "100%", marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                color: "#FFFFFF",
              }}
            >
              Room Name
            </label>
            <InputText
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "12px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
              }}
              placeholder="my-room"
            />
          </div>
          <div style={{ width: "100%", marginBottom: "32px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                color: "#FFFFFF",
              }}
            >
              Token
            </label>
            <InputText
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "12px",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
              }}
              placeholder="Your LiveKit token"
            />
          </div>
          <Button
            label="Join"
            onClick={handleConnect}
            style={{
              width: "100%",
              borderRadius: "12px",
              padding: "14px",
              background: "#1A73E8",
              border: "none",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              width: "100%",
              maxWidth: "1200px",
              height: "calc(100vh - 100px)",
              padding: "24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {roomState.participants.map(renderParticipant)}
          </div>
          <div
            style={{
              position: "fixed",
              bottom: "32px",
              display: "flex",
              gap: "12px",
              padding: "8px",
              borderRadius: "12px",
              background: "rgba(32, 33, 36, 0.6)",
            }}
          >
            <Button
              icon={
                roomState.isAudioEnabled
                  ? "pi pi-microphone"
                  : "pi pi-microphone-slash"
              }
              onClick={toggleAudio}
              style={{
                width: "44px",
                height: "44px",
                background: roomState.isAudioEnabled ? "#3C4043" : "#EA4335",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
              }}
            />
            <Button
              icon={
                roomState.isVideoEnabled ? "pi pi-video" : "pi pi-video-slash"
              }
              onClick={toggleVideo}
              style={{
                width: "44px",
                height: "44px",
                background: roomState.isVideoEnabled ? "#3C4043" : "#EA4335",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
              }}
            />
            <Button
              icon="pi pi-phone"
              onClick={disconnect}
              style={{
                width: "44px",
                height: "44px",
                background: "#EA4335",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                transform: "rotate(135deg)",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ConferenceCall;
