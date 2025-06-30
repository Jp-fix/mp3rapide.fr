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
    const command = `yt-dlp --dump-json --no-warnings --no-call-home --no-check-certificate --user-agent "${this.userAgent}" "${url}"`;
    console.log(`Executing yt-dlp command: ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      if (stderr) {
        console.warn(`yt-dlp stderr: ${stderr}`);
      }
      const info = JSON.parse(stdout);
      return {
        videoDetails: {
          title: info.title || 'Unknown Title',
          author: { name: info.uploader || info.channel || 'Unknown Author' },
          lengthSeconds: info.duration || 0,
          thumbnails: info.thumbnails || [{ url: info.thumbnail }],
          viewCount: info.view_count || 0,
          videoId: info.id,
          description: info.description,
        },
      };
    } catch (error) {
      console.error(`Failed to get video info with yt-dlp for URL: ${url}`, error);
      if (error.stderr) {
        if (error.stderr.includes('Video unavailable')) {
          throw new Error('Video unavailable');
        }
        if (error.stderr.includes('Private video')) {
          throw new Error('Private video');
        }
        if (error.stderr.includes('age limit')) {
          throw new Error('Video is age-restricted');
        }
      }
      if (error.code === 'ENOENT') {
        throw new Error('yt-dlp not found. Please ensure yt-dlp is installed.');
      }
      throw new Error(`yt-dlp failed: ${error.message}`);
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
    const fs = require('fs');
    const path = require('path');
    const { randomBytes } = require('crypto');
    
    // Create a temporary file for download
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `download_${randomBytes(8).toString('hex')}.m4a`);
    
    // yt-dlp command to download best audio
    const args = [
      '-f', 'bestaudio[ext=m4a]/bestaudio/best',
      '--no-warnings',
      '--no-call-home',
      '--no-check-certificate',
      '--user-agent', this.userAgent,
      '--quiet',
      '--no-playlist',
      '--no-colors',
      '-o', tempFile,
      url
    ];

    console.log('Downloading audio with yt-dlp:', url);
    
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', args);
      
      let errorOutput = '';
      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ytdlp.on('error', (error) => {
        console.error('Failed to spawn yt-dlp:', error);
        reject(error);
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          console.error('yt-dlp stderr:', errorOutput);
          // Clean up temp file if it exists
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
          reject(new Error(`yt-dlp exited with code ${code}: ${errorOutput}`));
        } else {
          // Create read stream from downloaded file
          const stream = fs.createReadStream(tempFile);
          
          // Clean up temp file after streaming
          stream.on('end', () => {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          });
          
          stream.on('error', (err) => {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          });
          
          resolve(stream);
        }
      });
    });
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