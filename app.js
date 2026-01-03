// Datos almacenados en localStorage
const STORAGE_KEYS = {
    PRODUCTOS: 'inventario_productos',
    VENTAS: 'inventario_ventas',
    ABONOS: 'inventario_abonos'
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

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
                    <label>Precio Compra:</label>
                    <span>$${parseFloat(producto.precioCompra).toFixed(2)}</span>
                </div>
                <div class="product-detail">
                    <label>Precio Venta:</label>
                    <span>$${parseFloat(producto.precioVenta).toFixed(2)}</span>
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
    if (cantidad === 0) return 'out';
    if (cantidad < 5) return 'low';
    return '';
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
        codigo: document.getElementById('productCodigo').value,
        precioCompra: parseFloat(document.getElementById('productPrecioCompra').value),
        precioVenta: parseFloat(document.getElementById('productPrecioVenta').value),
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
    document.getElementById('editProductCodigo').value = producto.codigo;
    document.getElementById('editProductPrecioCompra').value = producto.precioCompra;
    document.getElementById('editProductPrecioVenta').value = producto.precioVenta;
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
        codigo: document.getElementById('editProductCodigo').value,
        precioCompra: parseFloat(document.getElementById('editProductPrecioCompra').value),
        precioVenta: parseFloat(document.getElementById('editProductPrecioVenta').value),
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

function loadCatalogo() {
    const productos = getProductos();
    const grid = document.getElementById('catalogoGrid');
    
    if (productos.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay productos en el catálogo.</p>';
        return;
    }
    
    grid.innerHTML = productos.map(producto => `
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
                <div class="precio">$${parseFloat(producto.precioVenta).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
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
        const margin = 15;
        const cardWidth = (pageWidth - 3 * margin) / 2;
        const cardHeight = 60;
        let x = margin;
        let y = margin + 20; // Espacio para el título
        
        // Título
        doc.setFontSize(20);
        doc.setTextColor(255, 105, 180); // Rosa
        doc.text('Catálogo de Productos', pageWidth / 2, margin + 10, { align: 'center' });
        
        // Fecha
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const fecha = new Date().toLocaleDateString('es-ES');
        doc.text(`Fecha: ${fecha}`, pageWidth / 2, margin + 18, { align: 'center' });
        
        y = margin + 30;
        
        // Procesar cada producto
        for (let i = 0; i < productos.length; i++) {
            const producto = productos[i];
            
            // Verificar si necesitamos una nueva página
            if (y + cardHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
                x = margin;
            }
            
            // Dibujar borde de la tarjeta
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2);
            
            // Cargar y agregar imagen
            try {
                const imgUrl = convertImageUrl(producto.foto);
                if (!imgUrl || !imgUrl.includes('drive.google.com') && !imgUrl.includes('http')) {
                    // Si no hay imagen válida, dibujar placeholder
                    doc.setFillColor(255, 230, 240);
                    doc.roundedRect(x + 5, y + 5, cardWidth - 10, 30, 2, 2, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(200, 200, 200);
                    doc.text('Sin imagen', x + cardWidth / 2, y + 20, { align: 'center' });
                } else {
                    const img = new Image();
                    // No usar crossOrigin para evitar problemas con Google Drive
                    
                    await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            // Timeout después de 5 segundos
                            doc.setFillColor(255, 230, 240);
                            doc.roundedRect(x + 5, y + 5, cardWidth - 10, 30, 2, 2, 'F');
                            doc.setFontSize(8);
                            doc.setTextColor(200, 200, 200);
                            doc.text('Cargando...', x + cardWidth / 2, y + 20, { align: 'center' });
                            resolve();
                        }, 5000);
                        
                        img.onload = () => {
                            clearTimeout(timeout);
                            try {
                                const imgWidth = cardWidth - 10;
                                const imgHeight = (img.height / img.width) * imgWidth;
                                const maxImgHeight = 35;
                                const finalImgHeight = Math.min(imgHeight, maxImgHeight);
                                const finalImgWidth = (img.width / img.height) * finalImgHeight;
                                const imgX = x + (cardWidth - finalImgWidth) / 2;
                                const imgY = y + 5;
                                
                                doc.addImage(img, 'JPEG', imgX, imgY, finalImgWidth, finalImgHeight);
                            } catch (e) {
                                console.error('Error agregando imagen al PDF:', e);
                                doc.setFillColor(255, 230, 240);
                                doc.roundedRect(x + 5, y + 5, cardWidth - 10, 30, 2, 2, 'F');
                            }
                            resolve();
                        };
                        
                        img.onerror = () => {
                            clearTimeout(timeout);
                            // Si la imagen falla, dibujar un placeholder
                            doc.setFillColor(255, 230, 240);
                            doc.roundedRect(x + 5, y + 5, cardWidth - 10, 30, 2, 2, 'F');
                            doc.setFontSize(8);
                            doc.setTextColor(200, 200, 200);
                            doc.text('Sin imagen', x + cardWidth / 2, y + 20, { align: 'center' });
                            resolve();
                        };
                        
                        img.src = imgUrl;
                    });
                }
            } catch (error) {
                console.error('Error cargando imagen:', error);
                // Dibujar placeholder en caso de error
                doc.setFillColor(255, 230, 240);
                doc.roundedRect(x + 5, y + 5, cardWidth - 10, 30, 2, 2, 'F');
            }
            
            // Código del producto
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(producto.codigo, x + cardWidth / 2, y + 42, { align: 'center' });
            
            // Precio
            doc.setFontSize(14);
            doc.setTextColor(255, 105, 180); // Rosa
            doc.setFont(undefined, 'bold');
            doc.text(`$${parseFloat(producto.precioVenta).toFixed(2)}`, x + cardWidth / 2, y + 52, { align: 'center' });
            doc.setFont(undefined, 'normal');
            
            // Mover a la siguiente posición
            x += cardWidth + margin;
            if (x + cardWidth > pageWidth - margin) {
                x = margin;
                y += cardHeight + margin;
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
    updateProductSelects();
    document.getElementById('addSaleModal').classList.add('active');
}

function addSale(event) {
    event.preventDefault();
    
    const venta = {
        id: generateId(),
        cliente: document.getElementById('saleCliente').value,
        productoId: document.getElementById('saleProducto').value,
        cantidad: parseInt(document.getElementById('saleCantidad').value),
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
    document.getElementById('editSaleTotal').value = venta.total;
    document.getElementById('editSaleFecha').value = venta.fecha;
    
    updateProductSelects('editSaleProducto');
    document.getElementById('editSaleModal').classList.add('active');
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
        y += 8;
        
        // Línea separadora
        doc.line(5, y, pageWidth - 5, y);
        y += 8;
        
        // Totales
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('SUBTOTAL:', 10, y);
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
            option.textContent = `${producto.codigo} - $${parseFloat(producto.precioVenta).toFixed(2)}`;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
    
    // Actualizar total cuando cambia producto o cantidad
    if (selectId !== 'editSaleProducto') {
        const saleProducto = document.getElementById('saleProducto');
        const saleCantidad = document.getElementById('saleCantidad');
        
        if (saleProducto && saleCantidad) {
            const updateTotal = () => {
                const productoId = saleProducto.value;
                const cantidad = parseInt(saleCantidad.value) || 0;
                const producto = productos.find(p => p.id === productoId);
                
                if (producto) {
                    document.getElementById('saleTotal').value = (producto.precioVenta * cantidad).toFixed(2);
                }
            };
            
            saleProducto.addEventListener('change', updateTotal);
            saleCantidad.addEventListener('input', updateTotal);
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
function convertImageUrl(url) {
    if (!url) return null;
    
    // Si ya es un placeholder u otra URL válida, devolverla tal cual
    if (url.includes('placeholder') || url.includes('http') && !url.includes('drive.google.com')) {
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
    
    if (fileId) {
        // Usar formato de thumbnail que funciona mejor con CORS
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
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

