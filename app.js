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
            <img src="${producto.foto || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                 alt="${producto.codigo}" 
                 class="product-image"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
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
        cantidad: parseInt(document.getElementById('editProductCantidad').value)
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
            <img src="${producto.foto || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                 alt="${producto.codigo}" 
                 class="catalogo-image"
                 onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
            <div class="catalogo-info">
                <div class="codigo">${producto.codigo}</div>
                <div class="precio">$${parseFloat(producto.precioVenta).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
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

