import React from 'react';
import { Button } from 'primereact/button';
import { useMediaDeviceSelect } from '@livekit/components-react';

// Settings Sidebar Component
const SettingsDialog: React.FC<{
  visible: boolean;
  onHide: () => void;
}> = ({ visible, onHide }) => {
  const {
    devices: audioInputs,
    activeDeviceId: activeAudioInput,
    setActiveMediaDevice: setAudioInput,
  } = useMediaDeviceSelect({ kind: 'audioinput' });

  const {
    devices: videoInputs,
    activeDeviceId: activeVideoInput,
    setActiveMediaDevice: setVideoInput,
  } = useMediaDeviceSelect({ kind: 'videoinput' });

  const {
    devices: audioOutputs,
    activeDeviceId: activeAudioOutput,
    setActiveMediaDevice: setAudioOutput,
  } = useMediaDeviceSelect({ kind: 'audiooutput' });

  if (!visible) return null;

  return (
    <div className="settings-sidebar-container">
      <div className="settings-sidebar">
        <div className="settings-sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="icon-circle">
              <span className="material-icons">settings</span>
            </div>
            <h2 className="sidebar-title">Device Settings</h2>
            <div className="settings-subtitle">
              Configure your audio and video devices
            </div>
            <Button className="close-sidebar-button" onClick={onHide}>
              <span className="material-icons">close</span>
            </Button>
          </div>

          {/* Settings Content */}
          <div className="settings-sections">
            {/* Microphone Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <span className="material-icons">mic</span>
                <h3 className="settings-section-title">Microphone</h3>
              </div>
              <select
                className="device-select"
                value={activeAudioInput || ''}
                onChange={e => setAudioInput(e.target.value)}
              >
                <option value="" disabled>
                  {audioInputs.length === 0
                    ? 'No microphones found'
                    : 'Select microphone'}
                </option>
                {audioInputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <span className="material-icons">videocam</span>
                <h3 className="settings-section-title">Camera</h3>
              </div>
              <select
                className="device-select"
                value={activeVideoInput || ''}
                onChange={e => setVideoInput(e.target.value)}
              >
                <option value="" disabled>
                  {videoInputs.length === 0
                    ? 'No cameras found'
                    : 'Select camera'}
                </option>
                {videoInputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <span className="material-icons">volume_up</span>
                <h3 className="settings-section-title">Speaker</h3>
              </div>
              <select
                className="device-select"
                value={activeAudioOutput || ''}
                onChange={e => setAudioOutput(e.target.value)}
              >
                <option value="" disabled>
                  {audioOutputs.length === 0
                    ? 'No speakers found'
                    : 'Select speaker'}
                </option>
                {audioOutputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
