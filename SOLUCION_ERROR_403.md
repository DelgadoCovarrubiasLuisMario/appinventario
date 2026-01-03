# Solución para Error 403: access_denied

## El Problema

El error **403: access_denied** con el mensaje "appinventario no completó el proceso de verificación de Google" significa que tu aplicación está en **modo de prueba** y solo los usuarios de prueba pueden acceder.

## Solución Rápida: Agregar Usuarios de Prueba

### Pasos:

1. Ve a **Google Cloud Console**: https://console.cloud.google.com/

2. Navega a: **APIs & Services** > **OAuth consent screen** (Pantalla de consentimiento OAuth)

3. Desplázate hasta la sección **"Test users"** (Usuarios de prueba)

4. Haz clic en **"+ ADD USERS"** o **"Agregar usuarios"**

5. Agrega tu email:
   - `luismariocovarrubias06@gmail.com`
   - Puedes agregar múltiples emails separados por comas
   - Ejemplo: `email1@gmail.com, email2@gmail.com`

6. Haz clic en **"ADD"** o **"Agregar"**

7. **Guarda los cambios**

8. Espera 1-2 minutos y prueba de nuevo

## ¿Por qué pasa esto?

Cuando creas una aplicación OAuth en Google Cloud Console:
- Por defecto está en **modo "Testing"** (Prueba)
- Solo los usuarios agregados como "Test users" pueden acceder
- Esto es una medida de seguridad de Google

## Solución Permanente: Publicar la App (Opcional)

Si quieres que cualquier usuario pueda usar tu app sin agregarlos manualmente:

1. Ve a **OAuth consent screen**
2. En la parte superior, verás **"Publishing status"** (Estado de publicación)
3. Haz clic en **"PUBLISH APP"** (Publicar app)
4. ⚠️ **ADVERTENCIA**: Esto requiere completar el proceso de verificación de Google, que puede tomar varios días y requiere:
   - Información de privacidad
   - Términos de servicio
   - Verificación de dominio
   - Revisión de Google

**Para una demo o uso personal, es más fácil usar "Test users"**

## Verificación

Después de agregar tu email como usuario de prueba:
1. Cierra todas las ventanas del navegador relacionadas con Google
2. Limpia la caché o usa modo incógnito
3. Intenta usar Google Drive en tu app nuevamente
4. Deberías ver la pantalla de consentimiento y poder autorizar el acceso

