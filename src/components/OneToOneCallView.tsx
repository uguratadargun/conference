import React, { useState } from "react";
import { Participant } from "livekit-client";
import CustomParticipantTile from "./CustomParticipantTile";
import { Button } from "primereact/button";

interface OneToOneCallViewProps {
  remoteParticipant: Participant;
  localParticipant: Participant;
}

type LayoutType = "standard" | "focus" | "no-video";

const OneToOneCallView: React.FC<OneToOneCallViewProps> = ({
  remoteParticipant,
  localParticipant,
}) => {
  const [layout, setLayout] = useState<LayoutType>("standard");
  // State to track if participants are swapped
  const [isSwapped, setIsSwapped] = useState(false);

  const toggleLayout = () => {
    // Cycle through layouts: standard -> focus -> no-video -> standard
    if (layout === "standard") {
      setLayout("focus");
    } else if (layout === "focus") {
      setLayout("no-video");
    } else {
      setLayout("standard");
    }
  };

  // Function to swap positions
  const swapParticipants = () => {
    setIsSwapped(!isSwapped);
  };

  // Get the main and secondary participants based on swap state
  const mainParticipant = isSwapped ? localParticipant : remoteParticipant;
  const secondaryParticipant = isSwapped ? remoteParticipant : localParticipant;

  // Return different layouts based on the selected type
  const renderLayout = () => {
    switch (layout) {
      case "focus":
        return (
          <div className="one-to-one-focus">
            <div className="one-to-one-focus-remote">
              <CustomParticipantTile
                participant={mainParticipant}
                idx={0}
                onMaximize={swapParticipants}
              />
            </div>
            <div className="one-to-one-focus-local">
              <CustomParticipantTile
                participant={secondaryParticipant}
                idx={1}
                onMaximize={swapParticipants}
              />
            </div>
          </div>
        );
      case "no-video":
        return (
          <div className="one-to-one-no-video">
            <div className="one-to-one-remote-only">
              <CustomParticipantTile
                participant={remoteParticipant}
                idx={0}
                onMaximize={swapParticipants}
              />
            </div>
          </div>
        );
      case "standard":
      default:
        return (
          <>
            <div className="one-to-one-remote">
              <CustomParticipantTile
                participant={mainParticipant}
                idx={0}
                onMaximize={swapParticipants}
              />
            </div>
            <div className="one-to-one-local">
              <CustomParticipantTile
                participant={secondaryParticipant}
                idx={1}
                onMaximize={swapParticipants}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className={`one-to-one-container one-to-one-layout-${layout}`}>
      {renderLayout()}

      {/* Layout toggle button */}
      <Button
        icon={<span className="material-icons">grid_view</span>}
        onClick={toggleLayout}
        className="layout-toggle-button"
        tooltip={
          layout === "standard"
            ? "Change to focus layout"
            : layout === "focus"
            ? "Change to no-video layout"
            : "Change to standard layout"
        }
        tooltipOptions={{ position: "left" }}
      />
    </div>
  );
};

export default OneToOneCallView;
