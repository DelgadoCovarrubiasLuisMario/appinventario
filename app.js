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
    
    // Configurar formateo automático de números con comas
    setupNumberFormatting();
}

// Configurar formateo automático de números mientras se escriben
function setupNumberFormatting() {
    // Lista de IDs de inputs que deben formatearse
    const numberInputs = [
        'productPrecioNormal', 'productPrecioContado', 'productPrecioMayoreo', 'productCantidad',
        'editProductPrecioNormal', 'editProductPrecioContado', 'editProductPrecioMayoreo', 'editProductCantidad',
        'saleCantidad', 'saleAbono',
        'editSaleCantidad',
        'abonoMonto'
    ];
    
    numberInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Formatear al perder el foco
            input.addEventListener('blur', function() {
                const value = this.value;
                if (value) {
                    const formatted = formatNumberWithCommas(value);
                    if (formatted !== value) {
                        this.value = formatted;
                    }
                }
            });
            
            // Validar y limpiar mientras se escribe
            input.addEventListener('input', function(e) {
                let value = this.value;
                
                // Si es un input de cantidad (solo números y comas)
                if (inputId.includes('Cantidad')) {
                    // Remover todo excepto números y comas
                    value = value.replace(/[^0-9,]/g, '');
                } else {
                    // Para precios (números, comas y un punto decimal)
                    // Remover todo excepto números, comas y un punto
                    value = value.replace(/[^0-9,.]/g, '');
                    // Asegurar solo un punto decimal
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                }
                
                // Solo actualizar si cambió
                if (this.value !== value) {
                    this.value = value;
                }
            });
        }
    });
    
    // Para inputs que se actualizan automáticamente (como saleTotal)
    const autoUpdateInputs = ['saleTotal', 'editSaleTotal'];
    autoUpdateInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Estos inputs son readonly, pero asegurémonos de que se formateen cuando se actualicen
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                        const value = input.value;
                        if (value) {
                            const formatted = formatNumberWithCommas(value);
                            if (formatted !== value) {
                                input.value = formatted;
                            }
                        }
                    }
                });
            });
            observer.observe(input, { attributes: true, attributeFilter: ['value'] });
        }
    });
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
                    <span class="cantidad-badge ${getCantidadClass(producto.cantidad)}">${formatNumberWithCommas(producto.cantidad)}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Venta:</label>
                    <span>$${formatNumberWithCommas(parseFloat(producto.precioNormal || 0).toFixed(2))}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Contado:</label>
                    <span>$${formatNumberWithCommas(parseFloat(producto.precioContado || 0).toFixed(2))}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Mayoreo:</label>
                    <span>$${formatNumberWithCommas(parseFloat(producto.precioMayoreo || 0).toFixed(2))}</span>
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
    // Limpiar campos numéricos para que no muestren "0" formateado
    document.getElementById('productPrecioNormal').value = '';
    document.getElementById('productPrecioContado').value = '';
    document.getElementById('productPrecioMayoreo').value = '';
    document.getElementById('productCantidad').value = '';
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
        precioNormal: parseNumberWithCommas(document.getElementById('productPrecioNormal').value),
        precioContado: parseNumberWithCommas(document.getElementById('productPrecioContado').value),
        precioMayoreo: parseNumberWithCommas(document.getElementById('productPrecioMayoreo').value),
        cantidad: parseInt(parseNumberWithCommas(document.getElementById('productCantidad').value)),
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
    document.getElementById('editProductPrecioNormal').value = formatNumberWithCommas(producto.precioNormal || producto.precioVenta || 0);
    document.getElementById('editProductPrecioContado').value = formatNumberWithCommas(producto.precioContado || 0);
    document.getElementById('editProductPrecioMayoreo').value = formatNumberWithCommas(producto.precioMayoreo || producto.precioCompra || 0);
    document.getElementById('editProductCantidad').value = formatNumberWithCommas(producto.cantidad);
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
        precioNormal: parseNumberWithCommas(document.getElementById('editProductPrecioNormal').value),
        precioContado: parseNumberWithCommas(document.getElementById('editProductPrecioContado').value),
        precioMayoreo: parseNumberWithCommas(document.getElementById('editProductPrecioMayoreo').value),
        cantidad: parseInt(parseNumberWithCommas(document.getElementById('editProductCantidad').value)),
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
    // Filtrar productos agotados (cantidad = 0) del catálogo
    const productosDisponibles = productos.filter(p => (p.cantidad || 0) > 0);
    const grid = document.getElementById('catalogoGrid');
    const filtersContainer = document.querySelector('.catalogo-filters');
    
    if (productosDisponibles.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay productos disponibles en el catálogo.</p>';
        return;
    }
    
    // Generar botones de filtro dinámicamente basados en las categorías existentes (solo de productos disponibles)
    const categoriasUnicas = [...new Set(productosDisponibles.map(p => p.categoria || 'Sin categoría').filter(c => c))];
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
    let productosFiltrados = productosDisponibles;
    if (categoriaFiltroActual !== 'todos') {
        productosFiltrados = productosDisponibles.filter(p => (p.categoria || 'Sin categoría') === categoriaFiltroActual);
    }
    
    if (productosFiltrados.length === 0) {
        grid.innerHTML = `<p style="text-align: center; color: #666; padding: 40px;">No hay productos disponibles en la categoría seleccionada.</p>`;
        return;
    }
    
    // Si no hay filtro, agrupar por categoría dinámicamente
    if (categoriaFiltroActual === 'todos') {
        // Obtener todas las categorías únicas de los productos disponibles
        const categoriasUnicas = [...new Set(productosDisponibles.map(p => p.categoria || 'Sin categoría').filter(c => c))];
        categoriasUnicas.sort(); // Ordenar alfabéticamente
        
        let html = '';
        
        categoriasUnicas.forEach(categoria => {
            const productosCategoria = productosDisponibles.filter(p => (p.categoria || 'Sin categoría') === categoria);
            
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
                                    <div class="precio-normal">Venta: $${formatNumberWithCommas(parseFloat(producto.precioNormal || producto.precioVenta || 0).toFixed(2))}</div>
                                    <div class="precio-contado">Contado: $${formatNumberWithCommas(parseFloat(producto.precioContado || 0).toFixed(2))}</div>
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
                    <div class="precio-normal">Normal: $${formatNumberWithCommas(parseFloat(producto.precioNormal || producto.precioVenta || 0).toFixed(2))}</div>
                    <div class="precio-contado">Contado: $${formatNumberWithCommas(parseFloat(producto.precioContado || 0).toFixed(2))}</div>
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
    // Filtrar productos agotados (cantidad = 0) del PDF del catálogo
    const productosDisponibles = productos.filter(p => (p.cantidad || 0) > 0);
    
    if (productosDisponibles.length === 0) {
        showNotification('No hay productos disponibles en el catálogo para exportar');
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
        const imgPadding = 4; // Espacio interno alrededor de las imágenes (en mm)
        const imgWidth = (cardWidth / 2) - (imgPadding * 2); // Ancho de la imagen (mitad de la tarjeta)
        const infoWidth = cardWidth / 2; // Ancho del área de información (mitad de la tarjeta)
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
        
        // Agrupar productos por categoría (solo disponibles)
        const categoriasUnicas = [...new Set(productosDisponibles.map(p => p.categoria || 'Sin categoría').filter(c => c))];
        categoriasUnicas.sort(); // Ordenar alfabéticamente
        
        // Procesar cada categoría
        for (let catIndex = 0; catIndex < categoriasUnicas.length; catIndex++) {
            const categoria = categoriasUnicas[catIndex];
            const productosCategoria = productosDisponibles.filter(p => (p.categoria || 'Sin categoría') === categoria);
            
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
                
                // Área para la imagen (lado izquierdo, mitad de la tarjeta)
                const imgX = x + imgPadding;
                const imgY = y + imgPadding;
                const imgAreaWidth = imgWidth;
                const imgAreaHeight = cardHeight - (imgPadding * 2);
                
                // Cargar y agregar imagen
                try {
                    const imgUrl = convertImageUrl(producto.foto);
                    if (!imgUrl || (!imgUrl.includes('drive.google.com') && !imgUrl.includes('http'))) {
                        // Si no hay imagen válida, dibujar placeholder con tamaño fijo
                        const placeholderWidth = imgAreaWidth;
                        const placeholderHeight = imgAreaHeight;
                        const placeholderX = imgX;
                        const placeholderY = imgY;
                        
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
                            const placeholderWidth = imgAreaWidth;
                            const placeholderHeight = imgAreaHeight;
                            const placeholderX = imgX;
                            const placeholderY = imgY;
                            
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
                                // Calcular dimensiones para el PDF - ajustar al área de la mitad izquierda
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
                                
                                // Centrar la imagen en el área izquierda
                                const finalImgX = imgX + (imgAreaWidth - finalImgWidth) / 2;
                                const finalImgY = imgY + (imgAreaHeight - finalImgHeight) / 2;
                                
                                // Agregar imagen directamente al PDF (jsPDF puede manejar URLs con proxy)
                                // Si el proxy funciona, podemos usar la URL directamente
                                // Si no, intentamos con el objeto Image
                                try {
                                    doc.addImage(img, 'JPEG', finalImgX, finalImgY, finalImgWidth, finalImgHeight);
                                    console.log('✅ Imagen agregada al PDF:', producto.codigo);
                                } catch (e) {
                                    // Si falla, intentar con canvas pero con crossOrigin
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    ctx.drawImage(img, 0, 0);
                                    const imgData = canvas.toDataURL('image/jpeg', 0.8);
                                    doc.addImage(imgData, 'JPEG', finalImgX, finalImgY, finalImgWidth, finalImgHeight);
                                    console.log('✅ Imagen agregada al PDF (canvas):', producto.codigo);
                                }
                            } catch (e) {
                                console.error('Error agregando imagen al PDF:', e);
                                // Placeholder con tamaño fijo
                                const placeholderWidth = imgAreaWidth;
                                const placeholderHeight = imgAreaHeight;
                                const placeholderX = imgX;
                                const placeholderY = imgY;
                                
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
                            const placeholderWidth = imgAreaWidth;
                            const placeholderHeight = imgAreaHeight;
                            const placeholderX = imgX;
                            const placeholderY = imgY;
                            
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
                    const placeholderWidth = imgAreaWidth;
                    const placeholderHeight = imgAreaHeight;
                    const placeholderX = imgX;
                    const placeholderY = imgY;
                    
                    doc.setFillColor(255, 240, 245);
                    doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2, 'F');
                    doc.setDrawColor(255, 200, 220);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight, 2, 2);
                    doc.setFontSize(7);
                    doc.setTextColor(200, 180, 190);
                    doc.text('Error', x + cardWidth / 2, placeholderY + (placeholderHeight / 2), { align: 'center' });
                }
                
                // Área de información (lado derecho, mitad de la tarjeta)
                const infoX = x + (cardWidth / 2) + 2; // Inicio del área de info (mitad derecha + pequeño margen)
                let infoY = y + imgPadding; // Inicio vertical
                
                // Código del producto
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.setFont(undefined, 'bold');
                doc.text(producto.codigo, infoX, infoY, { maxWidth: infoWidth - 4 });
                infoY += 5;
                
                // Precios
                const precioNormal = producto.precioNormal || producto.precioVenta || 0;
                doc.setFontSize(10);
                doc.setTextColor(255, 105, 180); // Rosa
                doc.setFont(undefined, 'bold');
                doc.text(`Venta: $${formatNumberWithCommas(parseFloat(precioNormal).toFixed(2))}`, infoX, infoY, { maxWidth: infoWidth - 4 });
                infoY += 5;
                
                const precioContado = producto.precioContado || 0;
                doc.setFontSize(9);
                doc.setTextColor(255, 145, 164); // Rosa más claro
                doc.setFont(undefined, 'normal');
                doc.text(`Contado: $${formatNumberWithCommas(parseFloat(precioContado).toFixed(2))}`, infoX, infoY, { maxWidth: infoWidth - 4 });
                infoY += 5;
                
                // Agregar comentarios si existen (estilo elegante)
                if (producto.comentarios && producto.comentarios.trim()) {
                    // Línea decorativa sutil antes de los comentarios
                    doc.setDrawColor(255, 200, 220); // Rosa muy claro
                    doc.setLineWidth(0.2);
                    doc.line(infoX, infoY, infoX + infoWidth - 8, infoY);
                    infoY += 3;
                    
                    // Comentarios con estilo elegante
                    doc.setFontSize(7);
                    doc.setTextColor(140, 120, 130); // Gris rosa elegante
                    doc.setFont(undefined, 'italic'); // Itálica para elegancia
                    
                    // Dividir comentarios en líneas si son muy largos
                    const maxWidth = infoWidth - 8; // Margen adicional
                    const comentarios = doc.splitTextToSize(producto.comentarios.trim(), maxWidth);
                    
                    comentarios.forEach((line, idx) => {
                        if (idx < 3 && infoY < y + cardHeight - imgPadding) { // Máximo 3 líneas o hasta el final de la tarjeta
                            doc.text(line, infoX, infoY, { maxWidth: maxWidth });
                            infoY += 3.5; // Espaciado
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
        // Compatibilidad: si tiene productos (nuevo formato), usar eso; si no, usar productoId (formato antiguo)
        let productosVenta = [];
        if (venta.productos && Array.isArray(venta.productos)) {
            productosVenta = venta.productos;
        } else if (venta.productoId) {
            // Formato antiguo - convertir a nuevo formato
            productosVenta = [{
                productoId: venta.productoId,
                cantidad: venta.cantidad || 0,
                tipoVenta: venta.tipoVenta || 'normal'
            }];
        }
        
        const ventaAbonos = abonos.filter(a => a.ventaId === venta.id);
        const totalAbonado = ventaAbonos.reduce((sum, a) => sum + a.monto, 0);
        const pendiente = venta.total - totalAbonado;
        const estaPagado = pendiente <= 0;
        
        // Generar lista de productos
        const productosList = productosVenta.map(item => {
            const prod = productos.find(p => p.id === item.productoId);
            const tipoTexto = item.tipoVenta === 'normal' ? 'Venta' : item.tipoVenta === 'contado' ? 'Contado' : 'Mayoreo';
            return `${prod ? prod.codigo : 'N/A'} (${item.cantidad}x - ${tipoTexto})`;
        }).join(', ');
        
        return `
            <div class="venta-item">
                <div class="venta-header">
                    <div class="venta-info">
                        <h3>${venta.cliente}</h3>
                        <p><strong>Productos:</strong> ${productosList || 'N/A'}</p>
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
                        <label>Total de Productos</label>
                        <span>${productosVenta.reduce((sum, item) => sum + (item.cantidad || 0), 0)}</span>
                    </div>
                    <div class="venta-detail-item">
                        <label>Total</label>
                        <span>$${formatNumberWithCommas(parseFloat(venta.total).toFixed(2))}</span>
                    </div>
                    <div class="venta-detail-item">
                        <label>Abonado</label>
                        <span>$${formatNumberWithCommas(parseFloat(totalAbonado).toFixed(2))}</span>
                    </div>
                    <div class="venta-detail-item">
                        <label>Pendiente</label>
                        <span>$${formatNumberWithCommas(parseFloat(pendiente).toFixed(2))}</span>
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
                                <span>${formatDate(abono.fecha)} - $${formatNumberWithCommas(parseFloat(abono.monto).toFixed(2))}</span>
                                <button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.75em;" onclick="deleteAbono('${abono.id}')">Eliminar</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

let saleProductsCounter = 0;

function openAddSaleModal() {
    document.getElementById('addSaleForm').reset();
    document.getElementById('saleFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleAbono').value = '0';
    document.getElementById('saleTotal').value = '';
    saleProductsCounter = 0;
    
    // Limpiar contenedor de productos
    const container = document.getElementById('saleProductsContainer');
    container.innerHTML = '';
    
    // Agregar primer producto
    addProductToSale();
    
    document.getElementById('addSaleModal').classList.add('active');
}

function addProductToSale() {
    const container = document.getElementById('saleProductsContainer');
    const productId = `saleProduct_${saleProductsCounter}`;
    const cantidadId = `saleCantidad_${saleProductsCounter}`;
    const tipoVentaId = `saleTipoVenta_${saleProductsCounter}`;
    
    const productDiv = document.createElement('div');
    productDiv.className = 'sale-product-item';
    productDiv.style.cssText = 'border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; background: #f9f9f9;';
    productDiv.id = `productItem_${saleProductsCounter}`;
    
    productDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="margin: 0;">Producto ${saleProductsCounter + 1}</h4>
            ${saleProductsCounter > 0 ? `<button type="button" class="btn btn-danger" onclick="removeProductFromSale(${saleProductsCounter})" style="padding: 5px 10px; font-size: 0.85em;">Eliminar</button>` : ''}
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
            <label>Producto:</label>
            <select id="${productId}" class="sale-product-select" required onchange="updateSaleTotal()">
                <option value="">Seleccionar producto...</option>
            </select>
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
            <label>Cantidad:</label>
            <input type="text" id="${cantidadId}" class="sale-cantidad-input" inputmode="numeric" pattern="[0-9,]*" required oninput="updateSaleTotal()">
        </div>
        <div class="form-group" style="margin-bottom: 10px;">
            <label>Tipo de Venta:</label>
            <select id="${tipoVentaId}" class="sale-tipo-venta-select" required onchange="updateSaleTotal()">
                <option value="normal">Venta</option>
                <option value="contado">Contado</option>
                <option value="mayoreo">Mayoreo</option>
            </select>
        </div>
    `;
    
    container.appendChild(productDiv);
    
    // Llenar el select de productos
    updateProductSelects(productId);
    
    // Configurar formateo de números
    const cantidadInput = document.getElementById(cantidadId);
    if (cantidadInput) {
        cantidadInput.addEventListener('blur', function() {
            const value = this.value;
            if (value) {
                const formatted = formatNumberWithCommas(value);
                if (formatted !== value) {
                    this.value = formatted;
                }
            }
        });
        
        cantidadInput.addEventListener('input', function(e) {
            let value = this.value;
            value = value.replace(/[^0-9,]/g, '');
            if (this.value !== value) {
                this.value = value;
            }
        });
    }
    
    saleProductsCounter++;
}

function removeProductFromSale(index) {
    const productDiv = document.getElementById(`productItem_${index}`);
    if (productDiv) {
        productDiv.remove();
        // Renumerar los productos restantes
        renumerateSaleProducts();
        updateSaleTotal();
    }
}

function renumerateSaleProducts() {
    const productItems = document.querySelectorAll('.sale-product-item');
    productItems.forEach((item, index) => {
        const titleElement = item.querySelector('h4');
        if (titleElement) {
            titleElement.textContent = `Producto ${index + 1}`;
        }
        
        // Actualizar el botón de eliminar si no es el primero
        const deleteButton = item.querySelector('button.btn-danger');
        if (deleteButton && index === 0) {
            deleteButton.remove();
        } else if (index > 0 && !deleteButton) {
            // Agregar botón de eliminar si no existe
            const headerDiv = item.querySelector('div[style*="display: flex"]');
            if (headerDiv) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-danger';
                btn.onclick = () => removeProductFromSale(index);
                btn.style.cssText = 'padding: 5px 10px; font-size: 0.85em;';
                btn.textContent = 'Eliminar';
                headerDiv.appendChild(btn);
            }
        }
    });
}

// Función para actualizar el total de la venta según todos los productos agregados
function updateSaleTotal() {
    const productos = getProductos();
    let total = 0;
    
    // Obtener todos los elementos de productos que existen en el DOM
    const productItems = document.querySelectorAll('.sale-product-item');
    
    productItems.forEach((item, index) => {
        // Buscar los elementos dentro de este item
        const productSelect = item.querySelector('.sale-product-select');
        const cantidadInput = item.querySelector('.sale-cantidad-input');
        const tipoVentaSelect = item.querySelector('.sale-tipo-venta-select');
        
        if (!productSelect || !cantidadInput || !tipoVentaSelect) return;
        
        const productoId = productSelect.value;
        const cantidadStr = cantidadInput.value.replace(/,/g, ''); // Remover comas
        const cantidad = parseInt(cantidadStr) || 0;
        const tipoVenta = tipoVentaSelect.value;
        
        if (!productoId || cantidad === 0) return;
        
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;
        
        // Obtener el precio según el tipo de venta
        let precioUnitario = 0;
        
        if (tipoVenta === 'normal') {
            precioUnitario = parseFloat(producto.precioNormal || producto.precioVenta || 0);
        } else if (tipoVenta === 'contado') {
            precioUnitario = parseFloat(producto.precioContado || 0);
        } else if (tipoVenta === 'mayoreo') {
            precioUnitario = parseFloat(producto.precioMayoreo || 0);
        }
        
        const subtotal = precioUnitario * cantidad;
        total += subtotal;
    });
    
    const totalElement = document.getElementById('saleTotal');
    if (totalElement) {
        totalElement.value = formatNumberWithCommas(total.toFixed(2));
    }
}

function addSale(event) {
    event.preventDefault();
    
    const productos = getProductos();
    const productosVenta = [];
    
    // Recopilar todos los productos de la venta
    for (let i = 0; i < saleProductsCounter; i++) {
        const productSelect = document.getElementById(`saleProduct_${i}`);
        const cantidadInput = document.getElementById(`saleCantidad_${i}`);
        const tipoVentaSelect = document.getElementById(`saleTipoVenta_${i}`);
        
        if (!productSelect || !cantidadInput || !tipoVentaSelect) continue;
        if (!productSelect.parentElement || !productSelect.parentElement.parentElement) continue;
        
        const productoId = productSelect.value;
        const cantidad = parseInt(parseNumberWithCommas(cantidadInput.value)) || 0;
        const tipoVenta = tipoVentaSelect.value;
        
        if (!productoId || cantidad === 0) continue;
        
        productosVenta.push({
            productoId: productoId,
            cantidad: cantidad,
            tipoVenta: tipoVenta
        });
    }
    
    if (productosVenta.length === 0) {
        showNotification('Debes agregar al menos un producto a la venta');
        return;
    }
    
    const venta = {
        id: generateId(),
        cliente: document.getElementById('saleCliente').value,
        productos: productosVenta, // Array de productos
        total: parseNumberWithCommas(document.getElementById('saleTotal').value),
        fecha: document.getElementById('saleFecha').value
    };
    
    // Mantener compatibilidad con ventas antiguas (si no tienen productos, usar productoId)
    if (!venta.productos || venta.productos.length === 0) {
        // Esto es para compatibilidad hacia atrás, pero no debería pasar
        showNotification('Error: No se pudo procesar la venta');
        return;
    }
    
    const ventas = getVentas();
    ventas.push(venta);
    saveVentas(ventas);
    
    // Si hay abono inicial, agregarlo
    const abonoInicial = parseNumberWithCommas(document.getElementById('saleAbono').value);
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
    
    // Actualizar cantidad de cada producto
    productosVenta.forEach(item => {
        const productoIndex = productos.findIndex(p => p.id === item.productoId);
        if (productoIndex !== -1) {
            productos[productoIndex].cantidad -= item.cantidad;
            if (productos[productoIndex].cantidad < 0) productos[productoIndex].cantidad = 0;
        }
    });
    saveProductos(productos);
    
    closeModal('addSaleModal');
    loadVentas();
    loadInventario();
    loadCatalogo(); // Recargar catálogo para ocultar productos agotados
    
    showNotification('Venta registrada exitosamente');
}

function editSale(id) {
    const ventas = getVentas();
    const venta = ventas.find(v => v.id === id);
    
    if (!venta) return;
    
    document.getElementById('editSaleId').value = venta.id;
    document.getElementById('editSaleCliente').value = venta.cliente;
    document.getElementById('editSaleProducto').value = venta.productoId;
    document.getElementById('editSaleCantidad').value = formatNumberWithCommas(venta.cantidad);
    document.getElementById('editSaleTipoVenta').value = venta.tipoVenta || 'normal';
    document.getElementById('editSaleTotal').value = formatNumberWithCommas(venta.total);
    document.getElementById('editSaleFecha').value = venta.fecha;
    
    updateProductSelects('editSaleProducto');
    updateEditSaleTotal();
    document.getElementById('editSaleModal').classList.add('active');
}

// Función para actualizar el total de la venta editada
function updateEditSaleTotal() {
    const productoId = document.getElementById('editSaleProducto').value;
    const cantidad = parseInt(parseNumberWithCommas(document.getElementById('editSaleCantidad').value)) || 0;
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
    document.getElementById('editSaleTotal').value = formatNumberWithCommas(total.toFixed(2));
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
        cantidad: parseInt(parseNumberWithCommas(document.getElementById('editSaleCantidad').value)),
        tipoVenta: document.getElementById('editSaleTipoVenta').value,
        total: parseNumberWithCommas(document.getElementById('editSaleTotal').value),
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
        monto: parseNumberWithCommas(document.getElementById('abonoMonto').value),
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
    
    // Compatibilidad: si tiene productos (nuevo formato), usar eso; si no, usar productoId (formato antiguo)
    let productosVenta = [];
    if (venta.productos && Array.isArray(venta.productos)) {
        productosVenta = venta.productos;
    } else if (venta.productoId) {
        // Formato antiguo - convertir a nuevo formato
        productosVenta = [{
            productoId: venta.productoId,
            cantidad: venta.cantidad || 0,
            tipoVenta: venta.tipoVenta || 'normal'
        }];
    }
    
    const ventaAbonos = abonos.filter(a => a.ventaId === venta.id);
    const totalAbonado = ventaAbonos.reduce((sum, a) => sum + a.monto, 0);
    const pendiente = venta.total - totalAbonado;
    
    showNotification('Generando ticket PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        // Ajustar altura según cantidad de productos
        const baseHeight = 200;
        const extraHeight = productosVenta.length > 1 ? (productosVenta.length - 1) * 15 : 0;
        const doc = new jsPDF('p', 'mm', [80, baseHeight + extraHeight]); // Tamaño de ticket (ancho x alto)
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
        
        // Mostrar productos
        if (productosVenta.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Productos:', 10, y);
            y += 6;
            
            productosVenta.forEach((item, index) => {
                const prod = productos.find(p => p.id === item.productoId);
                const tipoTexto = item.tipoVenta === 'normal' ? 'Venta' : item.tipoVenta === 'contado' ? 'Contado' : 'Mayoreo';
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
                doc.text(`${prod ? prod.codigo : 'N/A'}`, 12, y);
                y += 4;
                doc.text(`  ${item.cantidad}x - ${tipoTexto}`, 12, y);
                y += 5;
            });
        } else {
            // Formato antiguo (compatibilidad)
            const producto = productos.find(p => p.id === venta.productoId);
            doc.setFont(undefined, 'bold');
            doc.text('Producto:', 10, y);
            doc.setFont(undefined, 'normal');
            doc.text(producto ? producto.codigo : 'N/A', 35, y);
            y += 6;
            
            doc.setFont(undefined, 'bold');
            doc.text('Cantidad:', 10, y);
            doc.setFont(undefined, 'normal');
            doc.text((venta.cantidad || 0).toString(), 35, y);
            y += 6;
            
            if (venta.tipoVenta) {
                const tipoTexto = venta.tipoVenta === 'normal' ? 'Venta' : venta.tipoVenta === 'contado' ? 'Contado' : 'Mayoreo';
                doc.setFont(undefined, 'bold');
                doc.text('Tipo:', 10, y);
                doc.setFont(undefined, 'normal');
                doc.text(tipoTexto, 35, y);
                y += 6;
            }
        }
        
        doc.setFontSize(9); // Restaurar tamaño de fuente
        
        y += 2;
        // Línea separadora
        doc.line(5, y, pageWidth - 5, y);
        y += 8;
        
        // Totales
        doc.setFontSize(10);
        if (venta.subtotal && venta.subtotal !== venta.total) {
            doc.setFont(undefined, 'bold');
            doc.text('SUBTOTAL:', 10, y);
            doc.text(`$${formatNumberWithCommas(parseFloat(venta.subtotal).toFixed(2))}`, pageWidth - 10, y, { align: 'right' });
            y += 6;
        }
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL:', 10, y);
        doc.text(`$${formatNumberWithCommas(parseFloat(venta.total).toFixed(2))}`, pageWidth - 10, y, { align: 'right' });
        y += 6;
        
        if (totalAbonado > 0) {
            doc.setFont(undefined, 'normal');
            doc.text('Abonado:', 10, y);
            doc.text(`$${formatNumberWithCommas(parseFloat(totalAbonado).toFixed(2))}`, pageWidth - 10, y, { align: 'right' });
            y += 6;
            
            doc.setFont(undefined, 'bold');
            doc.text('PENDIENTE:', 10, y);
            doc.text(`$${formatNumberWithCommas(parseFloat(pendiente).toFixed(2))}`, pageWidth - 10, y, { align: 'right' });
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
    
    // Si se especifica un selectId, actualizar solo ese
    if (selectId) {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Seleccionar producto...</option>';
            
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                const precioMostrar = producto.precioNormal || producto.precioVenta || 0;
                option.textContent = `${producto.codigo} - $${formatNumberWithCommas(parseFloat(precioMostrar).toFixed(2))}`;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }
        return;
    }
    
    // Actualizar todos los selects de productos en el modal de venta
    const allProductSelects = document.querySelectorAll('.sale-product-select');
    allProductSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccionar producto...</option>';
        
        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            const precioMostrar = producto.precioNormal || producto.precioVenta || 0;
            option.textContent = `${producto.codigo} - $${formatNumberWithCommas(parseFloat(precioMostrar).toFixed(2))}`;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
    
    // También actualizar selects del modal de edición (formato antiguo)
    const editSaleProducto = document.getElementById('editSaleProducto');
    if (editSaleProducto) {
        const currentValue = editSaleProducto.value;
        editSaleProducto.innerHTML = '<option value="">Seleccionar producto...</option>';
        
        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            const precioMostrar = producto.precioNormal || producto.precioVenta || 0;
            option.textContent = `${producto.codigo} - $${formatNumberWithCommas(parseFloat(precioMostrar).toFixed(2))}`;
            editSaleProducto.appendChild(option);
        });
        
        if (currentValue) {
            editSaleProducto.value = currentValue;
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

// Funciones para formatear y parsear números con comas
function formatNumberWithCommas(value) {
    if (!value && value !== 0) return '';
    // Convertir a número si es string
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    
    // Solo formatear si tiene 4 o más dígitos en la parte entera
    const numStr = num.toString();
    const parts = numStr.split('.');
    const integerPart = parts[0];
    
    if (integerPart.length >= 4) {
        // Formatear con comas
        const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        // Mantener decimales si existen
        return parts.length > 1 ? `${formatted}.${parts[1]}` : formatted;
    }
    
    // Si tiene menos de 4 dígitos, devolver tal cual (puede tener decimales)
    return numStr;
}

function parseNumberWithCommas(value) {
    if (!value) return 0;
    // Remover comas y convertir a número
    const cleaned = String(value).replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

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

