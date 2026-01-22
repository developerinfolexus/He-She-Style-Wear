document.addEventListener('DOMContentLoaded', function () {
    // --- Constants ---
    const CART_KEY = "he_she_cart";
    const WISHLIST_KEY = "he_she_wishlist";
    const SELECTED_REGION_KEY = "he_she_selected_region";
    const ALL_ORDERS_KEY = "he_she_all_orders";

    // Phone input formatting
    const phoneInput = document.getElementById('billing-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/\D/g, '');
        });
    }

    // --- Exchange Rates & Currency Symbols (Prices stored in USD) ---
    const EXCHANGE_RATES = {
        ca: { rate: 1.33, symbol: "CA$" }, // USD to CAD (1 USD = 1.33 CAD)
        us: { rate: 1.0, symbol: "US$" }   // USD to USD (no conversion)
    };


    const headerUrl = document.body.dataset.headerUrl || '/api/header/';
    fetch(headerUrl)
        .then(response => response.ok ? response.text() : Promise.reject('Failed to load header'))
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = data;
                // Re-initialize dynamic header parts from index.js
                if (typeof setupSearchFunctionality === 'function') setupSearchFunctionality();
                if (typeof setupProfileDropdown === 'function') setupProfileDropdown();
                if (typeof setupNavDropdowns === 'function') setupNavDropdowns();
                if (typeof setupRegionFlagDropdown === 'function') setupRegionFlagDropdown();

                // --- THIS IS THE FIX ---
                // This function attaches the click listener to the mobile menu button
                if (typeof setupMobileMenuToggle === 'function') setupMobileMenuToggle();
                // --- END FIX ---

                // *** MODIFICATION START: Call count updates AFTER header is loaded ***
                if (typeof updateCartCount === 'function') updateCartCount();
                if (typeof updateWishlistCount === 'function') updateWishlistCount();
                // *** MODIFICATION END ***

                // Remove active nav link
                headerPlaceholder.querySelectorAll(".main-nav li.active")
                    .forEach(link => link.classList.remove('active'));
            }
        })
        .catch(error => console.error('Error loading header:', error));


    // --- Product Catalog - Will be loaded from API ---
    let originalAllProductsINR = [];

    // --- Fetch products from API ---
    async function loadProductsFromAPI() {
        try {
            const response = await fetch('/api/products/');
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    // include gender and sub_category so we can match coupons
                    originalAllProductsINR = data.products.map(p => ({
                        id: p.id, // slug
                        name: p.name,
                        price: parseFloat(p.price).toString(),
                        discount_price: p.discount_price ? parseFloat(p.discount_price).toString() : null,
                        image: p.image || '/static/customer/images/placeholder.jpg',
                        category: p.category || '',
                        gender: p.gender || '',
                        sub_category: p.sub_category || ''
                    }));
                    console.log('Products loaded from API for checkout:', originalAllProductsINR.length);
                    // ALWAYS render checkout page after products are loaded (even if cart was rendered before)
                    renderCheckoutPage();
                } else {
                    console.warn('No products found in API response');
                    // Still render with empty product list
                    renderCheckoutPage();
                }
            } else {
                console.error('Failed to fetch products from API');
                // Still render with empty product list
                renderCheckoutPage();
            }
        } catch (error) {
            console.error('Error loading products from API:', error);
            // Still render with empty product list
            renderCheckoutPage();
        }
    }



    // --- Price Conversion Functions (Prices stored in USD) ---
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
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
        return `${regionData.symbol}${amount.toFixed(2)}`;
    }

    // --- Custom Alert Modal (Duplicated for Checkout) ---
    function showCustomAlert(message, title = 'Attention') {
        // Remove existing modal if any
        const existingModal = document.getElementById('custom-alert-modal');
        if (existingModal) existingModal.remove();

        // Create modal HTML
        const modalHTML = `
            <div id="custom-alert-modal" class="custom-alert-overlay">
                <div class="custom-alert-box">
                    <div class="custom-alert-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="custom-alert-body">
                        <p>${message}</p>
                    </div>
                    <div class="custom-alert-footer">
                        <button class="custom-alert-btn">OK</button>
                    </div>
                </div>
            </div>
        `;

        // Inject styles if not already present
        if (!document.getElementById('custom-alert-styles')) {
            const styles = document.createElement('style');
            styles.id = 'custom-alert-styles';
            styles.textContent = `
                .custom-alert-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    opacity: 0;
                    animation: fadeIn 0.2s ease forwards;
                }
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
                .custom-alert-box {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    min-width: 320px;
                    max-width: 400px;
                    overflow: hidden;
                    transform: scale(0.9);
                    animation: scaleIn 0.2s ease forwards;
                }
                @keyframes scaleIn {
                    to { transform: scale(1); }
                }
                .custom-alert-header {
                    padding: 20px 24px 16px;
                    border-bottom: 1px solid #e5e5e5;
                }
                .custom-alert-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                }
                .custom-alert-body {
                    padding: 24px;
                }
                .custom-alert-body p {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.5;
                    color: #666;
                }
                .custom-alert-footer {
                    padding: 16px 24px 20px;
                    text-align: right;
                }
                .custom-alert-btn {
                    background: #000;
                    color: white;
                    border: none;
                    padding: 10px 32px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .custom-alert-btn:hover {
                    background: #333;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                .custom-alert-btn:active {
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(styles);
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal elements
        const modal = document.getElementById('custom-alert-modal');
        const btn = modal.querySelector('.custom-alert-btn');

        // Close modal function
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        };

        // Event listeners
        btn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        setTimeout(() => btn.focus(), 100);
    }
    function convertDisplayedToUsd(priceDisplayedStr, region) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
        const priceNum = parseFloat(String(priceDisplayedStr).replace(/[^0-9.]/g, ''));
        return (isNaN(priceNum) || regionData.rate === 0) ? 0 : (priceNum / regionData.rate);
    }
    // Keep old function name for backward compatibility
    function convertDisplayedToInr(priceDisplayedStr, region) {
        return convertDisplayedToUsd(priceDisplayedStr, region);
    }


    // --- Helper Functions ---
    function getCart() {
        try {
            // --- BUY NOW FIX: Check for Buy Now item first ---
            const buyNowItemStr = sessionStorage.getItem('buy_now_item');
            if (buyNowItemStr && buyNowItemStr !== 'null' && buyNowItemStr !== 'undefined') {
                try {
                    const buyNowItem = JSON.parse(buyNowItemStr);
                    if (buyNowItem && buyNowItem.id) {
                        console.log('getCart: Buy Now item found, using exclusively:', buyNowItem);
                        // Return only the Buy Now item (not the regular cart)
                        return [buyNowItem];
                    }
                } catch (e) {
                    console.warn('getCart: Error parsing buy_now_item:', e);
                }
            }
            // --- END BUY NOW FIX ---

            // First check localStorage
            let cartStr = localStorage.getItem(CART_KEY);
            console.log('getCart: Raw localStorage value for key "' + CART_KEY + '":', cartStr);

            // If localStorage is empty or invalid, check sessionStorage backup
            if (!cartStr || cartStr === 'null' || cartStr === 'undefined' || cartStr === '[]' || cartStr.trim() === '') {
                const backupStr = sessionStorage.getItem('cart_backup');
                console.log('getCart: Checking sessionStorage backup:', backupStr);
                if (backupStr && backupStr !== 'null' && backupStr !== 'undefined' && backupStr !== '[]') {
                    cartStr = backupStr;
                    // Restore to localStorage
                    localStorage.setItem(CART_KEY, backupStr);
                    console.log('getCart: Restored cart from sessionStorage backup');
                }
            }

            if (!cartStr || cartStr === 'null' || cartStr === 'undefined' || cartStr === '[]' || cartStr.trim() === '') {
                console.log('getCart: No cart found in localStorage or sessionStorage');
                return [];
            }

            const cart = JSON.parse(cartStr);
            console.log('getCart: Parsed cart:', cart.length, 'items', cart);
            const isValidArray = Array.isArray(cart);
            console.log('getCart: Is valid array?', isValidArray);
            return isValidArray ? cart : [];
        } catch (e) {
            console.error('getCart: Error parsing cart:', e);
            // Try sessionStorage backup on error
            try {
                const backupStr = sessionStorage.getItem('cart_backup');
                if (backupStr) {
                    const backupCart = JSON.parse(backupStr);
                    console.log('getCart: Using sessionStorage backup due to error');
                    localStorage.setItem(CART_KEY, backupStr);
                    return Array.isArray(backupCart) ? backupCart : [];
                }
            } catch (e2) {
                console.error('getCart: Error parsing backup:', e2);
            }
            return [];
        }
    }
    function saveCart(cart) {
        try {
            console.log('saveCart: Saving cart with', cart.length, 'items', cart);
            if (!Array.isArray(cart)) {
                console.error('saveCart: Cart is not an array!', cart);
                return;
            }
            const cartStr = JSON.stringify(cart);
            localStorage.setItem(CART_KEY, cartStr);
            console.log('saveCart: Cart saved successfully');
            // Verify immediately
            const verify = localStorage.getItem(CART_KEY);
            console.log('saveCart: Verification - localStorage now contains:', verify);

            // Also save to sessionStorage as backup (or clear if empty)
            // NOTE: Do NOT clear buy_now_item here - it's independent of regular cart
            if (cart.length === 0) {
                sessionStorage.removeItem('cart_backup');
                console.log('saveCart: Cart is empty, cleared cart_backup');
            } else {
                sessionStorage.setItem('cart_backup', cartStr);
                console.log('saveCart: Also saved to sessionStorage backup');
            }
        } catch (e) {
            console.error('saveCart: Error saving cart:', e);
        }
    }

    // Update a single cart item by cartId to a new quantity (handles removal when qty<=0)
    function updateCartItem(cartId, newQty) {
        try {
            // Check if we're in Buy Now mode
            const buyNowItemStr = sessionStorage.getItem('buy_now_item');
            const isBuyNowMode = buyNowItemStr && buyNowItemStr !== 'null' && buyNowItemStr !== 'undefined';

            let cart = getCart();
            const idx = cart.findIndex(i => (i.cartId || i.id) === cartId);
            if (idx === -1) return;

            // Determine available stock for this cart item (prefer cart-level stock)
            const item = cart[idx];
            let available = null;
            if (item && item.stock !== undefined && item.stock !== null) {
                available = parseInt(item.stock, 10);
                if (isNaN(available)) available = null;
            }

            // If no cart-level stock, try to find product in loaded API products
            if ((available === null || available === undefined) && Array.isArray(originalAllProductsINR)) {
                const prod = originalAllProductsINR.find(p => p.id === item.id);
                if (prod && prod.stock !== undefined) {
                    available = parseInt(prod.stock, 10);
                    if (isNaN(available)) available = null;
                }
            }

            // If still unknown, treat as unlimited (cap handled elsewhere)
            if (available !== null && !isNaN(available)) {
                if (newQty > available) {
                    showTransientCartMessage('Maximum quantity limit reached');
                    return; // do not update
                }
            }

            if (newQty <= 0) {
                // Removing item
                if (isBuyNowMode) {
                    // Clear Buy Now item and redirect to home or show empty cart
                    sessionStorage.removeItem('buy_now_item');
                    console.log('updateCartItem: Buy Now item removed, cleared sessionStorage');
                } else {
                    cart.splice(idx, 1);
                    saveCart(cart);
                }
            } else {
                // Updating quantity
                if (isBuyNowMode) {
                    // Update the Buy Now item in sessionStorage
                    cart[idx].quantity = newQty;
                    sessionStorage.setItem('buy_now_item', JSON.stringify(cart[idx]));
                    console.log('updateCartItem: Buy Now item quantity updated to', newQty);
                } else {
                    cart[idx].quantity = newQty;
                    saveCart(cart);
                }
            }
            renderCheckoutPage();
            updateCartCount();
        } catch (e) {
            console.error('updateCartItem error:', e);
        }
    }
    function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
    function getSelectedRegion() {
        return localStorage.getItem(SELECTED_REGION_KEY) || 'ca';
    }

    // Transient message helper used across Checkout page
    function showTransientCartMessage(message, timeout = 2500) {
        try {
            let el = document.getElementById('transient-cart-msg');
            if (!el) {
                el = document.createElement('div');
                el.id = 'transient-cart-msg';
                el.style.position = 'fixed';
                el.style.right = '20px';
                el.style.bottom = '20px';
                el.style.background = 'rgba(0,0,0,0.8)';
                el.style.color = '#fff';
                el.style.padding = '10px 14px';
                el.style.borderRadius = '6px';
                el.style.zIndex = '99999';
                el.style.fontWeight = '600';
                el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)';
                document.body.appendChild(el);
            }
            el.textContent = message;
            el.style.display = 'block';
            clearTimeout(el._timeoutId);
            el._timeoutId = setTimeout(() => { el.style.display = 'none'; }, timeout);
        } catch (e) { console.warn('showTransientCartMessage error', e); }
    }

    // --- Helper function to get CSRF token from cookies ---
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

    // --- Inject Modal Styles ---
    function injectSuccessModalStyles() {
        if (document.getElementById('checkout-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'checkout-modal-styles';
        style.innerHTML = `
            .return-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .return-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            .return-modal {
                background: #fff;
                border-radius: 12px;
                padding: 30px;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .return-modal-overlay.active .return-modal {
                transform: scale(1);
            }
            .return-submit-btn {
                background-color: #28a745;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: background-color 0.2s;
            }
            .return-submit-btn:hover {
                background-color: #218838;
            }
        `;
        document.head.appendChild(style);
    }

    // --- Order Success Modal ---
    function showOrderSuccessModal(orderId, onCloseCallback) {
        injectSuccessModalStyles(); // Ensure styles are present

        // Random purchase quotes
        const quotes = [
            "Great choice! You have excellent taste.",
            "Your wardrobe is going to thank you!",
            "Style and comfort are on their way.",
            "Get ready to turn heads!",
            "Fashion is instant language."
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        const modalHTML = `
      <div class="return-modal-overlay active" id="order-success-overlay">
        <div class="return-modal" style="text-align: center; max-width: 450px; padding: 40px;">
          <div style="font-size: 50px; margin-bottom: 20px;">🎉</div>
          <h2 style="color: #28a745; margin-bottom: 10px; font-weight: 700;">Order Placed!</h2>
          <p style="font-size: 18px; color: #333; margin-bottom: 5px;">Thank you for shopping with us.</p>
          <p style="font-size: 14px; color: #888; font-style: italic; margin-bottom: 30px;">"${randomQuote}"</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
             <p style="margin:0; font-weight: 600; color: #555;">Order ID: #${orderId}</p>
          </div>

          <div class="modal-actions" style="justify-content: center;">
            <button class="return-submit-btn" id="view-orders-btn" style="width: 100%; max-width: 250px; padding: 12px; font-size: 16px;">View My Orders ➔</button>
          </div>
        </div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('order-success-overlay');
        const viewBtn = document.getElementById('view-orders-btn');

        viewBtn.addEventListener('click', () => {
            overlay.remove();
            if (onCloseCallback) onCloseCallback();
        });

        // Disable closing by clicking outside to force user acknowledge
        // overlay.addEventListener('click', (e) => { ... });
    }


    // --- Login Required Modal ---
    function showLoginRequiredModal() {
        const existing = document.getElementById('login-required-modal');
        if (existing) existing.remove();

        if (!document.getElementById('login-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'login-modal-styles';
            style.textContent = `
                .login-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center;
                    z-index: 10001; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s;
                }
                .login-modal-overlay.active { opacity: 1; visibility: visible; }
                .login-modal-box {
                    background: #fff; padding: 40px 30px; border-radius: 12px; width: 90%; max-width: 400px;
                    text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    transform: scale(0.95); transition: transform 0.3s;
                }
                .login-modal-overlay.active .login-modal-box { transform: scale(1); }
                .login-modal-msg { font-size: 18px; color: #333; margin-bottom: 30px; font-weight: 500; }
                .login-modal-actions { display: flex; flex-direction: column; gap: 12px; }
                .login-btn-primary { 
                    background: #000; color: white; border: none; padding: 14px; border-radius: 8px; 
                    font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; display: block;
                    transition: all 0.2s;
                }
                .login-btn-primary:hover { background: #333; transform: translateY(-1px); }
                .login-btn-secondary { 
                    background: transparent; color: #666; border: 1px solid #ddd; padding: 14px; border-radius: 8px; 
                    font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                }
                .login-btn-secondary:hover { background: #f9f9f9; color: #333; border-color: #ccc; }
             `;
            document.head.appendChild(style);
        }

        const modalHTML = `
            <div id="login-required-modal" class="login-modal-overlay">
                <div class="login-modal-box">
                    <div class="login-modal-msg">Please login to continue</div>
                    <div class="login-modal-actions">
                        <a href="/login/?next=/checkout/" class="login-btn-primary">Login</a>
                        <button class="login-btn-secondary" id="login-cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Animation trigger
        requestAnimationFrame(() => {
            document.getElementById('login-required-modal').classList.add('active');
        });

        document.getElementById('login-cancel-btn').addEventListener('click', () => {
            const el = document.getElementById('login-required-modal');
            el.classList.remove('active');
            setTimeout(() => el.remove(), 300);
        });
    }

    // --- Header Count Updaters ---
    function updateWishlistCount() {
        const count = getWishlist().length; const el = document.getElementById("wishlistCount");
        if (el) { el.textContent = count; el.style.display = count > 0 ? "flex" : "none"; }
    }
    function updateCartCount() {
        const cart = getCart(); const total = cart.reduce((s, i) => s + (i.quantity || 0), 0);
        const el = document.getElementById("cartCount"); if (el) { el.textContent = total; el.style.display = total > 0 ? "flex" : "none"; }
    }

    // --- Update Cart Item Quantity or Remove ---


    // --- Update Progress Bar ---
    function updateProgressBar(activeStep) { // activeStep: 'cart', 'billing', 'payment'
        const steps = document.querySelectorAll('.checkout-progress .step');
        let completed = true;
        steps.forEach(step => {
            const stepName = step.dataset.step;
            step.classList.remove('active', 'completed');
            if (completed) {
                step.classList.add('completed');
            }
            if (stepName === activeStep) {
                step.classList.add('active');
                step.classList.remove('completed');
                completed = false;
            }
        });
        // Ensure lines between completed steps are also green
        document.querySelectorAll('.checkout-progress .step-line').forEach((line, index) => {
            const prevStep = steps[index]; // Step before this line
            if (prevStep && prevStep.classList.contains('completed')) {
                line.style.backgroundColor = 'var(--active-step-color)';
            } else {
                line.style.backgroundColor = '#ccc'; // Reset to default grey
            }
        });
    }


    // --- Show Specific Checkout Step ---
    function showStep(stepId) { // stepId: 'cart-step', 'billing-step', 'payment-step'
        document.querySelectorAll('.checkout-step-section').forEach(section => {
            section.classList.add('hidden');
        });
        const activeSection = document.getElementById(stepId);
        if (activeSection) {
            activeSection.classList.remove('hidden');
        }

        const mainActionBtn = document.getElementById('main-checkout-action-btn');
        if (mainActionBtn) {
            if (stepId === 'cart-step') {
                mainActionBtn.textContent = 'Check out';
                mainActionBtn.style.display = 'block'; // Show button in summary
            } else {
                // Hide the summary button when user is in form steps
                mainActionBtn.style.display = 'none';
            }
        }

        // --- MODIFICATION: Toggle Discount/Coupon Section Visibility ---
        const discountSections = document.querySelectorAll('.discount-section, .discount-input-group');
        discountSections.forEach(section => {
            if (stepId === 'cart-step') {
                // For input group, we utilize flex; for others flow. 
                // Best to remove display property to let CSS take over, 
                // OR explicitly set 'flex' for input group if needed.
                // But .discount-input-group usually is flex.
                section.style.display = '';
                if (section.classList.contains('hidden')) section.classList.remove('hidden');
            } else {
                section.style.display = 'none'; // Force hide
            }
        });
        // --- END MODIFICATION ---
    }


    // --- Render Checkout Page ---
    async function renderCheckoutPage() {
        console.log('=== renderCheckoutPage() called ===');
        try {
            // Ensure helper functions exist
            if (typeof convertInrToTargetCurrency === 'undefined') {
                console.warn('convertInrToTargetCurrency missing, aliasing locally.');
                window.convertInrToTargetCurrency = convertUsdToTargetCurrency;
            }

            const cart = getCart();
            console.log('Checkout: Rendering page. Cart items:', cart.length);
            console.log('Checkout: Full cart data:', JSON.stringify(cart));

            if (cart.length > 0) {
                console.log('Checkout: Cart items details:', cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })));
            }

            const itemsContainer = document.getElementById('cart-items-container');
            const cartTitle = document.getElementById('cart-section-title');
            const summarySubtotalEl = document.getElementById('summary-subtotal');
            const summaryDiscountEl = document.getElementById('summary-discount');
            const summaryGstEl = document.getElementById('summary-gst');
            const summaryTotalEl = document.getElementById('summary-total');
            const mainActionBtn = document.getElementById('main-checkout-action-btn');
            const currentRegion = getSelectedRegion();

            // Check if required elements exist
            if (!itemsContainer) {
                console.error('Checkout: cart-items-container element not found!');
                return;
            }
            if (!cartTitle) {
                console.error('Checkout: cart-section-title element not found!');
                return;
            }

            console.log('Checkout: DOM elements found, proceeding with render');

            // Define GST Rate
            const GST_RATE = 0.05; // 5%

            // Clear container first
            itemsContainer.innerHTML = '';
            const emptyCartMsg = document.createElement('p');
            emptyCartMsg.className = 'empty-cart-message';
            emptyCartMsg.style.display = 'none';
            emptyCartMsg.textContent = 'Your cart is empty.';
            itemsContainer.appendChild(emptyCartMsg);

            let subtotalConverted = 0;
            let totalItems = 0;
            let discountAmount = 0; // will be calculated from coupons

            // Coupons disabled on client-side: keep empty cache and stub fetch
            const couponCache = {}; // coupons intentionally not used client-side
            async function fetchCouponsFor(gender, subcat) { return []; }

            // Map to store chosen coupon per cart item index
            const chosenCouponByIndex = {};


            if (cart.length === 0) {
                console.log('Checkout: Cart is empty!');
                emptyCartMsg.style.display = 'block';
                if (cartTitle) cartTitle.textContent = `Cart (0 items)`;
                if (mainActionBtn) mainActionBtn.disabled = true;

                // Update Summary
                if (summarySubtotalEl) summarySubtotalEl.textContent = formatCurrency(0, currentRegion);
                if (summaryDiscountEl) summaryDiscountEl.textContent = formatCurrency(discountAmount, currentRegion);
                if (summaryGstEl) summaryGstEl.textContent = formatCurrency(0, currentRegion);
                if (summaryTotalEl) summaryTotalEl.textContent = formatCurrency(0, currentRegion);

                return;
            } else {
                console.log('Checkout: Cart has items, rendering... (Logic Version 3)');
                console.log('Checkout: Using updated pricing logic: Item=Original, Discount=Difference.');
                emptyCartMsg.style.display = 'none';
                if (mainActionBtn) mainActionBtn.disabled = false;

                // Use separate variable for Original Subtotal (sum of original prices)
                // and Final Subtotal (sum of actual prices to pay)
                let originalSubtotalConverted = 0;
                let finalSubtotalConverted = 0;
                let finalSubtotalUSD = 0;

                // Now iterate and render items, applying coupons when found
                cart.forEach((item, index) => {
                    console.log(`Checkout: Processing cart item ${index + 1}/${cart.length}:`, item);

                    // Validate cart item has required fields
                    if (!item.id) {
                        console.error('Checkout: Cart item missing id:', item);
                        return;
                    }

                    // Try to find product in API products first (fallback for names/images)
                    let productINR = originalAllProductsINR.find(p => p.id === item.id);

                    // Determine Original Price and Discount Price
                    // 1. From Cart Item (Prioritize size-specific data stored in cart)
                    // Sanitize logic same as cart.js: strip everything except digits and decimal point
                    let itemOriginalPrice = 0;
                    if (item.price) {
                        itemOriginalPrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                    }

                    let itemDiscountPrice = null;
                    if (item.discount_price) {
                        itemDiscountPrice = parseFloat(String(item.discount_price).replace(/[^0-9.]/g, ''));
                        if (isNaN(itemDiscountPrice)) itemDiscountPrice = null;
                    }

                    // 2. Fallback to API data if cart data missing (unlikely if logic works)
                    if (itemOriginalPrice === 0 && productINR) {
                        itemOriginalPrice = parseFloat(productINR.price || 0);
                        if (productINR.discount_price) {
                            itemDiscountPrice = parseFloat(productINR.discount_price);
                        }
                    }

                    // Ensure we have a valid name and image
                    const displayProduct = {
                        name: item.name || (productINR ? productINR.name : 'Product'),
                        image: item.image || (productINR ? productINR.image : '/static/customer/images/placeholder.jpg')
                    };

                    const itemQuantity = item.quantity || 1;
                    totalItems += itemQuantity;

                    // Determine effective unit price to pay
                    const effectiveUnitPrice = (itemDiscountPrice !== null && itemDiscountPrice > 0)
                        ? itemDiscountPrice
                        : itemOriginalPrice;

                    // Convert to display currency
                    const originalPriceConverted = convertInrToTargetCurrency(itemOriginalPrice, currentRegion);
                    const effectivePriceConverted = convertInrToTargetCurrency(effectiveUnitPrice, currentRegion);

                    // Accumulate Subtotals
                    // Original Subtotal = Sum of Original Prices
                    originalSubtotalConverted += (originalPriceConverted * itemQuantity);

                    // Final Subtotal = Sum of Effective (Discounted) Prices
                    finalSubtotalConverted += (effectivePriceConverted * itemQuantity);
                    finalSubtotalUSD += (effectiveUnitPrice * itemQuantity);

                    // Prepare display strings
                    const displayImage = displayProduct.image;
                    const colorSwatchHTML = item.color ? `<span class="color-swatch" style="background-color: ${item.color};"></span>` : '<span class="color-swatch" style="background-color: #ccc;"></span>';

                    // Price to show in the cart row (Show Effective Price)
                    const priceDisplay = formatCurrency(effectivePriceConverted, currentRegion);
                    const totalDisplay = formatCurrency(effectivePriceConverted * itemQuantity, currentRegion);

                    // Optional: Show strike-through if discounted (visual polish)
                    let priceHtml = `<div class="cart-item-price-desktop">${priceDisplay}</div>`;
                    let mobilePriceHtml = `<div class="cart-item-price-mobile">${priceDisplay}</div>`;

                    if (itemDiscountPrice !== null && itemDiscountPrice > 0) {
                        const origDisplay = formatCurrency(originalPriceConverted, currentRegion);
                        priceHtml = `<div class="cart-item-price-desktop">
                                    <span style="text-decoration: line-through; color: #999; font-size: 0.9em; margin-right: 5px;">${origDisplay}</span>
                                    ${priceDisplay}
                                  </div>`;
                        mobilePriceHtml = `<div class="cart-item-price-mobile">
                                          <span style="text-decoration: line-through; color: #999; font-size: 0.8em;">${origDisplay}</span> ${priceDisplay}
                                        </div>`;
                    }

                    const itemElement = document.createElement('div');
                    itemElement.classList.add('cart-item');
                    itemElement.dataset.cartId = item.cartId || item.id;

                    // Create cart item HTML
                    itemElement.innerHTML = `
                    <img src="${displayImage}" alt="${displayProduct.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${displayProduct.name}</div>
                        <div class="cart-item-meta"><span>Size: ${item.size || 'N/A'}</span> ${colorSwatchHTML}</div>
                        ${mobilePriceHtml}
                    </div>
                    ${priceHtml}
                    <div class="quantity-control">
                        <button class="quantity-btn decrease-qty" aria-label="Decrease quantity">-</button>
                        <input type="tel" class="item-quantity" value="${itemQuantity}" min="1" max="99" data-cart-id="${item.cartId || item.id}" aria-label="Quantity" inputmode="numeric">
                        <button class="quantity-btn increase-qty" aria-label="Increase quantity">+</button>
                    </div>
                    <div class="cart-item-total-desktop">${totalDisplay}</div>
                    <button class="remove-item-btn" aria-label="Remove item"><i class="fas fa-trash-alt"></i></button>
                `;

                    itemsContainer.appendChild(itemElement);
                });

                if (cartTitle) cartTitle.textContent = `Cart (${totalItems} item${totalItems !== 1 ? 's' : ''})`;
                console.log(`Checkout: Rendered ${totalItems} items in cart`);

                // Calculate Totals for Summary
                // --- NEW ORDER SUMMARY LOGIC ---
                // 1. Subtotal (Item Total) - Use Final Subtotal (Effective Prices)
                const subtotalDisplay = finalSubtotalConverted;

                // 2. Calculate Coupon Discount (Dynamic Re-calculation)
                let couponDiscountConverted = 0;

                // Check if a coupon is applied
                if (window.appliedCoupon) {
                    const c = window.appliedCoupon;
                    const cSub = c.sub_category ? String(c.sub_category).trim().toLowerCase() : null;

                    // Recalculate base for coupon (matched items)
                    let couponBase = 0;
                    cart.forEach(item => {
                        let itemOriginalPrice = item.price ? parseFloat(item.price) : 0;
                        let itemDiscountPrice = item.discount_price ? parseFloat(item.discount_price) : null;

                        // Fallback to product data
                        const prod = originalAllProductsINR.find(p => p.id === item.id);
                        if (itemOriginalPrice === 0 && prod) {
                            itemOriginalPrice = parseFloat(prod.price || 0);
                            if (prod.discount_price) itemDiscountPrice = parseFloat(prod.discount_price);
                        }

                        const effectiveUnit = (itemDiscountPrice !== null && itemDiscountPrice > 0) ? itemDiscountPrice : itemOriginalPrice;
                        const qty = item.quantity || 1;

                        const pSub = prod ? (prod.sub_category || '').toLowerCase() : '';

                        // Convert to current region currency
                        const costConverted = convertInrToTargetCurrency(effectiveUnit, currentRegion);

                        if (!cSub || (cSub && pSub === cSub)) {
                            couponBase += (costConverted * qty);
                        }
                    });

                    if (c.discount_type === '%') {
                        couponDiscountConverted = (couponBase * (c.discount_percentage || 0)) / 100.0;
                    } else {
                        // Fixed amount
                        let fixedVal = convertInrToTargetCurrency(c.discount_value, currentRegion);
                        couponDiscountConverted = Math.min(fixedVal, couponBase);
                    }
                }

                // 3. GST Calculation (on Post-Coupon Amount?)
                // Usually VAT/GST is on the discounted price.
                const taxableAmount = Math.max(0, subtotalDisplay - couponDiscountConverted);
                const gstAmount = taxableAmount * GST_RATE;

                // 4. Shipping Calculation (Dynamic)
                function calculateShippingCost(qty, subtotalUSD) {
                    if (qty <= 0) return 0;

                    // Box dimension logic
                    const length = 30;
                    const breadth = 10;
                    const height = qty * 5;

                    const volume = length * breadth * height;
                    const dimWeight = volume / 6000;
                    const actualWeight = qty * 5;

                    const chargeableWeight = Math.max(dimWeight, actualWeight);
                    const ratePerKg = 4; // Base currency (USD)

                    const cost = chargeableWeight * ratePerKg;

                    // Rule: If cart subtotal > $200 USD, Shipping is Free
                    if (subtotalUSD > 200) {
                        return 0;
                    }

                    return cost;
                }

                const shippingCostUSD = calculateShippingCost(totalItems, finalSubtotalUSD);

                // Convert shipping cost to target region
                const deliveryCostConverted = convertInrToTargetCurrency(shippingCostUSD, currentRegion);

                // Update UI for delivery options
                const standardOptionPrice = document.querySelector('#delivery-standard ~ label .delivery-option-price');
                if (standardOptionPrice) {
                    if (deliveryCostConverted === 0) {
                        standardOptionPrice.textContent = 'Free Shipping';
                        standardOptionPrice.style.color = '#28a745'; // Green for free
                    } else {
                        standardOptionPrice.textContent = formatCurrency(deliveryCostConverted, currentRegion);
                        standardOptionPrice.style.color = ''; // Reset color
                    }
                }

                // Hide Express Option
                const expressOptionContainer = document.querySelector('#delivery-express')?.parentElement;
                if (expressOptionContainer) {
                    expressOptionContainer.style.display = 'none';
                }
                // Ensure Standard is checked
                const standardRadio = document.getElementById('delivery-standard');
                if (standardRadio) standardRadio.checked = true;

                // 5. Final Total
                const totalAmountConverted = taxableAmount + gstAmount + deliveryCostConverted;

                // --- UPDATE UI ELEMENTS ---

                // Subtotal
                if (summarySubtotalEl) summarySubtotalEl.textContent = formatCurrency(subtotalDisplay, currentRegion);

                // Coupon Discount Row Visibility
                const couponRow = document.getElementById('coupon-discount-row');
                if (summaryDiscountEl) {
                    if (couponDiscountConverted > 0.01) {
                        summaryDiscountEl.textContent = `- ${formatCurrency(couponDiscountConverted, currentRegion)}`;
                        if (couponRow) couponRow.style.display = 'flex';
                    } else {
                        summaryDiscountEl.textContent = formatCurrency(0, currentRegion);
                        if (couponRow) couponRow.style.display = 'none';
                    }
                }

                // GST & Shipping
                if (summaryGstEl) summaryGstEl.textContent = formatCurrency(gstAmount, currentRegion);
                const summaryShippingEl = document.getElementById('summary-shipping');
                if (summaryShippingEl) {
                    if (deliveryCostConverted === 0) {
                        summaryShippingEl.textContent = 'Free Shipping';
                        summaryShippingEl.style.color = '#28a745';
                    } else {
                        summaryShippingEl.textContent = formatCurrency(deliveryCostConverted, currentRegion);
                        summaryShippingEl.style.color = '';
                    }
                }

                // Final Total
                if (summaryTotalEl) summaryTotalEl.textContent = formatCurrency(totalAmountConverted, currentRegion);


                // Export for other functions
                subtotalConverted = finalSubtotalConverted; // Used by other helpers
            }

            // Only attach listeners once - use flag to prevent multiple attachments
            if (!listenersAttached) {
                attachActionListeners();
            }

            // Expose last-rendered summary for order creation (subtotalConverted and discountAmount are in display currency)
            try {
                window.latestCheckoutSummary = {
                    subtotalConverted: subtotalConverted,
                    discountAmountConverted: discountAmount,
                    region: currentRegion
                };
            } catch (e) {
                console.error("CRITICAL ERROR in renderCheckoutPage:", e);
                const itemsContainer = document.getElementById('cart-items-container');
                if (itemsContainer) itemsContainer.innerHTML = '<p class="error-message">Error loading cart. Please refresh the page.</p>';
            }

            console.log('=== renderCheckoutPage() completed ===');
            // Load available coupons for the current cart (if function exists)
            try { if (typeof window.loadAvailableCoupons === 'function') window.loadAvailableCoupons(); } catch (e) { console.warn('Could not load coupons:', e); }
        } catch (e) {
            console.error("CRITICAL ERROR in renderCheckoutPage wrapper:", e);
            const itemsContainer = document.getElementById('cart-items-container');
            if (itemsContainer) itemsContainer.innerHTML = '<p class="error-message">Error loading cart. Please refresh the page.</p>';
        }
    }

    document.querySelectorAll('input[name="delivery-method"]').forEach(radio => {
        radio.addEventListener('change', renderCheckoutPage);
    });

    // Load and display all available coupons on page initialization
    async function loadAllCoupons() {
        try {
            const resp = await fetch('/api/coupons/?subcategories=');
            if (!resp.ok) return;
            const data = await resp.json();
            if (!data.success) return;
            const coupons = data.coupons || [];
            const container = document.getElementById('available-coupons');
            if (!container) return;
            container.innerHTML = '';
            if (coupons.length === 0) {
                container.style.display = 'none';
                return;
            }
            container.style.display = '';
            const header = document.createElement('div');
            header.style.marginTop = '8px';
            header.style.marginBottom = '6px';
            header.style.fontWeight = 'bold';
            header.style.fontSize = '0.9rem';
            header.textContent = 'Available Coupons:';
            container.appendChild(header);
            const list = document.createElement('div');
            list.className = 'available-coupons-list';
            coupons.forEach(c => {
                const row = document.createElement('div');
                row.className = 'coupon-row';
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '6px';
                row.style.marginBottom = '4px';
                row.style.backgroundColor = '#f5f5f5';
                row.style.borderRadius = '4px';
                // Format discount display
                let discountText = '';
                if (c.discount_type === '%') {
                    discountText = `${c.discount_value}% off`;
                } else {
                    discountText = `$${parseFloat(c.discount_value).toFixed(2)} off`;
                }
                const subInfo = c.sub_category ? ` (${c.sub_category})` : '';
                row.innerHTML = `<div style="flex-grow:1;"><strong>${c.code}</strong> — ${discountText}${subInfo}</div>`;
                const applyBtn = document.createElement('button');
                applyBtn.type = 'button';
                applyBtn.className = 'apply-coupon-btn';
                applyBtn.textContent = 'Use';
                applyBtn.style.padding = '4px 10px';
                applyBtn.style.fontSize = '0.85rem';
                applyBtn.addEventListener('click', () => {
                    document.getElementById('discount-code').value = c.code;
                    applyCouponCode(c.code);
                });
                row.appendChild(applyBtn);
                list.appendChild(row);
            });
            container.appendChild(list);
            window.allCouponsData = coupons; // Store for reference
        } catch (e) {
            console.error('Error loading all coupons:', e);
        }
    }


    // --- MODIFICATION: Attach Event Listeners for Cart Actions (with input/change handlers) ---
    // Use a flag to prevent multiple bindings
    let listenersAttached = false;

    function attachActionListeners() {
        const itemsContainer = document.getElementById('cart-items-container');
        if (!itemsContainer) {
            console.warn('attachActionListeners: itemsContainer not found');
            return;
        }

        // CRITICAL FIX: Don't clone/replace the container - it clears the items!
        // Use event delegation on the container instead

        // Prevent multiple event listeners by checking if already attached
        if (listenersAttached) {
            console.log('attachActionListeners: Listeners already attached, skipping');
            return;
        }

        console.log('attachActionListeners: Attaching event listeners using delegation');

        // --- CLICK Listener (for buttons) - Use event delegation ---
        itemsContainer.addEventListener('click', function handleCartClick(event) {
            const target = event.target;
            const cartItemElement = target.closest('.cart-item');
            if (!cartItemElement) return;

            const cartId = cartItemElement.dataset.cartId;
            // Find the input field to read its *current* value
            const quantityInput = cartItemElement.querySelector('.item-quantity');
            const currentQuantity = quantityInput ? parseInt(quantityInput.value) : 1;

            if (target.classList.contains('increase-qty') || target.closest('.increase-qty')) {
                event.preventDefault();
                if (currentQuantity < 99) {
                    updateCartItem(cartId, currentQuantity + 1); // This will re-render
                }
            } else if (target.classList.contains('decrease-qty') || target.closest('.decrease-qty')) {
                event.preventDefault();
                updateCartItem(cartId, currentQuantity - 1); // updateCartItem handles <= 0
            } else if (target.closest('.remove-item-btn')) {
                event.preventDefault();
                updateCartItem(cartId, 0); // This will re-render
            }
        });

        // --- INPUT Listener (for stripping non-digits) ---
        itemsContainer.addEventListener('input', function handleCartInput(event) {
            const target = event.target;
            if (target.classList.contains('item-quantity') && target.tagName === 'INPUT') {
                // This just strips non-digits, it doesn't trigger a cart update
                target.value = target.value.replace(/\D/g, '');
            }
        });

        // --- CHANGE Listener (for validating and updating cart) ---
        itemsContainer.addEventListener('change', function handleCartChange(event) {
            const target = event.target;
            if (target.classList.contains('item-quantity') && target.tagName === 'INPUT') {
                const cartId = target.dataset.cartId;
                if (!cartId) return;

                let newQuantity = parseInt(target.value, 10);

                // Validate the final value
                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1;
                }
                if (newQuantity > 99) { // Enforce max
                    newQuantity = 99;
                }

                target.value = newQuantity; // Update the input
                updateCartItem(cartId, newQuantity); // Update cart and re-render
            }
        });

        listenersAttached = true;
        console.log('attachActionListeners: Event listeners attached using delegation');
    }

    // --- Apply Discount (Placeholder) ---
    const applyDiscountBtn = document.getElementById('apply-discount-btn');
    if (applyDiscountBtn) {
        // Fetch and display available coupons for cart subcategories
        async function loadAvailableCoupons() {
            try {
                const cart = getCart();
                // Build normalized set of subcategories from products loaded earlier
                const subcats = new Set();

                cart.forEach(item => {
                    // Try to get subcategory from API-loaded product list first
                    let prod = originalAllProductsINR.find(p => p.id === item.id);
                    if (prod && prod.sub_category) {
                        subcats.add(String(prod.sub_category).trim().toLowerCase());
                    } else if (item.sub_category) {
                        // Fallback: cart item might carry sub_category (e.g., buy-now or different id)
                        subcats.add(String(item.sub_category).trim().toLowerCase());
                    }
                });

                const subsArr = Array.from(subcats);
                const container = document.getElementById('available-coupons');
                if (!container) return;
                container.innerHTML = '';

                // Ensure we have coupon data; if not, fetch as fallback
                let coupons = Array.isArray(window.allCouponsData) ? window.allCouponsData : [];
                if ((!Array.isArray(coupons) || coupons.length === 0)) {
                    try {
                        const resp = await fetch('/api/coupons/?subcategories=');
                        if (resp.ok) {
                            const data = await resp.json();
                            if (data && data.success) {
                                coupons = data.coupons || [];
                                window.allCouponsData = coupons;
                            }
                        }
                    } catch (fetchErr) {
                        console.warn('loadAvailableCoupons: fallback fetch failed', fetchErr);
                    }
                }

                // If no cart subcategories, show all coupons (same behavior as before)
                let couponsToShow = coupons.slice();
                if (subsArr.length > 0) {
                    couponsToShow = couponsToShow.filter(c => {
                        const cSubRaw = (c.sub_category || c.subcategory || '');
                        const cSub = String(cSubRaw).trim().toLowerCase();
                        // If coupon has no subcategory, treat it as global
                        if (!cSub) return true;
                        return subsArr.includes(cSub);
                    });
                }

                if (!Array.isArray(couponsToShow) || couponsToShow.length === 0) {
                    container.style.display = 'none';
                    return;
                }

                container.style.display = '';
                const header = document.createElement('div');
                header.style.marginTop = '8px';
                header.style.marginBottom = '6px';
                header.style.fontWeight = 'bold';
                header.style.fontSize = '0.9rem';
                header.textContent = 'Available Coupons:';
                container.appendChild(header);

                const list = document.createElement('div');
                list.className = 'available-coupons-list';
                couponsToShow.forEach(c => {
                    const row = document.createElement('div');
                    row.className = 'coupon-row';
                    row.style.display = 'flex';
                    row.style.justifyContent = 'space-between';
                    row.style.alignItems = 'center';
                    row.style.padding = '6px';
                    row.style.marginBottom = '4px';
                    row.style.backgroundColor = '#f5f5f5';
                    row.style.borderRadius = '4px';
                    // Format discount display
                    let discountText = '';
                    if (c.discount_type === '%') {
                        discountText = `${c.discount_value}% off`;
                    } else {
                        discountText = `$${parseFloat(c.discount_value).toFixed(2)} off`;
                    }
                    const subInfo = c.sub_category ? ` (${c.sub_category})` : '';
                    const codeField = c.code || c.coupon_code; // support both field names
                    row.innerHTML = `<div style="flex-grow:1;"><strong>${codeField}</strong> — ${discountText}${subInfo}</div>`;

                    const applyBtn = document.createElement('button');
                    applyBtn.type = 'button';

                    // --- MODIFICATION: Check if currently applied ---
                    const isApplied = window.appliedCoupon && window.appliedCoupon.code === codeField;

                    if (isApplied) {
                        applyBtn.className = 'remove-coupon-btn';
                        applyBtn.textContent = 'Remove';
                        applyBtn.style.padding = '4px 10px';
                        applyBtn.style.fontSize = '0.85rem';
                        applyBtn.style.backgroundColor = '#dc3545'; // Red for remove
                        applyBtn.style.color = '#fff';
                        applyBtn.style.border = 'none';
                        applyBtn.style.borderRadius = '4px';
                        applyBtn.style.cursor = 'pointer';

                        applyBtn.addEventListener('click', () => {
                            removeCoupon();
                        });
                    } else {
                        applyBtn.className = 'apply-coupon-btn';
                        applyBtn.textContent = 'Use';
                        applyBtn.style.padding = '4px 10px';
                        applyBtn.style.fontSize = '0.85rem';
                        // Keep default styles or add explicit ones if needed

                        applyBtn.addEventListener('click', () => {
                            document.getElementById('discount-code').value = codeField;
                            applyCouponCode(codeField);
                        });
                    }
                    // --- END MODIFICATION ---

                    row.appendChild(applyBtn);
                    list.appendChild(row);
                });
                container.appendChild(list);
            } catch (e) {
                console.error('Error loading coupons:', e);
            }
        }

        // Apply coupon by calling backend to validate, then computing discount on client for display
        async function applyCouponCode(code) {
            try {
                const cart = getCart();
                if (!cart || cart.length === 0) {
                    alert('Your cart is empty');
                    return;
                }
                const payload = { code: code, cart_items: cart };
                const resp = await fetch('/api/apply-coupon/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await resp.json();
                if (!data.success) {
                    showCustomAlert(data.message || 'Coupon could not be applied', 'Coupon Error');
                    return;
                }

                // Data contains discount_type, discount_value, discount_percentage, discount_amount
                const discountType = data.discount_type || '%';
                const discountValue = parseFloat(data.discount_value || 0);
                const discountPercent = parseFloat(data.discount_percentage || 0);
                const couponSub = data.sub_category || null;

                // Compute base: if couponSub provided, compute subtotal for that subcategory; otherwise use full subtotal
                const currentRegion = getSelectedRegion();
                let baseConverted = 0; // in displayed currency
                const cartItems = getCart();
                cartItems.forEach(item => {
                    const prod = originalAllProductsINR.find(p => p.id === item.id);
                    // Prioritize cart item price (size-specific) over API product price
                    const priceToUse = item.price || (prod && prod.discount_price ? prod.discount_price : (prod ? prod.price : 0));
                    const priceConverted = convertInrToTargetCurrency(priceToUse, currentRegion);
                    if (!couponSub) {
                        baseConverted += priceConverted * (item.quantity || 1);
                    } else if (prod && prod.sub_category && prod.sub_category.toLowerCase() === couponSub.toLowerCase()) {
                        baseConverted += priceConverted * (item.quantity || 1);
                    }
                });

                if (baseConverted <= 0) {
                    showCustomAlert('Coupon does not apply to your cart items', 'Coupon Error');
                    return;
                }

                // Calculate discount amount based on type
                let discountAmountConverted = 0;
                if (discountType === '%') {
                    discountAmountConverted = (baseConverted * discountPercent) / 100.0;
                } else {
                    // Fixed discount - convert from INR to displayed currency
                    discountAmountConverted = convertInrToTargetCurrency(discountValue.toString(), currentRegion);
                    // Cap discount to not exceed base
                    if (discountAmountConverted > baseConverted) {
                        discountAmountConverted = baseConverted;
                    }
                }

                // Update UI summary values (summary-discount and summary-total)
                const summaryDiscountEl = document.getElementById('summary-discount');
                const summarySubtotalEl = document.getElementById('summary-subtotal');
                const summaryGstEl = document.getElementById('summary-gst');
                const summaryTotalEl = document.getElementById('summary-total');

                // Parse current subtotal from displayed text if available, otherwise use window.latestCheckoutSummary
                let displayedSubtotal = 0;
                if (window.latestCheckoutSummary && typeof window.latestCheckoutSummary.subtotalConverted === 'number') {
                    displayedSubtotal = window.latestCheckoutSummary.subtotalConverted;
                } else if (summarySubtotalEl) {
                    // remove non-digit
                    const t = summarySubtotalEl.textContent || '0';
                    displayedSubtotal = parseFloat(t.replace(/[^0-9.]/g, '')) || 0;
                }

                const gstRate = 0.05;
                const amountAfterDiscount = Math.max(0, displayedSubtotal - discountAmountConverted);
                const gstAmount = amountAfterDiscount * gstRate;
                // shipping
                const deliveryRadio = document.querySelector('input[name="delivery-method"]:checked');
                const deliveryCost = deliveryRadio ? parseFloat(deliveryRadio.dataset.cost) : 0;
                const finalTotal = amountAfterDiscount + gstAmount + deliveryCost;

                if (summaryDiscountEl) summaryDiscountEl.textContent = `- ${formatCurrency(discountAmountConverted, currentRegion)}`;
                if (summaryGstEl) summaryGstEl.textContent = formatCurrency(gstAmount, currentRegion);
                if (summaryTotalEl) summaryTotalEl.textContent = formatCurrency(finalTotal, currentRegion);

                // Show applied coupon short info
                const container = document.getElementById('available-coupons');
                if (container) {
                    const appliedNote = document.createElement('div');
                    appliedNote.style.marginTop = '8px';
                    appliedNote.style.color = '#0a6';
                    appliedNote.style.fontWeight = 'bold';
                    let discountDisplay = '';
                    if (discountType === '%') {
                        discountDisplay = `${discountPercent}% off`;
                    } else {
                        discountDisplay = `${formatCurrency(discountValue, 'ca')} off`;
                    }
                    appliedNote.innerHTML = `✓ Applied <strong>${code}</strong> — ${discountDisplay} (-${formatCurrency(discountAmountConverted, currentRegion)})`;
                    // remove previous applied notes
                    const prev = container.querySelector('.applied-coupon-note');
                    if (prev) prev.remove();
                    appliedNote.className = 'applied-coupon-note';
                    container.prepend(appliedNote);
                }

                // Save applied coupon in window for create_order and re-rendering
                window.appliedCoupon = {
                    code: code,
                    discount_type: discountType,
                    discount_value: discountValue,
                    discount_percentage: discountPercent,
                    discount_amount: discountAmountConverted,
                    sub_category: couponSub // Important for re-calculation
                };

                // Trigger renderCheckoutPage to update totals with new coupon logic
                renderCheckoutPage();

                // Refresh Available Coupons list to update button states (Use -> Remove)
                loadAvailableCoupons();

            } catch (e) {
                console.error('Error applying coupon:', e);
                showCustomAlert('An error occurred applying the coupon', 'Error');
            }
        }

        // --- Remove Coupon Logic ---
        function removeCoupon() {
            // Clear applied coupon
            window.appliedCoupon = null;

            // Clear input field
            const discountInput = document.getElementById('discount-code');
            if (discountInput) discountInput.value = '';

            // Remove applied note
            const container = document.getElementById('available-coupons');
            if (container) {
                const prev = container.querySelector('.applied-coupon-note');
                if (prev) prev.remove();
            }

            // Recalculate totals (re-render will handle original pricing)
            renderCheckoutPage();

            // Refresh Available Coupons list to update button states (Remove -> Use)
            loadAvailableCoupons();
        }

        // Wire up manual apply button to use applyCouponCode
        applyDiscountBtn.addEventListener('click', () => {
            // If currently applied coupon matches input, treat as remove? 
            // Logic: Button says "Apply", so typically applies.
            // If manual input is used, we just apply.
            const code = document.getElementById('discount-code').value.trim();
            if (!code) { showCustomAlert('Please enter a coupon code', 'Input Required'); return; }
            applyCouponCode(code);
        });

        // Load coupons on initial render (and whenever renderCheckoutPage runs it will call loadAvailableCoupons)
        // Expose for other parts of the file
        window.loadAvailableCoupons = loadAvailableCoupons;
    }

    // --- Button Event Listeners ---
    const mainActionBtn = document.getElementById('main-checkout-action-btn');
    const backToCartBtn = document.getElementById('back-to-cart-btn');
    const proceedToPaymentBtn = document.getElementById('proceed-to-payment-btn');
    const backToBillingBtn = document.getElementById('back-to-billing-btn');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const billingForm = document.getElementById('billing-address-form');

    // --- Address Label Logic (Postal + State) ---
    const countrySelect = document.getElementById('billing-country');
    const postalLabel = document.getElementById('billing-postal-label');
    const postalInput = document.getElementById('billing-postal');
    const stateLabel = document.getElementById('billing-state-label');
    const stateInput = document.getElementById('billing-state');

    function updateAddressLabels(shouldSyncToRegion = false) {
        if (!countrySelect || !postalLabel || !postalInput) return;

        // Sync Dropdown to Global Region ONLY if requested and editable
        if (shouldSyncToRegion && !countrySelect.disabled) {
            const currentRegion = typeof getSelectedRegion === 'function' ? getSelectedRegion() : 'us';
            const regionToCountryCode = { 'us': 'US', 'ca': 'CA' };
            countrySelect.value = regionToCountryCode[currentRegion] || 'US';
        }

        // Update Labels based on CURRENT value of the dropdown
        if (countrySelect.value === 'US') {
            // US Settings
            postalLabel.textContent = 'Zip Code';
            postalInput.placeholder = 'Zip Code (e.g., 10001)';
            postalInput.pattern = "^\\d{5}(-\\d{4})?$";
            postalInput.title = "5-digit Zip Code (e.g., 10001)";

            if (stateLabel) stateLabel.textContent = 'State';
            if (stateInput) stateInput.placeholder = 'State';
        } else if (countrySelect.value === 'CA') {
            // CA Settings
            postalLabel.textContent = 'Postal Code';
            postalInput.placeholder = 'Postal Code (e.g., A1A 1A1)';
            postalInput.pattern = "^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$";
            postalInput.title = "Canadian Postal Code (e.g., A1A 1A1)";

            if (stateLabel) stateLabel.textContent = 'Province';
            if (stateInput) stateInput.placeholder = 'Province';
        } else {
            // Fallback
            postalLabel.textContent = 'Postal Code';
            postalInput.placeholder = 'Postal Code';
            postalInput.removeAttribute('pattern');
            postalInput.removeAttribute('title');

            if (stateLabel) stateLabel.textContent = 'State / Province';
            if (stateInput) stateInput.placeholder = 'State / Province';
        }
    }

    // Initial load - Sync with region (unless disabled/saved)
    updateAddressLabels(true);

    // Listen for global region changes - Sync
    document.addEventListener('regionChanged', () => {
        console.log("Region change detected in checkout.js -> updating postal label");
        updateAddressLabels(true);
    });

    if (countrySelect) {
        countrySelect.addEventListener('change', () => {
            // Manual change - DO NOT sync to region, just update labels
            updateAddressLabels(false);
        });
    }


    // --- Login/Guest Modal ---
    function showLoginOrGuestModal(onGuest, onLogin) {
        // Remove existing if any
        const existing = document.getElementById('login-guest-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'login-guest-modal-overlay';
        overlay.className = 'custom-modal-overlay'; // Reusing custom modal styles

        // Inline styles to ensure it matches the look if custom-modal classes aren't perfect for this layout
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '10000';

        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '2rem';
        modal.style.borderRadius = '8px';
        modal.style.maxWidth = '400px';
        modal.style.width = '90%';
        modal.style.textAlign = 'center';
        modal.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

        const title = document.createElement('h2');
        title.textContent = 'Account Required';
        title.style.marginBottom = '1rem';
        title.style.color = '#333';

        const message = document.createElement('p');
        message.textContent = 'Would you like to login to save your order to your account, or continue as a guest?';
        message.style.marginBottom = '1.5rem';
        message.style.color = '#666';

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '1rem';
        btnContainer.style.justifyContent = 'center';

        const loginBtn = document.createElement('button');
        loginBtn.textContent = 'Login';
        loginBtn.className = 'btn btn-primary';
        loginBtn.style.padding = '0.5rem 1.5rem';
        loginBtn.onclick = () => {
            overlay.remove();
            if (onLogin) onLogin();
        };

        const guestBtn = document.createElement('button');
        guestBtn.textContent = 'Continue as Guest';
        guestBtn.className = 'btn btn-secondary'; // Assuming btn-secondary exists, else fallback
        guestBtn.style.padding = '0.5rem 1.5rem';
        guestBtn.style.backgroundColor = '#6c757d';
        guestBtn.style.color = 'white';
        guestBtn.style.border = 'none';
        guestBtn.style.borderRadius = '4px';
        guestBtn.style.cursor = 'pointer';
        guestBtn.onclick = () => {
            overlay.remove();
            if (onGuest) onGuest();
        };

        btnContainer.appendChild(loginBtn);
        btnContainer.appendChild(guestBtn);

        modal.appendChild(title);
        modal.appendChild(message);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    if (mainActionBtn) {
        mainActionBtn.addEventListener('click', () => {
            const currentActiveStep = document.querySelector('.checkout-progress .step.active')?.dataset.step;
            if (currentActiveStep === 'cart') {
                if (getCart().length === 0) {
                    alert("Your cart is empty.");
                    return;
                }

                // Check Login Status
                if (!window.isAuthenticated && !window.guestSession) {
                    showLoginOrGuestModal(
                        () => {
                            // On Guest
                            window.guestSession = true;
                            showStep('billing-step');
                            updateProgressBar('billing');
                        },
                        () => {
                            // On Login
                            window.location.href = '/login/?next=/checkout/';
                        }
                    );
                    return;
                }

                showStep('billing-step');
                updateProgressBar('billing');
            }
        });
    }

    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', () => {
            showStep('cart-step');
            updateProgressBar('cart');
        });
    }

    if (proceedToPaymentBtn) {
        proceedToPaymentBtn.addEventListener('click', async (e) => {
            if (billingForm && !billingForm.checkValidity()) {
                billingForm.reportValidity();
                return;
            }
            e.preventDefault();
            console.log("Billing details submitted (validation needed)");
            showStep('payment-step');
            updateProgressBar('payment');
            // Save checkout details now (so billing is persisted before payment)
            try {
                const currentRegion = getSelectedRegion();

                // Try to get displayed subtotal from window.latestCheckoutSummary or DOM
                let subtotalDisplayed = 0;
                if (window.latestCheckoutSummary && typeof window.latestCheckoutSummary.subtotalConverted === 'number') {
                    subtotalDisplayed = window.latestCheckoutSummary.subtotalConverted;
                } else {
                    const el = document.getElementById('summary-subtotal');
                    subtotalDisplayed = el ? parseFloat((el.textContent || '').replace(/[^0-9.]/g, '')) || 0 : 0;
                }

                const gstEl = document.getElementById('summary-gst');
                let gstDisplayed = gstEl ? parseFloat((gstEl.textContent || '').replace(/[^0-9.]/g, '')) || 0 : (subtotalDisplayed * 0.05);

                const shippingEl = document.getElementById('summary-shipping');
                let shippingDisplayed = shippingEl ? parseFloat((shippingEl.textContent || '').replace(/[^0-9.]/g, '')) || 0 : 0;

                // Convert displayed (region) values back to INR for backend storage
                const subtotalINR = convertDisplayedToInr(String(subtotalDisplayed), currentRegion);
                const shippingINR = convertDisplayedToInr(String(shippingDisplayed), currentRegion);
                const gstINR = Math.round((subtotalINR) * 0.05);
                const totalINR = subtotalINR + gstINR + shippingINR;

                const billingPaymentData = {
                    billing_email: document.getElementById('billing-email')?.value.trim(),
                    first_name: document.getElementById('billing-first-name')?.value.trim(),
                    last_name: document.getElementById('billing-last-name')?.value.trim(),
                    address: document.getElementById('billing-address')?.value.trim(),
                    apartment: document.getElementById('billing-apartment')?.value.trim(),
                    city: document.getElementById('billing-city')?.value.trim(),
                    state: document.getElementById('billing-state')?.value.trim(), // Added state
                    postal_code: document.getElementById('billing-postal')?.value.trim(),
                    country: document.getElementById('billing-country')?.value,
                    phone: document.getElementById('billing-phone')?.value.trim(),
                    delivery_method: document.querySelector('input[name="delivery-method"]:checked')?.value || "",
                    payment_method: document.querySelector('input[name="payment-method"]:checked')?.value || '',
                    subtotal: subtotalINR,
                    shipping: shippingINR,
                    tax: gstINR,
                    total: totalINR
                };
                // include product_id and size from first cart item if available
                try {
                    const c = getCart();
                    if (c && c.length > 0) {
                        billingPaymentData.product_id = c[0].id || null;
                        billingPaymentData.size = c[0].size || null;
                    }
                    // do not include cart_items on proceed; only include on confirm
                } catch (e) { /* ignore */ }
                // include product_id and size from first cart item if available
                try {
                    const c = getCart();
                    if (c && c.length > 0) {
                        billingPaymentData.product_id = c[0].id || null;
                        billingPaymentData.size = c[0].size || null;
                    }
                } catch (e) { /* ignore */ }

                const resp = await fetch('/api/save-checkout-details/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                    body: JSON.stringify(billingPaymentData)
                });
                if (resp.ok) {
                    const j = await resp.json().catch(() => null);
                    if (j && j.checkout_id) {
                        window.savedCheckoutId = j.checkout_id;
                    }
                    // Log proceed event and attach checkout id
                    try {
                        const proceedPayload = { event: 'proceed_to_payment', checkout_id: j?.checkout_id || null, metadata: { keys: Object.keys(billingPaymentData) } };
                        fetch('/api/checkout/event/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                            body: JSON.stringify(proceedPayload)
                        }).then(() => { }).catch(e => console.warn('Proceed event log failed', e));
                    } catch (e) { console.warn('Proceed event log error', e); }
                } else {
                    console.warn('Failed to save checkout details on proceed');
                }
            } catch (e) {
                console.warn('Error saving checkout on proceed', e);
            }
        });
    }
    if (billingForm) {
        billingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            proceedToPaymentBtn.click();
        });
    }

    if (backToBillingBtn) {
        backToBillingBtn.addEventListener('click', () => {
            showStep('billing-step');
            updateProgressBar('billing');
        });
    }

    // --- confirmPaymentBtn LISTENER ---
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Prevent double submission
            if (confirmPaymentBtn.disabled) return;
            confirmPaymentBtn.disabled = true;
            const originalBtnText = confirmPaymentBtn.textContent;
            confirmPaymentBtn.textContent = 'Processing...';

            // Helper to re-enable button on error
            const resetBtn = () => {
                confirmPaymentBtn.disabled = false;
                confirmPaymentBtn.textContent = originalBtnText;
            };

            // --- LOGIC TO CREATE AND SAVE ORDER ---
            const cart = getCart();
            if (cart.length === 0) {
                alert("Your cart is empty.");
                resetBtn();
                return;
            }

            const currentRegion = getSelectedRegion();
            const GST_RATE = 0.05; // 5%

            let subtotalINR = 0;
            let itemsForOrder = [];

            // 1. Process cart items and calculate INR totals
            // Ensure we include every cart item (even if product not found in API)
            cart.forEach(item => {
                // Prioritize cart item price (which contains size-specific price) over API product price
                const apiProd = Array.isArray(originalAllProductsINR) ? originalAllProductsINR.find(p => p.id === item.id) : null;

                // Determine Original Price and Discount Price
                let itemOriginalPrice = item.price ? parseFloat(item.price) : 0;
                let itemDiscountPrice = item.discount_price ? parseFloat(item.discount_price) : null;

                // Fallback to API if available and cart data missing
                if (itemOriginalPrice === 0 && apiProd) {
                    itemOriginalPrice = parseFloat(apiProd.price || 0);
                    if (apiProd.discount_price) {
                        itemDiscountPrice = parseFloat(apiProd.discount_price);
                    }
                }

                // EFFECTIVE UNIT PRICE (Payable price per item)
                const effectiveUnitPrice = (itemDiscountPrice !== null && itemDiscountPrice > 0)
                    ? itemDiscountPrice
                    : itemOriginalPrice;

                // Normalize price string to a numeric INR value (per-unit)
                const priceINR = Math.round(effectiveUnitPrice);
                const qty = parseInt(item.quantity || 1, 10) || 1;
                const itemTotalINR = priceINR * qty;

                subtotalINR += itemTotalINR;

                itemsForOrder.push({
                    productId: item.id,
                    quantity: qty,
                    // send per-unit price so backend can compute subtotal deterministically
                    price: priceINR,
                    size: item.size || null,
                    seller: "HE SHE STYLES",
                    image: item.image || null
                });
            });

            // 2. Calculate final INR totals
            const discountAmountINR = 0;
            const amountAfterDiscountINR = subtotalINR - discountAmountINR;
            const gstAmountINR = amountAfterDiscountINR * GST_RATE;

            const deliveryRadio = document.querySelector('input[name="delivery-method"]:checked');
            const deliveryCostConverted = deliveryRadio ? parseFloat(deliveryRadio.dataset.cost) : 0;
            const deliveryCostINR = convertDisplayedToInr(deliveryCostConverted.toString(), currentRegion);

            const totalAmountINR = amountAfterDiscountINR + gstAmountINR + deliveryCostINR;

            // 3. Generate new Order ID
            const newOrderId = "OD" + Date.now();

            // 4. Get payment method
            const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
            const paymentMethod = paymentRadio ? paymentRadio.value : 'N/A';

            // 5. Create the new order object
            const newOrder = {
                orderId: newOrderId,
                orderDate: new Date().toISOString(),
                totalAmount: totalAmountINR,
                currencyRegion: 'in',
                status: "Processing",
                deliveryDate: "Pending",
                items: itemsForOrder,
                timeline: [
                    { status: "Ordered", date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
                ],
                deliveryDetails: {
                    address: `${document.getElementById('billing-address').value}, ${document.getElementById('billing-apartment').value || ''}, ${document.getElementById('billing-city').value}, ${document.getElementById('billing-country').value}, ${document.getElementById('billing-postal').value}`,
                    name: `${document.getElementById('billing-first-name').value} ${document.getElementById('billing-last-name').value}`,
                    phone: document.getElementById('billing-phone').value || 'N/A'
                },
                priceDetails: {
                    listing: subtotalINR,
                    selling: subtotalINR,
                    extraDiscount: -discountAmountINR,
                    specialPrice: subtotalINR,
                    otherDiscount: 0,
                    fees: deliveryCostINR + gstAmountINR,
                    total: totalAmountINR,
                    paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
                }
            };

            // 6. Save to localStorage first (for customer-side display)
            try {
                const allOrders = JSON.parse(localStorage.getItem(ALL_ORDERS_KEY)) || [];
                allOrders.push(newOrder);
                localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(allOrders));
            } catch (e) {
                console.error("Failed to save order to localStorage:", e);
            }

            // 7. Save order to Django backend (for admin panel display)
            try {
                console.log('Preparing order data for API...');
                console.log('Items for order:', itemsForOrder);

                // Prepare cart items for API - use the cart items directly instead of itemsForOrder
                // because itemsForOrder doesn't have size, but cart items do
                const cartItemsForAPI = cart.map(item => {
                    console.log('Mapping cart item to API:', item);
                    return {
                        id: item.id,  // This is the product slug/ID
                        quantity: item.quantity || 1,
                        size: item.size || 'N/A'
                    };
                });

                console.log('Cart items for API:', cartItemsForAPI);

                // Prepare order data for API
                // Client-side coupon reporting disabled; server will calculate/validate coupons
                let appliedCouponsForAPI = [];
                if (window.appliedCoupon) {
                    appliedCouponsForAPI.push(window.appliedCoupon);
                }

                const orderDataForAPI = {
                    cart_items: cartItemsForAPI,
                    shipping_address: document.getElementById('billing-address').value,
                    shipping_city: document.getElementById('billing-city').value,
                    shipping_state: document.getElementById('billing-state').value, // Use the new State field
                    shipping_country: document.getElementById('billing-country').value, // Use the Country field
                    shipping_pincode: document.getElementById('billing-postal').value.substring(0, 10), // Truncate to max 10 characters
                    payment_method: paymentMethod === 'N/A' ? 'cod' : (paymentMethod === 'cash' ? 'cod' : paymentMethod),
                    first_name: document.getElementById('billing-first-name').value.trim(),
                    last_name: document.getElementById('billing-last-name').value.trim(),
                    email: document.getElementById('billing-email').value.trim(),
                    phone: document.getElementById('billing-phone').value.trim(),
                    subtotal: subtotalINR,
                    tax: gstAmountINR,
                    shipping: deliveryCostINR,
                    total: totalAmountINR,
                    applied_coupons: appliedCouponsForAPI,
                    notes: `Order placed from checkout. Order ID: ${newOrderId}`
                };

                console.log('Order data to send to API:', orderDataForAPI);
                console.log('Customer name being sent:', {
                    first_name: orderDataForAPI.first_name,
                    last_name: orderDataForAPI.last_name,
                    email: orderDataForAPI.email
                });

                // Send order to Django backend
                const response = await fetch('/api/orders/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(orderDataForAPI)
                });

                console.log('Order API Response Status:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    console.log('Order saved to database successfully:', result);
                    // Update localStorage order with database order ID if provided
                    if (result.order_id) {
                        newOrder.dbOrderId = result.order_id;
                        newOrder.orderNumber = result.order_number;
                        // Store redirect URL for the success modal callback
                        window.lastOrderRedirectUrl = result.redirect_url;
                        const updatedOrders = JSON.parse(localStorage.getItem(ALL_ORDERS_KEY)) || [];
                        const orderIndex = updatedOrders.findIndex(o => o.orderId === newOrderId);
                        if (orderIndex !== -1) {
                            updatedOrders[orderIndex] = newOrder;
                            localStorage.setItem(ALL_ORDERS_KEY, JSON.stringify(updatedOrders));
                        }
                        console.log('Order ID:', result.order_id, 'Order Number:', result.order_number);
                    }
                    // Save billing/payment snapshot to backend and create a checkout record
                    try {
                        const billingPaymentData = {
                            billing_email: document.getElementById('billing-email')?.value.trim(),
                            first_name: document.getElementById('billing-first-name')?.value.trim(),
                            last_name: document.getElementById('billing-last-name')?.value.trim(),
                            address: document.getElementById('billing-address')?.value.trim(),
                            apartment: document.getElementById('billing-apartment')?.value.trim(),
                            city: document.getElementById('billing-city')?.value.trim(),
                            postal_code: document.getElementById('billing-postal')?.value.trim(),
                            country: document.getElementById('billing-country')?.value,
                            phone: document.getElementById('billing-phone')?.value.trim(),
                            delivery_method: document.querySelector('input[name="delivery-method"]:checked')?.value || "",
                            payment_method: paymentMethod,
                            subtotal: subtotalINR,
                            shipping: deliveryCostINR,
                            tax: gstAmountINR,
                            total: totalAmountINR,
                            order_id: result.order_id || newOrderId,
                            checkout_id: window.savedCheckoutId || null
                        };
                        // include product_id and size
                        try {
                            const c = getCart();
                            if (c && c.length > 0) {
                                billingPaymentData.product_id = c[0].id || null;
                                billingPaymentData.size = c[0].size || null;
                            }
                        } catch (e) { }
                        // include cart items (per-item INR totals) and mark final
                        try {
                            billingPaymentData.cart_items = itemsForOrder;
                            billingPaymentData.final = true;
                        } catch (e) { }

                        const responseBP = await fetch('/api/save-checkout-details/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify(billingPaymentData)
                        });

                        if (responseBP.ok) {
                            const bpResult = await responseBP.json().catch(() => null);
                            console.log('Billing and payment details saved successfully.', bpResult);
                            // Log confirm_payment event and attach checkout id if returned
                            try {
                                const payload = { event: 'confirm_payment', order_id: result.order_id || newOrderId, checkout_id: bpResult?.checkout_id || null };
                                fetch('/api/checkout/event/', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                                    body: JSON.stringify(payload)
                                }).then(() => { }).catch(e => console.warn('Confirm event logging failed', e));
                            } catch (e) { console.warn('Confirm event log error', e); }
                        } else {
                            console.error('Error saving billing/payment details.');
                        }
                    } catch (e) {
                        console.error('Billing/Payment API failed', e);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    console.error('Failed to save order to database. Status:', response.status);

                    if (response.status === 401) {
                        showLoginRequiredModal();
                        resetBtn();
                        return; // Stop execution
                    }

                    console.error('Error details:', errorData);
                    alert(`Failed to save order: ${errorData.message || 'Please check console for details'}`);
                    resetBtn(); // Reset button
                    return; // Stop execution - Do NOT proceed to clear cart or show success
                }
            } catch (apiError) {
                console.error('Error calling create order API:', apiError);
                alert('An error occurred while creating your order. Please try again.');
                resetBtn(); // Reset button
                return; // Stop execution on network error
            }

            // 8. Clear cart
            try {
                // Refresh client-side product cache from API so product pages can update stock display
                if (typeof loadProductsFromAPI === 'function') {
                    await loadProductsFromAPI();
                }
                // Broadcast to other open pages/tabs that product data was refreshed
                try {
                    localStorage.setItem('products_refreshed', JSON.stringify({ ts: Date.now(), orderId: newOrderId }));
                } catch (e) { console.warn('Could not write products_refreshed to localStorage', e); }

                // Additionally, write a stock decrement payload so product pages can update displayed stock
                try {
                    const stockDecrements = cart.map(i => ({ id: i.id, size: i.size || null, quantity: parseInt(i.quantity || 1, 10) }));
                    localStorage.setItem('stock_decrements', JSON.stringify({ ts: Date.now(), items: stockDecrements }));
                } catch (e) {
                    console.warn('Could not write stock_decrements to localStorage', e);
                }
                // Also persist overrides so newly opened pages pick up the reduced stock
                try {
                    const raw = localStorage.getItem('product_stock_overrides');
                    let overrides = {};
                    if (raw) {
                        try { overrides = JSON.parse(raw) || {}; } catch (e) { overrides = {}; }
                    }
                    cart.forEach(ci => {
                        if (!ci || !ci.id) return;
                        const pid = String(ci.id);
                        const qty = parseInt(ci.quantity || 1, 10) || 1;
                        const size = ci.size || null;

                        if (!overrides[pid]) overrides[pid] = { stock: null, sizes: {} };

                        if (size) {
                            const cur = parseInt(overrides[pid].sizes[size] ?? null, 10);
                            // If override has numeric value, decrement that; otherwise mark as unknown (null) so product.js will fetch API
                            if (!isNaN(cur)) {
                                overrides[pid].sizes[size] = Math.max(0, cur - qty);
                            } else {
                                // If no override present, set negative sentinel to indicate delta until API refresh
                                overrides[pid].sizes[size] = (overrides[pid].sizes[size] ?? 0) - qty;
                            }
                        } else {
                            const curTop = parseInt(overrides[pid].stock ?? null, 10);
                            if (!isNaN(curTop)) {
                                overrides[pid].stock = Math.max(0, curTop - qty);
                            } else {
                                overrides[pid].stock = (overrides[pid].stock ?? 0) - qty;
                            }
                        }
                    });
                    localStorage.setItem('product_stock_overrides', JSON.stringify(overrides));
                } catch (e) {
                    console.warn('Could not persist product_stock_overrides', e);
                }
            } catch (e) {
                console.warn('Error refreshing product data after order:', e);
            }

            // alert("Payment Confirmed! Your order has been placed.");
            localStorage.removeItem(CART_KEY);
            // Clear all cart-related sessionStorage items
            sessionStorage.removeItem('buy_now_item');
            sessionStorage.removeItem('cart_backup');
            console.log('Order placed: Cleared cart and all sessionStorage backups');

            // Use Custom Modal instead of alert
            showOrderSuccessModal(newOrderId, () => {
                // 9. Redirect to the URL provided by backend (Home for guests, Order Detail for users)
                // Fallback to order detail page if not provided
                if (window.lastOrderRedirectUrl) {
                    window.location.href = window.lastOrderRedirectUrl;
                } else {
                    window.location.href = `/orders/?orderId=${newOrderId}`;
                }
            });
        });
    }

    // --- Listen for region changes ---
    document.addEventListener('regionChanged', () => {
        console.log("Region change detected in checkout.js, re-rendering cart totals.");
        renderCheckoutPage();
    });


    // --- Initial Page Load Actions ---
    console.log('Checkout: Page loaded');
    console.log('Checkout: Checking localStorage immediately...');

    // DEBUG: Check localStorage immediately BEFORE any other operations
    const immediateCheck = localStorage.getItem(CART_KEY);
    console.log('Checkout: Immediate localStorage check:', immediateCheck);
    console.log('Checkout: localStorage CART_KEY:', CART_KEY);

    // Check for cart backup in sessionStorage first
    const backupCart = sessionStorage.getItem('cart_backup');
    console.log('Checkout: sessionStorage backup check:', backupCart);

    // If localStorage is empty but backup exists, restore it
    if ((!immediateCheck || immediateCheck === '[]' || immediateCheck === 'null') && backupCart) {
        console.log('Checkout: localStorage empty but backup exists, restoring...');
        try {
            const parsedBackup = JSON.parse(backupCart);
            if (parsedBackup && parsedBackup.length > 0) {
                localStorage.setItem(CART_KEY, backupCart);
                console.log('Checkout: Cart restored from backup:', parsedBackup.length, 'items');
            }
        } catch (e) {
            console.error('Checkout: Error parsing backup cart:', e);
        }
    }

    // Get cart and verify - log EVERYTHING
    let initialCart = getCart();
    console.log('Checkout: Initial cart check:', initialCart.length, 'items');
    console.log('Checkout: Initial cart data:', JSON.stringify(initialCart));

    // If cart is still empty, retry multiple times with delays (in case of timing issues)
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = setInterval(() => {
        retryCount++;
        console.log(`Checkout: Retry attempt ${retryCount}/${maxRetries} to find cart...`);

        // Check localStorage directly
        const directCheck = localStorage.getItem(CART_KEY);
        console.log(`Checkout: Retry ${retryCount} - localStorage:`, directCheck);

        // Check sessionStorage backup
        const backupCheck = sessionStorage.getItem('cart_backup');
        console.log(`Checkout: Retry ${retryCount} - sessionStorage backup:`, backupCheck);

        if (directCheck && directCheck !== '[]' && directCheck !== 'null') {
            try {
                const parsed = JSON.parse(directCheck);
                if (parsed && parsed.length > 0) {
                    console.log(`Checkout: Found cart on retry ${retryCount}!`, parsed);
                    initialCart = parsed;
                    clearInterval(retryInterval);
                    // Re-render with found cart
                    renderCheckoutPage();
                }
            } catch (e) {
                console.error(`Checkout: Error parsing on retry ${retryCount}:`, e);
            }
        } else if (backupCheck && backupCheck !== '[]' && backupCheck !== 'null') {
            try {
                const parsed = JSON.parse(backupCheck);
                if (parsed && parsed.length > 0) {
                    console.log(`Checkout: Found cart in backup on retry ${retryCount}!`, parsed);
                    localStorage.setItem(CART_KEY, backupCheck);
                    initialCart = parsed;
                    clearInterval(retryInterval);
                    // Re-render with found cart
                    renderCheckoutPage();
                }
            } catch (e) {
                console.error(`Checkout: Error parsing backup on retry ${retryCount}:`, e);
            }
        }

        if (retryCount >= maxRetries) {
            clearInterval(retryInterval);
            console.log('Checkout: Max retries reached. Cart is empty or not found.');
        }
    }, 200); // Check every 200ms

    updateCartCount();
    updateWishlistCount();

    // ALWAYS render checkout page immediately (even if cart is empty)
    // This ensures we show empty state immediately, then update when products load
    setTimeout(() => {
        console.log('Checkout: Initial render (before products load)');
        renderCheckoutPage();
    }, 100);

    // Load products from API - this will trigger another render
    loadProductsFromAPI();

    // Load all available coupons on page initialization
    loadAllCoupons();

    showStep('cart-step');
    updateProgressBar('cart');




}); // End DOMContentLoaded