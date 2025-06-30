# MP3Rapide.fr - Convertisseur YouTube vers MP3

Convertisseur YouTube vers MP3 gratuit, rapide et sécurisé. Téléchargez vos musiques préférées en haute qualité jusqu'à 320kbps.

## 🚀 Fonctionnalités

- ✅ **Conversion rapide** : Convertit les vidéos YouTube en MP3 en quelques secondes
- ✅ **Haute qualité** : Audio jusqu'à 320kbps
- ✅ **Gratuit** : Aucun frais, aucune inscription requise
- ✅ **Sécurisé** : Aucun virus, aucun malware
- ✅ **Compatible** : Fonctionne sur tous les appareils
- ✅ **Interface intuitive** : Simple d'utilisation

## 🛠️ Technologies utilisées

- **Backend** : Node.js + Express.js
- **Conversion** : FFmpeg + yt-dlp (avec fallback ytdl-core)
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Styling** : Tailwind CSS
- **Icons** : Font Awesome

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- FFmpeg installé sur le système
- yt-dlp (recommandé pour une meilleure compatibilité YouTube)
- npm ou yarn

## 🔧 Installation locale

1. **Cloner le repository**
```bash
git clone https://github.com/Jp-fix/mp3rapide.fr.git
cd mp3rapide.fr
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Installer FFmpeg et yt-dlp**

**Sur Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install ffmpeg
# Installation de yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

**Sur macOS :**
```bash
brew install ffmpeg
brew install yt-dlp
```

**Sur Windows :**
- Téléchargez FFmpeg depuis https://ffmpeg.org/download.html
- Téléchargez yt-dlp depuis https://github.com/yt-dlp/yt-dlp/releases

4. **Démarrer l'application**
```bash
npm start
```

L'application sera disponible sur http://localhost:3000

## 🐳 Déploiement avec Docker

### Construction de l'image
```bash
docker build -t mp3rapide .
```

### Lancement du conteneur
```bash
docker run -p 3000:3000 mp3rapide
```

## ☁️ Déploiement sur Coolify

### Configuration requise dans Coolify :

| Paramètre | Valeur |
|-----------|---------|
| **Repository URL** | `https://github.com/Jp-fix/mp3rapide.fr.git` |
| **Branch** | `main` |
| **Build Pack** | `Node.js` |
| **Port** | `3000` |
| **Static site** | `Non` |

### Variables d'environnement (optionnelles)

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `NODE_ENV` | `production` | Environnement d'exécution |
| `PORT` | `3000` | Port d'écoute du serveur |

### Commandes de déploiement

- **Build** : `npm install`
- **Start** : `npm start`

## 📁 Structure du projet

```
mp3rapide.fr/
├── public/
│   ├── index.html          # Page principale
│   ├── app.js             # JavaScript frontend
│   ├── robots.txt         # Configuration SEO
│   ├── sitemap.xml        # Plan du site
│   └── site.webmanifest   # Manifeste PWA
├── temp/                  # Fichiers temporaires
├── server.js              # Serveur Express
├── ytdlp-wrapper.js       # Wrapper pour yt-dlp
├── test-ytdlp.js          # Script de test
├── package.json           # Dépendances Node.js
├── Dockerfile             # Configuration Docker
└── README.md              # Documentation

```

## 🔒 Sécurité

- Validation des URLs YouTube
- Sanitisation des noms de fichiers
- Nettoyage automatique des fichiers temporaires
- Pas de stockage de données utilisateur

## ⚖️ Mentions légales

- Respectez les droits d'auteur
- Utilisez uniquement pour du contenu libre de droits
- Conformez-vous aux conditions d'utilisation de YouTube

## 🐛 Dépannage

### Erreur "FFmpeg not found"
Assurez-vous que FFmpeg est installé et accessible dans le PATH :
```bash
ffmpeg -version
```

### Erreur "yt-dlp not found"
Vérifiez l'installation de yt-dlp :
```bash
yt-dlp --version
```

### Erreur "Error when parsing watch.html"
Cette erreur indique que YouTube a modifié sa structure. Solutions :
1. Mettre à jour yt-dlp : `yt-dlp -U`
2. Redémarrer le serveur
3. Si l'erreur persiste, le service utilisera automatiquement ytdl-core en fallback

### Test de fonctionnement
Un script de test est disponible :
```bash
node test-ytdlp.js
```

### Erreur de permissions
Vérifiez que le dossier `temp/` a les bonnes permissions :
```bash
chmod 755 temp/
```

### Port déjà utilisé
Changez le port dans `server.js` ou utilisez une variable d'environnement :
```bash
PORT=3001 npm start
```

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/Jp-fix/mp3rapide.fr/issues)
- **Email** : [Votre email de contact]

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🔧 Maintenance

### Mise à jour de yt-dlp
Pour maintenir la compatibilité avec YouTube, mettez régulièrement à jour yt-dlp :
```bash
# Dans le conteneur Docker
docker exec <container_name> yt-dlp -U

# En local
yt-dlp -U
```

### Surveillance des logs
Surveillez les logs pour détecter les problèmes :
```bash
# Logs Docker
docker logs -f <container_name>

# Logs locaux
npm start | grep -E "(error|Error|ERROR)"
```

### Reconstruction Docker après mise à jour
Après modification du Dockerfile, forcez la reconstruction :
```bash
docker build --no-cache -t mp3rapide .
```

---

**MP3Rapide.fr** - Convertisseur YouTube vers MP3 gratuit et sécurisé 🎵