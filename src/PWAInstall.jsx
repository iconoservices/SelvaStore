import React, { useState, useEffect } from 'react';
import './PWAInstall.css';

const PWA_STORAGE_KEY = 'selva_store_pwa_stats';

export default function PWAInstall() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // 1. Detectar si ya es PWA (standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // 2. Detectar iOS
        const ua = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(ua));

        // 3. Lógica de "Cortejo"
        const stats = JSON.parse(localStorage.getItem(PWA_STORAGE_KEY) || '{"visits":0,"last":0}');
        const now = Date.now();
        const newStats = { visits: stats.visits + 1, last: now };
        localStorage.setItem(PWA_STORAGE_KEY, JSON.stringify(newStats));

        const triggerBanner = () => {
            if (!showIOSGuide) setShowBanner(true);
        };

        const setupLogic = () => {
            if (newStats.visits === 1) {
                setTimeout(triggerBanner, 5000); // 5s en la primera visita
            } else if (newStats.visits === 2) {
                const checkScroll = () => {
                    const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
                    if (scrollPercent >= 0.5) {
                        triggerBanner();
                        window.removeEventListener('scroll', checkScroll);
                    }
                };
                window.addEventListener('scroll', checkScroll);
            } else if (newStats.visits % 2 === 0) {
                setTimeout(triggerBanner, 10000); // Visitas pares, 10s
            }
        };

        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setupLogic();
        };

        if (isIOS) {
            setupLogic();
        } else {
            window.addEventListener('beforeinstallprompt', handler);
        }

        window.addEventListener('appinstalled', () => setShowBanner(false));

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [showIOSGuide, isIOS]);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            setShowBanner(false);
        } else if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') setShowBanner(false);
        }
    };

    if (!showBanner && !showIOSGuide) return null;

    return (
        <>
            {showBanner && (
                <div className="pwa-banner glass-container animate-fade-in">
                    <div className="pwa-info">
                        <span className="pwa-icon">🌿</span>
                        <div className="pwa-text">
                            <p className="pwa-title">Instalar Selva Store</p>
                            <p className="pwa-subtitle">Lleva todas tus apps en tu pantalla de inicio</p>
                        </div>
                    </div>
                    <div className="pwa-actions">
                        <button className="pwa-btn-secondary" onClick={() => setShowBanner(false)}>Después</button>
                        <button className="pwa-btn-primary" onClick={handleInstallClick}>Instalar</button>
                    </div>
                </div>
            )}

            {showIOSGuide && (
                <div className="modal-overlay animate-fade-in" onClick={() => setShowIOSGuide(false)}>
                    <div className="modal-content glass-container ios-guide" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowIOSGuide(false)}>&times;</button>
                        <div className="modal-header">
                            <div className="modal-icon" style={{ backgroundColor: '#00ff8815', color: '#00ff88' }}>🍎</div>
                            <div className="modal-title-area">
                                <h2>Instalar en iOS</h2>
                                <span className="modal-category">Añadir a pantalla de inicio</span>
                            </div>
                        </div>
                        <div className="modal-body">
                            <p>Para añadir <strong>Selva Store</strong> a tu iPhone/iPad:</p>
                            <div className="ios-steps">
                                <div className="step">1. Toca el botón <strong>Compartir</strong> (icono ↑) abajo.</div>
                                <div className="step">2. Baja y selecciona <strong>"Añadir a pantalla de inicio"</strong> (+).</div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-install" style={{ '--accent': '#00ff88' }} onClick={() => setShowIOSGuide(false)}>¡Entendido! 🌿</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
