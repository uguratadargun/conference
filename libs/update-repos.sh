#!/bin/bash

# LiveKit Repositories Update Script
# Bu script monorepo'daki değişiklikleri ayrı repository'lere push eder

set -e

echo "🚀 LiveKit Repository'lerini güncelliyorum..."

# Dependency'leri düzelt
echo "🔧 Cross-package dependency'ler düzeltiliyor..."
./fix-dependencies.sh

# Önce ana repo'ya commit'leyin
echo "📝 Ana repo'ya commit atılıyor..."
git add .
git commit -m "Update packages" || echo "Zaten commit'lenmiş değişiklik yok"
git push origin main

echo "📦 Paketleri ayrı repository'lere push ediliyor..."

# Components React
echo "  → @livekit/components-react"
git subtree push --prefix=@livekit/components-react origin components-react
git push components-react-repo origin/components-react:main --force

# Components Core
echo "  → @livekit/components-core"
git subtree push --prefix=@livekit/components-core origin components-core
git push components-core-repo origin/components-core:main --force

# LiveKit Client
echo "  → livekit-client"
git subtree push --prefix=livekit-client origin livekit-client-split
git push livekit-client-repo origin/livekit-client-split:main --force

# Mutex
echo "  → @livekit/mutex"
git subtree push --prefix=@livekit/mutex origin mutex
git push mutex-repo origin/mutex:main --force

# Protocol
echo "  → @livekit/protocol"
git subtree push --prefix=@livekit/protocol origin protocol
git push protocol-repo origin/protocol:main --force

# Track Processors
echo "  → @livekit/track-processors"
git subtree push --prefix=@livekit/track-processors origin track-processors
git push track-processors-repo origin/track-processors:main --force

echo "✅ Tüm repository'ler güncellendi!"
echo ""
echo "📋 Güncellenen repository'ler:"
echo "  • https://gitlab.ordulu.com/ulak-conference/desktop/components-react"
echo "  • https://gitlab.ordulu.com/ulak-conference/desktop/components-core"
echo "  • https://gitlab.ordulu.com/ulak-conference/desktop/livekit-client"
echo "  • https://gitlab.ordulu.com/ulak-conference/desktop/mutex"
echo "  • https://gitlab.ordulu.com/ulak-conference/desktop/protocol"
echo "  • https://gitlab.ordulu.com/ulak-conference/desktop/track-processors" 