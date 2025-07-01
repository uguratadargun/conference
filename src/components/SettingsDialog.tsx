import React from 'react';
import { Button } from 'primereact/button';
import {
  useMediaDeviceSelect,
  useBackgroundEffects,
} from '@livekit/components-react';
import {
  IconSettings,
  IconX,
  IconMicrophone,
  IconVideo,
  IconVolume,
  IconPhoto,
  IconBlur,
  IconPlayerStop,
} from '@tabler/icons-react';

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

  // Background effects hook
  const {
    activeEffect,
    isProcessing,
    error,
    isSupported,
    blurRadius,
    appliedBlurRadius,
    applyEffect,
    setBlurRadius,
    clearError,
  } = useBackgroundEffects({
    initialBlurRadius: 10,
    blurDebounceMs: 300, // Faster response for better UX
  });

  if (!visible) return null;

  return (
    <div className="settings-sidebar-container">
      <div className="settings-sidebar">
        <div className="settings-sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="icon-circle">
              <IconSettings size={24} />
            </div>
            <h2 className="sidebar-title">Device Settings</h2>
            <div className="settings-subtitle">
              Configure your audio and video devices
            </div>
            <Button className="close-sidebar-button" onClick={onHide}>
              <IconX size={20} />
            </Button>
          </div>

          {/* Settings Content */}
          <div className="settings-sections">
            {/* Microphone Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <IconMicrophone size={20} />
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
                <IconVideo size={20} />
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

            {/* Background Effects Section */}
            {isSupported && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <IconPhoto size={20} />
                  <h3 className="settings-section-title">Background Effects</h3>
                </div>

                {error && (
                  <div className="background-effects-error">
                    {error}
                    <button onClick={clearError}>✕</button>
                  </div>
                )}

                <div className="background-effects-grid">
                  {/* None */}
                  <button
                    className={`effect-button ${activeEffect === 'none' ? 'active' : ''}`}
                    onClick={() => applyEffect('none')}
                    disabled={isProcessing}
                  >
                    <IconPlayerStop
                      size={20}
                      color={activeEffect === 'none' ? 'white' : '#ccc'}
                    />
                    <span>None</span>
                  </button>

                  {/* Blur */}
                  <button
                    className={`effect-button ${activeEffect === 'blur' ? 'active' : ''}`}
                    onClick={() => applyEffect('blur')}
                    disabled={isProcessing}
                  >
                    <IconBlur
                      size={20}
                      color={activeEffect === 'blur' ? 'white' : '#ccc'}
                    />
                    <span>Blur</span>
                  </button>

                  {/* Virtual Background */}
                  <button
                    className={`effect-button ${activeEffect === 'virtual' ? 'active' : ''}`}
                    onClick={() => applyEffect('virtual')}
                    disabled={isProcessing}
                  >
                    <IconPhoto
                      size={20}
                      color={activeEffect === 'virtual' ? 'white' : '#ccc'}
                    />
                    <span>Virtual</span>
                  </button>
                </div>

                {/* Blur Radius Control */}
                {activeEffect === 'blur' && (
                  <div className="blur-controls">
                    <label>Blur Intensity: {blurRadius}</label>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      value={blurRadius}
                      onChange={e => setBlurRadius(Number(e.target.value))}
                      disabled={isProcessing}
                    />
                  </div>
                )}

                {isProcessing && (
                  <div className="background-effects-processing">
                    Processing effect...
                  </div>
                )}
              </div>
            )}

            {!isSupported && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <IconPhoto size={20} />
                  <h3 className="settings-section-title">Background Effects</h3>
                </div>
                <div className="background-effects-unsupported">
                  Background effects are not supported in this browser
                </div>
              </div>
            )}

            {/* Speaker Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <IconVolume size={20} />
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
