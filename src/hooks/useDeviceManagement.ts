import { Room, Track } from "livekit-client";
import { useRef, useCallback } from "react";
import type { MediaDevice, DeviceState, CurrentDevices } from "../types/livekit";

// Global device cache
let deviceCache: DeviceState | null = null;
let lastDeviceCheck = 0;
const CACHE_DURATION = 5000; // 5 seconds

export const useDeviceManagement = (room: Room | null) => {
  const deviceChangeListenerRef = useRef<(() => void) | null>(null);

  // Optimized device enumeration with caching
  const getAvailableDevices = useCallback(async (): Promise<DeviceState> => {
    const now = Date.now();
    
    // Return cached result if still valid
    if (deviceCache && (now - lastDeviceCheck) < CACHE_DURATION) {
      return deviceCache;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs: MediaDevice[] = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
        }));

      const videoInputs: MediaDevice[] = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
        }));

      const audioOutputs: MediaDevice[] = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`
        }));

      // Update cache
      deviceCache = { audioInputs, videoInputs, audioOutputs };
      lastDeviceCheck = now;

      // Setup device change listener if not already setup
      if (!deviceChangeListenerRef.current) {
        const handleDeviceChange = () => {
          console.log('🔄 Media devices changed, invalidating cache');
          deviceCache = null;
          lastDeviceCheck = 0;
        };
        
        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        deviceChangeListenerRef.current = () => {
          navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        };
      }

      return deviceCache;
    } catch (error) {
      console.error("Failed to get available devices:", error);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }, []);

  const getCurrentDevices = useCallback(async (): Promise<CurrentDevices> => {
    if (!room) {
      return { audioInput: '', videoInput: '', audioOutput: '' };
    }

    try {
      const localParticipant = room.localParticipant;
      
      let audioInput = '';
      let videoInput = '';
      let audioOutput = '';

      const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      const videoTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track;

      if (audioTrack && 'getDeviceId' in audioTrack) {
        audioInput = await (audioTrack as any).getDeviceId() || '';
      }

      if (videoTrack && 'getDeviceId' in videoTrack) {
        videoInput = await (videoTrack as any).getDeviceId() || '';
      }

      audioOutput = '';

      return { audioInput, videoInput, audioOutput };
    } catch (error) {
      console.error("Failed to get current devices:", error);
      return { audioInput: '', videoInput: '', audioOutput: '' };
    }
  }, [room]);

  const changeAudioInput = useCallback(async (deviceId: string): Promise<void> => {
    if (room) {
      try {
        await room.switchActiveDevice('audioinput', deviceId);
        // Invalidate cache when device changes
        deviceCache = null;
        lastDeviceCheck = 0;
      } catch (error) {
        console.error("Failed to change audio input device:", error);
      }
    }
  }, [room]);

  const changeVideoInput = useCallback(async (deviceId: string): Promise<void> => {
    if (room) {
      try {
        await room.switchActiveDevice('videoinput', deviceId);
        // Invalidate cache when device changes
        deviceCache = null;
        lastDeviceCheck = 0;
      } catch (error) {
        console.error("Failed to change video input device:", error);
      }
    }
  }, [room]);

  const changeAudioOutput = useCallback(async (deviceId: string): Promise<void> => {
    if (room) {
      try {
        await room.switchActiveDevice('audiooutput', deviceId);
        
        // Optimize audio element updates
        const audioElements = document.querySelectorAll('audio');
        const updatePromises = Array.from(audioElements).map(async (audioElement) => {
          if ('setSinkId' in audioElement && typeof audioElement.setSinkId === 'function') {
            try {
              await audioElement.setSinkId(deviceId);
              console.log(`✅ Set audio output device for audio element: ${deviceId}`);
            } catch (sinkError) {
              console.warn('⚠️ Failed to set sink ID for audio element:', sinkError);
            }
          }
        });
        
        await Promise.allSettled(updatePromises);
        
        // Invalidate cache when device changes
        deviceCache = null;
        lastDeviceCheck = 0;
      } catch (error) {
        console.error("Failed to change audio output device:", error);
      }
    }
  }, [room]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (deviceChangeListenerRef.current) {
      deviceChangeListenerRef.current();
      deviceChangeListenerRef.current = null;
    }
  }, []);

  return {
    getAvailableDevices,
    getCurrentDevices,
    changeAudioInput,
    changeVideoInput,
    changeAudioOutput,
    cleanup,
  };
}; 