document.addEventListener("DOMContentLoaded", () => {
    // --- Constants for Local Storage Keys ---
    const CART_KEY = "he_she_cart";
    const WISHLIST_KEY = "he_she_wishlist"; // Needed for header count update
    const SELECTED_REGION_KEY = "he_she_selected_region";

    // --- Exchange Rates & Currency Symbols (Prices stored in USD) ---
    const EXCHANGE_RATES = {
        ca: { rate: 1.33, symbol: "CA$" }, // USD to CAD (1 USD = 1.33 CAD)
        us: { rate: 1.0, symbol: "US$" }   // USD to USD (no conversion)
    };

    // --- Get/Set Selected Region ---
    function getSelectedRegion() {
        return localStorage.getItem(SELECTED_REGION_KEY) || 'ca';
    }

    // Transient message helper used across Cart page
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
    // No setSelectedRegion here, assuming it's handled by header script

    // --- MODIFICATION: Inject CSS for the new input field ---
    function injectCartInputStyles() {
        const styleId = 'cart-input-styles';
        if (document.getElementById(styleId)) return; // Don't inject twice
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .quantity-control input.item-quantity {
                border: none;
                border-left: 1px solid var(--border-color);
                border-right: 1px solid var(--border-color);
                width: 40px; /* Give it a bit more space */
                text-align: center;
                font-weight: 600;
                font-size: 0.95rem;
                padding: 5px 2px; /* Adjust padding */
                -moz-appearance: textfield; /* Hide spinners Firefox */
            }
            .quantity-control input.item-quantity::-webkit-outer-spin-button,
            .quantity-control input.item-quantity::-webkit-inner-spin-button {
                -webkit-appearance: none; /* Hide spinners Chrome/Safari */
                margin: 0;
            }
        `;
        document.head.appendChild(style);


        const headerUrl = document.body.dataset.headerUrl || '/api/header/';
        fetch(headerUrl)
            .then(response => response.text())
            .then(data => {
                const headerPlaceholder = document.getElementById('header-placeholder');
                if (headerPlaceholder) {
                    headerPlaceholder.innerHTML = data;

                    // Re-initialize dynamic header parts handled by index.js:
                    if (typeof setupSearchFunctionality === 'function') setupSearchFunctionality();
                    if (typeof setupProfileDropdown === 'function') setupProfileDropdown();
                    if (typeof setupNavDropdowns === 'function') setupNavDropdowns();
                    if (typeof setupRegionFlagDropdown === 'function') setupRegionFlagDropdown();

                    // --- MODIFICATION START ---
                    // Must call count functions *after* header HTML is loaded
                    if (typeof updateCartCount === 'function') updateCartCount();
                    if (typeof updateWishlistCount === 'function') updateWishlistCount();

                    // --- THIS IS THE FIX ---
                    if (typeof setupMobileMenuToggle === 'function') setupMobileMenuToggle();
                    // --- END FIX ---

                    // --- END MODIFICATION ---


                    // Remove active class from all nav links on cart page
                    const navLinks = document.querySelectorAll(".main-nav li");
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                    });
                } else {
                    console.error('Header placeholder element not found.');
                }
            })
            .catch(error => console.error('Error loading header:', error));

    }
    // --- END MODIFICATION ---


    // --- Product Catalog (Contains original INR prices - MUST BE COMPLETE) ---
    const allProducts = [

    ];

    // --- Price Conversion Functions ---
    function convertUsdToTargetCurrency(priceUsdStr, region) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
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

    // --- Helper Functions ---
    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch (e) { console.error("Error parsing cart data:", e); localStorage.removeItem(CART_KEY); return []; }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            updateHeaderCounts(); // Update header count when cart changes
        } catch (e) { console.error("Error saving cart data:", e); }
    }

    // --- Update Header Counts (Needed by cart actions) ---
    function updateHeaderCounts() {
        const cart = getCart();
        const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

        // Update Cart Count
        const totalCartItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const cartCountEl = document.getElementById("cartCount");
        if (cartCountEl) {
            cartCountEl.textContent = totalCartItems;
            cartCountEl.style.display = totalCartItems > 0 ? "flex" : "none";
        }

        // Update Wishlist Count
        const wishlistCountEl = document.getElementById("wishlistCount");
        if (wishlistCountEl) {
            wishlistCountEl.textContent = wishlist.length;
            wishlistCountEl.style.display = wishlist.length > 0 ? "flex" : "none";
        }
    }

    // --- Render Cart Page Content ---
    function renderCartPage() {
        const cart = getCart();
        const itemsContainer = document.getElementById('cart-items-container');
        const cartLayout = document.getElementById('cart-layout');
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const subtotalEl = document.getElementById('subtotal-price');
        const gstEl = document.getElementById('gst-price');
        const shippingEl = document.getElementById('shipping-price');
        const totalEl = document.getElementById('total-price');
        const currentRegion = getSelectedRegion();

        // Define GST Rate
        const GST_RATE = 0.05; // 5%

        if (!itemsContainer || !cartLayout || !emptyCartMessage || !subtotalEl || !gstEl || !shippingEl || !totalEl) {
            console.error("Cart page HTML structure is missing required elements.");
            return;
        }

        itemsContainer.innerHTML = ''; // Clear previous items

        if (cart.length === 0) {
            cartLayout.style.display = 'none';
            emptyCartMessage.style.display = 'block';
            subtotalEl.textContent = formatCurrency(0, currentRegion);
            gstEl.textContent = formatCurrency(0, currentRegion);
            shippingEl.textContent = 'FREE';
            totalEl.textContent = formatCurrency(0, currentRegion);
            // Disable checkout button if cart is empty
            const checkoutBtn = document.querySelector('.checkout-btn');
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        // Ensure layout is visible and enable checkout if cart has items
        cartLayout.style.display = 'grid';
        emptyCartMessage.style.display = 'none';
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) checkoutBtn.disabled = false;


        let subtotalConverted = 0;

        cart.forEach(item => {
            const productDetails = allProducts.find(p => p.id === item.id);
            // Use fallback rendering if product details are missing
            const itemName = productDetails ? productDetails.name : (item.name || "Product Unavailable");
            const itemImage = item.image || (productDetails ? productDetails.image : 'placeholder.jpg');

            // Use discount_price if available, otherwise use price (prices stored in USD)
            const effectivePrice = item.discount_price || item.price || (productDetails ? productDetails.price : '0');
            const itemQuantity = item.quantity || 1;

            let itemPriceConverted = 0;
            if (effectivePrice && !isNaN(parseFloat(effectivePrice))) {
                itemPriceConverted = convertUsdToTargetCurrency(effectivePrice, currentRegion);
            } else {
                console.warn(`Cannot determine price for ${item.id}`);
            }
            const itemTotalPriceConverted = itemQuantity * itemPriceConverted;
            subtotalConverted += itemTotalPriceConverted;

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.dataset.cartId = item.cartId || item.id; // Use cartId

            // --- MODIFICATION: Replaced <span> with <input> for quantity ---
            itemElement.innerHTML = `
                <img src="${itemImage}" alt="${itemName}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="item-name">${itemName} ${!productDetails ? '(Details missing)' : ''}</div>
                    <div class="item-size">Size: ${item.size || 'N/A'}</div>
                    <div class="item-price">${itemPriceConverted > 0 ? formatCurrency(itemPriceConverted, currentRegion) : 'Price N/A'}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn decrease-qty" aria-label="Decrease quantity">-</button>
                        <input type="tel" class="item-quantity" value="${itemQuantity}" min="1" max="99" data-cart-id="${item.cartId || item.id}" aria-label="Quantity" inputmode="numeric">
                        <button class="quantity-btn increase-qty" aria-label="Increase quantity">+</button>
                    </div>
                    <div class="item-total-price">${itemTotalPriceConverted > 0 ? formatCurrency(itemTotalPriceConverted, currentRegion) : '--'}</div>
                    <button class="remove-item-btn" aria-label="Remove item"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            // --- END MODIFICATION ---
            itemsContainer.appendChild(itemElement);
        });

        // Calculate Shipping (Dynamic - Matching Checkout Logic)
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

        // Calculate Subtotal in USD for shipping threshold check
        let subtotalUSD = 0;
        cart.forEach(item => {
            const productDetails = allProducts.find(p => p.id === item.id);
            const effectivePrice = item.discount_price || item.price || (productDetails ? productDetails.price : '0');
            const priceNum = parseFloat(String(effectivePrice).replace(/[^0-9.]/g, '')) || 0;
            subtotalUSD += priceNum * (item.quantity || 1);
        });

        function calculateShippingCost(qty, cartTotalUSD) {
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
            if (cartTotalUSD > 200) {
                return 0;
            }
            return cost;
        }

        const shippingCostUSD = calculateShippingCost(totalItems, subtotalUSD);

        // Convert shipping cost to target region
        const shippingAmount = convertUsdToTargetCurrency(shippingCostUSD, currentRegion);

        // Calculate GST and Total
        const gstAmount = subtotalConverted * GST_RATE;
        const totalAmountConverted = subtotalConverted + gstAmount + shippingAmount;

        // Update Order Summary
        subtotalEl.textContent = formatCurrency(subtotalConverted, currentRegion);

        if (shippingCostUSD === 0 && totalItems > 0) {
            shippingEl.textContent = 'Free Shipping';
            shippingEl.style.color = '#28a745';
        } else {
            shippingEl.textContent = shippingAmount > 0 ? formatCurrency(shippingAmount, currentRegion) : 'FREE';
            shippingEl.style.color = '';
        }

        gstEl.textContent = formatCurrency(gstAmount, currentRegion);
        totalEl.textContent = formatCurrency(totalAmountConverted, currentRegion);

        attachActionListeners(); // Attach listeners AFTER content is rendered
    }

    // --- MODIFICATION: Replaced attachActionListeners with a new version ---
    function attachActionListeners() {
        const itemsContainer = document.getElementById('cart-items-container');
        if (!itemsContainer) return;

        // --- 1. CLICK Handler (for +, -, remove) ---
        const handleCartClick = (e) => {
            const target = e.target;
            const cartItemElement = target.closest('.cart-item');
            if (!cartItemElement) return;

            const cartId = cartItemElement.dataset.cartId;
            if (!cartId) return;

            let cart = getCart();
            const itemIndex = cart.findIndex(i => (i.cartId || i.id) === cartId);
            if (itemIndex === -1) { console.warn("Item not found:", cartId); return; }

            // Read quantity from the input field
            const quantityInput = cartItemElement.querySelector('.item-quantity');
            let currentQty = quantityInput ? parseInt(quantityInput.value, 10) : 1;
            if (isNaN(currentQty)) currentQty = 1;

            let needsUpdate = false;

            if (target.classList.contains('increase-qty')) {
                // enforce stock limit if available
                const availableStock = cart[itemIndex].stock !== undefined ? parseInt(cart[itemIndex].stock, 10) : null;
                if (availableStock !== null && !isNaN(availableStock)) {
                    if (currentQty < availableStock) {
                        cart[itemIndex].quantity = currentQty + 1;
                        needsUpdate = true;
                    } else {
                        // show immediate feedback (replace alert with transient UI)
                        showTransientCartMessage('Maximum quantity limit reached');
                    }
                } else {
                    if (currentQty < 99) {
                        cart[itemIndex].quantity = currentQty + 1;
                        needsUpdate = true;
                    }
                }
            } else if (target.classList.contains('decrease-qty')) {
                if (currentQty > 1) {
                    cart[itemIndex].quantity = currentQty - 1;
                    needsUpdate = true;
                } else { // Remove if qty goes to 1 or less
                    cart.splice(itemIndex, 1);
                    needsUpdate = true;
                }
            } else if (target.closest('.remove-item-btn')) {
                cart.splice(itemIndex, 1);
                needsUpdate = true;
            }

            if (needsUpdate) {
                saveCart(cart);
                renderCartPage(); // Re-render
            }
        };

        // --- 2. INPUT Handler (for stripping non-digits) ---
        const handleCartInput = (e) => {
            const target = e.target;
            if (target.classList.contains('item-quantity') && target.tagName === 'INPUT') {
                target.value = target.value.replace(/\D/g, ''); // Allow only digits
            }
        };

        // --- 3. CHANGE Handler (for saving typed value) ---
        const handleCartChange = (e) => {
            const target = e.target;
            if (target.classList.contains('item-quantity') && target.tagName === 'INPUT') {
                const cartId = target.dataset.cartId;
                if (!cartId) return;

                let newQuantity = parseInt(target.value, 10);

                // Validate
                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1; // Revert to 1 if invalid
                }
                if (newQuantity > 99) {
                    newQuantity = 99; // Cap at 99
                }

                // Enforce available stock if present on the cart item
                let cart = getCart();
                const itemIndex = cart.findIndex(i => (i.cartId || i.id) === cartId);
                if (itemIndex > -1) {
                    const availableStock = cart[itemIndex].stock !== undefined ? parseInt(cart[itemIndex].stock, 10) : null;
                    if (availableStock !== null && !isNaN(availableStock) && newQuantity > availableStock) {
                        newQuantity = availableStock;
                        if (typeof showTransientCartMessage === 'function') showTransientCartMessage('Maximum quantity limit reached');
                    }
                }

                if (itemIndex > -1) {
                    cart[itemIndex].quantity = newQuantity;
                    saveCart(cart);
                    renderCartPage(); // Re-render to update totals and correct the input value
                }
            }
        };

        // Ensure listeners aren't added multiple times
        // We check for one of the listeners, assuming all are added/removed together
        if (!itemsContainer.hasAttribute('data-cart-listener')) {
            itemsContainer.addEventListener('click', handleCartClick);
            itemsContainer.addEventListener('input', handleCartInput); // Add input listener
            itemsContainer.addEventListener('change', handleCartChange); // Add change listener
            itemsContainer.setAttribute('data-cart-listener', 'true');
        }

        // Checkout button listener (remains the same)
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn && !checkoutBtn.hasAttribute('data-checkout-listener')) {
            checkoutBtn.addEventListener('click', () => {
                if (getCart().length > 0) { // Only proceed if cart not empty
                    window.location.href = '/checkout/';
                } else {
                    alert("Your cart is empty.");
                }
            });
            checkoutBtn.setAttribute('data-checkout-listener', 'true');
        }
    }

    // --- MODIFICATION: Call the style injector ---
    injectCartInputStyles();
    // --- END MODIFICATION ---

    // Listen for region changes dispatched by the header script
    document.addEventListener('regionChanged', renderCartPage);

    // Initial setup
    updateHeaderCounts(); // Update cart/wishlist counts in the header initially
    renderCartPage(); // Render the main cart content

}); // End DOMContentLoaded