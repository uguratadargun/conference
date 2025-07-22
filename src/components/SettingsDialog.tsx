import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { useMediaDeviceSelect } from '@livekit/components-react';
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

import { useBackgroundEffects } from '../utils/useBackgroundEffects';

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

  // Background effects - temporarily disabled as useBackgroundEffects is not available in npm package
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
  } = useBackgroundEffects();

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
            <h2 className="sidebar-title">Cihaz Ayarları</h2>
            <div className="settings-subtitle">
              Ses ve video cihazlarınızı yapılandırın
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
                <h3 className="settings-section-title">Mikrofon</h3>
              </div>
              <select
                className="device-select"
                value={activeAudioInput || ''}
                onChange={e => setAudioInput(e.target.value)}
              >
                <option value="" disabled>
                  {audioInputs.length === 0
                    ? 'Mikrofon bulunamadı'
                    : 'Mikrofon seçin'}
                </option>
                {audioInputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Mikrofon ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <IconVideo size={20} />
                <h3 className="settings-section-title">Kamera</h3>
              </div>
              <select
                className="device-select"
                value={activeVideoInput || ''}
                onChange={e => setVideoInput(e.target.value)}
              >
                <option value="" disabled>
                  {videoInputs.length === 0
                    ? 'Kamera bulunamadı'
                    : 'Kamera seçin'}
                </option>
                {videoInputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Background Effects Section */}
            {isSupported && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <IconPhoto size={20} />
                  <h3 className="settings-section-title">
                    Arka Plan Efektleri
                  </h3>
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
                    <span>Yok</span>
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
                    <span>Bulanıklaştır</span>
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
                    <span>Sanal</span>
                  </button>
                </div>

                {/* Blur Radius Control */}
                {activeEffect === 'blur' && (
                  <div className="blur-controls">
                    <label>Bulanıklık Yoğunluğu: {blurRadius}</label>
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
                    Efekt işleniyor...
                  </div>
                )}
              </div>
            )}

            {!isSupported && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <IconPhoto size={20} />
                  <h3 className="settings-section-title">
                    Arka Plan Efektleri
                  </h3>
                </div>
                <div className="background-effects-unsupported">
                  Arka plan efektleri bu tarayıcıda desteklenmiyor
                </div>
              </div>
            )}

            {/* Speaker Section */}
            <div className="settings-section">
              <div className="settings-section-header">
                <IconVolume size={20} />
                <h3 className="settings-section-title">Hoparlör</h3>
              </div>
              <select
                className="device-select"
                value={activeAudioOutput || ''}
                onChange={e => setAudioOutput(e.target.value)}
              >
                <option value="" disabled>
                  {audioOutputs.length === 0
                    ? 'Hoparlör bulunamadı'
                    : 'Hoparlör seçin'}
                </option>
                {audioOutputs.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Hoparlör ${device.deviceId.slice(0, 8)}`}
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
