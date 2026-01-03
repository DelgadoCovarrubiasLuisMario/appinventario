# Configuración de Google Drive

Para usar la funcionalidad de selección de imágenes desde Google Drive, necesitas configurar las credenciales de Google Cloud.

## Pasos para configurar:

### 1. Crear un proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el nombre del proyecto

### 2. Habilitar las APIs necesarias

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca y habilita:
   - **Google Drive API**
   - **Google Picker API**

### 3. Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Si es la primera vez, configura la pantalla de consentimiento OAuth:
   - **Tipo de aplicación**: **External** (para uso personal o de prueba)
   - **Información de la aplicación**:
     - **Nombre de la aplicación**: "App Inventario" o el nombre que prefieras
     - **Email de soporte de usuario**: **Tu correo personal** (el que usas para Google)
     - **Logo de la aplicación**: (Opcional) Puedes subir tu logo si lo tienes
   - **Información de contacto del desarrollador**:
     - **Email de contacto**: **Tu correo personal** (el mismo o uno diferente)
     - Este correo es para que Google te contacte si hay problemas
   - **Dominios autorizados**: (Opcional) Puedes dejarlo vacío para desarrollo local
   - **Agrega tu email como usuario de prueba** en la sección "Test users"
     - ⚠️ **CRÍTICO**: Haz clic en "+ ADD USERS" o "Agregar usuarios"
     - Agrega tu email: `luismariocovarrubias06@gmail.com`
     - Puedes agregar múltiples emails separados por comas
     - **SIN usuarios de prueba, NO podrás usar la app** (Error 403: access_denied)
4. Guarda y continúa con los siguientes pasos
5. Crea el OAuth client ID:
   - Tipo de aplicación: **Web application**
   - Nombre: "App Inventario"
   - **Authorized JavaScript origins** (Orígenes autorizados de JavaScript):
     - `http://localhost` (para desarrollo local)
     - `http://127.0.0.1:5500` (para Live Server de VS Code - **agrega el puerto que uses**)
     - `http://127.0.0.1` (para desarrollo local con IP)
     - `https://delgadocovarrubiasluismario.github.io` (para GitHub Pages - **SIN la ruta `/appinventario`**)
     - ⚠️ **IMPORTANTE**: Solo el dominio base, **NO incluyas rutas** como `/appinventario`
     - ⚠️ **IMPORTANTE**: Si usas Live Server, agrega `http://127.0.0.1:5500` (o el puerto que uses)
     - ✅ Ejemplo correcto: `https://delgadocovarrubiasluismario.github.io`
     - ❌ Ejemplo incorrecto: `https://delgadocovarrubiasluismario.github.io/appinventario`
   - **Authorized redirect URIs** (URI de redirección autorizados):
     - `http://localhost` (para desarrollo local)
     - `http://localhost/` (con barra final)
     - `http://127.0.0.1:5500` (para Live Server - **agrega el puerto que uses**)
     - `http://127.0.0.1:5500/` (con barra final)
     - `https://delgadocovarrubiasluismario.github.io` (dominio base)
     - `https://delgadocovarrubiasluismario.github.io/` (dominio base con barra)
     - `https://delgadocovarrubiasluismario.github.io/appinventario` (con la ruta completa de tu app)
     - `https://delgadocovarrubiasluismario.github.io/appinventario/` (con barra final también)
     - ⚠️ **IMPORTANTE**: Los redirect URIs SÍ pueden tener rutas, a diferencia de los JavaScript origins
     - ⚠️ **CRÍTICO**: Agrega TODAS las variantes (con y sin barra final) para evitar errores
     - ⚠️ **IMPORTANTE**: Después de agregar los URIs, haz clic en **"Guardar"** (botón azul abajo)
     - ⚠️ **ESPERA**: Los cambios pueden tardar 5 minutos a varias horas en aplicarse
5. Copia el **Client ID** que se genera

### 4. Crear API Key

1. En **Credentials**, haz clic en **+ CREATE CREDENTIALS** > **API key**
2. Copia la **API Key** generada
3. (Opcional) Restringe la API Key a solo Google Drive API y Google Picker API para mayor seguridad

### 5. Configurar en la aplicación

1. Abre el archivo `app.js`
2. Busca las líneas:
   ```javascript
   const GOOGLE_API_KEY = 'YOUR_API_KEY';
   const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID';
   ```
3. Reemplaza `YOUR_API_KEY` con tu API Key
4. Reemplaza `YOUR_CLIENT_ID` con tu Client ID

### 6. Compartir archivos en Google Drive

⚠️ **IMPORTANTE**: Para que las imágenes se vean correctamente, DEBES compartirlas:

1. Ve a Google Drive y encuentra tu imagen
2. Haz clic derecho en el archivo > **Compartir** (o haz clic en el icono de compartir)
3. En "Obtener enlace", cambia el acceso a **"Cualquiera con el link"**
4. Haz clic en **"Listo"** o **"Done"**
5. **NO es necesario copiar el link** - si usas el botón "Google Drive" en la app, se compartirá automáticamente

**Si la imagen no se ve:**
- Verifica que el archivo esté compartido como "Cualquiera con el link"
- Asegúrate de que el archivo no esté en una carpeta compartida con restricciones
- Prueba abriendo el link directo en una nueva pestaña para verificar que funciona

## Nota importante

- Las credenciales son sensibles. **NO subas** el archivo `app.js` con las credenciales reales a un repositorio público.
- Para GitHub Pages, considera usar variables de entorno o un servicio de backend para manejar las credenciales de forma segura.

## Método alternativo (sin configuración)

Si no quieres configurar las APIs, puedes:
1. Subir la imagen a Google Drive
2. Compartirla como "Cualquiera con el link"
3. Copiar el link y pegarlo en el campo de foto
4. El sistema intentará convertirlo automáticamente

