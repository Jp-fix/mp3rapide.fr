const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const os = require('os');

class YtDlpWrapper {
  constructor() {
    const binDir = path.join(__dirname, 'bin');
    this.ytDlpWrap = new YTDlpWrap();
    this.ytDlpWrap.setBinaryPath(path.join(binDir, 'yt-dlp'));
  }

  async getInfo(url) {
    try {
      const metadata = await this.ytDlpWrap.getVideoInfo(url);
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
    const EventEmitter = require('events');
    const stream = new EventEmitter();
    this.ytDlpWrap.exec([
      url,
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '-o', '-',
    ])
    .on('data', (data) => stream.emit('data', data))
    .on('error', (err) => stream.emit('error', err))
    .on('close', () => stream.emit('end'));
    return stream;
  }

  async checkInstallation() {
    try {
      await this.ytDlpWrap.getBinaryPath();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new YtDlpWrapper();