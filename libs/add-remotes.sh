#!/bin/bash

# Script to add all required git remotes for LiveKit monorepo
# Run this once to set up all the remote repositories

set -e

echo "🔧 Adding git remotes for LiveKit repositories..."

# Base URL for all repositories
BASE_URL="https://gitlab.ordulu.com/ulak-conference/desktop"

# Add all required remotes
echo "  → Adding components-react-repo remote..."
git remote add components-react-repo "${BASE_URL}/components-react.git" 2>/dev/null || echo "    (remote already exists)"

echo "  → Adding components-core-repo remote..."
git remote add components-core-repo "${BASE_URL}/components-core.git" 2>/dev/null || echo "    (remote already exists)"

echo "  → Adding livekit-client-repo remote..."
git remote add livekit-client-repo "${BASE_URL}/livekit-client.git" 2>/dev/null || echo "    (remote already exists)"

echo "  → Adding mutex-repo remote..."
git remote add mutex-repo "${BASE_URL}/mutex.git" 2>/dev/null || echo "    (remote already exists)"

echo "  → Adding protocol-repo remote..."
git remote add protocol-repo "${BASE_URL}/protocol.git" 2>/dev/null || echo "    (remote already exists)"

echo "  → Adding track-processors-repo remote..."
git remote add track-processors-repo "${BASE_URL}/track-processors.git" 2>/dev/null || echo "    (remote already exists)"

echo ""
echo "✅ All remotes added successfully!"
echo ""
echo "📋 Configured remotes:"
git remote -v

echo ""
echo "🚀 You can now run ./update-repos.sh to update all repositories." 