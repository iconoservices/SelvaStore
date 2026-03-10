import React, { useState, useEffect } from 'react';
import { apps } from './appsData';
import PWAInstall from './PWAInstall';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
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
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [view, setView] = useState('store'); // 'store' o 'admin'
  const [submitData, setSubmitData] = useState({ name: '', link: '', icon: '✨', description: '', category: 'Utilidad', image: '' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const categories = ['Todos', 'Entretenimiento', 'Productividad', 'Utilidad', 'Negocios'];

  useEffect(() => {
    const onUpdate = (e) => {
      setUpdateAvailable(true);
      setWaitingWorker(e.detail);
    };
    window.addEventListener('pwa-update-available', onUpdate);
    return () => window.removeEventListener('pwa-update-available', onUpdate);
  }, []);

  useEffect(() => {
    // Sincronización en tiempo real con Firestore
    const q = query(collection(db, 'apps'), orderBy('rating', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dbApps = [];
      querySnapshot.forEach((doc) => {
        dbApps.push({ id: doc.id, ...doc.data() });
      });

      // Combinar apps estáticas con las de la base de datos
      // Usamos las de la DB como prioridad o extensión
      if (dbApps.length > 0) {
        setAppsList([...apps, ...dbApps]);
      } else {
        setAppsList(apps);
      }
    }, (error) => {
      console.error("Error al sincronizar con Firestore:", error);
      // Si falla Firestore (por config vacía), usamos LocalStorage como respaldo
      const savedApps = JSON.parse(localStorage.getItem('selva_store_user_apps') || '[]');
      setAppsList([...apps, ...savedApps]);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Escuchar si la URL tiene el parámetro ?dev=true o si se pulsa una combinación
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('admin') === 'selva') {
      setIsDevMode(true);
    }
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
    const password = prompt("Ingrese la clave de administrador para acceder al panel de Selva Store:");
    if (password === "selva2026") {
      setView('admin');
    } else {
      alert("Acceso denegado.");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSubmitData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (waitingWorker && waitingWorker.waiting) {
      waitingWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
  };

  const handleSubmitNewApp = async () => {
    if (!submitData.name || !submitData.link) return;

    const newApp = {
      name: submitData.name,
      description: submitData.description || 'Nueva aplicación añadida a la red de Selva Store.',
      icon: submitData.icon || '🚀',
      category: submitData.category || 'Utilidad',
      color: submitData.color || '#ffffff',
      status: 'Activo',
      version: '1.0.0',
      link: submitData.link,
      rating: 5.0,
      image: submitData.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      createdAt: new Date().toISOString()
    };

    try {
      // Guardar en Firestore
      await addDoc(collection(db, 'apps'), newApp);

      setShowSubmitModal(false);
      setSubmitData({ name: '', link: '', icon: '✨', description: '', category: 'Utilidad', image: '' });
    } catch (err) {
      console.error("Error al guardar en Firestore:", err);
      // Fallback a solo local si no hay Firebase configurado
      const localApp = { id: Date.now(), ...newApp };
      setAppsList(prev => [...prev, localApp]);
      const savedApps = JSON.parse(localStorage.getItem('selva_store_user_apps') || '[]');
      localStorage.setItem('selva_store_user_apps', JSON.stringify([...savedApps, localApp]));
      setShowSubmitModal(false);
    }
  };

  const handleDeleteApp = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta aplicación?")) {
      // Nota: Para borrar en Firebase necesitamos el ID del documento
      // Por ahora lo filtramos de la lista local
      setAppsList(prev => prev.filter(app => app.id !== id));
      // TODO: Implementar deleteDoc(doc(db, 'apps', id)) si tenemos los IDs de Firestore
    }
  };

  const handleExtractManifest = async () => {
    if (!submitData.link) return;
    try {
      const proxy = 'https://api.allorigins.win/get?url=';
      const cleanUrl = submitData.link.replace(/\/$/, '');
      const manifestUrl = `${cleanUrl}/manifest.json`;

      const response = await fetch(`${proxy}${encodeURIComponent(manifestUrl)}`);
      const data = await response.json();
      const manifest = JSON.parse(data.contents);

      // Buscar el mejor icono (buscando el más grande o 192px)
      let bestIcon = '📱';
      let iconUrl = '';
      if (manifest.icons && manifest.icons.length > 0) {
        const icon = manifest.icons.find(i => i.sizes && i.sizes.includes('192x192')) || manifest.icons[0];
        if (icon.src) {
          iconUrl = icon.src.startsWith('http') ? icon.src : `${cleanUrl}/${icon.src.replace(/^\//, '')}`;
        }
      }

      setSubmitData(prev => ({
        ...prev,
        name: manifest.short_name || manifest.name || prev.name,
        description: manifest.description || prev.description,
        color: manifest.theme_color || prev.color,
        image: iconUrl || prev.image
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

      {/* PWA Update Toast */}
      {updateAvailable && (
        <div className="update-toast animate-fade-in glass-container">
          <div className="update-toast-content">
            <span style={{ fontSize: '1.5rem' }}>🌿</span>
            <div>
              <strong>Hay una nueva versión disponible</strong>
              <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Actualiza para disfrutar de las últimas mejoras y funciones.
              </p>
            </div>
          </div>
          <div className="update-toast-actions">
            <button className="btn-glass-sm" onClick={() => setUpdateAvailable(false)} style={{ background: 'rgba(255,255,255,0.05)' }}>
              Ignorar
            </button>
            <button className="btn-primary" style={{ padding: '8px 16px', borderRadius: '12px' }} onClick={handleUpdate}>
              Actualizar Ahora
            </button>
          </div>
        </div>
      )}

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
          <button className={`nav-link ${view === 'store' ? 'active' : ''}`} onClick={() => setView('store')}>Tienda</button>
          {isDevMode && (
            <button className={`nav-link ${view === 'admin' ? 'active' : ''}`} onClick={handleOpenSubmit}>Desarrollador</button>
          )}
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
          {view === 'admin' ? (
            <div className="admin-dashboard animate-fade-in">
              <div className="dashboard-header">
                <h3>Panel de Administración</h3>
                <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>+ Añadir Nueva App</button>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <span className="label">Total Apps</span>
                  <span className="value">{appsList.length}</span>
                </div>
                <div className="stat-card">
                  <span className="label">Categorías</span>
                  <span className="value">{categories.length - 1}</span>
                </div>
                <div className="stat-card">
                  <span className="label">Estado del Servidor</span>
                  <span className="value" style={{ color: '#00ff88', fontSize: '1.2rem' }}>Online 🟢</span>
                </div>
              </div>

              <div className="admin-table-container glass-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Aplicación</th>
                      <th>Categoría</th>
                      <th>Estado</th>
                      <th>Versión</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appsList.map(app => (
                      <tr key={app.id}>
                        <td>
                          <div className="admin-app-row">
                            <div className="admin-app-icon" style={{ backgroundColor: `${app.color}15`, color: app.color }}>
                              {app.icon}
                            </div>
                            <span>{app.name}</span>
                          </div>
                        </td>
                        <td>{app.category}</td>
                        <td><span className="badge-featured" style={{ background: app.color, color: '#000' }}>{app.status || 'Activo'}</span></td>
                        <td>{app.version}</td>
                        <td>
                          <button className="btn-admin-action">Editar</button>
                          <button className="btn-admin-action btn-admin-delete" onClick={() => handleDeleteApp(app.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : searchTerm ? (
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
                  <div style={{ width: '120px' }}>
                    <label>Categoría</label>
                    <select name="category" value={submitData.category} onChange={handleFormChange} className="glass-input" style={{ width: '100%', marginTop: '8px', padding: '10px' }}>
                      <option value="Utilidad">Utilidad</option>
                      <option value="Entretenimiento">Entretenimiento</option>
                      <option value="Productividad">Productividad</option>
                      <option value="Negocios">Negocios</option>
                    </select>
                  </div>
                  <div style={{ width: '80px' }}>
                    <label>Icono</label>
                    <input type="text" name="icon" value={submitData.icon} onChange={handleFormChange} maxLength={2} className="glass-input" style={{ width: '100%', marginTop: '8px', textAlign: 'center', fontSize: '1.2rem', padding: '10px' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Descripción Corta</label>
                  <textarea name="description" value={submitData.description} onChange={handleFormChange} placeholder="Describe qué hace tu app..." className="glass-input" style={{ width: '100%', marginTop: '8px', minHeight: '80px', resize: 'none' }} />
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
