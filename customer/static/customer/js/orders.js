document.addEventListener("DOMContentLoaded", () => {
    console.log("Order List Page Loaded ✅");

    // --- MODIFICATION: Renamed and added styles for the review button ---
    // We add this function to inject styles dynamically.
    function injectDynamicCSS() {
        // Check if CSS is already injected
        if (document.getElementById('orders-dynamic-styles')) return;

        const style = document.createElement('style');
        style.id = 'orders-dynamic-styles';
        style.innerHTML = `
        /* --- Tracking Modal Styles (from before) --- */
        .tracking-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .tracking-modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        .tracking-modal {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .tracking-modal-overlay.active .tracking-modal {
            transform: scale(1);
        }
        .tracking-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .tracking-modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
            font-family: "Playfair Display", serif;
        }
        .tracking-modal-header .close-modal {
            font-size: 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            color: #888;
            line-height: 1;
        }
        .tracking-pipeline {
            list-style: none;
            padding: 0;
            margin: 0;
            position: relative;
        }
        /* The vertical line */
        .tracking-pipeline::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 9px; /* (Circle width / 2) - (line width / 2) */
            width: 2px;
            height: calc(100% - 20px);
            background: #e0e0e0;
        }
        .tracking-pipeline-item {
            position: relative;
            padding-left: 30px; /* Space for the circle */
            margin-bottom: 20px;
        }
        .tracking-pipeline-item:last-child {
            margin-bottom: 0;
        }
        /* The circle */
        .tracking-pipeline-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 5px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #e0e0e0; /* Pending */
            border: 3px solid #fff;
            z-index: 1;
        }
        .tracking-pipeline-item.completed::before {
            background: #28a745; /* Green for completed */
        }
        .tracking-pipeline-item.active::before {
            background: #007bff; /* Blue for active */
            box-shadow: 0 0 0 3px #cce5ff;
        }
        .tracking-pipeline-item strong {
            display: block;
            font-weight: 600;
            color: #333;
        }
        .tracking-pipeline-item span {
            font-size: 0.85rem;
            color: #777;
        }

        /* Cancel Button (for non-delivered orders) */
.cancel-btn {
  background-color: #ff9800;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #e68900;
}

/* Return Button (for delivered orders) */
.return-btn {
  background-color: #ff4d4d;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.return-btn:hover {
  background-color: #cc0000;
}

/* Responsive buttons */
@media (max-width: 600px) {
  .order-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .order-buttons button {
    width: 100%;
  }
}


        /* --- Review Button Style --- */
        .review-item-btn {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--secondary-color, #d11c5b);
            text-decoration: none;
            margin-top: 8px;
            display: inline-block;
            padding: 4px 8px;
            border: 1px solid var(--secondary-color, #d11c5b);
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        .review-item-btn:hover {
            background-color: #fef5f8;
            color: #a71448;
            text-decoration: none;
        }
        .review-item-btn i {
            margin-right: 4px;
        }

        /* --- START MODIFICATION: Styles for click-to-show review button --- */
        .review-item-btn-hidden {
            display: none;
        }
        
        .order-item[data-status="Delivered"] {
            /* Only show click cursor on items that are delivered */
            cursor: pointer;
        }
        /* --- END MODIFICATION --- */
    `;
        document.head.appendChild(style);
    }
    // --- END MODIFICATION ---


    // --- NEW FUNCTION: Show Tracking Modal ---
    function showTrackingModal(orderId, orderStatus) {
        // Ensure CSS is injected
        injectDynamicCSS(); // Uses the renamed function

        // Remove existing modal first
        document.getElementById('tracking-modal-overlay')?.remove();

        // --- Define tracking steps ---
        // Map database statuses to display labels
        const statusMapping = {
            'pending': 'Ordered',
            'fulfilled': 'Fulfilled',
            'shipping': 'Shipping',
            'shipped': 'Shipped',
            'delivered': 'Delivered'
        };

        const currentStatusLower = orderStatus.toLowerCase();
        let allSteps, statusOrder;

        if (['return_requested', 'returned'].includes(currentStatusLower)) {
            // Return Flow
            allSteps = ['Ordered', 'Shipping', 'Shipped', 'Delivered', 'Return Requested', 'Returned'];
            statusOrder = ['pending', 'shipping', 'shipped', 'delivered', 'return_requested', 'returned'];
        } else {
            // Normal Flow
            allSteps = ['Ordered', 'Shipping', 'Shipped', 'Delivered', 'Fulfilled'];
            statusOrder = ['pending', 'shipping', 'shipped', 'delivered', 'fulfilled'];
        }

        let activeStepFound = false;
        let pipelineHTML = '';

        // Determine the date for the "Ordered" status (assuming current date for demo)
        // In a real app, you'd get this from the order object
        const orderDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Find the current status index
        const currentStatusIndex = statusOrder.indexOf(currentStatusLower);

        allSteps.forEach((step, index) => {
            let statusClass = '';
            const dbStatus = statusOrder[index];

            if (currentStatusIndex === -1) {
                // Unknown status, mark first as active
                statusClass = index === 0 ? 'active' : '';
            } else if (index < currentStatusIndex) {
                // Steps before current status are completed
                statusClass = 'completed';
            } else if (index === currentStatusIndex) {
                // Current status is active
                statusClass = 'active';
            }
            // Steps after current status remain unmarked (default gray)

            // Add a simple date for completed/active steps
            const date = (statusClass === 'completed' || statusClass === 'active') ? `<span>${orderDate}</span>` : '';

            pipelineHTML += `
            <li class="tracking-pipeline-item ${statusClass}">
                <strong>${step}</strong>
                ${date}
            </li>
        `;
        });

        // --- Create Modal HTML ---
        const modalHTML = `
        <div class="tracking-modal-overlay active" id="tracking-modal-overlay">
            <div class="tracking-modal">
                <div class="tracking-modal-header">
                    <h3>Track Order: ${orderId}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="tracking-modal-body">
                    <ul class="tracking-pipeline">
                        ${pipelineHTML}
                    </ul>
                </div>
            </div>
        </div>
    `;

        // --- Add to body and add listeners ---
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('tracking-modal-overlay');
        const closeBtn = overlay.querySelector('.close-modal');

        const closeModal = () => {
            overlay.classList.remove('active');
            // Remove from DOM after transition
            setTimeout(() => overlay.remove(), 300);
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }


    // --- Constants (from checkout.js) ---
    const ALL_ORDERS_KEY = "he_she_all_orders";
    const SELECTED_REGION_KEY = "he_she_selected_region";
    // --- ADDED: Keys needed for review functionality ---
    const REVIEWS_KEY = "he_she_reviews";
    const PROFILE_DATA_KEY = "he_she_profile_data";


    // --- Exchange Rates (Prices stored in USD) ---
    const EXCHANGE_RATES = {
        ca: { rate: 1.33, symbol: "CA$" }, // USD to CAD (1 USD = 1.33 CAD)
        us: { rate: 1.0, symbol: "US$" }   // USD to USD (no conversion)
    };

    // --- Product Catalog - Will be loaded from API ---
    let originalAllProductsINR = [];

    // --- Fetch products from API ---
    async function loadProductsFromAPI() {
        try {
            const response = await fetch('/api/products/');
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    originalAllProductsINR = data.products.map(p => ({
                        id: p.id, // slug
                        name: p.name,
                        price: parseFloat(p.price).toString(),
                        discount_price: p.discount_price ? parseFloat(p.discount_price).toString() : null,
                        image: p.image || '/static/customer/images/placeholder.jpg',
                        category: p.category || ''
                    }));
                    console.log('Products loaded from API for orders:', originalAllProductsINR.length);
                    // Load orders after products are loaded
                    loadAllOrders();
                } else {
                    console.warn('No products found in API response');
                    loadAllOrders(); // Still load orders even if no products
                }
            } else {
                console.error('Failed to fetch products from API');
                loadAllOrders(); // Still load orders even if API fails
            }
        } catch (error) {
            console.error('Error loading products from API:', error);
            loadAllOrders(); // Still load orders even if error
        }
    }


    // --- Helper Functions (from checkout.js) ---
    function getSelectedRegion() {
        return localStorage.getItem(SELECTED_REGION_KEY) || 'ca';
    }
    function convertUsdToTargetCurrency(priceUsdStr, region) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
        // Use parseFloat to preserve decimal places, remove non-numeric characters except decimal point
        const priceNum = parseFloat(String(priceUsdStr).replace(/[^0-9.]/g, '')) || 0;
        return isNaN(priceNum) ? 0 : (priceNum * regionData.rate);
    }
    // Keep old function name for backward compatibility
    function convertInrToTargetCurrency(priceUsdStr, region) {
        return convertUsdToTargetCurrency(priceUsdStr, region);
    }
    function formatCurrency(amount, region) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['ca'];
        return `${regionData.symbol}${amount.toFixed(2)}`;
    }

    // --- Main Function to Load ALL Orders from Backend API ---
    // --- Helper to Render Detailed View ---
    function renderSingleOrderView(order, currentRegion) {
        const detailContainer = document.getElementById('single-order-detail-view');
        const listContainer = document.getElementById('orders-list-container');
        const breadcrumb = document.querySelector('.breadcrumb');
        const sidebar = document.querySelector('.order-summary-sidebar');

        if (!detailContainer) return;

        // Toggle Visibility
        if (listContainer) listContainer.style.display = 'none';
        if (breadcrumb) breadcrumb.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        detailContainer.style.display = 'block';

        // Populate Fields
        document.getElementById('detail-order-id').textContent = `#${order.order_number || order.order_id}`;

        // Status Badge
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-badge ${order.status}`;
        statusSpan.style.padding = '6px 12px';
        statusSpan.style.borderRadius = '20px';
        statusSpan.style.backgroundColor = getStatusColor(order.status);
        statusSpan.style.color = '#fff';
        statusSpan.style.fontWeight = 'bold';
        statusSpan.style.fontSize = '0.9rem';
        statusSpan.textContent = order.status.toUpperCase();

        const statusContainer = document.getElementById('detail-order-status');
        statusContainer.innerHTML = '';
        statusContainer.appendChild(statusSpan);

        // Customer Info
        document.getElementById('detail-customer-name').textContent = order.customer_name || 'N/A';
        document.getElementById('detail-customer-email').textContent = order.customer_email || 'N/A';
        document.getElementById('detail-customer-phone').textContent = order.customer_phone || 'N/A';

        // Addresses
        document.getElementById('detail-shipping-address').textContent = order.shipping_address || 'N/A';
        document.getElementById('detail-shipping-city').textContent = order.shipping_city || '';
        document.getElementById('detail-shipping-pincode').textContent = order.shipping_pincode || '';

        // Payment Info
        document.getElementById('detail-payment-method').textContent = order.payment_method || 'N/A';
        document.getElementById('detail-payment-status').textContent = order.payment_status || 'N/A';

        const dateObj = new Date(order.order_date);
        document.getElementById('detail-order-date').textContent = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

        // Financials (Convert Currency)
        const subtotalConv = convertUsdToTargetCurrency(order.subtotal_amount, currentRegion);
        const shippingConv = convertUsdToTargetCurrency(order.shipping_amount, currentRegion);
        const taxConv = convertUsdToTargetCurrency(order.tax_amount, currentRegion);
        const discountConv = convertUsdToTargetCurrency(order.discount_amount, currentRegion);
        const totalConv = convertUsdToTargetCurrency(order.total_amount, currentRegion);

        document.getElementById('detail-subtotal').textContent = formatCurrency(subtotalConv, currentRegion);
        document.getElementById('detail-shipping-cost').textContent = formatCurrency(shippingConv, currentRegion);
        document.getElementById('detail-tax').textContent = formatCurrency(taxConv, currentRegion);
        document.getElementById('detail-discount').textContent = `-${formatCurrency(discountConv, currentRegion)}`;
        document.getElementById('detail-grand-total').textContent = formatCurrency(totalConv, currentRegion);

        // Items Table
        const tbody = document.getElementById('detail-items-body');
        tbody.innerHTML = '';

        order.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f0f0f0';

            const priceConv = convertUsdToTargetCurrency(item.effective_price, currentRegion);
            const itemTotalConv = convertUsdToTargetCurrency(item.total_price, currentRegion);

            tr.innerHTML = `
                <td style="padding: 12px; display: flex; align-items: center; gap: 15px;">
                    <img src="${item.product_image}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                    <div>
                        <div style="font-weight: 500; color: #333;">${item.product_name}</div>
                        <div style="font-size: 0.85rem; color: #777;">${item.category}</div>
                    </div>
                </td>
                <td style="padding: 12px;">${formatCurrency(priceConv, currentRegion)}</td>
                <td style="padding: 12px;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; font-weight: 500;">${formatCurrency(itemTotalConv, currentRegion)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function getStatusColor(status) {
        switch (status) {
            case 'pending': return '#f39c12';
            case 'shipping': return '#3498db';
            case 'shipped': return '#2980b9';
            case 'delivered': return '#27ae60';
            case 'cancelled': return '#c0392b';
            case 'returned': return '#8e44ad';
            default: return '#95a5a6';
        }
    }

    // --- Helper to Check Return Window (IST Rule) ---
    function isReturnWindowOpen(deliveredAtIso) {
        if (!deliveredAtIso) return false;
        try {
            const d = new Date(deliveredAtIso);
            const istOffsetMs = 19800000; // 5.5 * 60 * 60 * 1000
            const deliveredIstMs = d.getTime() + istOffsetMs;
            const deliveredIstDate = new Date(deliveredIstMs);

            // Get Day/Month/Year components in IST (using UTC getters on shifted time)
            const year = deliveredIstDate.getUTCFullYear();
            const month = deliveredIstDate.getUTCMonth();
            const day = deliveredIstDate.getUTCDate();

            // Business Rule:
            // 1. Effective Date = Delivered Date (IST) - 1 Day
            // 2. Return Window = 5 days from Effective Date
            //    Deadline = (Delivered - 1) + 4 = Delivered + 3 days

            const deadlineDay = day + 3;

            // Construct Deadline in "IST-shifted Frame" using UTC setter (End of Day: 23:59:59.999)
            // Date.UTC handles overflow (e.g. Jan 32 -> Feb 1) automatically
            const deadlineIstFrameMs = Date.UTC(year, month, deadlineDay, 23, 59, 59, 999);

            // Convert Deadline back to real absolute time (subtract offset)
            const deadlineRealMs = deadlineIstFrameMs - istOffsetMs;

            // Compare with Now
            const nowMs = Date.now();

            return nowMs <= deadlineRealMs;
        } catch (e) {
            console.error("Error checking return window:", e);
            return false;
        }
    }

    // --- Main Function to Load ALL Orders from Backend API ---
    async function loadAllOrders() {
        const listContainer = document.getElementById('orders-list-container');
        // We use listContainer for loading message, unless we are in single view

        const singleOrderId = document.body.dataset.singleOrderId;

        if (singleOrderId) {
            // SINGLE ORDER MODE
            try {
                const response = await fetch(`/api/orders/${singleOrderId}/`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();

                if (data && data.order) {
                    const currentRegion = getSelectedRegion();
                    renderSingleOrderView(data.order, currentRegion);
                } else {
                    document.body.innerHTML = "<h2 style='text-align:center; padding:50px;'>Order not found or access denied.</h2>";
                }
            } catch (error) {
                console.error("Error loading single order:", error);
                document.body.innerHTML = `<h2 style='text-align:center; padding:50px; color:red;'>Error loading order: ${error.message}</h2>`;
            }
            return; // EXIT FUNCTION - DO NOT LOAD LIST
        }

        // --- STANDARD LIST MODE (Below happens only if no singleOrderId) ---
        const sidebar = document.querySelector('.order-summary-sidebar');
        if (!listContainer || !sidebar) return;

        // Hide the single-order sidebar
        sidebar.style.display = 'none';
        listContainer.style.gridColumn = "1 / -1";

        // Show loading state
        listContainer.innerHTML = '<p style="text-align: center; padding: 40px;">Loading orders...</p>';

        try {
            // Fetch ALL orders
            const response = await fetch('/api/orders/');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (!data.success || !data.orders || data.orders.length === 0) {
                listContainer.innerHTML = "<p style='text-align: center; padding: 40px;'>You have not placed any orders yet.</p>";
                return;
            }

            const orders = data.orders;
            const currentRegion = getSelectedRegion();

            // Clear loading state
            listContainer.innerHTML = '';

            // Loop through orders (newest first)
            orders.forEach(order => {
                const orderCard = createOrderCard(order, currentRegion); // Refactored to helper for cleanliness
                listContainer.appendChild(orderCard);
            });

            // Add event listeners for buttons
            addDynamicButtonListeners(listContainer);

        } catch (error) {
            console.error('Error loading orders:', error);
            listContainer.innerHTML = `
            <p style='text-align: center; padding: 40px; color: #e74c3c;'>
                Error loading orders. Please try refreshing the page.<br>
                <small>${error.message}</small>
            </p>
        `;
        }
    }

    // Helper to create the CARD HTML (Logic moved from original loop)
    function createOrderCard(order, currentRegion) {
        const orderCard = document.createElement('section');
        orderCard.className = 'order-card';
        // ... (Logic to build card HTML - essentially reusing your existing code but wrapped)
        // For brevity in this replacement, I'll inline the existing logic from lines 414-522
        // BUT wait, replace_file_content replaces a block. I need to be careful not to delete the entire logic if I can't put it back easily.
        // Actually, since I'm rewriting the whole loadAllOrders block, I need to restore the card generation logic.

        let itemsHTML = '';
        order.items.forEach(item => {
            const name = item.product_name || "Unknown Product";
            const image = item.product_image || '/static/customer/images/placeholder.jpg';
            const effectivePrice = item.effective_price || item.price || 0;
            const totalItemPrice = item.total_price || (effectivePrice * item.quantity);
            const pricePerUnitConverted = convertUsdToTargetCurrency(effectivePrice, currentRegion);
            const totalItemPriceConverted = convertUsdToTargetCurrency(totalItemPrice, currentRegion);
            const productUrl = item.product_id ? `/product/${item.product_id}?img=${encodeURIComponent(image)}` : '#';

            let reviewButtonHTML = '';
            // ... review button logic ...
            if (order.status === 'delivered') {
                reviewButtonHTML = `
                        <button class="review-item-btn review-item-btn-hidden open-review-modal-btn" 
                                data-product-id="${item.product_id}" 
                                data-product-name="${name}" 
                                data-product-image="${image}">
                            <i class="fas fa-star"></i> Write a Review
                        </button>
                    `;
            }

            itemsHTML += `
                   <div class="order-item" data-status="${order.status}">
                     <a href="${productUrl}" style="line-height: 0;"> 
                       <img src="${image}" alt="${name}">
                     </a>
                     <div class="item-info">
                       <h3>
                         <a href="${productUrl}" style="text-decoration: none; color: inherit;">
                           ${name}
                         </a>
                       </h3>
                       <p>Sold by: HE SHE STYLES</p>
                       ${reviewButtonHTML}
                     </div>
                     <div class="item-price">
                       <p>${formatCurrency(pricePerUnitConverted, currentRegion)}</p>
                       <span>Qty: ${item.quantity}</span>
                       <p class="item-total">Total: ${formatCurrency(totalItemPriceConverted, currentRegion)}</p>
                     </div>
                   </div>
                 `;
        });

        const orderDate = new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const orderStatus = order.status || 'pending';
        const orderStatusCapitalized = orderStatus.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());

        let statusHTML = '';
        if (orderStatus === 'delivered') {
            const deliveryDate = new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            statusHTML = `🟢 Delivered on: <strong>${deliveryDate}</strong>`;
        } else if (orderStatus === 'cancelled') {
            statusHTML = ` Status: <strong>Cancelled</strong>`;
        } else if (orderStatus === 'return_requested') {
            statusHTML = `🟡 Status: <strong>Return Requested</strong>`;
        } else if (orderStatus === 'returned') {
            statusHTML = `🔵 Status: <strong>Returned</strong>`;
        } else {
            statusHTML = `🟠 Status: <strong>${orderStatusCapitalized}</strong>`;
        }

        let actionButtonHTML = '';
        const statusLower = (orderStatus || '').toLowerCase();

        // Block Cancel if shipped/delivered/shipping
        // Allow Return if delivered AND window open
        if (statusLower === 'delivered') {
            if (isReturnWindowOpen(order.delivered_at)) {
                actionButtonHTML = `<button class="return-btn" data-order-id="${order.order_number || order.order_id}">↩️ Return Order</button>`;
            } else {
                // Window expired - show nothing or maybe a disabled button/text?
                // Requirement: "return option must automatically disappear"
                actionButtonHTML = '';
            }
        } else if (['cancelled', 'return_requested', 'returned', 'shipped', 'shipping', 'fulfilled'].includes(statusLower)) {
            // Cannot cancel, cannot return (unless delivered, handled above)
            actionButtonHTML = '';
        } else {
            // Pending or other states where cancel is allowed
            actionButtonHTML = `<button class="cancel-btn" data-order-id="${order.order_number || order.order_id}">❌ Cancel Order</button>`;
        }

        const totalOrderAmountConverted = convertUsdToTargetCurrency(order.total_amount, currentRegion);

        orderCard.innerHTML = `
                 <header class="order-header">
                   <div class="order-info">
                     <h2>Order ID: <span>${order.order_number || order.order_id}</span></h2>
                     <p class="order-date">Order date: <strong>${orderDate}</strong></p>
                     <p class="delivery-estimate">${statusHTML}</p>
                   </div>
                   <div class="order-buttons">
                     ${orderStatus === 'cancelled' ? '' : `<button class="track-btn" data-order-id="${order.order_number || order.order_id}" data-order-status="${orderStatus}">Track Order 🚚</button>`}
                     ${actionButtonHTML}
                   </div>
                 </header>
                 <div class="order-items">
                   ${itemsHTML}
                 </div>
                 <div style="text-align: right; font-weight: 600; padding-top: 15px; border-top: 1px solid #eee; margin-top: 10px;">
                     Order Total: ${formatCurrency(totalOrderAmountConverted, currentRegion)}
                 </div>
             `;
        return orderCard;
    }

    // --- MODIFIED: Add delegated listeners for dynamic buttons ---
    function addDynamicButtonListeners(container) {
        container.addEventListener('click', (e) => {
            // Check for track button
            if (e.target.classList.contains('track-btn')) {
                e.preventDefault(); // Prevent link navigation if button is inside <a>
                const orderId = e.target.dataset.orderId;
                const orderStatus = e.target.dataset.orderStatus; // Get the status

                // --- REPLACED ALERT WITH MODAL ---
                showTrackingModal(orderId, orderStatus);
            }
            // Check for invoice button
            if (e.target.classList.contains('invoice-btn')) {
                e.preventDefault(); // Prevent link navigation
                const orderId = e.target.dataset.orderId;
                alert(`Invoice for Order ${orderId} is not available.`);
            }

            // --- Open Review Modal ---
            if (e.target.closest('.open-review-modal-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.open-review-modal-btn');
                const productId = btn.dataset.productId;
                const productName = btn.dataset.productName;
                const productImage = btn.dataset.productImage;

                openReviewModal(productId, productName, productImage);
            }

            // --- Cancel Order Modal Logic (for non-delivered orders) ---
            if (e.target.classList.contains('cancel-btn')) {
                e.preventDefault();
                const orderId = e.target.dataset.orderId;

                // Remove existing modal if open
                document.getElementById('cancel-modal-overlay')?.remove();

                // Create modal HTML for Cancel
                const modalHTML = `
      <div class="return-modal-overlay active" id="cancel-modal-overlay">
        <div class="return-modal">
          <h3>Cancel Order #${orderId}</h3>

          <div class="checkbox-group" id="cancel-reasons">
            <p><strong>Select Reason(s) for Cancellation:</strong></p>
            <label><input type="checkbox" value="ordered-by-mistake"> Ordered by mistake</label>
            <label><input type="checkbox" value="better-price"> Found a better price elsewhere</label>
            <label><input type="checkbox" value="delivery-time"> Delivery time is too long</label>
            <label><input type="checkbox" value="changed-mind"> Changed my mind</label>
            <label><input type="checkbox" value="other"> Other</label>
          </div>

          <div class="modal-actions">
            <button class="return-cancel-btn">Close</button>
            <button class="return-submit-btn">Confirm Cancellation</button>
          </div>
        </div>
      </div>
    `;

                document.body.insertAdjacentHTML('beforeend', modalHTML);

                const overlay = document.getElementById('cancel-modal-overlay');
                const cancelBtn = overlay.querySelector('.return-cancel-btn');
                const submitBtn = overlay.querySelector('.return-submit-btn');
                const reasonCheckboxes = overlay.querySelectorAll('#cancel-reasons input[type="checkbox"]');

                // Close button
                cancelBtn.addEventListener('click', () => overlay.remove());

                // Submit button
                submitBtn.addEventListener('click', async () => {
                    const selectedReasons = [...reasonCheckboxes].filter(cb => cb.checked).map(cb => cb.value);

                    if (selectedReasons.length === 0) {
                        alert("Please select at least one reason for cancellation.");
                        return;
                    }

                    // Show loading state
                    submitBtn.textContent = "Cancelling...";
                    submitBtn.disabled = true;

                    try {
                        const response = await fetch('/api/orders/cancel/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken') // Function to be defined
                            },
                            body: JSON.stringify({
                                order_id: orderId,
                                reasons: selectedReasons
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            overlay.remove();
                            showSuccessModal(
                                "Order Cancelled!",
                                `Your order #${orderId} has been successfully cancelled.`,
                                () => { loadAllOrders(); }
                            );
                        } else {
                            alert(`❌ Failed to cancel order: ${data.message}`);
                            submitBtn.textContent = "Confirm Cancellation";
                            submitBtn.disabled = false;
                        }
                    } catch (error) {
                        console.error('Error cancelling order:', error);
                        alert("An error occurred while cancelling the order.");
                        submitBtn.textContent = "Confirm Cancellation";
                        submitBtn.disabled = false;
                    }
                });

                // Close modal when clicking outside
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) overlay.remove();
                });
            }

            // --- Return Order Modal Logic (for delivered orders) ---
            if (e.target.classList.contains('return-btn')) {
                e.preventDefault();
                const orderId = e.target.dataset.orderId;

                // Remove existing modal if open
                document.getElementById('return-modal-overlay')?.remove();

                // Create modal HTML for Return
                const modalHTML = `
      <div class="return-modal-overlay active" id="return-modal-overlay">
        <div class="return-modal">
          <h3>Return Order #${orderId}</h3>

          <div class="checkbox-group" id="return-reasons">
            <p><strong>Select Reason(s) for Return:</strong></p>
            <label><input type="checkbox" value="product-damaged"> Product damaged</label>
            <label><input type="checkbox" value="wrong-item"> Wrong item delivered</label>
            <label><input type="checkbox" value="size-fit-issue"> Size/fit issue</label>
            <label><input type="checkbox" value="quality-issue"> Quality not as expected</label>
            <label><input type="checkbox" value="other"> Other</label>
          </div>

          <div class="checkbox-group" id="return-conditions" style="display:none;">
            <p><strong>Return Conditions:</strong></p>
            <ol>
            <li>Tags must not be removed</li>
            <li>Product should be returned within 7 days of delivery</li>
            </ol>
          </div>

          <div class="modal-actions">
            <button class="return-cancel-btn">Close</button>
            <button class="return-submit-btn">Submit Return Request</button>
          </div>
        </div>
      </div>
    `;

                document.body.insertAdjacentHTML('beforeend', modalHTML);

                const overlay = document.getElementById('return-modal-overlay');
                const cancelBtn = overlay.querySelector('.return-cancel-btn');
                const submitBtn = overlay.querySelector('.return-submit-btn');
                const reasonCheckboxes = overlay.querySelectorAll('#return-reasons input[type="checkbox"]');
                const conditionsBox = overlay.querySelector('#return-conditions');

                // Show conditions when any reason is checked
                reasonCheckboxes.forEach(box => {
                    box.addEventListener('change', () => {
                        const anyChecked = [...reasonCheckboxes].some(cb => cb.checked);
                        conditionsBox.style.display = anyChecked ? 'block' : 'none';
                    });
                });

                // Close button
                cancelBtn.addEventListener('click', () => overlay.remove());

                // Submit button
                submitBtn.addEventListener('click', async () => {
                    const selectedReasons = [...reasonCheckboxes].filter(cb => cb.checked).map(cb => cb.value);

                    if (selectedReasons.length === 0) {
                        alert("Please select at least one return reason.");
                        return;
                    }

                    // Show loading state
                    submitBtn.textContent = "Submitting...";
                    submitBtn.disabled = true;

                    try {
                        const response = await fetch('/api/orders/return/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify({
                                order_id: orderId,
                                reasons: selectedReasons
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            overlay.remove();
                            showSuccessModal(
                                "Return Requested!",
                                `Your return request for Order #${orderId} has been submitted successfully.`,
                                () => { loadAllOrders(); }
                            );
                        } else {
                            alert(`❌ Failed to submit return request: ${data.message}`);
                            submitBtn.textContent = "Submit Return Request";
                            submitBtn.disabled = false;
                        }
                    } catch (error) {
                        console.error('Error submitting return request:', error);
                        alert("An error occurred while submitting return request.");
                        submitBtn.textContent = "Submit Return Request";
                        submitBtn.disabled = false;
                    }
                });

                // Close modal when clicking outside
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) overlay.remove();
                });
            }

            // Find the .order-item that was clicked
            const clickedItem = e.target.closest('.order-item');

            // 1. If the click was *on* the review button itself, do nothing.
            // This allows the <a> tag's default link behavior to work.
            if (e.target.closest('.review-item-btn') && !e.target.closest('.open-review-modal-btn')) {
                return;
            }

            // 2. If the click was anywhere else *inside* an order item
            if (clickedItem) {

                // 3. First, hide all *other* review buttons that might be visible
                container.querySelectorAll('.review-item-btn:not(.review-item-btn-hidden)').forEach(btn => {
                    // Check if this button is *inside* the item we just clicked
                    // If it's not, hide it.
                    if (!clickedItem.contains(btn)) {
                        btn.classList.add('review-item-btn-hidden');
                    }
                });

                // 4. Find the review button *inside* the item that was clicked
                const reviewBtn = clickedItem.querySelector('.review-item-btn');

                // 5. If the item is "Delivered" and has a review button...
                if (clickedItem.dataset.status === 'Delivered' && reviewBtn) {
                    // ...toggle the hidden class on it.
                    reviewBtn.classList.toggle('review-item-btn-hidden');
                }
            }
            // --- END MODIFICATION ---
        });
    }

    // --- Helper for CSRF Token ---
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // --- Review Modal Logic ---
    const reviewModalOverlay = document.getElementById('review-submission-modal-overlay');
    const reviewForm = document.getElementById('review-submission-form');
    const closeReviewModalBtn = document.getElementById('close-review-submit-modal');
    const starsContainer = document.getElementById('review-modal-stars');
    const ratingInput = document.getElementById('review-modal-rating');

    function openReviewModal(productId, productName, productImage) {
        if (!reviewModalOverlay) return;

        // Reset form
        reviewForm.reset();
        ratingInput.value = "0";
        updateStarDisplay(0);

        // Set product details
        document.getElementById('review-product-id').value = productId;
        document.getElementById('review-modal-product-name').textContent = `Write a Review for ${productName}`;
        document.getElementById('review-modal-product-image').src = productImage;

        // Show modal
        reviewModalOverlay.classList.add('active');
    }

    if (closeReviewModalBtn) {
        closeReviewModalBtn.addEventListener('click', () => {
            reviewModalOverlay.classList.remove('active');
        });
    }

    if (reviewModalOverlay) {
        reviewModalOverlay.addEventListener('click', (e) => {
            if (e.target === reviewModalOverlay) {
                reviewModalOverlay.classList.remove('active');
            }
        });
    }

    // Star Rating Interaction
    if (starsContainer) {
        const stars = starsContainer.querySelectorAll('i');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = star.dataset.value;
                ratingInput.value = rating;
                updateStarDisplay(rating);
            });

            star.addEventListener('mouseover', () => {
                const rating = star.dataset.value;
                highlightStars(rating);
            });

            star.addEventListener('mouseout', () => {
                const currentRating = ratingInput.value;
                updateStarDisplay(currentRating);
            });
        });
    }

    function updateStarDisplay(rating) {
        const stars = starsContainer.querySelectorAll('i');
        stars.forEach(star => {
            if (star.dataset.value <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
                star.style.color = '#f1c40f'; // active color
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
                star.style.color = ''; // default color
            }
        });
    }

    function highlightStars(rating) {
        const stars = starsContainer.querySelectorAll('i');
        stars.forEach(star => {
            if (star.dataset.value <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
                star.style.color = '#f39c12'; // hover color
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
                star.style.color = '';
            }
        });
    }

    // Submit Review
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-review-button');
            const productId = document.getElementById('review-product-id').value;
            const rating = ratingInput.value;
            const comment = document.getElementById('review-modal-comment').value;

            if (rating === "0") {
                alert("Please click on dots to give a rating.");
                return;
            }

            submitBtn.textContent = "Submitting...";
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('product_id', productId);
            formData.append('rating', rating);
            formData.append('comment', comment);

            // Add images
            const img1 = document.getElementById('review-image-1')?.files[0];
            const img2 = document.getElementById('review-image-2')?.files[0];
            const img3 = document.getElementById('review-image-3')?.files[0];

            if (img1) formData.append('image1', img1);
            if (img2) formData.append('image2', img2);
            if (img3) formData.append('image3', img3);

            try {
                const response = await fetch('/api/reviews/submit/', {
                    method: 'POST',
                    body: formData, // Auto sets Content-Type to multipart/form-data
                    headers: {
                        // 'Content-Type': 'multipart/form-data', // Do NOT set this manually with FormData
                        // 'X-CSRFToken': getCookie('csrftoken') // Handled by @csrf_exempt for now to be safe, or include if needed
                    }
                });

                const data = await response.json();

                if (data.success) {
                    alert('Review submitted successfully!');
                    reviewModalOverlay.classList.remove('active');
                } else {
                    alert(`Failed to submit review: ${data.message}`);
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('An error occurred. Please try again.');
            } finally {
                submitBtn.textContent = "Submit Review";
                submitBtn.disabled = false;
            }
        });
    }



    // --- Helper: Success Modal ---
    function showSuccessModal(title, message, onCloseCallback) {
        const modalHTML = `
      <div class="return-modal-overlay active" id="success-modal-overlay">
        <div class="return-modal" style="text-align: center; max-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 10px;"></div>
          <h3 style="color: #28a745; margin-bottom: 15px;">${title}</h3>
          <p style="font-size: 16px; margin-bottom: 25px; color: #555;">${message}</p>
          <div class="modal-actions" style="justify-content: center;">
            <button class="return-submit-btn" style="width: 100%; max-width: 200px;">Okay, Got it!</button>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('success-modal-overlay');
        const okBtn = overlay.querySelector('.return-submit-btn');

        const closeAndCallback = () => {
            overlay.remove();
            if (onCloseCallback) onCloseCallback();
        };

        okBtn.addEventListener('click', closeAndCallback);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAndCallback();
        });
    }

    // --- Initial Load ---
    injectDynamicCSS(); // Call this once to make sure styles are ready

    // Load products from API first, then load orders
    loadProductsFromAPI();

    // Listen for region changes to update prices
    document.addEventListener('regionChanged', () => {
        loadProductsFromAPI(); // Reload products and orders when region changes
    });

});
