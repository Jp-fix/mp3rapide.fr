class YouTubeConverter {
    constructor() {
        this.currentVideoUrl = '';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('urlForm');
        const downloadBtn = document.getElementById('downloadBtn');
        const convertAnotherBtnModal = document.getElementById('convertAnotherBtnModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalOverlay = document.getElementById('modalOverlay');

        if (form) {
            form.addEventListener('submit', (e) => this.handleUrlSubmit(e));
        }
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.handleDownload());
        }
        if (convertAnotherBtnModal) {
            convertAnotherBtnModal.addEventListener('click', () => this.handleConvertAnother());
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideSuccessModal());
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.hideSuccessModal());
        }
    }

    async handleUrlSubmit(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('youtubeUrl');
        const url = urlInput.value.trim();

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('Veuillez entrer une URL YouTube valide');
            return;
        }

        this.currentVideoUrl = url;
        await this.fetchVideoInfo(url);
    }

    async fetchVideoInfo(url) {
        this.showLoading(true);
        this.hideError();
        this.hideVideoInfo();

        try {
            console.log('🔍 Fetching video info for:', url);
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            console.log('📡 API Response status:', response.status);
            console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();
            console.log('📦 API Response data:', data);

            if (!response.ok) {
                console.error('❌ API Error - Status:', response.status, 'Data:', data);
                throw new Error(data.error || 'Erreur lors de la récupération des informations');
            }

            console.log('✅ Video info fetched successfully');
            this.displayVideoInfo(data);
        } catch (error) {
            console.error('💥 Fetch error details:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                this.showError('Impossible de contacter le serveur. Vérifiez votre connexion.');
            } else {
                this.showError(error.message);
            }
        } finally {
            this.showLoading(false);
        }
    }

    async handleDownload() {
        if (!this.currentVideoUrl) return;

        this.showDownloadProgress(true);
        this.hideError();

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: this.currentVideoUrl
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la conversion');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = this.extractFilename(contentDisposition) || 'mp3rapide.fr - audio.mp3';

            this.downloadFile(blob, filename);
            this.showSuccess('Conversion MP3 terminée ! Fichier téléchargé.');
            this.showSuccessModal();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showDownloadProgress(false);
        }
    }

    displayVideoInfo(data) {
        document.getElementById('videoThumbnail').src = data.thumbnail;
        document.getElementById('videoTitle').textContent = data.title;
        document.getElementById('videoAuthor').textContent = data.author;
        document.getElementById('videoDuration').textContent = this.formatDuration(data.duration);
        document.getElementById('videoViews').textContent = this.formatNumber(data.viewCount);
        
        this.showVideoInfo();
    }

    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    extractFilename(contentDisposition) {
        if (!contentDisposition) return null;
        const match = contentDisposition.match(/filename="(.+)"/);
        return match ? match[1] : null;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    }

    isValidYouTubeUrl(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return regex.test(url);
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        loadingState.classList.toggle('hidden', !show);
    }

    showDownloadProgress(show) {
        const progressState = document.getElementById('downloadProgress');
        const downloadBtn = document.getElementById('downloadBtn');
        
        progressState.classList.toggle('hidden', !show);
        downloadBtn.disabled = show;
        
        if (show) {
            downloadBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    showVideoInfo() {
        document.getElementById('videoInfo').classList.remove('hidden');
    }

    hideVideoInfo() {
        document.getElementById('videoInfo').classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');

        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorDiv.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-6';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-3"></i>
                <span class="text-green-700">${message}</span>
            </div>
        `;
        errorDiv.classList.remove('hidden');

        setTimeout(() => {
            this.hideError();
            errorDiv.className = 'hidden bg-red-50 border border-red-200 rounded-lg p-4 mb-6';
            errorDiv.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    <span class="text-red-700" id="errorText"></span>
                </div>
            `;
        }, 3000);
    }


    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Initialize Ko-fi for modal if not already done
            const kofiModal = document.getElementById('kofiModal');
            if (kofiModal && kofiModal.innerHTML === '') {
                // Create a fresh button for the modal
                const button = document.createElement('a');
                button.href = 'https://ko-fi.com/V7V41H5OBB';
                button.target = '_blank';
                button.className = 'flex-1 inline-flex justify-center items-center px-4 py-2 bg-[#72a4f2] text-white rounded-lg hover:bg-[#5a92e0] transition-colors text-sm font-medium';
                button.innerHTML = '<i class="fas fa-heart mr-2"></i>Soutenir mp3rapide';
                kofiModal.appendChild(button);
            }
        }
    }

    hideSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleConvertAnother() {
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const version = 'v1.3.0-ytdlp';
    const deploymentId = 'deploy-' + Date.now();
    
    console.log(`🎵 MP3Rapide Frontend ${version}`);
    console.log(`📋 Frontend Deployment ID: ${deploymentId}`);
    console.log('✅ yt-dlp integration: ACTIVE');
    console.log('🔧 Debug mode: Check Network tab for API calls');
    
    new YouTubeConverter();
});