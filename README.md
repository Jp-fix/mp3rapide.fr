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
- **Conversion** : FFmpeg + ytdl-core
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Styling** : Tailwind CSS
- **Icons** : Font Awesome

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- FFmpeg installé sur le système
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

3. **Installer FFmpeg**

**Sur Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Sur macOS :**
```bash
brew install ffmpeg
```

**Sur Windows :**
Téléchargez FFmpeg depuis https://ffmpeg.org/download.html

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

---

**MP3Rapide.fr** - Convertisseur YouTube vers MP3 gratuit et sécurisé 🎵