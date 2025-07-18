# 🚀 LiveKit Split Repository Development Workflow

## 📋 Genel Bakış

Bu repo artık ayrı git repository'lere bölünmüştür. Her paket kendi bağımsız repository'sine sahiptir ve git üzerinden kullanılabilir. Livekit.

## 🏗️ Repository Yapısı

### Ana Monorepo (Development)

- `git@gitlab.ordulu.com/ulak-conference/desktop/libs.git`
- Tüm development işlemleri burada yapılır

### Ayrı Paket Repository'leri (Production)

- `@livekit/components-react` → `git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git`
- `@livekit/components-core` → `git@gitlab.ordulu.com/ulak-conference/desktop/components-core.git`
- `livekit-client` → `git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git`
- `@livekit/mutex` → `git@gitlab.ordulu.com/ulak-conference/desktop/mutex.git`
- `@livekit/protocol` → `git@gitlab.ordulu.com/ulak-conference/desktop/protocol.git`
- `@livekit/track-processors` → `git@gitlab.ordulu.com/ulak-conference/desktop/track-processors.git`

## 🔄 Development Workflow

### 1. Normal Development

```bash
cd /Users/ugur/Projects/libs

# Değişikliklerinizi yapın
# Örnek: @livekit/components-react/src/components/...

# Test edin
npm run build:components-react

# Commit yapın
git add .
git commit -m "feat: yeni özellik eklendi"
```

### 2. Tüm Repository'leri Güncelleme

```bash
# NPM script ile (Önerilen)
npm run update:all

# Veya doğrudan shell script
./update-repos.sh
```

### 3. Tek Paket Güncelleme

```bash
# NPM script ile - Her paket için özel komut (Önerilen)
npm run update:components-react
npm run update:components-core
npm run update:livekit-client
npm run update:mutex
npm run update:protocol
npm run update:track-processors

# Veya parametre ile
npm run update:single components-react

# Veya doğrudan shell script - Sadece components-react'ı güncelle
./update-single-repo.sh components-react

# Sadece livekit-client'ı güncelle
./update-single-repo.sh livekit-client
```

## 📦 Versioning Stratejisi

### Git Hash Based Versioning (Önerilen)

```json
{
  "dependencies": {
    "@livekit/components-react": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git"
  }
}
```

### Specific Commit/Tag Based

```json
{
  "dependencies": {
    "@livekit/components-react": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git#v2.9.12",
    "livekit-client": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git#abc1234"
  }
}
```

### Branch Based (Development için)

```json
{
  "dependencies": {
    "@livekit/components-react": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git#main"
  }
}
```

## 🔧 Dependency Management

### Cross-Package Dependencies

Paketler arası bağımlılıklar otomatik olarak git-based'e çevrilir:

```bash
# NPM script ile (Önerilen)
npm run fix:deps

# Veya doğrudan shell script
./fix-dependencies.sh
```

### Manuel Dependency Güncellemesi

```bash
# Belirli bir commit'e pin'le
npm install git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git#abc1234

# Latest'e güncelle
npm install git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git
```

## 🚀 Production Kullanımı

### Yeni Proje'de Kullanım

```json
{
  "name": "my-project",
  "dependencies": {
    "@livekit/components-react": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/components-react.git",
    "livekit-client": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git"
  }
}
```

```bash
npm install
```

### Existing Proje'de Güncelleme

```bash
# package.json'u güncelle
vim package.json

# Install et
npm install

# Cache'i temizle (gerekirse)
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📋 NPM Script'ler ve Shell Dosyaları

### NPM Script'ler (Önerilen Kullanım)

```bash
# Tüm paketleri güncelle
npm run update:all

# Tek paket güncellemeleri
npm run update:components-react
npm run update:components-core
npm run update:livekit-client
npm run update:mutex
npm run update:protocol
npm run update:track-processors

# Dependency'leri düzelt
npm run fix:deps

# Parametre ile tek paket (alternatif)
npm run update:single components-react
```

### Shell Script'ler

### `update-repos.sh` → `npm run update:all`

- Tüm paketleri günceller
- Cross-package dependency'leri düzeltir
- Ana repo'ya commit yapar
- Ayrı repository'lere push eder

### `update-single-repo.sh [package-name]` → `npm run update:*`

- Tek bir paketi günceller
- Geçerli paket isimleri:
  - `components-react`
  - `components-core`
  - `livekit-client`
  - `mutex`
  - `protocol`
  - `track-processors`

### `fix-dependencies.sh` → `npm run fix:deps`

- Cross-package dependency'leri git-based'e çevirir
- Otomatik olarak update script'lerinde çalışır

## ⚠️ Önemli Notlar

1. **Development**: Ana monorepo'da yapın
2. **Production**: Ayrı repository'leri kullanın
3. **Dependency Management**: Git hash'leri otomatik güncellenir
4. **Versioning**: Git commit hash'leri kullanılır
5. **Updates**: Script'leri kullanın, manuel push yapmayın

## 🔗 Linkler

- [GitLab Ana Repo](https://gitlab.ordulu.com/ulak-conference/desktop/libs)
- [Components React](https://gitlab.ordulu.com/ulak-conference/desktop/components-react)
- [Components Core](https://gitlab.ordulu.com/ulak-conference/desktop/components-core)
- [LiveKit Client](https://gitlab.ordulu.com/ulak-conference/desktop/livekit-client)
- [Mutex](https://gitlab.ordulu.com/ulak-conference/desktop/mutex)
- [Protocol](https://gitlab.ordulu.com/ulak-conference/desktop/protocol)
- [Track Processors](https://gitlab.ordulu.com/ulak-conference/desktop/track-processors)
