import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useMediaDeviceSelect } from "../@livekit/components-react/dist";

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

export default SettingsDialog;
