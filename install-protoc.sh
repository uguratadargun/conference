#!/bin/bash

# Install protoc for Ubuntu
echo "Installing protoc (Protocol Buffers compiler)..."

# Update package list
apt-get update

# Install required dependencies
apt-get install -y wget unzip

# Download and install protoc
PROTOC_VERSION="25.1"
PROTOC_ZIP="protoc-${PROTOC_VERSION}-linux-x86_64.zip"

# Download protoc
wget https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/${PROTOC_ZIP}

# Unzip to /usr/local
unzip -o $PROTOC_ZIP -d /usr/local bin/protoc
unzip -o $PROTOC_ZIP -d /usr/local 'include/*'

# Clean up
rm -f $PROTOC_ZIP

# Verify installation
echo "Protoc version:"
protoc --version

echo "Protoc installation completed!" 