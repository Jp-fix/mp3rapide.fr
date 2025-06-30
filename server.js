const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ytdlp = require('./ytdlp-wrapper');
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
    
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({ error: 'URL manquante ou invalide' });
    }

    const cleanUrl = url.trim();
    
    if (!isValidYouTubeUrl(cleanUrl)) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    if (!ytdl.validateURL(cleanUrl)) {
      return res.status(400).json({ error: 'URL YouTube non valide ou vidéo indisponible' });
    }

    console.log(`Fetching info for URL: ${cleanUrl}`);
    
    const ytdlpAvailable = await ytdlp.checkInstallation();
    if (!ytdlpAvailable) {
      return res.status(503).json({ error: 'Service temporairement indisponible (yt-dlp non trouvé).' });
    }

    try {
      console.log('Using yt-dlp for video info...');
      const info = await ytdlp.getInfo(cleanUrl);

      if (!info || !info.videoDetails) {
        console.error('No video details found in yt-dlp response');
        return res.status(404).json({ error: 'Informations de la vidéo non trouvées' });
      }

      const videoDetails = info.videoDetails;

      const responseData = {
        title: videoDetails.title,
        author: videoDetails.author?.name || 'Auteur inconnu',
        duration: videoDetails.lengthSeconds,
        thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '',
        viewCount: videoDetails.viewCount || '0'
      };

      console.log(`Successfully fetched info for: ${videoDetails.title}`);
      res.json(responseData);
    } catch (ytdlpError) {
      console.error('Erreur détaillée de yt-dlp:', ytdlpError);
      let errorMessage = 'Erreur lors de la récupération des informations de la vidéo.';
      if (ytdlpError.message.includes('Video unavailable')) {
        errorMessage = 'Vidéo non disponible ou privée.';
      } else if (ytdlpError.message.includes('Private video')) {
        errorMessage = 'Cette vidéo est privée.';
      } else if (ytdlpError.message.includes('age-restricted')) {
        errorMessage = 'Cette vidéo est soumise à une restriction d\'âge.';
      } else if (ytdlpError.message.includes('yt-dlp failed')) {
        errorMessage = 'Le service de téléchargement a échoué. Veuillez réessayer.';
      }
      res.status(500).json({ error: errorMessage });
    }
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des infos:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('Video unavailable')) {
      return res.status(404).json({ error: 'Vidéo non disponible ou privée' });
    }
    
    if (error.message.includes('Private video')) {
      return res.status(403).json({ error: 'Cette vidéo est privée' });
    }
    
    if (error.message.includes('age-restricted')) {
      return res.status(403).json({ error: 'Cette vidéo est soumise à une restriction d\'âge' });
    }
    
    if (error.message.includes('Sign in to confirm')) {
      console.error('YouTube bot detection triggered');
      return res.status(403).json({ error: 'YouTube a détecté une activité suspecte. Réessayez dans quelques instants.' });
    }
    
    if (error.message.includes('Error when parsing watch.html')) {
      console.error('YouTube HTML structure changed - library needs update');
      return res.status(503).json({ error: 'YouTube a modifié sa structure. Service temporairement indisponible. Nous travaillons sur une solution.' });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Problème de connexion réseau' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la récupération des informations de la vidéo' });
  }
});

app.post('/api/convert', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }

    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) {
      return res.status(500).json({ 
        error: 'FFmpeg n\'est pas installé. Veuillez installer FFmpeg pour utiliser cette fonctionnalité.' 
      });
    }

    const ytdlpAvailable = await ytdlp.checkInstallation();
    if (!ytdlpAvailable) {
      return res.status(503).json({ error: 'Service de conversion temporairement indisponible (yt-dlp non trouvé).' });
    }

    try {
      console.log('Using yt-dlp for audio download...');
      const info = await ytdlp.getInfo(url);
      const title = sanitizeFilename(info.videoDetails.title);
      const audioStream = await ytdlp.downloadAudio(url);

      console.log(`Downloading with yt-dlp: ${title}`);

      const filename = `mp3rapide.fr - ${title}.mp3`;
      console.log(`Conversion MP3: ${title}`);

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Type', 'audio/mpeg');

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
    } catch (ytdlpError) {
      console.error('Erreur lors du téléchargement avec yt-dlp:', ytdlpError);
      if (!res.headersSent) {
        res.status(500).json({ error: `Le téléchargement a échoué: ${ytdlpError.message}` });
      }
    }

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    
    if (error.message && error.message.includes('Error when parsing watch.html')) {
      return res.status(503).json({ error: 'YouTube a modifié sa structure. Service temporairement indisponible. Nous travaillons sur une solution.' });
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors du téléchargement de la vidéo' });
    }
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  const deploymentId = 'v1.3.0-ytdlp-' + Date.now();
  console.log(`🚀 MP3Rapide Server v1.3.0 (yt-dlp)`);
  console.log(`📋 Deployment ID: ${deploymentId}`);
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
  console.log('⚙️  Assurez-vous que FFmpeg est installé sur votre système');
  
  // Check yt-dlp installation
  const ytdlpInstalled = await ytdlp.checkInstallation();
  if (ytdlpInstalled) {
    console.log('✅ yt-dlp: INSTALLED');
  } else {
    console.log('❌ yt-dlp: NOT FOUND - Falling back to ytdl-core');
  }
});