#!/bin/bash

# Script to set up LiveKit repositories as proper git submodules
# This fixes the "embedded git repository" warnings

echo "Setting up LiveKit repositories as git submodules..."

# Define the repositories and their URLs
declare -a repo_paths=("@livekit/components-core" "@livekit/components-react" "@livekit/mutex" "@livekit/protocol" "@livekit/track-processors" "livekit-client")
declare -a repo_urls=(
    "https://gitlab.ordulu.com/ulak-conference/desktop/components-core.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/components-react.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/mutex.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/protocol.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/track-processors.git"
    "https://gitlab.ordulu.com/ulak-conference/desktop/livekit-client.git"
)

# Add each repository as a submodule
for i in "${!repo_paths[@]}"; do
    path="${repo_paths[$i]}"
    url="${repo_urls[$i]}"
    
    echo "Adding submodule: $path"
    
    if git submodule add "$url" "$path"; then
        echo "✓ Successfully added $path as submodule"
    else
        echo "✗ Failed to add $path as submodule - continuing with others..."
    fi
    echo ""
done

echo "Initializing and updating submodules..."
git submodule init
git submodule update

echo ""
echo "✓ Submodule setup completed!"
echo "✓ The 'embedded git repository' warnings should now be resolved."
echo ""
echo "To update all submodules in the future, run:"
echo "  git submodule update --remote"