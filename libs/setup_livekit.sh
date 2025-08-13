#!/bin/bash

# LiveKit Repository Setup Script
set -e  # Exit on any error

echo "🚀 Starting LiveKit repository setup..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the libs directory."
    exit 1
fi

# Clone main livekit-client repository first
echo "📦 Cloning main livekit-client repository..."
if [ -d "livekit-client" ]; then
    echo "  ⚠️  Directory livekit-client already exists, skipping..."
else
    git clone https://gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git || {
        echo "  ❌ Failed to clone livekit-client"
        exit 1
    }
    echo "  ✅ Successfully cloned livekit-client"
fi

# Create @livekit directory if it doesn't exist
echo "📁 Creating @livekit directory..."
mkdir -p @livekit
cd @livekit

# List of repositories to clone
repositories=(
    "https://gitlab.ordulu.com/ulak-conference/desktop/components-react.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/components-core.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/mutex.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/protocol.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/track-processors.git"
)

echo "📦 Cloning LiveKit @livekit repositories..."

# Clone each repository
for repo in "${repositories[@]}"; do
    repo_name=$(basename "$repo" .git)
    echo "  🔄 Cloning $repo_name..."
    
    if [ -d "$repo_name" ]; then
        echo "  ⚠️  Directory $repo_name already exists, skipping..."
    else
        git clone "$repo" || {
            echo "  ❌ Failed to clone $repo"
            exit 1
        }
        echo "  ✅ Successfully cloned $repo_name"
    fi
done

echo ""
echo "🎉 All repositories cloned successfully!"
echo "📍 Repositories are located in: $(pwd)"

# Go back to parent directory
cd ..

echo ""
echo "📝 Next step: Update package.json with dependencies"
echo "   Run the script and then manually add the packages to package.json"

echo ""
echo "✨ Setup completed! Directory structure:"
echo "   libs/"
echo "   ├── @livekit/"
echo "   │   ├── components-react/"
echo "   │   ├── components-core/"
echo "   │   ├── mutex/"
echo "   │   ├── protocol/"
echo "   │   └── track-processors/"
echo "   ├── livekit-client/"
echo "   └── package.json"
