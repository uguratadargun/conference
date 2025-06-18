# Use Node.js 18 with Ubuntu
FROM node:18-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install protoc
RUN wget https://github.com/protocolbuffers/protobuf/releases/download/v25.1/protoc-25.1-linux-x86_64.zip \
    && unzip protoc-25.1-linux-x86_64.zip -d /usr/local \
    && rm protoc-25.1-linux-x86_64.zip \
    && chmod +x /usr/local/bin/protoc

# Verify protoc installation
RUN protoc --version

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "preview"] 