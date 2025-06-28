const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class YtDlpWrapper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Get video info using yt-dlp
   * @param {string} url - YouTube URL
   * @returns {Promise<Object>} Video information
   */
  async getInfo(url) {
    try {
      // Use yt-dlp to get video info in JSON format
      const command = `yt-dlp --dump-json --no-warnings --no-call-home --no-check-certificate --user-agent "${this.userAgent}" "${url}"`;
      
      console.log('Executing yt-dlp for info:', url);
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('yt-dlp stderr:', stderr);
      }

      const info = JSON.parse(stdout);
      
      // Transform yt-dlp output to match our expected format
      return {
        videoDetails: {
          title: info.title || 'Unknown Title',
          author: {
            name: info.uploader || info.channel || 'Unknown Author'
          },
          lengthSeconds: info.duration || 0,
          thumbnails: info.thumbnails || [{ url: info.thumbnail }],
          viewCount: info.view_count || 0,
          videoId: info.id,
          description: info.description
        }
      };
    } catch (error) {
      console.error('yt-dlp error:', error);
      
      // Parse specific yt-dlp errors
      if (error.message.includes('Video unavailable')) {
        throw new Error('Video unavailable');
      }
      if (error.message.includes('Private video')) {
        throw new Error('Private video');
      }
      if (error.message.includes('age limit')) {
        throw new Error('Video is age-restricted');
      }
      if (error.code === 'ENOENT') {
        throw new Error('yt-dlp not found. Please ensure yt-dlp is installed.');
      }
      
      throw error;
    }
  }

  /**
   * Download audio using yt-dlp and return the stream
   * @param {string} url - YouTube URL
   * @param {Object} options - Download options
   * @returns {Promise<Stream>} Audio stream
   */
  async downloadAudio(url, options = {}) {
    const { spawn } = require('child_process');
    
    // yt-dlp command to extract audio
    const args = [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0', // best quality
      '--no-warnings',
      '--no-call-home',
      '--no-check-certificate',
      '--user-agent', this.userAgent,
      '-o', '-', // output to stdout
      url
    ];

    console.log('Downloading audio with yt-dlp:', url);
    const ytdlp = spawn('yt-dlp', args);

    // Handle errors
    ytdlp.stderr.on('data', (data) => {
      const message = data.toString();
      if (!message.includes('WARNING')) {
        console.error('yt-dlp stderr:', message);
      }
    });

    return ytdlp.stdout;
  }

  /**
   * Check if yt-dlp is installed
   * @returns {Promise<boolean>}
   */
  async checkInstallation() {
    try {
      const { stdout } = await execAsync('yt-dlp --version');
      console.log('yt-dlp version:', stdout.trim());
      return true;
    } catch (error) {
      console.error('yt-dlp not found:', error.message);
      return false;
    }
  }
}

module.exports = new YtDlpWrapper();