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
      // Use basic yt-dlp without complex workarounds
      const output = await this.ytDlpWrap.execPromise([
        url,
        '--dump-json',
        '--no-warnings',
        '--no-playlist'
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
      '-o', '-'
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