# Solución para Error 400: redirect_uri_mismatch

## El Problema

El error `redirect_uri_mismatch` ocurre cuando la URL desde donde se ejecuta la aplicación no está en la lista de "Authorized redirect URIs" en Google Cloud Console.

## Pasos para Solucionarlo

### 1. Verifica la URL exacta de tu aplicación

Abre tu aplicación en el navegador y copia la URL completa de la barra de direcciones. Por ejemplo:
- `https://delgadocovarrubiasluismario.github.io/appinventario/`
- O `https://delgadocovarrubiasluismario.github.io/appinventario` (sin barra final)

### 2. Agrega TODAS las variantes en Google Cloud Console

Ve a: **Google Cloud Console** > **APIs & Services** > **Credentials** > Tu **OAuth 2.0 Client ID**

En **"Authorized redirect URIs"**, agrega TODAS estas variantes:

```
http://localhost
http://localhost/
https://delgadocovarrubiasluismario.github.io
https://delgadocovarrubiasluismario.github.io/
https://delgadocovarrubiasluismario.github.io/appinventario
https://delgadocovarrubiasluismario.github.io/appinventario/
```

### 3. ⚠️ IMPORTANTE: Guarda los cambios

**NO OLVIDES hacer clic en el botón "Guardar" (azul) en la parte inferior de la página.**

### 4. Espera la propagación

Los cambios pueden tardar:
- **Mínimo**: 5 minutos
- **Máximo**: Varias horas (aunque generalmente es menos de 30 minutos)

### 5. Limpia la caché del navegador

Después de esperar, limpia la caché del navegador o prueba en modo incógnito:
- **Chrome/Edge**: `Ctrl + Shift + Delete` o `Ctrl + Shift + N` (modo incógnito)
- **Firefox**: `Ctrl + Shift + Delete` o `Ctrl + Shift + P` (modo privado)

### 6. Prueba de nuevo

Intenta usar el botón "Google Drive" nuevamente.

## Verificación Rápida

Para verificar qué redirect_uri está usando tu aplicación:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network" (Red)
3. Intenta usar Google Drive
4. Busca la solicitud a `accounts.google.com`
5. Revisa los parámetros de la URL - ahí verás el `redirect_uri` que se está enviando
6. Asegúrate de que ese URI exacto esté en tu lista de "Authorized redirect URIs"

## Solución Alternativa Temporal

Si el problema persiste después de varias horas, puedes usar el método manual:

1. Sube tu imagen a Google Drive
2. Compártela como "Cualquiera con el link"
3. Copia el link
4. Pégalo directamente en el campo de foto de la aplicación
5. El sistema lo convertirá automáticamente

## Nota Técnica

Google OAuth usa automáticamente `window.location.origin + window.location.pathname` como redirect_uri. Por eso es importante tener todas las variantes posibles configuradas.

