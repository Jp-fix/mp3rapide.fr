# Use Node.js 18 with Alpine for smaller image size
# Force rebuild: v1.3.2
FROM node:18-alpine

# Install FFmpeg, build dependencies, and certificates
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    make \
    g++ \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Install yt-dlp directly from binary for better reliability
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && yt-dlp --version \
    && echo "yt-dlp installation verified"

# Verify installations
RUN ffmpeg -version && echo "FFmpeg installation verified" \
    && yt-dlp --help > /dev/null && echo "yt-dlp command verified"

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create temp directory for file processing
RUN mkdir -p /app/temp && chmod 755 /app/temp

# Expose the port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "server.js"]