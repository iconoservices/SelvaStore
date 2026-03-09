# 📱 Respaldo: Vista Móvil a Dos Columnas (App.css)

Si en el futuro necesitas reconstruir la vista móvil con cuadrícula de 2 aplicaciones por fila, este es el fragmento de CSS crítico que debe ir al final de `App.css` dentro del `@media (max-width: 768px)`:

```css
@media (max-width: 768px) {
  /* Contenedor adaptado */
  .app-container {
    padding: 0 1rem;
  }

  /* Header y buscador amigable */
  .header {
    margin-top: 10px;
    padding: 0.6rem 1rem;
    flex-wrap: wrap;
    gap: 10px;
  }
  .header-search {
    order: 3;
    max-width: 100%;
    width: 100%;
    margin: 0;
  }
  .logo h1 { display: none; } /* Ocultar texto del logo para dar espacio */

  /* Hero Section reorganizado */
  .hero-grid {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
    padding-bottom: 10px;
  }
  .hero-main { height: 220px; }
  .hero-side {
    grid-template-columns: 1fr 1fr;
    display: grid;
    height: 120px;
    gap: 10px;
  }
  .hero-overlay h2 { font-size: 1.4rem; }

  /* 🟢 CLAVE: Rejilla de Apps a 2 Columnas */
  .apps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .app-card-banner { aspect-ratio: 16/10; }
  .app-card-content { padding: 10px; gap: 8px; }
  
  /* Miniaturizar elementos internos para que quepan 2 tarjetas */
  .app-icon {
    width: 36px; height: 36px;
    font-size: 1.2rem;
    margin-top: -24px;
    border-radius: 8px;
  }
  .app-info h4 { font-size: 0.85rem; }
  .app-info p { display: none; } /* Ocultar descripciones largas */
  
  .btn-launch {
    padding: 8px;
    font-size: 0.8rem;
    border-radius: 10px;
  }

  /* CLAVE: Tendencias a 2 Columnas */
  .small-apps-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .small-app-item { padding: 8px; gap: 8px; }
  .small-app-icon { width: 36px; height: 36px; font-size: 1.2rem; }
  .small-app-details h4 { font-size: 0.8rem; }
}
```
> *Generado por Antigravity para mantener el conocimiento seguro en Selva Store.*
