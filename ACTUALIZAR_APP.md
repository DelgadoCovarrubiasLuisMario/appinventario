# Guía para Actualizar la App

## Para el Desarrollador: Subir Cambios a GitHub

### Paso 1: Verificar cambios
```bash
git status
```

### Paso 2: Agregar archivos modificados
```bash
git add app.js index.html sw.js
```

### Paso 3: Hacer commit
```bash
git commit -m "Agregar múltiples productos por venta, ocultar productos agotados del catálogo, y reorganizar layout del PDF"
```

### Paso 4: Subir a GitHub
```bash
git push origin main
```

### Paso 5: Verificar en GitHub Pages
- Ve a: https://delgadocovarrubiasluismario.github.io/appinventario/
- Verifica que los cambios se vean correctamente
- Puede tardar 1-2 minutos en actualizarse

---

## Para el Cliente: Actualizar la App en Android

### Opción 1: Actualización Automática (Recomendada)

1. **Cerrar completamente la app:**
   - Abre el menú de aplicaciones recientes (botón cuadrado o deslizar desde abajo)
   - Desliza la app hacia arriba para cerrarla completamente

2. **Esperar unos minutos** (2-5 minutos después de que subas los cambios a GitHub)

3. **Abrir la app de nuevo:**
   - La app debería actualizarse automáticamente
   - Si no se actualiza, sigue con la Opción 2

### Opción 2: Actualización Manual

1. **Abrir Chrome** (no la PWA, sino el navegador Chrome normal)

2. **Ir a la página de la app:**
   - Abre Chrome
   - Ve a: https://delgadocovarrubiasluismario.github.io/appinventario/

3. **Forzar actualización:**
   - Toca el menú de Chrome (⋮) en la esquina superior derecha
   - Selecciona "Actualizar" o "Recargar"
   - O mantén presionado el botón de recargar y selecciona "Recargar sin caché"

4. **Si aún no se actualiza:**
   - Mantén presionado el ícono de la app en el menú de aplicaciones
   - Selecciona "Eliminar" o "Desinstalar"
   - Vuelve a Chrome y ve a la página de la app
   - Instala la app de nuevo (menú de Chrome → "Instalar app" o "Añadir a pantalla de inicio")

### Opción 3: Limpiar Caché (Solo si nada más funciona)

1. **Abrir Chrome**

2. **Ir a Configuración:**
   - Menú de Chrome (⋮) → Configuración
   - Privacidad y seguridad → Borrar datos de navegación

3. **Seleccionar:**
   - ✅ Imágenes y archivos en caché
   - Período: "Última hora" o "Todo el tiempo"

4. **Borrar datos**

5. **Cerrar Chrome completamente**

6. **Abrir la app de nuevo**

---

## Cambios Incluidos en esta Actualización

✅ **Múltiples productos por venta:**
   - Ahora puedes agregar varios productos en una sola venta
   - Botón "+ Agregar Producto" para agregar más productos
   - Cada producto tiene su propia cantidad y tipo de venta

✅ **Productos agotados ocultos:**
   - Los productos con cantidad = 0 desaparecen del catálogo
   - Siguen visibles en el inventario para control
   - El PDF del catálogo también oculta productos agotados

✅ **Nuevo diseño del PDF:**
   - Imagen del producto a la izquierda (mitad de la tarjeta)
   - Información (código, precios, comentarios) a la derecha
   - Mejor uso del espacio

✅ **Correcciones:**
   - Cálculo correcto de totales con múltiples productos
   - Formato de números con comas para números grandes

---

## Notas Importantes

⚠️ **Los datos NO se pierden** al actualizar la app. Todos los productos, ventas y abonos se mantienen.

⚠️ Si el cliente tiene problemas para actualizar, puede:
   - Esperar 24 horas (la app se actualizará automáticamente)
   - Seguir la Opción 3 (limpiar caché)
   - Contactarte para ayuda

⚠️ Después de actualizar, es recomendable:
   - Probar agregar una venta con múltiples productos
   - Verificar que los productos agotados no aparezcan en el catálogo
   - Revisar el PDF del catálogo para ver el nuevo diseño

