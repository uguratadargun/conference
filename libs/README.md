# 📦 LiveKit Libraries

Bu repository LiveKit JavaScript/TypeScript kütüphanelerinin geliştirme ortamını içerir. Her paket ayrı git repository'lere split edilmiştir ve git üzerinden kullanılabilir.

## 🚀 Kullanım

### Tek Paket Kurulumu

```bash
# Sadece React bileşenlerini kullanmak için
npm install git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git

# Sadece client kütüphanesini kullanmak için
npm install git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git
```

### Tüm Paketlerin Kurulumu

```json
{
  "name": "my-livekit-project",
  "version": "1.0.0",
  "description": "LiveKit kullanarak geliştirilen proje",
  "main": "index.js",
  "dependencies": {
    "@livekit/components-react": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git",
    "@livekit/components-core": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-core.git",
    "livekit-client": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git",
    "@livekit/mutex": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/mutex.git",
    "@livekit/protocol": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/protocol.git",
    "@livekit/track-processors": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/track-processors.git",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Belirli Commit/Tag Kullanımı

```json
{
  "dependencies": {
    "@livekit/components-react": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git#v2.9.12",
    "livekit-client": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git#abc1234"
  }
}
```

## 🔧 Kod Örnekleri

### React Video Conference Uygulaması

```typescript
import React from 'react';
import { VideoConference, LiveKitRoom } from '@livekit/components-react';
import { Room, RoomOptions } from 'livekit-client';

function App() {
  const serverUrl = 'wss://your-livekit-server.com';
  const token = 'your-jwt-token';

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: '100dvh' }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

export default App;
```

### LiveKit Client Kullanımı

```typescript
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';

const room = new Room();

room.on(RoomEvent.TrackSubscribed, (track, participant) => {
  if (track.kind === 'video') {
    const videoElement = document.createElement('video');
    videoElement.srcObject = new MediaStream([track.mediaStreamTrack]);
    document.body.appendChild(videoElement);
  }
});

// Odaya bağlan
await room.connect('wss://your-livekit-server.com', token);
```

### Track Processors (Arka Plan Blur)

```typescript
import { BackgroundBlur } from '@livekit/track-processors';

// Video track'inize blur efekti ekleyin
const blurProcessor = BackgroundBlur(0.5);
await localVideoTrack.setProcessor(blurProcessor);
```

## 📋 Mevcut Paketler

| Paket                       | Repository                                                                             | Açıklama                         |
| --------------------------- | -------------------------------------------------------------------------------------- | -------------------------------- |
| `@livekit/components-react` | [components-react](https://gitlab.ordulu.com/ulak-conference/desktop/components-react) | React UI bileşenleri             |
| `@livekit/components-core`  | [components-core](https://gitlab.ordulu.com/ulak-conference/desktop/components-core)   | Core utility fonksiyonları       |
| `livekit-client`            | [livekit-client](https://gitlab.ordulu.com/ulak-conference/desktop/livekit-client)     | JavaScript/TypeScript client SDK |
| `@livekit/mutex`            | [mutex](https://gitlab.ordulu.com/ulak-conference/desktop/mutex)                       | Mutex implementasyonu            |
| `@livekit/protocol`         | [protocol](https://gitlab.ordulu.com/ulak-conference/desktop/protocol)                 | Protocol buffer definitions      |
| `@livekit/track-processors` | [track-processors](https://gitlab.ordulu.com/ulak-conference/desktop/track-processors) | Video/Audio track processors     |

## 🛠️ Development

Bu repository sadece geliştirme amaçlıdır. Eğer bu paketleri geliştirmek istiyorsanız:

```bash
# Repository'yi clone edin
git clone git@gitlab.ordulu.com/ulak-conference/desktop/libs.git
cd libs

# Dependencies'leri kurun
npm install

# Tüm paketleri build edin
npm run build

# Değişikliklerinizi yapın...

# Tüm paketleri ayrı repository'lere push edin
npm run update:all

# Veya sadece belirli bir paketi güncelleyin
npm run update:components-react
```

Detaylı development workflow'u için [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) dosyasına bakın.

## 📚 Daha Fazla Bilgi

- [Development Workflow](./DEVELOPMENT_WORKFLOW.md) - Geliştirme süreci
- [LiveKit Documentation](https://docs.livekit.io/) - Resmi dokümantasyon
- [React Components Guide](https://docs.livekit.io/client-sdk-js/interfaces/VideoConferenceProps.html) - React bileşenleri
- [Client SDK Reference](https://docs.livekit.io/client-sdk-js/) - Client SDK referansı

## 🚀 Hızlı Başlangıç

1. **Paketleri kurun:**

```bash
npm install git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git
```

2. **React uygulamanızda kullanın:**

```tsx
import { VideoConference, LiveKitRoom } from '@livekit/components-react';

function MyVideoApp() {
  return (
    <LiveKitRoom token="your-token" serverUrl="wss://your-server">
      <VideoConference />
    </LiveKitRoom>
  );
}
```

3. **Build edin ve çalıştırın:**

```bash
npm run build
npm start
```

## ⚡ Performans İpuçları

- **Specific commits kullanın**: Production'da belirli commit hash'leri ile versioning yapın
- **Lazy loading**: Sadece ihtiyacınız olan bileşenleri import edin
- **Bundle size**: Sadece kullandığınız paketleri kurun

## 📞 Destek

Sorularınız için:

- Issues: Her paket için ilgili repository'de issue açın
- Documentation: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- Email: development@ordulu.com
