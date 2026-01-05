// Datos almacenados en localStorage
// Actualizado: función updateSaleTotal agregada
const STORAGE_KEYS = {
    PRODUCTOS: 'inventario_productos',
    VENTAS: 'inventario_ventas',
    ABONOS: 'inventario_abonos'
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    registerServiceWorker();
});

// Registrar Service Worker para PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Intentar registrar con ruta relativa primero (para desarrollo local)
            const swPath = window.location.pathname.includes('/appinventario/') 
                ? '/appinventario/sw.js' 
                : './sw.js';
            
            navigator.serviceWorker.register(swPath)
                .then((registration) => {
                    console.log('✅ Service Worker registrado:', registration.scope);
                })
                .catch((error) => {
                    console.log('⚠️ Error registrando Service Worker:', error);
                    // Intentar con ruta alternativa
                    if (swPath !== './sw.js') {
                        navigator.serviceWorker.register('./sw.js')
                            .then((reg) => console.log('✅ Service Worker registrado (alternativo):', reg.scope))
                            .catch((err) => console.log('❌ Error en registro alternativo:', err));
                    }
                });
        });
    }
}

function initializeApp() {
    // Configurar navegación de tabs
    setupTabs();
    
    // Cargar datos
    loadInventario();
    loadCatalogo();
    loadVentas();
    
    // Configurar fecha por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleFecha').value = today;
    document.getElementById('abonoFecha').value = today;
    
    // Cargar productos en select de ventas
    updateProductSelects();
}

// Navegación entre secciones
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.section');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.getAttribute('data-section');
            
            // Remover active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Agregar active al seleccionado
            btn.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
            
            // Recargar datos de la sección
            if (targetSection === 'inventario') {
                loadInventario();
            } else if (targetSection === 'catalogo') {
                loadCatalogo();
            } else if (targetSection === 'venta') {
                loadVentas();
            }
        });
    });
}

// ========== INVENTARIO ==========

function loadInventario() {
    const productos = getProductos();
    const grid = document.getElementById('inventarioGrid');
    
    if (productos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay productos en el inventario. Agrega uno para comenzar.</p>';
        return;
    }
    
    grid.innerHTML = productos.map(producto => `
        <div class="product-card">
            <img src="${convertImageUrl(producto.foto) || 'https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Sin+Imagen'}" 
                 alt="${producto.codigo}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Sin+Imagen';"
                 style="background: #FFE4E9; display: block;"
                 referrerpolicy="no-referrer">
            <div class="product-info">
                <h3>${producto.codigo}</h3>
                <div class="product-detail">
                    <label>Cantidad:</label>
                    <span class="cantidad-badge ${getCantidadClass(producto.cantidad)}">${producto.cantidad}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Venta:</label>
                    <span>$${parseFloat(producto.precioNormal || 0).toFixed(2)}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Contado:</label>
                    <span>$${parseFloat(producto.precioContado || 0).toFixed(2)}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Mayoreo:</label>
                    <span>$${parseFloat(producto.precioMayoreo || 0).toFixed(2)}</span>
                </div>
                ${producto.comentarios ? `
                <div class="product-comentarios">
                    <label>Especificaciones:</label>
                    <p>${producto.comentarios}</p>
                </div>
                ` : ''}
                <div class="product-actions">
                    <button class="btn btn-warning" onclick="editProduct('${producto.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${producto.id}')">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getCantidadClass(cantidad) {
    if (cantidad <= 3) return 'cantidad-baja'; // Rojo
    if (cantidad >= 4 && cantidad <= 8) return 'cantidad-media'; // Amarillo
    return 'cantidad-alta'; // Rosa (9 o más)
}

function openAddProductModal() {
    document.getElementById('addProductForm').reset();
    document.getElementById('addProductModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function addProduct(event) {
    event.preventDefault();
    
    const producto = {
        id: generateId(),
        foto: document.getElementById('productFoto').value,
        categoria: document.getElementById('productCategoria').value,
        codigo: document.getElementById('productCodigo').value,
        precioNormal: parseFloat(document.getElementById('productPrecioNormal').value),
        precioContado: parseFloat(document.getElementById('productPrecioContado').value),
        precioMayoreo: parseFloat(document.getElementById('productPrecioMayoreo').value),
        cantidad: parseInt(document.getElementById('productCantidad').value),
        comentarios: document.getElementById('productComentarios').value || '',
        fechaCreacion: new Date().toISOString()
    };
    
    const productos = getProductos();
    productos.push(producto);
    saveProductos(productos);
    
    closeModal('addProductModal');
    loadInventario();
    loadCatalogo();
    updateProductSelects();
    
    showNotification('Producto agregado exitosamente');
}

function editProduct(id) {
    const productos = getProductos();
    const producto = productos.find(p => p.id === id);
    
    if (!producto) return;
    
    document.getElementById('editProductId').value = producto.id;
    document.getElementById('editProductFoto').value = producto.foto;
    document.getElementById('editProductCategoria').value = producto.categoria || '';
    document.getElementById('editProductCodigo').value = producto.codigo;
    document.getElementById('editProductPrecioNormal').value = producto.precioNormal || producto.precioVenta || 0;
    document.getElementById('editProductPrecioContado').value = producto.precioContado || 0;
    document.getElementById('editProductPrecioMayoreo').value = producto.precioMayoreo || producto.precioCompra || 0;
    document.getElementById('editProductCantidad').value = producto.cantidad;
    document.getElementById('editProductComentarios').value = producto.comentarios || '';
    
    document.getElementById('editProductModal').classList.add('active');
}

function updateProduct(event) {
    event.preventDefault();
    
    const id = document.getElementById('editProductId').value;
    const productos = getProductos();
    const index = productos.findIndex(p => p.id === id);
    
    if (index === -1) return;
    
    productos[index] = {
        ...productos[index],
        foto: document.getElementById('editProductFoto').value,
        categoria: document.getElementById('editProductCategoria').value,
        codigo: document.getElementById('editProductCodigo').value,
        precioNormal: parseFloat(document.getElementById('editProductPrecioNormal').value),
        precioContado: parseFloat(document.getElementById('editProductPrecioContado').value),
        precioMayoreo: parseFloat(document.getElementById('editProductPrecioMayoreo').value),
        cantidad: parseInt(document.getElementById('editProductCantidad').value),
        comentarios: document.getElementById('editProductComentarios').value || ''
    };
    
    saveProductos(productos);
    closeModal('editProductModal');
    loadInventario();
    loadCatalogo();
    updateProductSelects();
    
    showNotification('Producto actualizado exitosamente');
}

function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const productos = getProductos();
    const filtered = productos.filter(p => p.id !== id);
    saveProductos(filtered);
    
    loadInventario();
    loadCatalogo();
    updateProductSelects();
    
    showNotification('Producto eliminado');
}

// ========== CATÁLOGO ==========

let categoriaFiltroActual = 'todos';

function filterCatalogo(categoria) {
    categoriaFiltroActual = categoria;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.categoria === categoria) {
            btn.classList.add('active');
        }
    });
    
    loadCatalogo();
}

function loadCatalogo() {
    const productos = getProductos();
    const grid = document.getElementById('catalogoGrid');
    const filtersContainer = document.querySelector('.catalogo-filters');
    
    if (productos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay productos en el catálogo.</p>';
        return;
    }
    
    // Generar botones de filtro dinámicamente basados en las categorías existentes
    const categoriasUnicas = [...new Set(productos.map(p => p.categoria || 'Sin categoría').filter(c => c))];
    categoriasUnicas.sort();
    
    if (filtersContainer) {
        let filtersHTML = '<button class="filter-btn active" data-categoria="todos" onclick="filterCatalogo(\'todos\')">Todos</button>';
        categoriasUnicas.forEach(categoria => {
            const isActive = categoriaFiltroActual === categoria ? 'active' : '';
            filtersHTML += `<button class="filter-btn ${isActive}" data-categoria="${categoria}" onclick="filterCatalogo('${categoria}')">${categoria}</button>`;
        });
        filtersContainer.innerHTML = filtersHTML;
    }
    
    // Filtrar productos por categoría si hay filtro activo
    let productosFiltrados = productos;
    if (categoriaFiltroActual !== 'todos') {
        productosFiltrados = productos.filter(p => (p.categoria || 'Sin categoría') === categoriaFiltroActual);
    }
    
    if (productosFiltrados.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #666; padding: 40px;">No hay productos en la categoría seleccionada.</p>`;
        return;
    }
    
    // Si no hay filtro, agrupar por categoría dinámicamente
    if (categoriaFiltroActual === 'todos') {
        // Obtener todas las categorías únicas de los productos
        const categoriasUnicas = [...new Set(productos.map(p => p.categoria || 'Sin categoría').filter(c => c))];
        categoriasUnicas.sort(); // Ordenar alfabéticamente
        
        let html = '';
        
        categoriasUnicas.forEach(categoria => {
            const productosCategoria = productos.filter(p => (p.categoria || 'Sin categoría') === categoria);
            
            if (productosCategoria.length > 0) {
                html += `<div class="categoria-section">
                    <h3 class="categoria-title">${categoria}</h3>
                    <div class="catalogo-grid-section">
                        ${productosCategoria.map(producto => `
                            <div class="catalogo-card">
                                <img src="${convertImageUrl(producto.foto) || 'https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Sin+Imagen'}" 
                                     alt="${producto.codigo}" 
                                     class="catalogo-image"
                                     loading="lazy"
                                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Sin+Imagen';"
                                     style="background: #FFE4E9; display: block;"
                                     referrerpolicy="no-referrer">
                                <div class="catalogo-info">
                                    <div class="codigo">${producto.codigo}</div>
                                    <div class="precio-normal">Venta: $${parseFloat(producto.precioNormal || producto.precioVenta || 0).toFixed(2)}</div>
                                    <div class="precio-contado">Contado: $${parseFloat(producto.precioContado || 0).toFixed(2)}</div>
                                    ${producto.comentarios ? `
                                    <div class="comentarios-catalogo">${producto.comentarios}</div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }
        });
        
        grid.innerHTML = html;
    } else {
        // Mostrar productos filtrados sin agrupar
        grid.innerHTML = productosFiltrados.map(producto => `
            <div class="catalogo-card">
                <img src="${convertImageUrl(producto.foto) || 'https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Sin+Imagen'}" 
                     alt="${producto.codigo}" 
                     class="catalogo-image"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/FFB6C1/FFFFFF?text=Sin+Imagen';"
                     style="background: #FFE4E9; display: block;"
                     referrerpolicy="no-referrer">
                <div class="catalogo-info">
                    <div class="codigo">${producto.codigo}</div>
                    <div class="precio-normal">Normal: $${parseFloat(producto.precioNormal || producto.precioVenta || 0).toFixed(2)}</div>
                    <div class="precio-contado">Contado: $${parseFloat(producto.precioContado || 0).toFixed(2)}</div>
                    ${producto.comentarios ? `
                    <div class="comentarios-catalogo">${producto.comentarios}</div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
}

async function exportCatalogoToPDF() {
    const productos = getProductos();
    
    if (productos.length === 0) {
        showNotification('No hay productos en el catálogo para exportar');
        return;
    }
    
    showNotification('Generando PDF del catálogo...');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // ========== VARIABLES PARA AJUSTAR EL ACOMODO DEL PDF ==========
        // Edita estas variables para cambiar el diseño del PDF:
        const margin = 12; // Márgenes de la página (en mm)
        const cardWidth = (pageWidth - 3 * margin) / 2; // Ancho de cada tarjeta (2 columnas)
        const cardHeight = 55; // Altura de cada tarjeta de producto (en mm)
        const imgHeight = 30; // Altura de las imágenes dentro de las tarjetas (en mm)
        const imgPadding = 4; // Espacio interno alrededor de las imágenes (en mm)
        // ================================================================
        
        let x = margin; // Posición horizontal inicial
        let y = margin; // Posición vertical inicial
        
        // ========== LOGO DEL PDF ==========
        // Para cambiar el tamaño del logo, edita: logoWidth (línea ~276)
        // Para cambiar el espacio después del logo, edita: y += logoHeight + 5 (línea ~280)
        try {
            await new Promise((resolve, reject) => {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                logoImg.onload = () => {
                    try {
                        const logoWidth = 40; // Ancho del logo en mm - EDITA AQUÍ para cambiar tamaño
                        const logoHeight = (logoImg.height / logoImg.width) * logoWidth; // Mantener proporción
                        const logoX = (pageWidth - logoWidth) / 2; // Centrado
                        doc.addImage(logoImg, 'JPEG', logoX, y, logoWidth, logoHeight);
                        y += logoHeight + 10; // Espacio después del logo - EDITA AQUÍ para cambiar espaciado
                        resolve();
                    } catch (error) {
                        console.error('Error agregando logo al PDF:', error);
                        y += 10;
                        resolve();
                    }
                };
                logoImg.onerror = () => {
                    console.log('Logo no encontrado, continuando sin logo');
                    y += 10;
                    resolve();
                };
                logoImg.src = 'Logo.jpeg';
            });
        } catch (error) {
            console.error('Error cargando logo:', error);
            y += 10;
        }
        
        // ========== TÍTULO Y ENCABEZADO ==========
        // Para cambiar el tamaño del título, edita: setFontSize(20) (línea ~301)
        // Para cambiar el color del título, edita: setTextColor(255, 105, 180) (línea ~303)
        // Para cambiar el texto del título, edita: 'Catálogo de Productos' (línea ~304)
        doc.setFontSize(20); // Tamaño del título - EDITA AQUÍ
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 105, 180); // Color rosa - EDITA AQUÍ (RGB)
        doc.text('Catálogo de Productos', pageWidth / 2, y, { align: 'center' }); // Texto del título - EDITA AQUÍ
        y += 6; // Espacio después del título - EDITA AQUÍ
        
        // Línea decorativa bajo el título
        doc.setDrawColor(255, 182, 193); // Color de la línea - EDITA AQUÍ (RGB)
        doc.setLineWidth(0.8); // Grosor de la línea - EDITA AQUÍ
        doc.line(pageWidth / 2 - 35, y, pageWidth / 2 + 35, y); // Longitud de la línea - EDITA AQUÍ (35mm a cada lado)
        y += 4; // Espacio después de la línea - EDITA AQUÍ
        
        // Fecha
        doc.setFontSize(8); // Tamaño de la fecha - EDITA AQUÍ
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150); // Color de la fecha - EDITA AQUÍ (RGB)
        const fecha = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fecha}`, pageWidth / 2, y, { align: 'center' });
        
        y += 8; // Espacio antes de los productos - EDITA AQUÍ
        
        // Agrupar productos por categoría
        const categoriasUnicas = [...new Set(productos.map(p => p.categoria || 'Sin categoría').filter(c => c))];
        categoriasUnicas.sort(); // Ordenar alfabéticamente
        
        // Procesar cada categoría
        for (let catIndex = 0; catIndex < categoriasUnicas.length; catIndex++) {
            const categoria = categoriasUnicas[catIndex];
            const productosCategoria = productos.filter(p => (p.categoria || 'Sin categoría') === categoria);
            
            // Verificar si necesitamos una nueva página para el título de la categoría
            if (y + 20 > pageHeight - margin) {
                doc.addPage();
                y = margin;
                x = margin;
            }
            
            // Título de la categoría
            doc.setFontSize(16); // Tamaño del título de categoría
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 105, 180); // Color rosa
            doc.text(categoria, pageWidth / 2, y, { align: 'center' });
            y += 6; // Espacio después del título
            
            // Línea decorativa bajo el título de categoría
            doc.setDrawColor(255, 182, 193);
            doc.setLineWidth(0.8);
            doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y);
            y += 6; // Espacio después de la línea
            
            // Resetear posición horizontal para las tarjetas
            x = margin;
            
            // Procesar cada producto de esta categoría
            for (let i = 0; i < productosCategoria.length; i++) {
                const producto = productosCategoria[i];
                
                // Verificar si necesitamos una nueva página
                if (y + cardHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                    x = margin;
                }
                
                // Dibujar borde de la tarjeta con mejor diseño
                doc.setDrawColor(255, 182, 193); // Rosa pastel
                doc.setLineWidth(0.3);
                
                // Fondo sutil de la tarjeta
                doc.setFillColor(255, 250, 250);
                doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
                doc.setDrawColor(255, 182, 193);
                doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3);
                
                // Área fija para la imagen (siempre el mismo tamaño)
                const imgAreaY = y + imgPadding;
                const imgAreaHeight = imgHeight;
                const imgAreaWidth = cardWidth - (imgPadding * 2);
                
                // Cargar y agregar imagen
                try {
                    const imgUrl = convertImageUrl(producto.foto);
                    if (!imgUrl || (!imgUrl.includes('drive.google.com') && !imgUrl.includes('http'))) {
                        // Si no hay imagen válida, dibujar placeholder con tamaño fijo
                        const placeholderWidth = cardWidth - (imgPadding * 2);
                        const placeholderHeight = imgHeight;
                        const placeholderX = x + imgPadding;
                        const placeholderY = y + imgPadding;
                        
                        doc.setFillColor(255, 240, 245);
                        doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2, 'F');
                        doc.setDrawColor(255, 200, 220);
                        doc.setLineWidth(0.5);
                        doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2);
                        doc.setFontSize(7);
                        doc.setTextColor(200, 180, 190);
                        doc.text('Sin imagen', x + cardWidth / 2, placeholderY + (placeholderHeight / 2), { align: 'center' });
                    } else {
                        // convertImageUrl ya devuelve el proxy de weserv.nl para evitar problemas de CORS
                        // Esto funciona tanto en navegador normal como en PWA instalada
                        let finalImgUrl = imgUrl;
                        
                        // Si la URL ya viene con el proxy de weserv.nl, usarla directamente
                        // Si no, intentar extraer el fileId y construir el proxy
                        if (!imgUrl.includes('images.weserv.nl') && imgUrl.includes('drive.google.com')) {
                            const fileIdMatch = imgUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                            if (fileIdMatch) {
                                const fileId = fileIdMatch[1];
                                // Usar proxy de imágenes que maneja CORS (necesario para GitHub Pages y PWA)
                                finalImgUrl = `https://images.weserv.nl/?url=https://drive.google.com/thumbnail?id=${fileId}&sz=w1000&output=jpg`;
                            }
                        }
                        
                        const img = new Image();
                        
                        await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            // Timeout después de 10 segundos
                            console.warn('Timeout cargando imagen:', finalImgUrl);
                            // Placeholder con tamaño fijo igual al área de imagen
                            const placeholderWidth = cardWidth - (imgPadding * 2);
                            const placeholderHeight = imgHeight;
                            const placeholderX = x + imgPadding;
                            const placeholderY = y + imgPadding;
                            
                            doc.setFillColor(255, 240, 245);
                            doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2, 'F');
                            doc.setDrawColor(255, 200, 220);
                            doc.setLineWidth(0.5);
                            doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2);
                            doc.setFontSize(7);
                            doc.setTextColor(200, 180, 190);
                            doc.text('Sin imagen', x + cardWidth / 2, placeholderY + (placeholderHeight / 2), { align: 'center' });
                            resolve();
                        }, 10000);
                        
                        img.onload = () => {
                            clearTimeout(timeout);
                            try {
                                // Calcular dimensiones para el PDF - tamaño fijo
                                const imgAreaWidth = cardWidth - (imgPadding * 2);
                                const imgAreaHeight = imgHeight;
                                
                                // Calcular dimensiones manteniendo proporción pero ajustando al área fija
                                const imgAspectRatio = img.width / img.height;
                                const areaAspectRatio = imgAreaWidth / imgAreaHeight;
                                
                                let finalImgWidth, finalImgHeight;
                                
                                if (imgAspectRatio > areaAspectRatio) {
                                    // Imagen más ancha - ajustar al ancho
                                    finalImgWidth = imgAreaWidth;
                                    finalImgHeight = imgAreaWidth / imgAspectRatio;
                                } else {
                                    // Imagen más alta - ajustar al alto
                                    finalImgHeight = imgAreaHeight;
                                    finalImgWidth = imgAreaHeight * imgAspectRatio;
                                }
                                
                                // Centrar la imagen en el área
                                const imgX = x + imgPadding + (imgAreaWidth - finalImgWidth) / 2;
                                const imgY = y + imgPadding + (imgAreaHeight - finalImgHeight) / 2;
                                
                                // Agregar imagen directamente al PDF (jsPDF puede manejar URLs con proxy)
                                // Si el proxy funciona, podemos usar la URL directamente
                                // Si no, intentamos con el objeto Image
                                try {
                                    doc.addImage(img, 'JPEG', imgX, imgY, finalImgWidth, finalImgHeight);
                                    console.log('✅ Imagen agregada al PDF:', producto.codigo);
                                } catch (e) {
                                    // Si falla, intentar con canvas pero con crossOrigin
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    ctx.drawImage(img, 0, 0);
                                    const imgData = canvas.toDataURL('image/jpeg', 0.8);
                                    doc.addImage(imgData, 'JPEG', imgX, imgY, finalImgWidth, finalImgHeight);
                                    console.log('✅ Imagen agregada al PDF (canvas):', producto.codigo);
                                }
                            } catch (e) {
                                console.error('Error agregando imagen al PDF:', e);
                                // Placeholder con tamaño fijo
                                const placeholderWidth = cardWidth - (imgPadding * 2);
                                const placeholderHeight = imgHeight;
                                const placeholderX = x + imgPadding;
                                const placeholderY = y + imgPadding;
                                
                                doc.setFillColor(255, 240, 245);
                                doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2, 'F');
                                doc.setDrawColor(255, 200, 220);
                                doc.setLineWidth(0.5);
                                doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2);
                                doc.setFontSize(7);
                                doc.setTextColor(200, 180, 190);
                                doc.text('Error', x + cardWidth / 2, placeholderY + (placeholderHeight / 2), { align: 'center' });
                            }
                            resolve();
                        };
                        
                        img.onerror = (error) => {
                            clearTimeout(timeout);
                            console.error('Error cargando imagen:', finalImgUrl, error);
                            // Si la imagen falla, dibujar un placeholder con tamaño fijo
                            const placeholderWidth = cardWidth - (imgPadding * 2);
                            const placeholderHeight = imgHeight;
                            const placeholderX = x + imgPadding;
                            const placeholderY = y + imgPadding;
                            
                            doc.setFillColor(255, 240, 245);
                            doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2, 'F');
                            doc.setDrawColor(255, 200, 220);
                            doc.setLineWidth(0.5);
                            doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2);
                            doc.setFontSize(7);
                            doc.setTextColor(200, 180, 190);
                            doc.text('Sin imagen', x + cardWidth / 2, placeholderY + (placeholderHeight / 2), { align: 'center' });
                            resolve();
                        };
                        
                        // Configurar crossOrigin para permitir CORS (necesario para proxy)
                        img.crossOrigin = 'anonymous';
                        
                            img.src = finalImgUrl;
                        });
                    }
                } catch (error) {
                    console.error('Error cargando imagen:', error);
                    // Dibujar placeholder en caso de error con tamaño fijo
                    const placeholderWidth = cardWidth - (imgPadding * 2);
                    const placeholderHeight = imgHeight;
                    const placeholderX = x + imgPadding;
                    const placeholderY = y + imgPadding;
                    
                    doc.setFillColor(255, 240, 245);
                    doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2, 'F');
                    doc.setDrawColor(255, 200, 220);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2);
                    doc.setFontSize(7);
                    doc.setTextColor(200, 180, 190);
                    doc.text('Error', x + cardWidth / 2, placeholderY + (placeholderHeight / 2), { align: 'center' });
                }
                
                // Código del producto - posición fija después del área de imagen
                const codeY = y + imgPadding + imgHeight + 8; // 4mm después del área de imagen (reducido)
                doc.setFontSize(7); // Reducido
                doc.setTextColor(120, 120, 120);
                doc.setFont(undefined, 'normal');
                doc.text(producto.codigo, x + cardWidth / 2, codeY, { align: 'center' });
                
                // Precios - posición fija después del código
                const priceY = codeY + 6; // Espacio después del código
                doc.setFontSize(11); // Tamaño para precio venta
                doc.setTextColor(255, 105, 180); // Rosa
                doc.setFont(undefined, 'bold');
                const precioNormal = producto.precioNormal || producto.precioVenta || 0;
                doc.text(`Venta: $${parseFloat(precioNormal).toFixed(2)}`, x + cardWidth / 2, priceY, { align: 'center' });
                
                const priceContadoY = priceY + 5; // Espacio para precio contado
                doc.setFontSize(10); // Tamaño ligeramente menor
                doc.setTextColor(255, 145, 164); // Rosa más claro
                doc.setFont(undefined, 'normal');
                const precioContado = producto.precioContado || 0;
                doc.text(`Contado: $${parseFloat(precioContado).toFixed(2)}`, x + cardWidth / 2, priceContadoY, { align: 'center' });
                
                // Agregar comentarios si existen (estilo elegante)
                if (producto.comentarios && producto.comentarios.trim()) {
                    const comentariosY = priceContadoY + 6; // Espacio después del precio contado
                    
                    // Línea decorativa sutil antes de los comentarios
                    doc.setDrawColor(255, 200, 220); // Rosa muy claro
                    doc.setLineWidth(0.2);
                    const lineY = comentariosY - 2;
                    doc.line(x + cardWidth / 2 - 15, lineY, x + cardWidth / 2 + 15, lineY);
                    
                    // Comentarios con estilo elegante
                    doc.setFontSize(7); // Tamaño ligeramente mayor
                    doc.setTextColor(140, 120, 130); // Gris rosa elegante
                    doc.setFont(undefined, 'italic'); // Itálica para elegancia
                    
                    // Dividir comentarios en líneas si son muy largos
                    const maxWidth = cardWidth - (imgPadding * 2) - 4; // Margen adicional
                    const comentarios = doc.splitTextToSize(producto.comentarios.trim(), maxWidth);
                    let currentY = comentariosY + 2; // Espacio después de la línea decorativa
                    
                    comentarios.forEach((line, idx) => {
                        if (idx < 2) { // Máximo 2 líneas de comentarios
                            doc.text(line, x + cardWidth / 2, currentY, { align: 'center', maxWidth: maxWidth });
                            currentY += 3.5; // Espaciado más generoso
                        }
                    });
                    
                    // Restaurar fuente normal
                    doc.setFont(undefined, 'normal');
                }
                
                doc.setFont(undefined, 'normal');
                
                // Mover a la siguiente posición
                x += cardWidth + margin;
                if (x + cardWidth > pageWidth - margin) {
                    x = margin;
                    y += cardHeight + margin;
                }
            }
            
            // Espacio después de la última tarjeta de la sección
            if (x > margin) {
                // Si hay una tarjeta en la segunda columna, bajar a la siguiente fila
                y += cardHeight + margin;
                x = margin;
            } else {
                // Si ya estamos en una nueva fila, solo agregar espacio
                y += margin;
            }
        }
        
        // Generar el PDF como blob
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const fileName = `Catalogo_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Intentar usar Web Share API en móviles
        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            try {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                await navigator.share({
                    title: 'Catálogo de Productos',
                    text: 'Catálogo de productos',
                    files: [file]
                });
                showNotification('PDF compartido exitosamente');
                URL.revokeObjectURL(pdfUrl);
                return;
            } catch (shareError) {
                // Si el usuario cancela o hay error, descargar normalmente
                console.log('Share cancelado o error:', shareError);
            }
        }
        
        // Opción de descargar o abrir en nueva ventana
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar el URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
        
        showNotification('PDF del catálogo generado exitosamente');
    } catch (error) {
        console.error('Error generando PDF:', error);
        showNotification('Error al generar el PDF. Por favor intenta de nuevo.');
    }
}

// ========== VENTAS ==========

function loadVentas() {
    const ventas = getVentas();
    const abonos = getAbonos();
    const productos = getProductos();
    const container = document.getElementById('ventasList');
    
    if (ventas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay ventas registradas. Crea una nueva venta para comenzar.</p>';
        return;
    }
    
    container.innerHTML = ventas.map(venta => {
        const producto = productos.find(p => p.id === venta.productoId);
        const ventaAbonos = abonos.filter(a => a.ventaId === venta.id);
        const totalAbonado = ventaAbonos.reduce((sum, a) => sum + a.monto, 0);
        const pendiente = venta.total - totalAbonado;
        const estaPagado = pendiente <= 0;
        
        return `
            <div class="venta-item">
                <div class="venta-header">
                    <div class="venta-info">
                        <h3>${venta.cliente}</h3>
                        <p><strong>Producto:</strong> ${producto ? producto.codigo : 'N/A'}</p>
                        <p><strong>Fecha:</strong> ${formatDate(venta.fecha)}</p>
                    </div>
                    <div class="venta-actions">
                        <button class="btn btn-primary" onclick="exportVentaToPDF('${venta.id}')">📄 Ticket PDF</button>
                        <button class="btn btn-success" onclick="openAddAbonoModal('${venta.id}')">+ Abono</button>
                        <button class="btn btn-warning" onclick="editSale('${venta.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="deleteSale('${venta.id}')">Eliminar</button>
                    </div>
                </div>
                <div class="venta-details">
                    <div class="venta-detail-item">
                        <label>Cantidad</label>
                        <span>${venta.cantidad}</span>
                    </div>
                    ${venta.tipoVenta ? `
                    <div class="venta-detail-item">
                        <label>Tipo</label>
                        <span>${venta.tipoVenta === 'normal' ? 'Normal' : venta.tipoVenta === 'contado' ? 'Contado' : 'Mayoreo'}</span>
                    </div>
                    ` : ''}
                    <div class="venta-detail-item">
                        <label>Total</label>
                        <span>$${parseFloat(venta.total).toFixed(2)}</span>
                    </div>
                    <div class="venta-detail-item">
                        <label>Abonado</label>
                        <span>$${parseFloat(totalAbonado).toFixed(2)}</span>
                    </div>
                    <div class="venta-detail-item">
                        <label>Pendiente</label>
                        <span>$${parseFloat(pendiente).toFixed(2)}</span>
                    </div>
                    <div class="venta-detail-item">
                        <label>Estado</label>
                        <span class="pago-status ${estaPagado ? 'pagado' : 'pendiente'}">
                            ${estaPagado ? 'Pagado' : 'Pendiente'}
                        </span>
                    </div>
                </div>
                ${ventaAbonos.length > 0 ? `
                    <div class="abonos-list">
                        <h4>Abonos Registrados:</h4>
                        ${ventaAbonos.map(abono => `
                            <div class="abono-item">
                                <span>${formatDate(abono.fecha)} - $${parseFloat(abono.monto).toFixed(2)}</span>
                                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75em;" onclick="deleteAbono('${abono.id}')">Eliminar</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openAddSaleModal() {
    document.getElementById('addSaleForm').reset();
    document.getElementById('saleFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleAbono').value = 0;
    document.getElementById('saleTipoVenta').value = 'normal';
    document.getElementById('saleTotal').value = '';
    updateProductSelects();
    document.getElementById('addSaleModal').classList.add('active');
}

// Función para actualizar el total de la venta según el tipo de venta
function updateSaleTotal() {
    const productoId = document.getElementById('saleProducto').value;
    const cantidad = parseInt(document.getElementById('saleCantidad').value) || 0;
    const tipoVenta = document.getElementById('saleTipoVenta').value;
    
    if (!productoId || cantidad === 0) {
        document.getElementById('saleTotal').value = '';
        return;
    }
    
    const productos = getProductos();
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto) {
        document.getElementById('saleTotal').value = '';
        return;
    }
    
    // Obtener el precio según el tipo de venta
    let precioUnitario = 0;
    
    if (tipoVenta === 'normal') {
        precioUnitario = producto.precioNormal || producto.precioVenta || 0;
    } else if (tipoVenta === 'contado') {
        precioUnitario = producto.precioContado || 0;
    } else if (tipoVenta === 'mayoreo') {
        precioUnitario = producto.precioMayoreo || 0;
    }
    
    // Calcular total
    const total = precioUnitario * cantidad;
    document.getElementById('saleTotal').value = total.toFixed(2);
}

function addSale(event) {
    event.preventDefault();
    
    const venta = {
        id: generateId(),
        cliente: document.getElementById('saleCliente').value,
        productoId: document.getElementById('saleProducto').value,
        cantidad: parseInt(document.getElementById('saleCantidad').value),
        tipoVenta: document.getElementById('saleTipoVenta').value,
        total: parseFloat(document.getElementById('saleTotal').value),
        fecha: document.getElementById('saleFecha').value
    };
    
    const ventas = getVentas();
    ventas.push(venta);
    saveVentas(ventas);
    
    // Si hay abono inicial, agregarlo
    const abonoInicial = parseFloat(document.getElementById('saleAbono').value);
    if (abonoInicial > 0) {
        const abono = {
            id: generateId(),
            ventaId: venta.id,
            monto: abonoInicial,
            fecha: venta.fecha
        };
        const abonos = getAbonos();
        abonos.push(abono);
        saveAbonos(abonos);
    }
    
    // Actualizar cantidad del producto
    const productos = getProductos();
    const productoIndex = productos.findIndex(p => p.id === venta.productoId);
    if (productoIndex !== -1) {
        productos[productoIndex].cantidad -= venta.cantidad;
        if (productos[productoIndex].cantidad < 0) productos[productoIndex].cantidad = 0;
        saveProductos(productos);
    }
    
    closeModal('addSaleModal');
    loadVentas();
    loadInventario();
    
    showNotification('Venta registrada exitosamente');
}

function editSale(id) {
    const ventas = getVentas();
    const venta = ventas.find(v => v.id === id);
    
    if (!venta) return;
    
    document.getElementById('editSaleId').value = venta.id;
    document.getElementById('editSaleCliente').value = venta.cliente;
    document.getElementById('editSaleProducto').value = venta.productoId;
    document.getElementById('editSaleCantidad').value = venta.cantidad;
    document.getElementById('editSaleTipoVenta').value = venta.tipoVenta || 'normal';
    document.getElementById('editSaleTotal').value = venta.total;
    document.getElementById('editSaleFecha').value = venta.fecha;
    
    updateProductSelects('editSaleProducto');
    updateEditSaleTotal();
    document.getElementById('editSaleModal').classList.add('active');
}

// Función para actualizar el total de la venta editada
function updateEditSaleTotal() {
    const productoId = document.getElementById('editSaleProducto').value;
    const cantidad = parseInt(document.getElementById('editSaleCantidad').value) || 0;
    const tipoVenta = document.getElementById('editSaleTipoVenta').value;
    
    if (!productoId || cantidad === 0) {
        document.getElementById('editSaleTotal').value = '';
        return;
    }
    
    const productos = getProductos();
    const producto = productos.find(p => p.id === productoId);
    
    if (!producto) {
        document.getElementById('editSaleTotal').value = '';
        return;
    }
    
    // Obtener el precio según el tipo de venta
    let precioUnitario = 0;
    
    if (tipoVenta === 'normal') {
        precioUnitario = producto.precioNormal || producto.precioVenta || 0;
    } else if (tipoVenta === 'contado') {
        precioUnitario = producto.precioContado || 0;
    } else if (tipoVenta === 'mayoreo') {
        precioUnitario = producto.precioMayoreo || 0;
    }
    
    // Calcular total
    const total = precioUnitario * cantidad;
    document.getElementById('editSaleTotal').value = total.toFixed(2);
}

function updateSale(event) {
    event.preventDefault();
    
    const id = document.getElementById('editSaleId').value;
    const ventas = getVentas();
    const index = ventas.findIndex(v => v.id === id);
    
    if (index === -1) return;
    
    ventas[index] = {
        ...ventas[index],
        cliente: document.getElementById('editSaleCliente').value,
        productoId: document.getElementById('editSaleProducto').value,
        cantidad: parseInt(document.getElementById('editSaleCantidad').value),
        tipoVenta: document.getElementById('editSaleTipoVenta').value,
        total: parseFloat(document.getElementById('editSaleTotal').value),
        fecha: document.getElementById('editSaleFecha').value
    };
    
    saveVentas(ventas);
    closeModal('editSaleModal');
    loadVentas();
    
    showNotification('Venta actualizada exitosamente');
}

function deleteSale(id) {
    if (!confirm('¿Estás seguro de eliminar esta venta? También se eliminarán todos los abonos asociados.')) return;
    
    const ventas = getVentas();
    const filtered = ventas.filter(v => v.id !== id);
    saveVentas(filtered);
    
    // Eliminar abonos asociados
    const abonos = getAbonos();
    const filteredAbonos = abonos.filter(a => a.ventaId !== id);
    saveAbonos(filteredAbonos);
    
    loadVentas();
    
    showNotification('Venta eliminada');
}

function openAddAbonoModal(ventaId) {
    document.getElementById('abonoSaleId').value = ventaId;
    document.getElementById('abonoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('addAbonoModal').classList.add('active');
}

function addAbono(event) {
    event.preventDefault();
    
    const abono = {
        id: generateId(),
        ventaId: document.getElementById('abonoSaleId').value,
        monto: parseFloat(document.getElementById('abonoMonto').value),
        fecha: document.getElementById('abonoFecha').value
    };
    
    const abonos = getAbonos();
    abonos.push(abono);
    saveAbonos(abonos);
    
    closeModal('addAbonoModal');
    loadVentas();
    
    showNotification('Abono registrado exitosamente');
}

function deleteAbono(id) {
    if (!confirm('¿Estás seguro de eliminar este abono?')) return;
    
    const abonos = getAbonos();
    const filtered = abonos.filter(a => a.id !== id);
    saveAbonos(filtered);
    
    loadVentas();
    
    showNotification('Abono eliminado');
}

async function exportVentaToPDF(ventaId) {
    const ventas = getVentas();
    const abonos = getAbonos();
    const productos = getProductos();
    const venta = ventas.find(v => v.id === ventaId);
    
    if (!venta) {
        showNotification('Venta no encontrada');
        return;
    }
    
    const producto = productos.find(p => p.id === venta.productoId);
    const ventaAbonos = abonos.filter(a => a.ventaId === venta.id);
    const totalAbonado = ventaAbonos.reduce((sum, a) => sum + a.monto, 0);
    const pendiente = venta.total - totalAbonado;
    
    showNotification('Generando ticket PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', [80, 200]); // Tamaño de ticket (ancho x alto)
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 10;
        
        // Cargar y agregar logo
        try {
            const logoImg = new Image();
            // No usar crossOrigin para evitar problemas
            
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    y += 10;
                    resolve();
                }, 3000); // Timeout de 3 segundos
                
                logoImg.onload = () => {
                    clearTimeout(timeout);
                    try {
                        const logoWidth = 30;
                        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
                        const logoX = (pageWidth - logoWidth) / 2;
                        doc.addImage(logoImg, 'JPEG', logoX, y, logoWidth, logoHeight);
                        y += logoHeight + 5;
                    } catch (e) {
                        console.error('Error agregando logo al PDF:', e);
                    }
                    resolve();
                };
                logoImg.onerror = () => {
                    clearTimeout(timeout);
                    y += 10;
                    resolve();
                };
                logoImg.src = 'Logo.jpeg';
            });
        } catch (error) {
            console.error('Error cargando logo:', error);
            y += 10;
        }
        
        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(5, y, pageWidth - 5, y);
        y += 8;
        
        // Título "TICKET DE VENTA"
        doc.setFontSize(12);
        doc.setTextColor(255, 105, 180); // Rosa
        doc.setFont(undefined, 'bold');
        doc.text('TICKET DE VENTA', pageWidth / 2, y, { align: 'center' });
        y += 8;
        
        // Línea separadora
        doc.line(5, y, pageWidth - 5, y);
        y += 8;
        
        // Información de la venta
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        
        doc.setFont(undefined, 'bold');
        doc.text('Cliente:', 10, y);
        doc.setFont(undefined, 'normal');
        doc.text(venta.cliente, 35, y);
        y += 6;
        
        doc.setFont(undefined, 'bold');
        doc.text('Fecha:', 10, y);
        doc.setFont(undefined, 'normal');
        doc.text(formatDate(venta.fecha), 35, y);
        y += 6;
        
        doc.setFont(undefined, 'bold');
        doc.text('Producto:', 10, y);
        doc.setFont(undefined, 'normal');
        doc.text(producto ? producto.codigo : 'N/A', 35, y);
        y += 6;
        
        doc.setFont(undefined, 'bold');
        doc.text('Cantidad:', 10, y);
        doc.setFont(undefined, 'normal');
        doc.text(venta.cantidad.toString(), 35, y);
        y += 6;
        
        // Tipo de venta y porcentaje si existe
        if (venta.tipoVenta) {
            const tipoTexto = venta.tipoVenta === 'normal' ? 'Venta' : venta.tipoVenta === 'contado' ? 'Contado' : 'Mayoreo';
            doc.setFont(undefined, 'bold');
            doc.text('Tipo:', 10, y);
            doc.setFont(undefined, 'normal');
            doc.text(tipoTexto, 35, y);
            y += 6;
        }
        
        y += 2;
        // Línea separadora
        doc.line(5, y, pageWidth - 5, y);
        y += 8;
        
        // Totales
        doc.setFontSize(10);
        if (venta.subtotal && venta.subtotal !== venta.total) {
            doc.setFont(undefined, 'bold');
            doc.text('SUBTOTAL:', 10, y);
            doc.text(`$${parseFloat(venta.subtotal).toFixed(2)}`, pageWidth - 10, y, { align: 'right' });
            y += 6;
        }
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL:', 10, y);
        doc.text(`$${parseFloat(venta.total).toFixed(2)}`, pageWidth - 10, y, { align: 'right' });
        y += 6;
        
        if (totalAbonado > 0) {
            doc.setFont(undefined, 'normal');
            doc.text('Abonado:', 10, y);
            doc.text(`$${parseFloat(totalAbonado).toFixed(2)}`, pageWidth - 10, y, { align: 'right' });
            y += 6;
            
            doc.setFont(undefined, 'bold');
            doc.text('PENDIENTE:', 10, y);
            doc.text(`$${parseFloat(pendiente).toFixed(2)}`, pageWidth - 10, y, { align: 'right' });
            y += 8;
        } else {
            y += 6;
        }
        
        // Línea separadora
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(1);
        doc.line(5, y, pageWidth - 5, y);
        y += 10;
        
        // "Gracias por su compra" en grande
        doc.setFontSize(16);
        doc.setTextColor(255, 105, 180); // Rosa
        doc.setFont(undefined, 'bold');
        doc.text('¡GRACIAS POR', pageWidth / 2, y, { align: 'center' });
        y += 8;
        doc.text('SU COMPRA!', pageWidth / 2, y, { align: 'center' });
        y += 8;
        
        // Línea final
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(5, y, pageWidth - 5, y);
        y += 5;
        
        // Información adicional
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont(undefined, 'normal');
        doc.text('Este es un comprobante de venta', pageWidth / 2, y, { align: 'center' });
        y += 4;
        doc.text('Válido para efectos contables', pageWidth / 2, y, { align: 'center' });
        
        // Generar el PDF como blob
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const fileName = `Ticket_Venta_${venta.cliente.replace(/\s+/g, '_')}_${venta.fecha}.pdf`;
        
        // Intentar usar Web Share API en móviles
        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            try {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                await navigator.share({
                    title: 'Ticket de Venta',
                    text: `Ticket de venta - ${venta.cliente}`,
                    files: [file]
                });
                showNotification('Ticket PDF compartido exitosamente');
                URL.revokeObjectURL(pdfUrl);
                return;
            } catch (shareError) {
                // Si el usuario cancela o hay error, descargar normalmente
                console.log('Share cancelado o error:', shareError);
            }
        }
        
        // Opción de descargar o abrir en nueva ventana
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar el URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
        
        showNotification('Ticket PDF generado exitosamente');
    } catch (error) {
        console.error('Error generando ticket PDF:', error);
        showNotification('Error al generar el ticket PDF. Por favor intenta de nuevo.');
    }
}

function updateProductSelects(selectId = null) {
    const productos = getProductos();
    const selects = selectId 
        ? [document.getElementById(selectId)]
        : [document.getElementById('saleProducto'), document.getElementById('editSaleProducto')];
    
    selects.forEach(select => {
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccionar producto...</option>';
        
        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            const precioMostrar = producto.precioNormal || producto.precioVenta || 0;
            option.textContent = `${producto.codigo} - $${parseFloat(precioMostrar).toFixed(2)}`;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
    
    // Actualizar total cuando cambia producto, cantidad o tipo de venta
    if (selectId !== 'editSaleProducto') {
        const saleProducto = document.getElementById('saleProducto');
        const saleCantidad = document.getElementById('saleCantidad');
        const saleTipoVenta = document.getElementById('saleTipoVenta');
        
        // Remover listeners anteriores para evitar duplicados
        if (saleProducto) {
            saleProducto.removeEventListener('change', updateSaleTotal);
            saleProducto.addEventListener('change', updateSaleTotal);
        }
        if (saleCantidad) {
            saleCantidad.removeEventListener('input', updateSaleTotal);
            saleCantidad.addEventListener('input', updateSaleTotal);
        }
        if (saleTipoVenta) {
            saleTipoVenta.removeEventListener('change', updateSaleTotal);
            saleTipoVenta.addEventListener('change', updateSaleTotal);
        }
    } else {
        // Para el modal de edición
        const editSaleProducto = document.getElementById('editSaleProducto');
        const editSaleCantidad = document.getElementById('editSaleCantidad');
        const editSaleTipoVenta = document.getElementById('editSaleTipoVenta');
        
        // Remover listeners anteriores para evitar duplicados
        if (editSaleProducto) {
            editSaleProducto.removeEventListener('change', updateEditSaleTotal);
            editSaleProducto.addEventListener('change', updateEditSaleTotal);
        }
        if (editSaleCantidad) {
            editSaleCantidad.removeEventListener('input', updateEditSaleTotal);
            editSaleCantidad.addEventListener('input', updateEditSaleTotal);
        }
        if (editSaleTipoVenta) {
            editSaleTipoVenta.removeEventListener('change', updateEditSaleTotal);
            editSaleTipoVenta.addEventListener('change', updateEditSaleTotal);
        }
    }
}

// ========== GOOGLE DRIVE ==========

// Configuración de Google Drive API
// NOTA: Necesitas obtener un API Key y Client ID de Google Cloud Console
// Ve a: https://console.cloud.google.com/
// 1. Crea un proyecto
// 2. Habilita Google Drive API y Google Picker API
// 3. Crea credenciales OAuth 2.0
// 4. Agrega tu dominio a los orígenes autorizados

const GOOGLE_API_KEY = 'AIzaSyCkBj1JGV3Fj46AIC_7ohPvcFd0kpouGgw'; // Reemplaza con tu API Key
const GOOGLE_CLIENT_ID = '1094180131744-0ae4v8llls981fm482rairql3bvsph8b.apps.googleusercontent.com'; // Reemplaza con tu Client ID
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Inicializar Google APIs
function gapiLoaded() {
    gapi.load('client:picker', initializeGapi);
}

function initializeGapi() {
    gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        gapiInited = true;
        maybeEnablePicker();
    }).catch((error) => {
        console.error('Error inicializando Google API:', error);
        // Si no hay API key configurado, usar método alternativo
        if (GOOGLE_API_KEY === 'YOUR_API_KEY') {
            console.warn('Google API Key no configurado. Usando método alternativo.');
        }
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // Se define cuando se llama
        // Nota: redirect_uri se determina automáticamente desde window.location
        // Asegúrate de que la URL actual esté en los Authorized redirect URIs
    });
    gisInited = true;
    maybeEnablePicker();
}

function maybeEnablePicker() {
    if (gapiInited && gisInited) {
        // APIs listas
    }
}

// Función principal para seleccionar archivo de Google Drive
function pickFromGoogleDrive(inputId) {
    // Si no hay credenciales configuradas, usar método alternativo
    if (GOOGLE_API_KEY === 'YOUR_API_KEY' || GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID') {
        showNotification('Configura tu API Key y Client ID de Google. Por ahora puedes pegar el link manualmente.');
        // Método alternativo: abrir Google Drive en nueva ventana
        const input = document.getElementById(inputId);
        const driveUrl = prompt('Pega el link de Google Drive de tu imagen:');
        if (driveUrl) {
            convertDriveLinkToDirect(driveUrl, input);
        }
        return;
    }

    if (!gapiInited || !gisInited) {
        showNotification('Cargando Google Drive... Por favor espera un momento.');
        return;
    }

    tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
            showNotification('Error al autenticar con Google Drive');
            return;
        }
        
        createPicker(inputId);
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function createPicker(inputId) {
    const view = new google.picker.DocsView(google.picker.ViewId.IMAGES);
    view.setMimeTypes('image/png,image/jpeg,image/jpg,image/gif,image/webp');
    view.setSelectFolderEnabled(false);

    const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(GOOGLE_CLIENT_ID)
        .setOAuthToken(gapi.client.getToken().access_token)
        .addView(view)
        .setCallback((data) => {
            if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                const fileId = data.docs[0].id;
                const input = document.getElementById(inputId);
                
                // Obtener el link directo de la imagen
                getDirectImageUrl(fileId, input);
            }
        })
        .build();
    
    picker.setVisible(true);
}

async function getDirectImageUrl(fileId, input) {
    try {
        // Intentar obtener información del archivo
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'webViewLink, webContentLink, thumbnailLink, permissions'
        });
        
        // Intentar compartir el archivo públicamente si no lo está
        try {
            await gapi.client.drive.permissions.create({
                fileId: fileId,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
            console.log('Archivo compartido públicamente');
        } catch (permError) {
            // Si ya está compartido o hay error, continuar
            console.log('Permiso ya existe o no se pudo compartir:', permError);
        }
        
        // Usar formato de thumbnail que funciona mejor con CORS
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        input.value = thumbnailUrl;
        showNotification('✅ Imagen seleccionada de Google Drive');
        
        // Nota: No verificamos la carga aquí porque puede tener problemas de CORS
        // El formato de thumbnail debería funcionar si el archivo está compartido
        return Promise.resolve(true);
        
    } catch (error) {
        console.error('Error obteniendo URL:', error);
        // Usar método alternativo
        const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        const altUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        input.value = directUrl;
        showNotification('⚠️ Imagen seleccionada. Si no se ve, prueba compartir el archivo como "Cualquiera con el link" en Google Drive');
    }
}

// Función para convertir URLs de Google Drive a formato que funcione sin CORS
// Usa proxy de weserv.nl para funcionar en PWA y evitar problemas de CORS
function convertImageUrl(url) {
    if (!url) return null;
    
    // Si ya es un placeholder u otra URL válida, devolverla tal cual
    if (url.includes('placeholder') || (url.includes('http') && !url.includes('drive.google.com'))) {
        return url;
    }
    
    // Extraer el ID del archivo de Google Drive
    let fileId = null;
    
    // Formato 1: https://drive.google.com/uc?export=view&id=FILE_ID
    const match1 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match1) {
        fileId = match1[1];
    }
    
    // Formato 2: https://drive.google.com/file/d/FILE_ID/view
    const match2 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match2) {
        fileId = match2[1];
    }
    
    // Formato 3: https://drive.google.com/thumbnail?id=FILE_ID
    const match3 = url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
    if (match3) {
        fileId = match3[1];
    }
    
    if (fileId) {
        // Usar proxy de imágenes para evitar problemas de CORS en PWA
        // Esto funciona tanto en navegador normal como en PWA instalada
        return `https://images.weserv.nl/?url=https://drive.google.com/thumbnail?id=${fileId}&sz=w1000&output=jpg`;
    }
    
    // Si no se puede convertir, devolver la URL original
    return url;
}

// Método alternativo: convertir link de Drive a directo
function convertDriveLinkToDirect(url, input) {
    let fileId = null;
    
    // Formato 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) {
        fileId = match1[1];
    }
    
    // Formato 2: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && !fileId) {
        fileId = match2[1];
    }
    
    if (fileId) {
        // Usar formato de thumbnail que evita problemas de CORS
        const thumbnailLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        input.value = thumbnailLink;
        showNotification('Link de Google Drive convertido exitosamente');
    } else {
        input.value = url;
        showNotification('Link guardado. Si es de Google Drive, asegúrate de compartirlo como "Cualquiera con el link"');
    }
}

// ========== UTILIDADES ==========

function getProductos() {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
    return data ? JSON.parse(data) : [];
}

function saveProductos(productos) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
}

function getVentas() {
    const data = localStorage.getItem(STORAGE_KEYS.VENTAS);
    return data ? JSON.parse(data) : [];
}

function saveVentas(ventas) {
    localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify(ventas));
}

function getAbonos() {
    const data = localStorage.getItem(STORAGE_KEYS.ABONOS);
    return data ? JSON.parse(data) : [];
}

function saveAbonos(abonos) {
    localStorage.setItem(STORAGE_KEYS.ABONOS, JSON.stringify(abonos));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showNotification(message) {
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

