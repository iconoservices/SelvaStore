import React, { useState, useEffect } from 'react';
import { apps } from './appsData';
import PWAInstall from './PWAInstall';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './App.css';

const AppIcon = ({ icon, color, className = "app-icon" }) => {
  const isUrl = typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/') || icon.includes('.'));
  return (
    <div className={className} style={{ backgroundColor: `${color}15`, color: color }}>
      {isUrl ? <img src={icon} alt="icon" /> : icon}
    </div>
  );
};

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
      <AppIcon icon={app.icon} color={app.color} />
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [submitData, setSubmitData] = useState({
    name: '',
    link: '',
    icon: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png', // Fallback profesional
    description: '',
    category: 'Utilidad',
    image: '',
    color: '#00ff88'
  });
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
    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dbApps = [];
      querySnapshot.forEach((doc) => {
        dbApps.push({ id: doc.id, ...doc.data() });
      });

      // ALGORITMO DE MERGE ULTRA-RESILIENTE: 
      // 1. Unimos todo (DB + Estáticas)
      // 2. Filtramos por nombre único (Case insensitive)
      // 3. Priorizamos siempre la versión de la DB (que viene primero en el array)
      const allPossibleApps = [...dbApps, ...apps];
      const uniqueApps = [];
      const seenNames = new Set();

      allPossibleApps.forEach(app => {
        const nameLower = app.name.toLowerCase().trim();
        if (!seenNames.has(nameLower)) {
          uniqueApps.push(app);
          seenNames.add(nameLower);
        }
      });

      setAppsList(uniqueApps);
    }, (error) => {
      console.error("Error al sincronizar con Firestore:", error);
      const savedApps = JSON.parse(localStorage.getItem('selva_store_user_apps') || '[]');
      const allFallback = [...savedApps, ...apps];
      const uniqueFallback = [];
      const seenFallback = new Set();

      allFallback.forEach(app => {
        const nameLower = app.name.toLowerCase().trim();
        if (!seenFallback.has(nameLower)) {
          uniqueFallback.push(app);
          seenFallback.add(nameLower);
        }
      });
      setAppsList(uniqueFallback);
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
    setShowAdminPrompt(true);
  };

  const handleAdminAuth = () => {
    if (adminPass === "selva2026") {
      setView('admin');
      setShowAdminPrompt(false);
      setAdminPass('');
    } else {
      alert("Clave incorrecta 🌿");
      setAdminPass('');
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

    const appData = {
      name: submitData.name,
      description: submitData.description || 'Nueva aplicación añadida a la red de Selva Store.',
      icon: submitData.icon || 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png',
      category: submitData.category || 'Utilidad',
      color: submitData.color || '#00ff88',
      status: 'Activo',
      version: submitData.version || '1.0.0',
      link: submitData.link,
      rating: submitData.rating || 5.0,
      image: submitData.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
      createdAt: isEditing ? (submitData.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (isEditing && editingId) {
        const docRef = doc(db, 'apps', editingId);
        await updateDoc(docRef, appData);
      } else {
        await addDoc(collection(db, 'apps'), appData);
      }
      
      alert(isEditing ? "¡Aplicación actualizada con éxito!" : "¡Aplicación añadida a la red!");
      setShowSubmitModal(false);
      setIsEditing(false);
      setEditingId(null);
      setSubmitData({ name: '', link: '', icon: 'https://cdn-icons-png.flaticon.com/512/2589/2589175.png', description: '', category: 'Utilidad', image: '', color: '#00ff88' });
    } catch (err) {
      console.error("Error al guardar en Firestore:", err);
      alert("Error guardando en la nube. Se guardó localmente.");
      const localApp = { id: editingId || Date.now(), ...appData };
      setAppsList(prev => isEditing ? prev.map(a => a.id === editingId ? localApp : a) : [localApp, ...prev]);
      setShowSubmitModal(false);
    }
  };

  // Auto-detect al escribir el link (con debounce ligero)
  useEffect(() => {
    if (!submitData.link || isEditing) return;

    // Solo si parece una URL válida y ha cambiado
    if (submitData.link.startsWith('http')) {
      const timer = setTimeout(() => {
        handleExtractManifest();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [submitData.link]);

  const handleDeleteApp = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta aplicación para SIEMPRE de la nube?")) {
      try {
        await deleteDoc(doc(db, 'apps', id));
        // El onSnapshot actualizará la lista automáticamente
      } catch (err) {
        console.error("Error al eliminar de Firestore:", err);
        setAppsList(prev => prev.filter(app => app.id !== id));
      }
    }
  };

  const handleEditApp = (app) => {
    setSubmitData({
      name: app.name,
      link: app.link,
      icon: app.icon,
      description: app.description,
      category: app.category,
      image: app.image,
      color: app.color || '#00ff88',
      version: app.version,
      rating: app.rating,
      createdAt: app.createdAt
    });
    setEditingId(app.id);
    setIsEditing(true);
    setShowSubmitModal(true);
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

      // Icono: Buscar en manifest -> Si no, intentar Favicon
      let iconUrl = '';
      if (manifest.icons && manifest.icons.length > 0) {
        const icon = manifest.icons.find(i => i.sizes?.includes('192')) ||
                    manifest.icons.find(i => i.sizes?.includes('512')) ||
                    manifest.icons[0];
        if (icon.src) {
          iconUrl = icon.src.startsWith('http') ? icon.src : `${cleanUrl}/${icon.src.replace(/^\//, '')}`;
        }
      }

      // Fallback a favicon si no hay icono en manifest
      if (!iconUrl) {
        iconUrl = `${cleanUrl}/favicon.ico`;
      }

      // Banner (screenshot para fondo)
      let screenshotUrl = '';
      if (manifest.screenshots && manifest.screenshots.length > 0) {
        const screen = manifest.screenshots[0];
        const sUrl = typeof screen === 'string' ? screen : screen.src;
        screenshotUrl = sUrl.startsWith('http') ? sUrl : `${cleanUrl}/${sUrl.replace(/^\//, '')}`;
      }

      setSubmitData(prev => ({
        ...prev,
        name: manifest.short_name || manifest.name || prev.name,
        description: manifest.description || prev.description,
        color: manifest.theme_color || prev.color,
        icon: iconUrl || prev.icon,
        image: screenshotUrl || prev.image
      }));
    } catch (err) {
      console.log("No se pudo extraer el manifiesto, intentando favicon básico...");
      const cleanUrl = submitData.link.replace(/\/$/, '');
      setSubmitData(prev => ({
        ...prev,
        icon: prev.icon.includes('flaticon') ? `${cleanUrl}/favicon.ico` : prev.icon
      }));
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
          <img src="/icon-192.png" alt="Selva Store Logo" className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
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
          <button className={`nav-link ${view === 'store' && activeCategory === 'Todos' ? 'active' : ''}`} onClick={() => { setView('store'); setActiveCategory('Todos'); setSearchTerm(''); }}>Tienda</button>
          <button className={`nav-link ${activeCategory === 'Entretenimiento' ? 'active' : ''}`} onClick={() => { setView('store'); setActiveCategory('Entretenimiento'); setSearchTerm(''); }}>Juegos</button>
          <button className={`nav-link ${activeCategory === 'Utilidad' ? 'active' : ''}`} onClick={() => { setView('store'); setActiveCategory('Utilidad'); setSearchTerm(''); }}>Apps</button>
          <div className="user-profile" onClick={handleOpenSubmit} title="Acceso de Desarrollador">
            <div className="avatar">{view === 'admin' ? '⚙️' : 'JD'}</div>
          </div>
        </nav>
      </header>

      <main className="content">
        {activeCategory === 'Todos' && !searchTerm && view === 'store' && (
          <section className="hero-grid animate-fade-in">
            <div className="hero-main glass-container" onClick={() => handleOpenApp(appsList.find(a => a.name.toLowerCase().includes('selvabeat')) || appsList[0])}>
              <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1200" alt="Main Feature" />
              <div className="hero-overlay">
                <span className="badge-featured">Destacado</span>
                <h2>{appsList.find(a => a.name.toLowerCase().includes('selvabeat'))?.name || 'SelvaBeat'}</h2>
                <p>{appsList.find(a => a.name.toLowerCase().includes('selvabeat'))?.description || 'Tu música sin límites.'}</p>
                <button className="btn-primary">Explorar</button>
              </div>
            </div>
            <div className="hero-side">
              <div className="hero-sub glass-container" onClick={() => handleOpenApp(appsList.find(a => a.name.toLowerCase().includes('selvaflix')) || appsList[1])}>
                <img src="https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=800" alt="Sub Feature 1" />
                <div className="hero-overlay small">
                  <h3>{appsList.find(a => a.name.toLowerCase().includes('selvaflix'))?.name || 'SelvaFlix'}</h3>
                  <button className="btn-glass-sm">Ver más</button>
                </div>
              </div>
              <div className="hero-sub glass-container" onClick={() => handleOpenApp(appsList.find(a => a.name.toLowerCase().includes('incflow')) || appsList[2])}>
                <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800" alt="Sub Feature 2" />
                <div className="hero-overlay small">
                  <h3>{appsList.find(a => a.name.toLowerCase().includes('incflow'))?.name || 'INCFlow'}</h3>
                  <button className="btn-glass-sm">Ver más</button>
                </div>
              </div>
            </div>
          </section>
        )}

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
                      <tr key={app.id || app.name}>
                        <td>
                          <div className="admin-app-row">
                            <AppIcon icon={app.icon} color={app.color} className="admin-app-icon" />
                            <span>{app.name}</span>
                          </div>
                        </td>
                        <td>{app.category}</td>
                        <td><span className="badge-featured" style={{ background: app.color, color: '#000' }}>{app.status || 'Activo'}</span></td>
                        <td>{app.version}</td>
                        <td>
                          <button className="btn-admin-action" onClick={() => handleEditApp(app)}>Editar</button>
                          <button className="btn-admin-action btn-admin-delete" onClick={() => handleDeleteApp(app.id || app.name)}>Eliminar</button>
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
               {/* Barra de Filtros en Tienda */}
               {view === 'store' && !searchTerm && (
                 <div className="category-filter-bar animate-fade-in" style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
                   {categories.map(cat => (
                     <button 
                       key={cat} 
                       className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                       onClick={() => setActiveCategory(cat)}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>
               )}

              {/* Sección: Tendencias (Solo si es 'Todos') */}
              {activeCategory === 'Todos' && (
                <div className="home-category-row">
                  <div className="section-header">
                    <h3>Tendencias en aplicaciones</h3>
                  </div>
                  <div className="small-apps-list">
                    {appsList.slice(0, 6).map((app, index) => (
                      <div key={`trend-${app.id || app.name}-${index}`} className="small-app-item" onClick={() => handleOpenApp(app)}>
                        <AppIcon icon={app.icon} color={app.color} className="small-app-icon" />
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
              )}

              {/* Secciones por Categoría */}
              {categories.filter(c => c !== 'Todos' && (activeCategory === 'Todos' || activeCategory === c)).map(category => {
                const categoryApps = appsList.filter(a => a.category === category);
                if (categoryApps.length === 0) return null;

                return (
                  <div key={category} className="home-category-row">
                    <div className="section-header">
                      <h3>{category}</h3>
                      {activeCategory === 'Todos' && (
                        <button className="btn-text" onClick={() => setActiveCategory(category)}>Más {'>'}</button>
                      )}
                    </div>
                    <div className="apps-grid">
                      {(activeCategory === 'Todos' ? categoryApps.slice(0, 5) : categoryApps).map((app, index) => (
                        <AppCard key={`grid-${app.id || app.name}-${index}`} app={app} index={index} onOpen={handleOpenApp} renderStars={renderStars} />
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
              <AppIcon icon={selectedApp.icon} color={selectedApp.color} className="modal-icon" />
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

      {showAdminPrompt && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAdminPrompt(false)}>
          <div className="modal-content glass-container admin-login-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="logo-icon">🔒</span>
              <h2>Zona Desarrollador</h2>
              <button className="modal-close" onClick={() => setShowAdminPrompt(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Esta área es exclusiva para administradores de Selva Store.</p>
              <div className="input-group">
                <label>Clave de Acceso</label>
                <input 
                  type="password" 
                  value={adminPass} 
                  onChange={(e) => setAdminPass(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                  className="glass-input" 
                  placeholder="••••••••"
                  autoFocus
                  style={{ width: '100%', marginTop: '10px', fontSize: '1.2rem', textAlign: 'center' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAdminAuth} style={{ width: '100%' }}>Entrar al Panel</button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="modal-overlay animate-fade-in" onClick={handleCloseModal}>
          <div className="modal-content glass-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="logo-icon">🌿</span>
              <h2>{isEditing ? 'Editar Aplicación' : 'Añadir Nueva App'}</h2>
              <button className="modal-close" onClick={() => { setShowSubmitModal(false); setIsEditing(false); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="submit-form">
                <div className="input-group">
                  <label>URL de la Aplicación (PWA)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      name="link"
                      value={submitData.link}
                      onChange={handleFormChange}
                      placeholder="http://mi-app.com"
                      className="glass-input"
                      style={{ flex: 1 }}
                    />
                    <div className="auto-detect-indicator" style={{ fontSize: '0.7rem', color: 'var(--accent-green)', opacity: submitData.link.startsWith('http') ? 0.8 : 0 }}>
                      Auto-detecting... ⚡
                    </div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Pega el link y el sistema extraerá los datos automáticamente.
                  </p>
                </div>

                <div className="input-group" style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Nombre de la App</label>
                    <input type="text" name="name" value={submitData.name} onChange={handleFormChange} placeholder="Ej. SelvaTools" className="glass-input" style={{ width: '100%', marginTop: '8px' }} />
                  </div>
                  <div style={{ width: '140px' }}>
                    <label>Categoría</label>
                    <select name="category" value={submitData.category} onChange={handleFormChange} className="glass-input" style={{ width: '100%', marginTop: '8px', padding: '10px' }}>
                      <option value="Utilidad">Utilidad</option>
                      <option value="Entretenimiento">Entretenimiento</option>
                      <option value="Productividad">Productividad</option>
                      <option value="Negocios">Negocios</option>
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Icono URL (o Emoji)</label>
                    <input type="text" name="icon" value={submitData.icon} onChange={handleFormChange} placeholder="https://mi-icono.png o ✨" className="glass-input" style={{ width: '100%', marginTop: '8px' }} />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label>Color Marca</label>
                    <input type="color" name="color" value={submitData.color} onChange={handleFormChange} className="glass-input" style={{ width: '100%', height: '40px', marginTop: '8px', padding: '2px' }} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Imagen de Banner (Link)</label>
                  <input type="text" name="image" value={submitData.image} onChange={handleFormChange} placeholder="https://ejemplo.com/fondo.jpg" className="glass-input" style={{ width: '100%', marginTop: '8px' }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '5px' }}>Dejar vacío para usar fondo aleatorio.</p>
                </div>

                <div className="input-group">
                  <label>Descripción del Producto</label>
                  <textarea name="description" value={submitData.description} onChange={handleFormChange} placeholder="¿Qué hace tu app especial?" className="glass-input" style={{ width: '100%', marginTop: '8px', minHeight: '80px', resize: 'none' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-install" style={{ '--accent': '#00ff88' }} onClick={handleSubmitNewApp}>
                {isEditing ? 'Guardar Cambios' : 'Añadir a la Tienda'}
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
