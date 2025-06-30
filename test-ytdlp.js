const ytdlp = require("./ytdlp-wrapper");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

console.log("🧪 Test de yt-dlp pour MP3Rapide\n");

// URL de test (vidéo courte)
const testUrl = "https://www.youtube.com/watch?v=z5THXBxzMOc";

async function runTests() {
  console.log("1️⃣  Test de l'installation de yt-dlp...");
  try {
    const isInstalled = await ytdlp.checkInstallation();
    if (isInstalled) {
      console.log("✅ yt-dlp est installé");

      // Afficher la version
      const { stdout } = await execAsync("yt-dlp --version");
      console.log(`   Version: ${stdout.trim()}`);
    } else {
      console.log("❌ yt-dlp n'est pas installé");
      return;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error.message);
    return;
  }

  console.log("\n2️⃣  Test de récupération des informations vidéo...");
  try {
    const info = await ytdlp.getInfo(testUrl);
    console.log("✅ Informations récupérées avec succès:");
    console.log(`   - Titre: ${info.videoDetails.title}`);
    console.log(`   - Auteur: ${info.videoDetails.author.name}`);
    console.log(`   - Durée: ${info.videoDetails.lengthSeconds}s`);
    console.log(`   - ID: ${info.videoDetails.videoId}`);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des infos:",
      error.message,
    );
  }

  console.log("\n3️⃣  Test de téléchargement audio...");
  try {
    console.log("   Démarrage du téléchargement (test de 10 secondes)...");
    const audioStream = await ytdlp.downloadAudio(testUrl);

    await new Promise((resolve, reject) => {
      let dataReceived = false;
      let totalBytes = 0;

      audioStream.on("data", (chunk) => {
        if (!dataReceived) {
          dataReceived = true;
          console.log("✅ Flux audio reçu avec succès");
        }
        totalBytes += chunk.length;
        if (totalBytes > 100000) {
          // Stop after 100KB
          console.log(`   Total reçu: ${(totalBytes / 1024).toFixed(2)} KB`);
          audioStream.destroy();
          resolve();
        }
      });

      audioStream.on("error", (error) => {
        console.error("❌ Erreur du flux:", error.message);
        reject(error);
      });

      audioStream.on("end", () => {
        if (!dataReceived) {
          console.error("❌ Aucune donnée reçue");
          reject(new Error("No data received"));
        } else {
          console.log(`   Total final: ${(totalBytes / 1024).toFixed(2)} KB`);
          resolve();
        }
      });

      // Timeout après 10 secondes
      setTimeout(() => {
        if (!dataReceived) {
          console.error("❌ Timeout - aucune donnée reçue après 10 secondes");
          audioStream.destroy();
          reject(new Error("Timeout"));
        }
      }, 10000);
    });
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement:", error.message);
  }

  console.log("\n4️⃣  Test de FFmpeg...");
  try {
    const { stdout } = await execAsync("ffmpeg -version");
    console.log("✅ FFmpeg est installé");
    const version = stdout.split("\n")[0];
    console.log(`   ${version}`);
  } catch (error) {
    console.error("❌ FFmpeg n'est pas installé:", error.message);
  }

  console.log("\n5️⃣  Test avec une URL invalide...");
  try {
    await ytdlp.getInfo("https://www.youtube.com/watch?v=invalid123");
    console.log("❌ Le test aurait dû échouer");
  } catch (error) {
    console.log("✅ Erreur correctement gérée:", error.message);
  }

  console.log("\n✨ Tests terminés");
}

// Lancer les tests
runTests().catch(console.error);
