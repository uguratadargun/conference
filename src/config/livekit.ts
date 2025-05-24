export const LIVEKIT_CONFIG = {
  apiKey: "APItrVwR79fsfN6",
  apiSecret: "0sbQLRiGbRSTBpAlKUJO7hdniYfGCCfANlv5rUMK8ib",
  projectName: "ugurdargun-w5ph6ze0",
  roomName: "test-room",
} as const;

export const ROOM_OPTIONS = {
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: 48000,
    channelCount: 1,
  },
  audioPlaybackDefaults: {
    autoplay: true,
    playsInline: true,
  },
} as const;

export const CONNECTION_CONFIG = {
  autoSubscribe: true,
  maxRetries: 3,
  retryDelayMs: 1000,
} as const;

export const INTERVALS = {
  // CONNECTION_QUALITY_CHECK: 5000, // KALDIRILIYOR: Event-driven yaklaşım kullanılıyor
  RETRY_DELAY: 1000, // Bağlantı yeniden deneme gecikmesi - gerekli
  // AUDIO_LEVEL_UPDATE: 150, // KALDIRILIYOR: ActiveSpeakersChanged event'i kullanılıyor
} as const; 