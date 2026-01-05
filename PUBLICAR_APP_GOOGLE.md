# Cómo Publicar la App en Google Cloud Console (Salir del Modo Prueba)

Para que tu aplicación pueda ser usada por cualquier usuario sin necesidad de agregarlos como "usuarios de prueba", necesitas publicar la app en Google Cloud Console.

## ⚠️ IMPORTANTE ANTES DE PUBLICAR

1. **Verifica que todo funcione correctamente** en modo prueba con tu cuenta
2. **Asegúrate de que las credenciales estén configuradas correctamente**
3. **Ten en cuenta que una vez publicada, cualquier usuario con Google podrá usar la app**

## Pasos para Publicar la App

### 1. Ir a la Pantalla de Consentimiento OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **APIs & Services** > **OAuth consent screen**

### 2. Completar la Información Requerida

Asegúrate de que todos los campos obligatorios estén completos:

#### Información de la aplicación:
- ✅ **Nombre de la aplicación**: "App Inventario" (o el nombre que prefieras)
- ✅ **Email de soporte de usuario**: Tu correo personal
- ✅ **Logo de la aplicación**: (Opcional) Puedes subir tu logo
- ✅ **Dominio de la aplicación**: (Opcional) Puedes dejarlo vacío
- ✅ **Página de inicio**: `https://delgadocovarrubiasluismario.github.io/appinventario`
- ✅ **Política de privacidad**: (Opcional pero recomendado) Puedes crear una página simple
- ✅ **Términos de servicio**: (Opcional pero recomendado)

#### Información de contacto del desarrollador:
- ✅ **Email de contacto**: Tu correo personal
- ✅ Este correo es para que Google te contacte si hay problemas

### 3. Agregar Ámbitos (Scopes)

En la sección "Scopes", asegúrate de tener:
- ✅ `https://www.googleapis.com/auth/drive.readonly` (para leer archivos de Drive)
- ✅ `https://www.googleapis.com/auth/drive.file` (para acceder a archivos seleccionados)

### 4. Agregar Usuarios de Prueba (Temporal)

Antes de publicar, agrega al menos tu email como usuario de prueba para poder probar:
- En "Test users", haz clic en "+ ADD USERS"
- Agrega tu email: `luismariocovarrubias06@gmail.com`
- Guarda los cambios

### 5. Publicar la App

1. En la parte superior de la página de "OAuth consent screen", verás el estado actual (probablemente "Testing")
2. Haz clic en el botón **"PUBLISH APP"** o **"PUBLICAR APLICACIÓN"**
3. Aparecerá una advertencia sobre que la app estará disponible para todos los usuarios de Google
4. Confirma haciendo clic en **"CONFIRM"** o **"CONFIRMAR"**

### 6. Verificación de Google (Puede ser Requerida)

Dependiendo del tipo de app y los permisos que solicites, Google puede requerir una **verificación de seguridad**:

#### Si Google solicita verificación:

1. **Completa el formulario de verificación**:
   - Explica el propósito de tu aplicación
   - Describe cómo usas los datos de Google Drive
   - Indica que es una app interna/privada para un cliente específico

2. **Información útil para el formulario**:
   - **Tipo de app**: "Internal" o "Private" (si es solo para tu cliente)
   - **Propósito**: "Aplicación de inventario para gestión de productos con imágenes almacenadas en Google Drive"
   - **Uso de datos**: "Solo leemos imágenes seleccionadas por el usuario desde su propio Google Drive. No almacenamos ni compartimos datos de Google"

3. **Tiempo de revisión**: Puede tardar desde unos días hasta varias semanas

#### Si NO necesitas verificación:

- Si tu app solo solicita permisos básicos y es para uso interno, Google puede aprobarla automáticamente
- La app estará disponible inmediatamente después de publicarla

### 7. Verificar el Estado

Después de publicar:

1. El estado cambiará de "Testing" a "In production" o "En producción"
2. Ya no necesitarás agregar usuarios de prueba
3. Cualquier usuario con Google podrá usar la app

## ⚠️ Consideraciones Importantes

### Seguridad:
- Una vez publicada, cualquier usuario puede usar la app
- Si quieres restringir el acceso, considera:
  - Usar un dominio verificado
  - Implementar autenticación adicional en tu app
  - Mantener la app en modo prueba y agregar usuarios manualmente

### Límites:
- Apps en producción tienen límites más altos de usuarios
- Apps en prueba están limitadas a 100 usuarios de prueba

### Reversión:
- Si necesitas volver a modo prueba, puedes hacerlo desde la misma página
- Haz clic en "BACK TO TESTING" o "VOLVER A PRUEBA"

## Solución de Problemas

### "App not verified" (App no verificada):
- Esto es normal para apps nuevas
- Los usuarios verán una advertencia pero pueden continuar
- Para eliminar la advertencia, completa el proceso de verificación de Google

### La app sigue pidiendo usuarios de prueba:
- Espera unos minutos después de publicar (los cambios pueden tardar en aplicarse)
- Limpia la caché del navegador
- Verifica que el estado sea "In production"

### Error 403 después de publicar:
- Verifica que hayas guardado todos los cambios
- Asegúrate de que el estado sea "In production"
- Espera unos minutos y vuelve a intentar

## Resumen Rápido

1. ✅ Completa toda la información en OAuth consent screen
2. ✅ Agrega usuarios de prueba temporalmente
3. ✅ Haz clic en "PUBLISH APP"
4. ✅ Confirma la publicación
5. ✅ Espera la verificación si es requerida
6. ✅ Verifica que el estado sea "In production"

¡Listo! Tu app estará disponible para todos los usuarios de Google sin necesidad de agregarlos manualmente.

