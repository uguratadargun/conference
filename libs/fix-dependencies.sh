#!/bin/bash

# Fix Dependencies Script
# Bu script paketler arası dependency'leri git-based'e çevirir

echo "🔧 Cross-package dependency'ler düzeltiliyor..."

# Components-react'teki track-processors dependency'sini güncelle
echo "  → @livekit/components-react dependency'si güncelleniyor..."

COMPONENTS_REACT_PACKAGE="@livekit/components-react/package.json"

# Mevcut file: dependency'sini git-based'e çevir
sed -i '' 's|"@livekit/track-processors": "file:../track-processors"|"@livekit/track-processors": "git+ssh://git@gitlab.ordulu.com/ulak-conference/desktop/track-processors.git"|g' "$COMPONENTS_REACT_PACKAGE"

echo "✅ Dependency'ler düzeltildi!"

# Değişiklikleri göster
echo "📋 Düzeltilen dosyalar:"
echo "  • $COMPONENTS_REACT_PACKAGE" 