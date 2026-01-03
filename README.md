# App Inventario - Demo

Aplicación web de inventario, catálogo y ventas diseñada para funcionar como demo en GitHub Pages.

## Características

### 📦 Inventario
- Agregar productos con foto, código, precio de compra, precio de venta y cantidad
- Vista de tarjetas con toda la información del producto
- Editar y eliminar productos
- Indicadores visuales de cantidad (bajo stock, agotado)

### 🛍️ Catálogo
- Vista en tarjetas con foto y precio de cada producto
- Diseño limpio y fácil de navegar
- Los productos agregados al inventario aparecen automáticamente

### 💰 Ventas
- Registrar ventas con cliente, producto, cantidad y total
- Sistema de cuentas por cobrar
- Agregar abonos a las ventas
- Editar y eliminar ventas
- Visualización del estado de pago (Pagado/Pendiente)
- Lista de abonos por venta

## Cómo usar

1. Abre `index.html` en tu navegador
2. Navega entre las secciones usando las pestañas superiores
3. Los datos se guardan automáticamente en el navegador (localStorage)

## Desplegar en GitHub Pages

1. Crea un repositorio en GitHub
2. Sube estos archivos al repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md` (opcional)
3. Ve a Settings > Pages en tu repositorio
4. Selecciona la rama `main` (o `master`) como fuente
5. Guarda los cambios
6. Tu aplicación estará disponible en: `https://tu-usuario.github.io/nombre-repositorio/`

## Notas

- Los datos se almacenan en el navegador del usuario (localStorage)
- Para usar imágenes, puedes subirlas a un servicio como Imgur o usar URLs de imágenes públicas
- Esta es una aplicación demo, ideal para mostrar funcionalidades a clientes

## Tecnologías

- HTML5
- CSS3 (con gradientes y animaciones)
- JavaScript (Vanilla JS)
- LocalStorage para persistencia de datos

