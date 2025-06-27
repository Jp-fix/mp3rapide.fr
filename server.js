const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const isValidYouTubeUrl = (url) => {
  const regex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return regex.test(url);
};

const sanitizeFilename = (title) => {
  return title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
};

const checkFFmpeg = () => {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      resolve(!error);
    });
  });
};

app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL YouTube non valide ou vidéo indisponible' });
    }

    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    const responseData = {
      title: videoDetails.title,
      author: videoDetails.author.name,
      duration: videoDetails.lengthSeconds,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      viewCount: videoDetails.viewCount
    };

    res.json(responseData);
  } catch (error) {
    console.error('Erreur lors de la récupération des infos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations de la vidéo' });
  }
});

app.post('/api/convert', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'URL YouTube non valide ou vidéo indisponible' });
    }

    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) {
      return res.status(500).json({ 
        error: 'FFmpeg n\'est pas installé. Veuillez installer FFmpeg pour utiliser cette fonctionnalité.' 
      });
    }

    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title);
    const filename = `mp3rapide.fr - ${title}.mp3`;

    console.log(`Conversion MP3: ${title}`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const audioStream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    ffmpeg(audioStream)
      .audioBitrate(320)
      .format('mp3')
      .on('error', (err) => {
        console.error('Erreur FFmpeg:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur lors de la conversion MP3. Vérifiez que FFmpeg est correctement installé.' });
        }
      })
      .on('end', () => {
        console.log('Conversion MP3 terminée pour:', title);
      })
      .pipe(res);

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors du téléchargement de la vidéo' });
    }
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log('Assurez-vous que FFmpeg est installé sur votre système');
});