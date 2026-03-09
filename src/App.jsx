import React, { useState, useEffect } from 'react';
import { apps } from './appsData';
import PWAInstall from './PWAInstall';
import './App.css';

const AppCard = ({ app, index, onOpen, renderStars }) => (
  <div
    className="app-card glass-container animate-fade-in"
    style={{ animationDelay: `${index * 0.1}s` }}
    onClick={() => onOpen(app)}
  >
    <div className="app-card-banner">
      <img src={app.image} alt={app.name} />
      <div className="status-badge" style={{ backgroundColor: app.color }}>{app.status}</div>
    </div>
    <div className="app-card-content">
      <div className="app-icon" style={{ backgroundColor: `${app.color}15`, color: app.color }}>
        {app.icon}
      </div>
      <div className="app-info">
        <div className="app-header-row">
          <h4>{app.name}</h4>
          {renderStars(app.rating || 4.5)}
        </div>
        <p>{app.description}</p>
        <div className="app-meta">
          <span className="category-tag">{app.category}</span>
          <span className="version-tag">{app.version}</span>
        </div>
      </div>
      <div className="app-actions">
        <button className="btn-launch" style={{ '--accent': app.color }}>Obtener</button>
      </div>
    </div>
  </div>
);

function App() {
  const [appsList, setAppsList] = useState(apps);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitData, setSubmitData] = useState({ name: '', link: '', icon: '✨' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Todos', 'Entretenimiento', 'Productividad', 'Utilidad', 'Negocios'];

  useEffect(() => {
    const savedApps = JSON.parse(localStorage.getItem('selva_store_user_apps') || '[]');
    if (savedApps.length > 0) {
      setAppsList([...apps, ...savedApps]);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const filteredApps = appsList.filter(app => {
    const matchesCategory = activeCategory === 'Todos' || app.category === activeCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenApp = (app) => {
    setSelectedApp(app);
  };

  const handleCloseModal = () => {
    setSelectedApp(null);
    setShowSubmitModal(false);
  };

  const handleOpenSubmit = () => {
    setShowSubmitModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSubmitData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitNewApp = () => {
    if (!submitData.name || !submitData.link) return;

    const newApp = {
      id: submitData.name.toLowerCase().replace(/\s+/g, '-'),
      name: submitData.name,
      description: 'Nueva aplicación añadida a la red de Selva Store.',
      icon: submitData.icon || '🚀',
      category: 'Utilidad', // Default
      color: '#ffffff', // Default white glass
      status: 'Revisión',
      version: '1.0.0',
      link: submitData.link,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800'
    };

    const savedApps = JSON.parse(localStorage.getItem('selva_store_user_apps') || '[]');
    localStorage.setItem('selva_store_user_apps', JSON.stringify([...savedApps, newApp]));

    setAppsList(prev => [...prev, newApp]);
    setShowSubmitModal(false);
    setSubmitData({ name: '', link: '', icon: '✨' });
  };

  const handleExtractManifest = async () => {
    if (!submitData.link) return;
    try {
      // Intentar obtener el manifiesto usando un proxy de CORS
      const proxy = 'https://api.allorigins.win/get?url=';
      const manifestUrl = `${submitData.link}/manifest.json`;
      const response = await fetch(`${proxy}${encodeURIComponent(manifestUrl)}`);
      const data = await response.json();
      const manifest = JSON.parse(data.contents);

      setSubmitData(prev => ({
        ...prev,
        name: manifest.short_name || manifest.name || prev.name,
        icon: '📱' // Por ahora emoji, pero detectado
      }));
    } catch (err) {
      console.log("No se pudo extraer el manifiesto automáticamente", err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.round(rating) ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return <div className="stars-container">{stars} <span className="rating-num">{rating}</span></div>;
  };

  return (
    <div
      className={`app-container ${selectedApp || showSubmitModal ? 'modal-open' : ''}`}
      style={{
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`
      }}
    >
      <div className="bg-spotlight"></div>
      <PWAInstall />

      <header className="header glass-container animate-fade-in">
        <div className="logo">
          <span className="logo-icon">🌿</span>
          <h1>Selva<span>Store</span></h1>
        </div>
        <div className="header-search">
          <div className="search-bar glass-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar aplicaciones, juegos y más..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <nav className="nav">
          <button className="nav-link active">Tienda</button>
          <button className="nav-link" onClick={handleOpenSubmit}>Desarrollador</button>
          <div className="user-profile">
            <div className="avatar">JD</div>
          </div>
        </nav>
      </header>

      <main className="content">
        <section className="hero-grid animate-fade-in">
          <div className="hero-main glass-container" onClick={() => handleOpenApp(appsList.find(a => a.id === 'selvabeat'))}>
            <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1200" alt="Main Feature" />
            <div className="hero-overlay">
              <span className="badge-featured">Destacado</span>
              <h2>SelvaBeat: Tu Música Sin Límites</h2>
              <p>La experiencia auditiva más resiliente del ecosistema.</p>
              <button className="btn-primary">Explorar</button>
            </div>
          </div>
          <div className="hero-side">
            <div className="hero-sub glass-container" onClick={() => handleOpenApp(appsList.find(a => a.id === 'selvaflix'))}>
              <img src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800" alt="Sub Feature 1" />
              <div className="hero-overlay small">
                <h3>Netflix en Selva</h3>
                <button className="btn-glass-sm">Ver más</button>
              </div>
            </div>
            <div className="hero-sub glass-container" onClick={() => handleOpenApp(appsList.find(a => a.id === 'incflow'))}>
              <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800" alt="Sub Feature 2" />
              <div className="hero-overlay small">
                <h3>Domina tus Finanzas</h3>
                <button className="btn-glass-sm">Ver más</button>
              </div>
            </div>
          </div>
        </section>

        <section className="store-section">
          {searchTerm ? (
            <div className="search-results">
              <div className="section-header">
                <h3>Resultados para "{searchTerm}"</h3>
              </div>
              <div className="apps-grid">
                {filteredApps.map((app, index) => (
                  <AppCard key={app.id} app={app} index={index} onOpen={handleOpenApp} renderStars={renderStars} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Sección: Tendencias (Formato Pequeño) */}
              <div className="home-category-row">
                <div className="section-header">
                  <h3>Tendencias en aplicaciones</h3>
                  <button className="btn-text">Ver todo {'>'}</button>
                </div>
                <div className="small-apps-list">
                  {appsList.slice(0, 6).map((app, index) => (
                    <div key={app.id} className="small-app-item" onClick={() => handleOpenApp(app)}>
                      <div className="small-app-icon" style={{ backgroundColor: `${app.color}15`, color: app.color }}>
                        {app.icon}
                      </div>
                      <div className="small-app-details">
                        <h4>{app.name}</h4>
                        <span className="small-app-cat">{app.category}</span>
                        {renderStars(app.rating)}
                      </div>
                      <span className="small-app-price">Gratis</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secciones por Categoría (Formato Estándar) */}
              {categories.filter(c => c !== 'Todos').map(category => {
                const categoryApps = appsList.filter(a => a.category === category);
                if (categoryApps.length === 0) return null;

                return (
                  <div key={category} className="home-category-row">
                    <div className="section-header">
                      <h3>{category}</h3>
                      <button className="btn-text">Más {'>'}</button>
                    </div>
                    <div className="apps-grid">
                      {categoryApps.slice(0, 5).map((app, index) => (
                        <AppCard key={app.id} app={app} index={index} onOpen={handleOpenApp} renderStars={renderStars} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>
      </main>

      {selectedApp && (
        <div className="modal-overlay animate-fade-in" onClick={handleCloseModal}>
          <div className="modal-content glass-container" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            <div className="modal-header">
              <div className="modal-icon" style={{ backgroundColor: `${selectedApp.color}15`, color: selectedApp.color }}>
                {selectedApp.icon}
              </div>
              <div className="modal-title-area">
                <h2>{selectedApp.name}</h2>
                <span className="modal-category">{selectedApp.category}</span>
              </div>
            </div>
            <div className="modal-body">
              <div className="modal-image-banner">
                <img src={selectedApp.image} alt={selectedApp.name} />
              </div>
              <div className="modal-main-info">
                <div className="modal-rating-row">
                  <h3>Sobre esta App</h3>
                  {renderStars(selectedApp.rating || 4.5)}
                </div>
                <p>{selectedApp.description}</p>
              </div>

              <div className="modal-stats">
                <div className="stat-box">
                  <span className="stat-label">Versión</span>
                  <span className="stat-value">{selectedApp.version}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Servidor</span>
                  <span className="stat-value">{selectedApp.link.replace('http://', '')}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Desarrollador</span>
                  <span className="stat-value">Antigravity</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a
                href={selectedApp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-install"
                style={{ '--accent': selectedApp.color, textDecoration: 'none', display: 'block', textAlign: 'center' }}
              >
                Lanzar Aplicación
              </a>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="modal-overlay animate-fade-in" onClick={handleCloseModal}>
          <div className="modal-content glass-container" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            <div className="modal-header">
              <div className="modal-icon" style={{ backgroundColor: '#00ff8815', color: '#00ff88' }}>
                🚀
              </div>
              <div className="modal-title-area">
                <h2>Submit Your App</h2>
                <span className="modal-category">Developer Portal</span>
              </div>
            </div>
            <div className="modal-body">
              <p>¿Tienes una PWA? Pega el link y nosotros extraeremos los datos automáticamente.</p>
              <div className="submit-form">
                <div className="input-group">
                  <label>URL de la Aplicación</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" name="link" value={submitData.link} onChange={handleFormChange} placeholder="http://localhost:4005" className="glass-input" style={{ flex: 1 }} />
                    <button className="btn-extract" onClick={handleExtractManifest}>Auto-detect ⚡</button>
                  </div>
                </div>
                <div className="input-group" style={{ display: 'flex', flexDirection: 'row', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Nombre de la App</label>
                    <input type="text" name="name" value={submitData.name} onChange={handleFormChange} placeholder="Ej. SelvaTools" className="glass-input" style={{ width: '100%', marginTop: '8px' }} />
                  </div>
                  <div style={{ width: '80px' }}>
                    <label>Icono</label>
                    <input type="text" name="icon" value={submitData.icon} onChange={handleFormChange} maxLength={2} className="glass-input" style={{ width: '100%', marginTop: '8px', textAlign: 'center', fontSize: '1.2rem', padding: '10px' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-install" style={{ '--accent': '#00ff88', opacity: (!submitData.name || !submitData.link) && 0.5 }} onClick={handleSubmitNewApp}>
                Añadir a la Tienda
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer animate-fade-in">
        <p>&copy; 2026 Selva Store. Todos los derechos reservados.</p>
        <div className="footer-links">
          <span>Privacidad</span>
          <span>Términos</span>
          <span>Soporte</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
