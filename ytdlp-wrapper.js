const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const os = require('os');
const which = require('which');
const fs = require('fs');

class YtDlpWrapper {
  constructor() {
    this.ytDlpWrap = new YTDlpWrap();
    this.ytdlpPath = null;
    this.initializePath();
  }

  initializePath() {
    // First, check if we're in Docker (the Docker path exists)
    const dockerPath = '/usr/local/bin/yt-dlp';
    if (fs.existsSync(dockerPath)) {
      this.ytDlpPath = dockerPath;
      console.log('Using Docker yt-dlp path:', this.ytDlpPath);
    } else {
      // Try to find yt-dlp in the system PATH
      try {
        this.ytDlpPath = which.sync('yt-dlp');
        console.log('Found yt-dlp in PATH:', this.ytDlpPath);
      } catch (error) {
        console.error('yt-dlp not found in PATH. Please install yt-dlp:');
        console.error('- macOS: brew install yt-dlp');
        console.error('- Linux: sudo apt-get install yt-dlp');
        console.error('- Or download from: https://github.com/yt-dlp/yt-dlp');
        this.ytDlpPath = null;
      }
    }

    if (this.ytDlpPath) {
      this.ytDlpWrap.setBinaryPath(this.ytDlpPath);
    }
  }

  async getInfo(url) {
    if (!this.ytDlpPath) {
      throw new Error('yt-dlp is not installed. Please install yt-dlp to use this feature.');
    }

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    try {
      // Use execPromise directly to avoid the automatic "-f best" parameter
      const output = await this.ytDlpWrap.execPromise([
        url,
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--no-check-certificates',  // Help with SSL issues in Docker
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '--extractor-args', 'youtube:player_client=android,web',  // Try multiple clients
        '--extractor-args', 'youtube:player_skip=webpage,configs',
        '--extractor-args', 'youtube:skip=hls,dash',
        '--extractor-args', 'youtube:player_params=CgIQBg=='
      ]);
      
      const metadata = JSON.parse(output);
      
      return {
        videoDetails: {
          title: metadata.title || 'Unknown Title',
          author: { name: metadata.uploader || metadata.channel || 'Unknown Author' },
          lengthSeconds: metadata.duration || 0,
          thumbnails: metadata.thumbnails || [{ url: metadata.thumbnail }],
          viewCount: metadata.view_count || 0,
          videoId: metadata.id,
          description: metadata.description,
        },
      };
    } catch (error) {
      console.error(`Failed to get video info with yt-dlp for URL: ${url}`, error);
      
      // If bot detection, try Invidious API as fallback
      if (error.message && error.message.includes('Sign in to confirm')) {
        console.log('Bot detected, trying Invidious API fallback...');
        
        if (!videoId) {
          throw new Error('Could not extract video ID from URL');
        }
        
        try {
          // Try multiple Invidious instances
          const invidiousInstances = [
            'https://inv.nadeko.net',
            'https://invidious.nerdvpn.de',
            'https://inv.bp.projectsegfau.lt',
            'https://invidious.protokolla.fi'
          ];
          
          let lastError;
          for (const instance of invidiousInstances) {
            try {
              const https = require('https');
              const invidiousUrl = `${instance}/api/v1/videos/${videoId}`;
              
              const response = await new Promise((resolve, reject) => {
                https.get(invidiousUrl, { 
                  timeout: 5000,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  }
                }, (res) => {
                  let data = '';
                  res.on('data', chunk => data += chunk);
                  res.on('end', () => {
                    if (res.statusCode === 200) {
                      resolve(JSON.parse(data));
                    } else {
                      reject(new Error(`Invidious API returned ${res.statusCode}`));
                    }
                  });
                }).on('error', reject);
              });
              
              console.log(`Successfully fetched from Invidious: ${instance}`);
              
              return {
                videoDetails: {
                  title: response.title || 'Unknown Title',
                  author: { name: response.author || 'Unknown Author' },
                  lengthSeconds: response.lengthSeconds || 0,
                  thumbnails: response.videoThumbnails || [],
                  viewCount: response.viewCount || 0,
                  videoId: response.videoId,
                  description: response.description || '',
                },
              };
            } catch (invError) {
              lastError = invError;
              console.error(`Invidious instance ${instance} failed:`, invError.message);
              continue;
            }
          }
          
          throw new Error(`All Invidious instances failed. Last error: ${lastError?.message}`);
        } catch (fallbackError) {
          console.error('Invidious fallback failed:', fallbackError);
          throw new Error(`Bot detection cannot be bypassed. ${fallbackError.message}`);
        }
      }
      
      throw new Error(`yt-dlp failed: ${error.message}`);
    }
  }

  async downloadAudio(url) {
    if (!this.ytDlpPath) {
      throw new Error('yt-dlp is not installed. Please install yt-dlp to use this feature.');
    }

    const EventEmitter = require('events');
    const stream = new EventEmitter();
    this.ytDlpWrap.exec([
      url,
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '-o', '-',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '--extractor-args', 'youtube:player_client=android',
      '--extractor-args', 'youtube:player_skip=webpage'
    ])
    .on('data', (data) => stream.emit('data', data))
    .on('error', (err) => stream.emit('error', err))
    .on('close', () => stream.emit('end'));
    return stream;
  }

  async checkInstallation() {
    return this.ytDlpPath !== null;
  }
}

module.exports = new YtDlpWrapper();