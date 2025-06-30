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

    try {
      // Use execPromise directly to avoid the automatic "-f best" parameter
      const output = await this.ytDlpWrap.execPromise([
        url,
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '--no-check-certificates',  // Help with SSL issues in Docker
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '--extractor-args', 'youtube:player_client=android',  // Use Android client to avoid bot detection
        '--extractor-args', 'youtube:player_skip=webpage'     // Skip webpage extraction
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
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stderr: error.stderr,
        stdout: error.stdout
      });
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