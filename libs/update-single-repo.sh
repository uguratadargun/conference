#!/bin/bash

# Single Package Update Script
# Kullanım: ./update-single-repo.sh [package-name]

if [ "$#" -ne 1 ]; then
    echo "Kullanım: $0 [package-name]"
    echo ""
    echo "Geçerli paket isimleri:"
    echo "  • components-react"
    echo "  • components-core"
    echo "  • livekit-client"
    echo "  • mutex"
    echo "  • protocol"
    echo "  • track-processors"
    exit 1
fi

PACKAGE=$1

case $PACKAGE in
    "components-react")
        PREFIX="@livekit/components-react"
        BRANCH="components-react"
        REMOTE="components-react-repo"
        ;;
    "components-core")
        PREFIX="@livekit/components-core"
        BRANCH="components-core"
        REMOTE="components-core-repo"
        ;;
    "livekit-client")
        PREFIX="livekit-client"
        BRANCH="livekit-client-split"
        REMOTE="livekit-client-repo"
        ;;
    "mutex")
        PREFIX="@livekit/mutex"
        BRANCH="mutex"
        REMOTE="mutex-repo"
        ;;
    "protocol")
        PREFIX="@livekit/protocol"
        BRANCH="protocol"
        REMOTE="protocol-repo"
        ;;
    "track-processors")
        PREFIX="@livekit/track-processors"
        BRANCH="track-processors"
        REMOTE="track-processors-repo"
        ;;
    *)
        echo "❌ Geçersiz paket ismi: $PACKAGE"
        exit 1
        ;;
esac

echo "🚀 $PACKAGE paketi güncelleniyor..."

# Dependency'leri düzelt
echo "🔧 Cross-package dependency'ler düzeltiliyor..."
./fix-dependencies.sh

# Ana repo'ya commit
echo "📝 Ana repo'ya değişiklikler commit'leniyor..."
git add .
git commit -m "Update $PACKAGE" || echo "Zaten commit'lenmiş değişiklik yok"
git push origin main

echo "📦 $PACKAGE ayrı repository'ye push ediliyor..."
git subtree push --prefix=$PREFIX origin $BRANCH
git push $REMOTE origin/$BRANCH:main --force

echo "✅ $PACKAGE başarıyla güncellendi!" 