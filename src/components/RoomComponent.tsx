import React, { useEffect, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { useLiveKit } from "../context/LiveKitContext";
import ConferenceComponent from "./ConferenceComponent";
import { Button } from "primereact/button";

// Main ConferenceCall Component with LiveKitRoom wrapper
const RoomComponent: React.FC = () => {
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
      <ConferenceComponent />
    </LiveKitRoom>
  );
};

export default RoomComponent;
