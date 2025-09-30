class MP3RapideConverter {
    constructor() {
        this.currentVideoUrl = '';
        this.isConverting = false;
        this.states = {
            IDLE: 'idle',
            LOADING: 'loading',
            INFO_LOADED: 'info_loaded',
            DOWNLOADING: 'downloading',
            SUCCESS: 'success',
            ERROR: 'error'
        };
        this.currentState = this.states.IDLE;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeAnimations();
        this.setupHeader();
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

        // Header scroll effect
        window.addEventListener('scroll', () => this.handleHeaderScroll());

        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    initializeAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeInUp');
                }
            });
        }, observerOptions);

        // Observe sections for animations
        const sections = document.querySelectorAll('section > div');
        sections.forEach(section => observer.observe(section));
    }

    setupHeader() {
        const header = document.getElementById('header');
        if (header) {
            // Add initial styles
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        }
    }

    handleHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        const scrolled = window.scrollY > 50;

        if (scrolled) {
            header.classList.add('header-blur');
            header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        } else {
            header.classList.remove('header-blur');
            header.style.boxShadow = 'none';
        }
    }

    setState(newState) {
        this.currentState = newState;
        this.updateUI();
    }

    updateUI() {
        const loadingState = document.getElementById('loadingState');
        const videoInfo = document.getElementById('videoInfo');
        const errorState = document.getElementById('errorState');
        const convertBtn = document.getElementById('convertBtn');

        // Hide all states first
        loadingState?.classList.add('status-hidden');
        videoInfo?.classList.add('status-hidden');
        errorState?.classList.add('status-hidden');

        switch (this.currentState) {
            case this.states.IDLE:
                if (convertBtn) {
                    convertBtn.disabled = false;
                    convertBtn.innerHTML = `
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Convertir en MP3
                    `;
                }
                break;

            case this.states.LOADING:
                loadingState?.classList.remove('status-hidden');
                if (convertBtn) {
                    convertBtn.disabled = true;
                    convertBtn.innerHTML = `
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyse en cours...
                    `;
                }
                break;

            case this.states.INFO_LOADED:
                videoInfo?.classList.remove('status-hidden');
                if (convertBtn) {
                    convertBtn.disabled = false;
                    convertBtn.innerHTML = `
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Convertir en MP3
                    `;
                }
                break;

            case this.states.DOWNLOADING:
                loadingState?.classList.remove('status-hidden');
                break;

            case this.states.ERROR:
                errorState?.classList.remove('status-hidden');
                if (convertBtn) {
                    convertBtn.disabled = false;
                    convertBtn.innerHTML = `
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Réessayer
                    `;
                }
                break;
        }
    }

    updateProgress(percentage, text) {
        const progressBar = document.getElementById('progressBar');
        const loadingText = document.getElementById('loadingText');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (loadingText && text) {
            loadingText.textContent = text;
        }
    }

    async handleUrlSubmit(e) {
        e.preventDefault();

        if (this.isConverting) return;

        const urlInput = document.getElementById('youtubeUrl');
        const url = urlInput?.value?.trim();

        if (!url) {
            this.showError('Veuillez entrer une URL YouTube valide');
            return;
        }

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('L\'URL fournie n\'est pas une URL YouTube valide');
            return;
        }

        this.currentVideoUrl = url;
        this.isConverting = true;
        this.setState(this.states.LOADING);
        this.updateProgress(10, 'Connexion au serveur...');

        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            this.updateProgress(30, 'Récupération des informations...');

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des informations');
            }

            this.updateProgress(70, 'Traitement des données...');
            this.displayVideoInfo(data);
            this.updateProgress(100, 'Terminé !');

            setTimeout(() => {
                this.setState(this.states.INFO_LOADED);
                this.isConverting = false;
            }, 500);

        } catch (error) {
            console.error('Erreur lors de la récupération des infos:', error);
            this.showError(error.message || 'Erreur lors de la récupération des informations de la vidéo');
            this.isConverting = false;
        }
    }

    displayVideoInfo(videoData) {
        const thumbnail = document.getElementById('videoThumbnail');
        const title = document.getElementById('videoTitle');
        const author = document.getElementById('videoAuthor');
        const duration = document.getElementById('videoDuration');
        const views = document.getElementById('videoViews');

        if (thumbnail && videoData.thumbnail) {
            thumbnail.src = videoData.thumbnail;
            thumbnail.alt = `Miniature de ${videoData.title}`;
        }

        if (title) {
            title.textContent = videoData.title || 'Titre indisponible';
            title.title = videoData.title; // Tooltip for full title
        }

        if (author) {
            author.textContent = `Par ${videoData.author || 'Auteur inconnu'}`;
        }

        if (duration) {
            duration.textContent = this.formatDuration(videoData.duration);
        }

        if (views) {
            views.textContent = this.formatViews(videoData.viewCount);
        }
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatViews(viewCount) {
        if (!viewCount || isNaN(viewCount)) return '0 vues';

        const count = parseInt(viewCount);
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M vues`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K vues`;
        }
        return `${count} vues`;
    }

    async handleDownload() {
        if (!this.currentVideoUrl) {
            this.showError('Aucune vidéo sélectionnée');
            return;
        }

        this.setState(this.states.DOWNLOADING);
        this.updateProgress(0, 'Préparation du téléchargement...');

        try {
            this.updateProgress(20, 'Connexion au serveur...');

            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: this.currentVideoUrl })
            });

            this.updateProgress(40, 'Conversion en cours...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la conversion');
            }

            this.updateProgress(70, 'Finalisation...');

            // Handle file download
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'audio.mp3';

            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/);
                if (match) {
                    filename = decodeURIComponent(match[1]);
                }
            }

            this.updateProgress(90, 'Téléchargement...');

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.updateProgress(100, 'Téléchargement terminé !');

            setTimeout(() => {
                this.showSuccessModal();
                this.setState(this.states.SUCCESS);
            }, 1000);

        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            this.showError(error.message || 'Erreur lors du téléchargement');
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        this.setState(this.states.ERROR);

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            if (this.currentState === this.states.ERROR) {
                this.setState(this.states.IDLE);
            }
        }, 5000);
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Add fade in animation
            requestAnimationFrame(() => {
                modal.style.opacity = '0';
                modal.style.transform = 'scale(0.95)';
                requestAnimationFrame(() => {
                    modal.style.transition = 'all 0.2s ease-out';
                    modal.style.opacity = '1';
                    modal.style.transform = 'scale(1)';
                });
            });
        }
    }

    hideSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.transition = 'all 0.2s ease-in';
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.transition = '';
            }, 200);
        }
    }

    handleConvertAnother() {
        this.hideSuccessModal();
        this.resetForm();
        this.setState(this.states.IDLE);

        // Scroll to converter
        const converter = document.getElementById('convertir');
        if (converter) {
            converter.scrollIntoView({ behavior: 'smooth' });
        }

        // Focus on input
        const urlInput = document.getElementById('youtubeUrl');
        if (urlInput) {
            setTimeout(() => urlInput.focus(), 500);
        }
    }

    resetForm() {
        const urlInput = document.getElementById('youtubeUrl');
        if (urlInput) {
            urlInput.value = '';
        }
        this.currentVideoUrl = '';
        this.isConverting = false;
    }

    isValidYouTubeUrl(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=)[\w-]+(&\S*)?$/;
        return regex.test(url);
    }

    // Utility methods for accessibility
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Handle keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Escape key to close modal
            if (e.key === 'Escape') {
                const modal = document.getElementById('successModal');
                if (modal && !modal.classList.contains('hidden')) {
                    this.hideSuccessModal();
                }
            }

            // Enter key to submit form when input is focused
            if (e.key === 'Enter' && e.target.id === 'youtubeUrl') {
                e.preventDefault();
                const form = document.getElementById('urlForm');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        const converter = new MP3RapideConverter();

        // Make it globally accessible for debugging
        window.mp3Converter = converter;

        // Add some visual feedback for successful initialization
        console.log('🎵 MP3Rapide Converter initialized successfully');

    } catch (error) {
        console.error('❌ Failed to initialize MP3Rapide Converter:', error);

        // Fallback for essential functionality
        const form = document.getElementById('urlForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Le convertisseur rencontre un problème. Veuillez recharger la page.');
            });
        }
    }
});

// Add error boundary for unhandled errors
window.addEventListener('error', (e) => {
    console.error('Unhandled error:', e.error);

    // Show user-friendly error message
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');

    if (errorState && errorMessage) {
        errorMessage.textContent = 'Une erreur technique est survenue. Veuillez recharger la page.';
        errorState.classList.remove('status-hidden');
    }
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Only register if we have a service worker file
        fetch('/sw.js')
            .then(response => {
                if (response.ok) {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('SW registered: ', registration);
                        })
                        .catch(registrationError => {
                            console.log('SW registration failed: ', registrationError);
                        });
                }
            })
            .catch(() => {
                // Service worker file doesn't exist, ignore
            });
    });
}