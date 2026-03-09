# 🚀 Guía de Despliegue - Selva Store

Para subir los cambios de la tienda al repositorio de GitHub (`iconoservices/SelvaStore`), sigue estos pasos de forma ordenada.

### 📋 Prerrequisitos
* Tener instalado [Git](https://git-scm.com/).
* Acceso al repositorio en GitHub.

---

### 🛠️ Operación Manual (Terminal)

Si prefieres usar la consola, ejecuta estos comandos en la carpeta del proyecto:

1. **Guardar cambios locales:**
   ```bash
   git add .
   git commit -m "feat: mejoras estéticas y ajuste de banner para laptop"
   ```

2. **Subir al servidor (GitHub):**
   ```bash
   git push origin main
   ```

---

### 🎨 Operación Visual (GitHub Desktop) - *Recomendado*

Si usas la aplicación de escritorio de GitHub:

1. Abre **GitHub Desktop**.
2. Asegúrate de que la carpeta `SelvaAPP` esté seleccionada.
3. En el panel izquierdo, verás los archivos modificados. Escribe un título (ej: "Ajuste de Banner") y dale al botón azul **"Commit to main"**.
4. Dale al botón de arriba que dice **"Push origin"**.

---

### ⚠️ Notas Importantes
* **CORS**: Si agregas nuevas apps, asegúrate de que sus servidores tengan configurado el acceso CORS o usa el proxy integrado en `App.jsx`.
* **Imágenes**: Usa URLs de Unsplash con parámetros de optimización para mantener la fluidez (`auto=format&fit=crop&q=80&w=800`).

---
*Generado por Antigravity 🌿*
