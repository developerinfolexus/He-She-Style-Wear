document.addEventListener("DOMContentLoaded", () => {
    // --- Constants ---
    var CART_KEY = "he_she_cart";
    var WISHLIST_KEY = "he_she_wishlist";
    var REVIEWS_KEY = "he_she_reviews"; // <<< Key for reviews
    var SELECTED_REGION_KEY = "he_she_selected_region"; // Key to store selected region

    // --- Exchange Rates & Currency Symbols (Prices stored in USD) ---
    var EXCHANGE_RATES = EXCHANGE_RATES || {
        ca: { rate: 1.33, symbol: "CA$" }, // USD to CAD (1 USD = 1.33 CAD)
        us: { rate: 1.0, symbol: "US$" }   // USD to USD (no conversion)
    };

    const WOMENS_SIZE_CHART_IN_HTML = `
        <table style="width:100%; border-collapse: collapse; text-align: center; font-size: 0.9em;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Size</th>
                    <th style="padding: 10px;">Bust (in)</th>
                    <th style="padding: 10px;">Front Length (in)</th>
                    <th style="padding: 10px;">Sleeve Length (in)</th>
                    <th style="padding: 10px;">To Fit Waist (in)</th>
                    <th style="padding: 10px;">Waist (in)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">S</td><td>36.0</td><td>46.0</td><td>17.0</td><td>30.0</td><td>33.0</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">M</td><td>38.0</td><td>46.0</td><td>17.0</td><td>32.0</td><td>35.0</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">L</td><td>40.0</td><td>46.0</td><td>17.0</td><td>34.0</td><td>37.0</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XL</td><td>42.0</td><td>46.0</td><td>17.0</td><td>36.0</td><td>39.0</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XXL</td><td>44.0</td><td>46.0</td><td>17.0</td><td>38.0</td><td>41.0</td></tr>
            </tbody>
        </table>
    `;

    const WOMENS_SIZE_CHART_CM_HTML = `
        <table style="width:100%; border-collapse: collapse; text-align: center; font-size: 0.9em;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Size</th>
                    <th style="padding: 10px;">Bust (cm)</th>
                    <th style="padding: 10px;">Front Length (cm)</th>
                    <th style="padding: 10px;">Sleeve Length (cm)</th>
                    <th style="padding: 10px;">To Fit Waist (cm)</th>
                    <th style="padding: 10px;">Waist (cm)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">S</td><td>91</td><td>117</td><td>43</td><td>76</td><td>84</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">M</td><td>97</td><td>117</td><td>43</td><td>81</td><td>89</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">L</td><td>102</td><td>117</td><td>43</td><td>86</td><td>94</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XL</td><td>107</td><td>117</td><td>43</td><td>91</td><td>99</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XXL</td><td>112</td><td>117</td><td>43</td><td>97</td><td>104</td></tr>
            </tbody>
        </table>
    `;

    const WOMENS_BLOUSE_CHART_HTML = `
        <table style="width:100%; border-collapse: collapse; text-align: center; font-size: 0.9em;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Size</th>
                    <th style="padding: 10px;">To Fit Bust (in)</th>
                    <th style="padding: 10px;">Front Length (in)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">S</td><td>33.0</td><td>13.5</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">M</td><td>35.0</td><td>14.0</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">L</td><td>37.0</td><td>14.5</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XL</td><td>39.0</td><td>14.5</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XXL</td><td>41.0</td><td>15.0</td></tr>
            </tbody>
        </table>
    `;

    const WOMENS_BLOUSE_CHART_CM_HTML = `
        <table style="width:100%; border-collapse: collapse; text-align: center; font-size: 0.9em;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Size</th>
                    <th style="padding: 10px;">To Fit Bust (cm)</th>
                    <th style="padding: 10px;">Front Length (cm)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">S</td><td>84</td><td>34</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">M</td><td>89</td><td>36</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">L</td><td>94</td><td>37</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XL</td><td>99</td><td>37</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XXL</td><td>104</td><td>38</td></tr>
            </tbody>
        </table>
    `;

    const KIDS_SIZE_CHART_IN_HTML = `
        <table style="width:100%; border-collapse: collapse; text-align: center; font-size: 0.9em;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Size</th>
                    <th style="padding: 10px;">Age Range</th>
                    <th style="padding: 10px;">Height (in)</th>
                    <th style="padding: 10px;">Weight (kg)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">S</td><td>2–4Y</td><td>32.7 – 42.5</td><td>12 – 13</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">M</td><td>4–6Y</td><td>38.6 – 47.2</td><td>15 – 17</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">L</td><td>6–8Y</td><td>44.9 – 53.5</td><td>19 – 21.5</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XL</td><td>8–10Y</td><td>50.4 – 57.5</td><td>23.5</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XXL</td><td>10–14Y</td><td>55.9 – 59.8+</td><td>29 – 32</td></tr>
            </tbody>
        </table>
    `;

    const KIDS_SIZE_CHART_CM_HTML = `
        <table style="width:100%; border-collapse: collapse; text-align: center; font-size: 0.9em;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #eee;">
                    <th style="padding: 10px;">Size</th>
                    <th style="padding: 10px;">Age Range</th>
                    <th style="padding: 10px;">Height (cm)</th>
                    <th style="padding: 10px;">Weight (lbs)</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">S</td><td>2–4Y</td><td>83 – 108</td><td>26.5 – 28.7</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">M</td><td>4–6Y</td><td>98 – 120</td><td>33 – 37.5</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">L</td><td>6–8Y</td><td>114 – 136</td><td>42 – 47.4</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XL</td><td>8–10Y</td><td>128 – 146</td><td>51.8</td></tr>
                <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">XXL</td><td>10–14Y</td><td>142 – 152+</td><td>64 – 70.5</td></tr>
            </tbody>
        </table>
    `;

    // Toggle Wrapper with Unit Switch
    const SIZE_CHART_WRAPPER_HTML = `
        <div class="size-chart-controls" style="text-align:center; margin-bottom:15px;">
            <div style="display:inline-flex; border:1px solid #000; border-radius:4px; overflow:hidden;">
                <button type="button" id="size-chart-unit-in" class="unit-toggle-btn active" style="padding:8px 16px; border:none; background:#000; color:#fff; cursor:pointer; font-size:14px; font-weight:600; border-right:1px solid #444;">Inches</button>
                <button type="button" id="size-chart-unit-cm" class="unit-toggle-btn" style="padding:8px 16px; border:none; background:#fff; color:#000; cursor:pointer; font-size:14px; font-weight:600;">CM</button>
            </div>
        </div>
        <div id="size-chart-table-container"></div>
    `;

    // --- Global Storage Key Helpers (Delegate to index.js logic) ---
    function getWishlistKey() {
        return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(WISHLIST_KEY) : WISHLIST_KEY;
    }
    function getCartKey() {
        return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(CART_KEY) : CART_KEY;
    }

    // --- Helper Functions to Access Storage ---
    function getWishlist() {
        try {
            const list = JSON.parse(localStorage.getItem(getWishlistKey())) || [];
            return Array.isArray(list) ? list.filter(item => item && item.id) : [];
        } catch (e) {
            console.error("Error parsing wishlist:", e);
            return [];
        }
    }
    function getCart() {
        try {
            const list = JSON.parse(localStorage.getItem(getCartKey())) || [];
            return Array.isArray(list) ? list.filter(item => item && item.id) : [];
        } catch (e) {
            console.error("Error parsing cart:", e);
            return [];
        }
    }
    function saveCart(cart) {
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
        // Also update header counts via index.js functions if available
        if (typeof updateCartCount === 'function') updateCartCount();
    }

    // --- Legacy Helper: Calculate cart total items ---
    function getMainProductCartId() {
        // This logic depends on the product implementation details
        // For now, simpler to just access cart directly
        return null;
    }


    const originalAllProductsUSD = [
    ];
    // Keep old name for backward compatibility
    const originalAllProductsINR = originalAllProductsUSD;



    // --- Get/Set Selected Region ---
    function getSelectedRegion() {
        return localStorage.getItem(SELECTED_REGION_KEY) || 'ca';
    }

    // Transient message helper used across PDP
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

    // --- Custom Alert Modal for Size Selection ---
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

        // Focus on OK button for accessibility
        setTimeout(() => btn.focus(), 100);
    }

    function setSelectedRegion(region) {
        if (EXCHANGE_RATES[region]) {
            localStorage.setItem(SELECTED_REGION_KEY, region);
        } else {
            console.error("Invalid region selected:", region);
        }
    }

    // --- Price Conversion Functions (Prices stored in USD) ---
    function convertUsdToTargetCurrency(priceUsdStr, region) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
        const priceNum = parseFloat(String(priceUsdStr).replace(/[^0-9.]/g, '')) || 0;
        return isNaN(priceNum) ? 0 : (priceNum * regionData.rate);
    }
    // Keep old function name for backward compatibility, but it now converts USD
    function convertInrToTargetCurrency(priceUsdStr, region) {
        return convertUsdToTargetCurrency(priceUsdStr, region);
    }
    function formatCurrency(amount, region) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
        return `${regionData.symbol}${amount.toFixed(2)}`;
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

    // --- Added to Cart Confirmation Popup ---
    function showAddedToCartPopup() {
        console.log('DEBUG: showAddedToCartPopup called');

        // Remove existing modal if any
        const existingModal = document.getElementById('added-to-cart-modal');
        if (existingModal) existingModal.remove();

        // Create modal HTML
        const modalHTML = `
            <div id="added-to-cart-modal" class="custom-alert-overlay">
                <div class="custom-alert-box added-to-cart-box">
                    <div class="custom-alert-header">
                        <div class="success-icon-circle">
                            <i class="fas fa-check"></i>
                        </div>
                        <h3>Success!</h3>
                    </div>
                    <div class="custom-alert-body">
                        <p>Item added to your cart successfully.</p>
                    </div>
                    <div class="custom-alert-footer vertical-actions">
                        <button class="custom-alert-btn primary-btn" id="popup-go-to-cart">Go to Cart</button>
                        <button class="custom-alert-btn secondary-btn" id="popup-continue-shopping">Continue Shopping</button>
                    </div>
                </div>
            </div>
        `;

        // Inject styles if not already present (extending custom-alert-styles)
        if (!document.getElementById('added-to-cart-styles')) {
            const styles = document.createElement('style');
            styles.id = 'added-to-cart-styles';
            styles.textContent = `
                /* Base modal overlay styles */
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
                    opacity: 1;
                }
                .custom-alert-box {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    min-width: 320px;
                    max-width: 400px;
                    overflow: hidden;
                    transform: scale(1);
                    animation: popupScaleIn 0.2s ease forwards;
                }
                @keyframes popupScaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .custom-alert-header {
                    padding: 20px 24px 16px;
                }
                .custom-alert-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                }
                .custom-alert-body {
                    padding: 10px 24px 24px;
                }
                .custom-alert-body p {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.5;
                    color: #666;
                }
                .custom-alert-btn {
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                /* Added to cart specific styles */
                .added-to-cart-box {
                    text-align: center;
                    padding-bottom: 30px;
                }
                .success-icon-circle {
                    width: 50px;
                    height: 50px;
                    background-color: #27ae60;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    margin: 0 auto 15px;
                }
                .vertical-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    align-items: stretch;
                    padding: 0 40px 30px;
                }
                .primary-btn {
                    background-color: #000;
                    color: white;
                    border: 1px solid #000;
                }
                .primary-btn:hover {
                    background-color: #333;
                }
                .secondary-btn {
                    background-color: white;
                    color: #333;
                    border: 1px solid #ccc;
                }
                .secondary-btn:hover {
                    background-color: #f5f5f5;
                    border-color: #bbb;
                }
                @media (max-width: 480px) {
                    .vertical-actions {
                        padding: 0 20px 25px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal elements
        const modal = document.getElementById('added-to-cart-modal');
        const goToCartBtn = document.getElementById('popup-go-to-cart');
        const continueBtn = document.getElementById('popup-continue-shopping');

        // Close modal function
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        };

        // Event listeners
        goToCartBtn.addEventListener('click', () => {
            window.location.href = '/cart/';
        });

        continueBtn.addEventListener('click', closeModal);

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

        // Focus on "Go to Cart" button for accessibility
        setTimeout(() => goToCartBtn.focus(), 100);
    }

    // --- Removed from Cart Confirmation Popup ---
    function showRemovedFromCartPopup() {
        console.log('DEBUG: showRemovedFromCartPopup called');

        // Remove existing modal if any
        const existingModal = document.getElementById('removed-from-cart-modal');
        if (existingModal) existingModal.remove();

        // Create modal HTML
        const modalHTML = `
            <div id="removed-from-cart-modal" class="custom-alert-overlay">
                <div class="custom-alert-box removed-from-cart-box">
                    <div class="custom-alert-header">
                        <div class="remove-icon-circle">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <h3>Removed!</h3>
                    </div>
                    <div class="custom-alert-body">
                        <p>Item has been removed from your cart.</p>
                    </div>
                    <div class="custom-alert-footer single-action">
                        <button class="custom-alert-btn primary-btn" id="popup-continue-after-remove">Continue Shopping</button>
                    </div>
                </div>
            </div>
        `;

        // Inject styles if not already present
        if (!document.getElementById('removed-from-cart-styles')) {
            const styles = document.createElement('style');
            styles.id = 'removed-from-cart-styles';
            styles.textContent = `
                .removed-from-cart-box {
                    text-align: center;
                    padding-bottom: 30px;
                }
                .remove-icon-circle {
                    width: 50px;
                    height: 50px;
                    background-color: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    margin: 0 auto 15px;
                }
                .single-action {
                    display: flex;
                    justify-content: center;
                    padding: 0 40px 30px;
                }
            `;
            document.head.appendChild(styles);
        }

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal elements
        const modal = document.getElementById('removed-from-cart-modal');
        const continueBtn = document.getElementById('popup-continue-after-remove');

        // Close modal function
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 200);
        };

        // Event listeners
        continueBtn.addEventListener('click', closeModal);

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

        // Focus on button for accessibility
        setTimeout(() => continueBtn.focus(), 100);
    }


    // But wait until DOM is ready to access elements
    const pathParts = window.location.pathname.split('/').filter(p => p);
    const productId = pathParts[pathParts.length - 1]; // Get last part of path
    const urlParams = new URLSearchParams(window.location.search);
    const passedImageUrl = urlParams.get('img');

    // Product will be loaded from API
    let product = null;
    let productImageURL = '';
    let allProductsConverted = [];

    async function loadProductAndInitialize() {
        // Get productDetailWrapper here, after DOM is ready
        const productDetailWrapper = document.getElementById('product-detail-wrapper');

        if (!productDetailWrapper) {
            console.error('Product detail wrapper element not found in DOM');
            return;
        }

        if (!productId) {
            console.error('Product ID not found in URL. Path:', window.location.pathname, 'Extracted ID:', productId);
            productDetailWrapper.innerHTML = `<p class="error-message">Product ID not found in URL.</p>`;
            return;
        }

        console.log('Loading product with ID:', productId);

        try {
            // Fetch the specific product by slug with cache busting
            const response = await fetch(`/product/${productId}/api/?t=${Date.now()}`);

            console.log('API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('API data received (FULL):', data);
                console.log('API data size_data:', data.size_data);

                if (data && data.id) {
                    const apiProduct = data;    // ⬅️ Use the data directly
                    console.log('Product found:', apiProduct);

                    // Convert API format to expected format
                    const initialRegionPDP = getSelectedRegion();
                    const regularPriceConverted = convertInrToTargetCurrency(apiProduct.price, initialRegionPDP);
                    const discountPriceConverted = apiProduct.discount_price ? convertInrToTargetCurrency(apiProduct.discount_price, initialRegionPDP) : null;
                    const displayPrice = discountPriceConverted || regularPriceConverted;

                    product = {
                        id: apiProduct.id, // slug
                        name: apiProduct.name,
                        price: parseFloat(apiProduct.price).toString(),
                        discount_price: apiProduct.discount_price ? parseFloat(apiProduct.discount_price).toString() : null,
                        priceConverted: displayPrice,
                        regularPriceConverted: regularPriceConverted,
                        discountPriceConverted: discountPriceConverted,
                        image: apiProduct.image || '/static/customer/images/placeholder.jpg',
                        size_data: apiProduct.size_data || {},
                        // ✅ Add these lines
                        thumbnail1: apiProduct.thumbnail1 || null,
                        thumbnail2: apiProduct.thumbnail2 || null,
                        thumbnail3: apiProduct.thumbnail3 || null,
                        description: apiProduct.description || '',
                        category: apiProduct.category || '',
                        gender: apiProduct.gender || '',
                        size_chart_type: apiProduct.size_chart_type || 'none', // Added
                        rating: apiProduct.rating_data ? apiProduct.rating_data.rating : 4.5,
                        isNew: apiProduct.rating_data ? apiProduct.rating_data.is_new : false,
                        onSale: apiProduct.discount_price && parseFloat(apiProduct.discount_price) > 0,

                    };

                    productImageURL = passedImageUrl || product.image;

                    console.log('Product object created:', product);

                    // Also fetch all products for similar products section and search
                    const allProductsResponse = await fetch('/api/products/');
                    if (allProductsResponse.ok) {
                        const allProductsData = await allProductsResponse.json();
                        if (allProductsData.products) {
                            allProductsConverted = allProductsData.products.map(p => ({
                                id: p.id,
                                name: p.name,
                                price: parseFloat(p.price).toString(),
                                discount_price: p.discount_price ? parseFloat(p.discount_price).toString() : null,
                                priceConverted: convertInrToTargetCurrency(p.discount_price || p.price, initialRegionPDP),
                                image: p.image || '/static/customer/images/placeholder.jpg',
                                category: p.category || '',
                                rating: 4.5
                            }));

                            // Update originalAllProductsINR for search functionality
                            originalAllProductsINR.length = 0;
                            originalAllProductsINR.push(...allProductsData.products.map(p => ({
                                id: p.id,
                                name: p.name,
                                price: parseFloat(p.price).toString(),
                                image: p.image || '/static/customer/images/placeholder.jpg',
                                category: p.category || '',
                                rating: 4.5,
                                isNew: false,
                                onSale: p.discount_price && parseFloat(p.discount_price) > 0
                            })));
                        }
                    }

                    console.log('Rendering product detail page...');
                    // Render the product detail page
                    renderPDPContent();
                    setupPDPInteractivity();
                    renderCartItems();
                    setupSizeChartModal();
                    initializeWishlistButtonState();
                    updateCartCount();
                    updateWishlistCount();
                    setupSearchFunctionality();

                    // Listen for region changes
                    document.addEventListener('regionChanged', () => {
                        updateDisplayedPrices();
                        updateSearchPopupPrices();
                    });

                    // Listen for user identification
                    document.addEventListener('userIdentified', () => {
                        console.log("Product Page: User identified, refreshing header counts...");
                        updateCartCount();
                        updateWishlistCount();
                    });
                } else {
                    console.error('No products found in API response');
                    productDetailWrapper.innerHTML = `<p class="error-message" style="padding: 40px; text-align: center; color: #e74c3c;">
                        Product not found. Please check the URL.
                        <br><br><a href="/" style="color: #007bff;">Return to Homepage</a>
                    </p>`;
                }
            } else {
                const errorText = await response.text();
                console.error('API request failed:', response.status, errorText);
                throw new Error(`Failed to fetch product: HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading product:', error);
            productDetailWrapper.innerHTML = `<p class="error-message" style="padding: 40px; text-align: center; color: #e74c3c;">
                Error loading product: ${error.message}. 
                <br><br>Please check:<br>
                1. The product URL is correct<br>
                2. The product exists in the database<br>
                3. Your internet connection is working<br>
                <br><a href="/" style="color: #007bff;">Return to Homepage</a>
            </p>`;
        }
    }

    // Initialize when DOM is ready - ensure it runs
    console.log('Product page script loaded. Product ID from URL:', productId, 'Path:', window.location.pathname);

    if (productId && productId.trim() !== '' && productId !== 'product') {
        console.log('Calling loadProductAndInitialize...');
        loadProductAndInitialize();
    } else {
        console.error('Invalid product ID:', productId, 'from path:', window.location.pathname);
        const productDetailWrapper = document.getElementById('product-detail-wrapper');
        if (productDetailWrapper) {
            productDetailWrapper.innerHTML = `<p class="error-message" style="padding: 40px; text-align: center; color: #e74c3c;">
                Invalid product URL. The product ID could not be extracted from the URL.
                <br><br>Expected format: /product/product-slug/
                <br>Current URL: ${window.location.pathname}
                <br><br><a href="/" style="color: #007bff;">Return to Homepage</a>
            </p>`;
        }
    }

    // --- Refresh product details when a product update broadcast is received ---
    async function refreshProductDetails() {
        try {
            if (!productId) return;
            console.log('refreshProductDetails: fetching latest product data for', productId);
            const resp = await fetch(`/product/${productId}/api/?t=${Date.now()}`);
            if (!resp.ok) {
                console.warn('refreshProductDetails: failed to fetch product API', resp.status);
                return;
            }
            const apiProduct = await resp.json();
            if (!apiProduct) return;

            // Update local product object
            product.size_data = apiProduct.size_data || {};
            product.stock = apiProduct.stock || product.stock;

            // Update size-option buttons (if present)
            Object.entries(product.size_data || {}).forEach(([size, data]) => {
                try {
                    const btn = document.querySelector(`.size-option[data-size="${size}"]`);
                    if (btn) {
                        btn.dataset.stock = String(data.stock || 0);
                        if (data.price !== undefined) btn.dataset.price = String(data.price);
                        if (data.discount !== undefined) btn.dataset.discount = String(data.discount || 0);
                        if ((data.stock || 0) <= 0) {
                            btn.classList.add('disabled');
                            btn.disabled = true;
                        } else {
                            btn.classList.remove('disabled');
                            btn.disabled = false;
                        }
                    }
                } catch (e) {
                    console.warn('refreshProductDetails: error updating size button for', size, e);
                }
            });

            // Update stock display for selected size
            try {
                const sel = document.querySelector('.size-option.selected');
                const stockDisplay = document.getElementById('stock-display');
                if (sel && stockDisplay) {
                    const s = sel.dataset.size;
                    const sd = product.size_data && product.size_data[s] ? parseInt(product.size_data[s].stock, 10) : 0;

                    if (sd <= 0) {
                        stockDisplay.textContent = 'Out of Stock';
                        stockDisplay.style.color = '#e74c3c'; // Red
                    } else if (sd <= 5) {
                        stockDisplay.textContent = `Only ${sd} left`;
                        stockDisplay.style.color = '#e67e22'; // Orange/Warning
                    } else {
                        stockDisplay.textContent = `${sd} left`;
                        stockDisplay.style.color = '#27ae60'; // Green
                    }
                } else if (stockDisplay) {
                    // Fallback: if no size selection, show top-level stock if available
                    const topStock = product.stock !== undefined ? parseInt(product.stock, 10) : 0;
                    if (topStock <= 0) {
                        stockDisplay.textContent = 'Out of Stock';
                        stockDisplay.style.color = '#e74c3c';
                    } else if (topStock <= 5) {
                        stockDisplay.textContent = `Only ${topStock} left`;
                        stockDisplay.style.color = '#e67e22';
                    } else {
                        stockDisplay.textContent = `${topStock} left`;
                        stockDisplay.style.color = '#27ae60';
                    }
                }
            } catch (e) { console.warn('refreshProductDetails: error updating stock display', e); }

            // Update quantity input max based on new stock
            try {
                const qtyInput = document.getElementById('pdp-quantity');
                if (qtyInput) {
                    const maxStock = (function getMaxFromProduct() {
                        if (!product || !product.size_data) return 99;
                        if (Object.keys(product.size_data).length > 0) {
                            const sel = document.querySelector('.size-option.selected');
                            if (sel) return parseInt(sel.dataset.stock || '0', 10) || 0;
                        }
                        return product.stock !== undefined ? parseInt(product.stock || '0', 10) : 99;
                    })();
                    qtyInput.max = Math.max(1, maxStock || 1);
                    if (parseInt(qtyInput.value, 10) > maxStock) qtyInput.value = maxStock || 1;
                }
            } catch (e) { console.warn('refreshProductDetails: error updating qty input', e); }

            // Optionally re-render parts if needed
            try { updateCartButtonState(); renderCartItems(); } catch (e) { /* ignore */ }
            console.log('refreshProductDetails: update complete');
        } catch (e) {
            console.error('refreshProductDetails error', e);
        }
    }

    // Listen for storage events from other tabs/pages announcing product updates
    window.addEventListener('storage', (e) => {
        try {
            if (!e) return;
            if (e.key === 'products_refreshed') {
                console.log('storage event: products_refreshed received', e.newValue);
                // Refresh current product details
                refreshProductDetails();
                return;
            }

            // Handle client-side stock decrements written by checkout when an order is placed
            if (e.key === 'stock_decrements') {
                try {
                    console.log('storage event: stock_decrements received', e.newValue);
                    const payload = JSON.parse(e.newValue || '{}');
                    const items = Array.isArray(payload.items) ? payload.items : [];
                    if (items.length === 0) return;

                    // Apply decrements to the current product if present
                    items.forEach(dec => {
                        if (!dec || !dec.id) return;
                        // If this decrement is for the currently viewed product
                        if (String(dec.id) === String(productId)) {
                            const qty = parseInt(dec.quantity || 0, 10) || 0;
                            const sizeKey = dec.size || null;
                            // Decrement size-level stock if available
                            if (product && product.size_data && sizeKey && product.size_data[sizeKey]) {
                                const cur = parseInt(product.size_data[sizeKey].stock || 0, 10) || 0;
                                const next = Math.max(0, cur - qty);
                                product.size_data[sizeKey].stock = next;
                                const btn = document.querySelector(`.size-option[data-size="${sizeKey}"]`);
                                if (btn) {
                                    btn.dataset.stock = String(next);
                                    if (next <= 0) { btn.classList.add('disabled'); btn.disabled = true; }
                                    else { btn.classList.remove('disabled'); btn.disabled = false; }
                                }
                            }

                            // If no size-specific stock, decrement top-level stock
                            if (product && (product.stock !== undefined) && (!sizeKey || !product.size_data || !product.size_data[sizeKey])) {
                                const curTop = parseInt(product.stock || 0, 10) || 0;
                                product.stock = Math.max(0, curTop - qty);
                            }
                        }

                        // Also update any cached allProductsConverted / originalAllProductsINR entries
                        try {
                            if (Array.isArray(allProductsConverted)) {
                                const idx = allProductsConverted.findIndex(p => String(p.id) === String(dec.id));
                                if (idx !== -1) {
                                    const entry = allProductsConverted[idx];
                                    if (entry && entry.stock !== undefined) {
                                        entry.stock = Math.max(0, (parseInt(entry.stock || 0, 10) - (parseInt(dec.quantity || 0, 10) || 0)));
                                    }
                                }
                            }
                        } catch (e) { /* non-fatal */ }
                    });

                    // Update stock display for selected size or top-level
                    try {
                        const stockDisplay = document.getElementById('stock-display');
                        const sel = document.querySelector('.size-option.selected');
                        if (stockDisplay) {
                            let sd = null;
                            if (sel) {
                                sd = product.size_data && product.size_data[sel.dataset.size] ? parseInt(product.size_data[sel.dataset.size].stock, 10) : null;
                            }
                            if (sd === null || sd === undefined) sd = parseInt(product.stock || 0, 10);

                            if (sd <= 0) {
                                stockDisplay.textContent = 'Out of Stock';
                                stockDisplay.style.color = '#e74c3c';
                            } else if (sd <= 5) {
                                stockDisplay.textContent = `Only ${sd} left`;
                                stockDisplay.style.color = '#e67e22';
                            } else {
                                stockDisplay.textContent = `${sd} left`;
                                stockDisplay.style.color = '#27ae60';
                            }
                        }

                        // Update quantity input max
                        const qtyInput = document.getElementById('pdp-quantity');
                        if (qtyInput) {
                            const maxStock = (function getMaxFromProduct() {
                                if (!product || !product.size_data) return 99;
                                if (Object.keys(product.size_data).length > 0) {
                                    const sel = document.querySelector('.size-option.selected');
                                    if (sel) return parseInt(sel.dataset.stock || '0', 10) || 0;
                                }
                                return product.stock !== undefined ? parseInt(product.stock || '0', 10) : 99;
                            })();
                            qtyInput.max = Math.max(1, maxStock || 1);
                            if (parseInt(qtyInput.value, 10) > maxStock) qtyInput.value = maxStock || 1;
                        }
                    } catch (e) { console.warn('stock_decrements: error updating displays', e); }
                } catch (err) {
                    console.warn('Error parsing stock_decrements payload', err);
                }
                return;
            }
        } catch (err) {
            console.warn('storage event handler error', err);
        }
    });

    // --- Helper Functions ---
    function getCartKey() {
        return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(CART_KEY) : CART_KEY;
    }
    function getWishlistKey() {
        return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(WISHLIST_KEY) : WISHLIST_KEY;
    }
    function getReviewsKey() {
        return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(REVIEWS_KEY) : REVIEWS_KEY;
    }

    function getWishlist() { return JSON.parse(localStorage.getItem(getWishlistKey())) || []; }
    function getCart() {
        try {
            const cartStr = localStorage.getItem(getCartKey());
            const cart = JSON.parse(cartStr || '[]');
            return Array.isArray(cart) ? cart : [];
        } catch (e) {
            console.error('getCart: Error parsing cart:', e);
            return [];
        }
    }
    function saveCart(cart) {
        try {
            console.log('saveCart (product.js): Saving cart with', cart.length, 'items');
            if (!Array.isArray(cart)) {
                console.error('saveCart (product.js): Cart is not an array!', cart);
                return;
            }
            // Validate cart items have required fields
            let clamped = false;
            const validatedCart = cart.filter(item => {
                if (!item.id) {
                    console.warn('saveCart (product.js): Cart item missing id, removing:', item);
                    return false;
                }
                // Ensure quantity is at least 1
                if (!item.quantity || isNaN(parseInt(item.quantity, 10)) || parseInt(item.quantity, 10) < 1) {
                    item.quantity = 1;
                } else {
                    item.quantity = parseInt(item.quantity, 10);
                }
                // Ensure size is preserved (even if it's 'N/A')
                if (item.size === undefined || item.size === null) {
                    item.size = 'N/A';
                    console.warn('saveCart (product.js): Cart item missing size, setting to N/A for:', item.id);
                }
                // If stock info exists, clamp quantity to stock
                if (item.stock !== undefined && item.stock !== null) {
                    const stockNum = parseInt(item.stock, 10);
                    if (!isNaN(stockNum) && item.quantity > stockNum) {
                        console.warn(`saveCart (product.js): Clamping quantity for ${item.id} (requested ${item.quantity}, stock ${stockNum})`);
                        item.quantity = stockNum;
                        clamped = true;
                    }
                }
                console.log('saveCart (product.js): Validated item:', { id: item.id, size: item.size, quantity: item.quantity });
                return true;
            });

            if (validatedCart.length !== cart.length) {
                console.warn('saveCart (product.js): Some cart items were invalid and removed');
            }

            const cartStr = JSON.stringify(validatedCart);
            localStorage.setItem(getCartKey(), cartStr);
            // Verify immediately
            const verify = getCart();
            console.log('saveCart (product.js): Verification - cart now has', verify.length, 'items');

            // Also save to sessionStorage as backup (or clear if empty)
            // NOTE: Do NOT clear buy_now_item here - it's independent of regular cart
            if (validatedCart.length === 0) {
                sessionStorage.removeItem('cart_backup');
                console.log('saveCart (product.js): Cart is empty, cleared cart_backup');
            } else {
                sessionStorage.setItem('cart_backup', cartStr);
                console.log('saveCart (product.js): Also saved to sessionStorage backup');
            }

            // If we clamped quantities, surface a transient message for the user
            if (clamped) {
                showTransientCartMessage('Some item quantities were reduced to available stock.');
            }
        } catch (e) {
            console.error('saveCart (product.js): Error saving cart:', e);
        }
    }
    function getReviews() {
        try { const stored = localStorage.getItem(getReviewsKey()); return stored ? JSON.parse(stored) : []; }
        catch (e) { console.error("Error parsing reviews:", e); localStorage.removeItem(getReviewsKey()); return []; }
    }
    function saveReviews(reviews) { localStorage.setItem(getReviewsKey(), JSON.stringify(reviews)); }

    // --- Header Count Updates ---
    function updateWishlistCount() {
        const count = getWishlist().length;
        const el = document.getElementById("wishlistCount");
        console.log("updateWishlistCount called. Count:", count, "Element found:", !!el);
        if (el) { el.textContent = count; el.style.display = count > 0 ? "flex" : "none"; }
    }
    function updateCartCount() {
        const cart = getCart();
        const total = cart.reduce((s, i) => s + (i.quantity || 0), 0);
        const el = document.getElementById("cartCount");
        console.log("updateCartCount called. Total:", total, "Element found:", !!el);
        if (el) { el.textContent = total; el.style.display = total > 0 ? "flex" : "none"; }
    }

    // Listen for header loaded event (registered immediately so it catches the event)
    document.addEventListener('headerLoaded', () => {
        console.log("Product Page: Header loaded, refreshing counts...");
        updateCartCount();
        updateWishlistCount();
    });

    // --- Wishlist Update Logic ---
    function updateWishlist(productData, isAdding) {
        let list = getWishlist();
        const currentRegion = getSelectedRegion();
        if (!productData || !productData.id || !productData.name || productData.priceConverted === undefined || !productData.image) { console.error("Invalid product data for wishlist:", productData); return; }

        const priceInr = convertDisplayedToInr(productData.priceConverted.toString(), currentRegion);
        const itemToStore = { ...productData, price: priceInr.toString() };
        delete itemToStore.priceConverted;

        if (isAdding) { if (!list.some(item => item.id === itemToStore.id)) list.push(itemToStore); }
        else { list = list.filter(item => item.id !== itemToStore.id); }

        localStorage.setItem(getWishlistKey(), JSON.stringify(list));
        updateWishlistCount();
    }


    // --- Render Side Cart Items ---
    function renderCartItems() {
        const cart = getCart();
        const container = document.getElementById('cart-items-container');
        const subtotalEl = document.getElementById('subtotal-price');
        if (!container || !subtotalEl) { console.error("Side cart HTML elements not found"); return; }
        container.innerHTML = ''; let subtotalConverted = 0;
        const currentRegion = getSelectedRegion();

        if (cart.length === 0) { container.innerHTML = '<div class="empty-cart-message"><p>Your cart is empty.</p></div>'; subtotalEl.textContent = formatCurrency(0, currentRegion); return; }

        cart.forEach(item => {
            // Try to find product in allProductsConverted first, then fallback to originalAllProductsINR
            let productINR = allProductsConverted.find(p => p.id === item.id);
            if (!productINR) {
                productINR = originalAllProductsINR.find(p => p.id === item.id);
            }
            if (!productINR) {
                console.warn(`Product details not found for side cart item ID: ${item.id}`);
                return;
            }
            const itemQuantity = item.quantity || 1;
            // Use discount_price from cart item if available, otherwise use price (stored in USD)
            const effectivePrice = item.discount_price || item.price || productINR.price || '0';
            const priceConverted = convertUsdToTargetCurrency(effectivePrice, currentRegion);
            const itemTotalPriceConverted = priceConverted * itemQuantity;
            subtotalConverted += itemTotalPriceConverted;
            const displayImage = item.image || productINR.image;

            const itemHTML = `
                <div class="cart-item" data-cart-id="${item.cartId}"> <img src="${displayImage}" alt="${productINR.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${productINR.name} (Size: ${item.size || 'N/A'})</div>
                        <div class="cart-item-price">${formatCurrency(priceConverted, currentRegion)}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button class="quantity-btn decrease-qty">-</button>
                                <span class="item-quantity">${itemQuantity}</span>
                                <button class="quantity-btn increase-qty">+</button>
                            </div>
                            <button class="remove-item-btn">Remove</button>
                        </div>
                    </div>
                </div>`;
            container.innerHTML += itemHTML;
        });
        subtotalEl.textContent = formatCurrency(subtotalConverted, currentRegion);
        addCartActionListeners();
    }

    // --- Add Listeners for Side Cart Actions ---
    function addCartActionListeners() {
        const cartItemsContainer = document.getElementById('cart-items-container'); if (!cartItemsContainer) return;
        cartItemsContainer.querySelectorAll('.remove-item-btn, .increase-qty, .decrease-qty').forEach(btn => {
            const newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                const cartItemElement = e.target.closest('.cart-item');
                const cartId = cartItemElement?.dataset.cartId; if (!cartId) return;
                let cart = getCart(); const itemIndex = cart.findIndex(i => (i.cartId || i.id) === cartId); if (itemIndex === -1) return; // Check both cartId and id
                const currentItem = cart[itemIndex]; let needsUpdate = false;
                if (newBtn.classList.contains('remove-item-btn') || (newBtn.classList.contains('decrease-qty') && currentItem.quantity <= 1)) {
                    cart.splice(itemIndex, 1);
                    needsUpdate = true;
                }
                else if (newBtn.classList.contains('increase-qty')) {
                    // enforce stock limit if available on cart item
                    const availableStock = currentItem.stock !== undefined ? parseInt(currentItem.stock, 10) : null;
                    if (availableStock !== null && !isNaN(availableStock)) {
                        if ((currentItem.quantity || 0) < availableStock) {
                            currentItem.quantity = (currentItem.quantity || 0) + 1;
                            needsUpdate = true;
                        } else {
                            // show consistent transient message
                            if (typeof showTransientCartMessage === 'function') showTransientCartMessage('Maximum quantity limit reached');
                        }
                    } else {
                        currentItem.quantity = (currentItem.quantity || 0) + 1;
                        needsUpdate = true;
                    }
                }
                else if (newBtn.classList.contains('decrease-qty')) {
                    currentItem.quantity--;
                    needsUpdate = true;
                }
                if (needsUpdate) { saveCart(cart); renderCartItems(); updateCartCount(); const mainCartBtn = document.querySelector('.add-to-cart-btn'); const currentProductCartId = getMainProductCartId(); if (mainCartBtn && currentProductCartId && cartId === currentProductCartId) { updateCartButtonState(); } }
            });
        });
        const sideCartCheckoutBtn = document.querySelector('#cart-sidebar .checkout-btn');
        if (sideCartCheckoutBtn) { sideCartCheckoutBtn.onclick = () => window.location.href = '/checkout/'; }
    }

    // --- Generate Static Star Rating HTML ---
    function generateRatingHTML(rating, productId) {
        const productReviews = getReviews().filter(r => r.productId === productId); const count = productReviews.length;
        const validRating = (typeof rating === 'number' && !isNaN(rating) && rating > 0) ? rating : 0;
        const full = '<i class="fas fa-star"></i>', half = '<i class="fas fa-star-half-alt"></i>', empty = '<i class="far fa-star"></i>'; let stars = '';
        const r = Math.round(validRating * 2) / 2; for (let i = 1; i <= 5; i++) { stars += (r >= i) ? full : (r >= i - 0.5) ? half : empty; }
        const ratingText = validRating > 0 ? `(${validRating.toFixed(1)} / 5)` : '(No Rating)';
        const countText = count > 0 ? `| ${count} ${count === 1 ? 'Review' : 'Reviews'}` : '';
        // --- MODIFICATION: Added cursor: pointer; and title attribute ---
        return `<div class="product-rating-display" data-product-id="${productId}" style="cursor: pointer;" title="Scroll to reviews">
                    <div class="product-rating-stars">${stars}
                        <span class="rating-text">${ratingText}</span>
                        <span class="review-count-text">${countText}</span>
                    </div>
                </div>`;
    }

    // --- Generate Sale/New Labels ---
    function generateLabelsHTML(product) {
        // Explicitly ignore NEW label everywhere
        if (product.onSale) {
            return `<div class="product-labels">
                    <span class="product-label-sale">SALE</span>
                </div>`;
        }
        return '';
    }



    // --- Render Similar Products ---
    function shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a;
    }
    function renderSimilarProducts(currentProduct) {
        const grid = document.getElementById('similar-products-grid');
        const section = document.querySelector('.similar-products-section');
        if (!grid || !currentProduct || !section) {
            if (section) section.style.display = 'none';
            return;
        }

        // If allProductsConverted is empty, hide the section
        if (!allProductsConverted || allProductsConverted.length === 0) {
            section.style.display = 'none';
            return;
        }

        const currentRegion = getSelectedRegion(); // Get region for formatting

        // Filter similar products by category or gender, excluding current product
        let similar = allProductsConverted.filter(p => {
            if (p.id === currentProduct.id) return false;
            // Match by category if available
            if (currentProduct.category && p.category) {
                return p.category === currentProduct.category;
            }
            // Otherwise show any other products
            return true;
        });

        // If no similar products found, show random products
        if (similar.length === 0) {
            similar = allProductsConverted.filter(p => p.id !== currentProduct.id);
        }

        // Limit to 4 products and shuffle
        const display = shuffleArray(similar).slice(0, 4);
        if (display.length === 0) {
            section.style.display = 'none';
            return;
        }
        section.style.display = 'block';
        grid.innerHTML = display.map(p => `
            <article class="product-card"> <a href="/product/${p.id}?img=${encodeURIComponent(p.image)}">
                <div class="product-image-container"><img src="${p.image}" alt="${p.name}"></div>
                <div class="product-info"><h3 class="product-name">${p.name}</h3><p class="product-price">${formatCurrency(convertInrToTargetCurrency(p.price, currentRegion), currentRegion)}</p>
</div> 
            </a> </article>`).join('');
    }

    // --- PDP Specific Logic to find product ---
    // Note: productId, product, productImageURL, and allProductsConverted are already declared above

    // --- Helper to get cartId ---
    function getMainProductCartId() {
        if (!product) return null;
        // Determine if sizes should be shown
        // Determine if sizes should be shown
        const showSizes = product.size_data && Object.keys(product.size_data).length > 0;
        let size = 'N/A';
        if (showSizes) {
            const sel = document.querySelector('.size-option.selected');
            if (!sel) return null;
            size = sel.textContent;
        }
        const cart = getCart();
        const item = cart.find(i => i.id === product.id && i.size === size);
        return item ? item.cartId : null;
    }

    // --- Update Main "Add to Cart" Button State ---
    const updateCartButtonState = () => {
        const cartBtn = document.querySelector('.add-to-cart-btn'); if (!cartBtn || !product) return;

        const showSizes = product.size_data && Object.keys(product.size_data).length > 0;
        let selSize = 'N/A';
        const qtyDisplay = document.getElementById('pdp-quantity'); // This is now an input
        if (showSizes) {
            const sel = document.querySelector('.size-option.selected');
            if (!sel) {
                cartBtn.textContent = "ADD TO CART";
                cartBtn.classList.remove('in-cart');
                if (qtyDisplay) qtyDisplay.value = 1;
                return;
            }
            // Use dataset.size if available, otherwise textContent
            selSize = (sel.dataset.size && sel.dataset.size.trim() !== '') ? sel.dataset.size.trim() : sel.textContent.trim();
        }
        const cart = getCart();
        const item = cart.find(i => i.id === product.id && i.size === selSize);
        console.log('DEBUG updateCartButtonState: selSize =', selSize, ', item found =', !!item, ', cart =', cart);
        if (item) {
            cartBtn.textContent = "REMOVE FROM CART";
            cartBtn.classList.add('in-cart');
            if (qtyDisplay) qtyDisplay.value = item.quantity || 1;
        } else {
            cartBtn.textContent = "ADD TO CART";
            cartBtn.classList.remove('in-cart');
            if (qtyDisplay) qtyDisplay.value = 1;
        }
    };

    // --- Setup Size Chart Modal Logic ---
    function setupSizeChartModal() {
        const overlay = document.getElementById('size-chart-modal-overlay');
        const open = document.getElementById('view-size-chart-btn');
        const close = document.querySelector('#size-chart-modal-overlay .close-modal-btn');

        if (overlay && open && close) {
            open.addEventListener('click', () => {
                const body = overlay.querySelector('.size-chart-body');
                if (body && typeof product !== 'undefined') {
                    const chartType = product.size_chart_type || 'none';

                    // Clear previous content
                    body.innerHTML = '';

                    if (chartType === 'women_general') {
                        // Inject Wrapper
                        body.innerHTML = SIZE_CHART_WRAPPER_HTML;

                        // Elements
                        const container = body.querySelector('#size-chart-table-container');
                        const btnIn = body.querySelector('#size-chart-unit-in');
                        const btnCm = body.querySelector('#size-chart-unit-cm');

                        // Initial Render (Inches)
                        if (container) container.innerHTML = WOMENS_SIZE_CHART_IN_HTML;

                        // Event Listeners for Toggle
                        if (btnIn && btnCm && container) {
                            btnIn.addEventListener('click', () => {
                                // Switch to Inches
                                container.innerHTML = WOMENS_SIZE_CHART_IN_HTML;

                                // Update Styles
                                btnIn.classList.add('active');
                                btnIn.style.background = '#000';
                                btnIn.style.color = '#fff';

                                btnCm.classList.remove('active');
                                btnCm.style.background = '#fff';
                                btnCm.style.color = '#000';
                            });

                            btnCm.addEventListener('click', () => {
                                // Switch to CM
                                container.innerHTML = WOMENS_SIZE_CHART_CM_HTML;

                                // Update Styles
                                btnCm.classList.add('active');
                                btnCm.style.background = '#000';
                                btnCm.style.color = '#fff';

                                btnIn.classList.remove('active');
                                btnIn.style.background = '#fff';
                                btnIn.style.color = '#000';
                            });
                        }
                    } else if (chartType === 'women_blouse') {
                        // Inject Wrapper
                        body.innerHTML = `<h3 style="text-align:center;">Blouse Size Chart</h3>${SIZE_CHART_WRAPPER_HTML}`;

                        // Elements
                        const container = body.querySelector('#size-chart-table-container');
                        const btnIn = body.querySelector('#size-chart-unit-in');
                        const btnCm = body.querySelector('#size-chart-unit-cm');

                        // Initial Render (Inches)
                        if (container) container.innerHTML = WOMENS_BLOUSE_CHART_HTML;

                        // Event Listeners for Toggle
                        if (btnIn && btnCm && container) {
                            btnIn.addEventListener('click', () => {
                                // Switch to Inches
                                container.innerHTML = WOMENS_BLOUSE_CHART_HTML;

                                // Update Styles
                                btnIn.classList.add('active');
                                btnIn.style.background = '#000';
                                btnIn.style.color = '#fff';

                                btnCm.classList.remove('active');
                                btnCm.style.background = '#fff';
                                btnCm.style.color = '#000';
                            });

                            btnCm.addEventListener('click', () => {
                                // Switch to CM
                                container.innerHTML = WOMENS_BLOUSE_CHART_CM_HTML;

                                // Update Styles
                                btnCm.classList.add('active');
                                btnCm.style.background = '#000';
                                btnCm.style.color = '#fff';

                                btnIn.classList.remove('active');
                                btnIn.style.background = '#fff';
                                btnIn.style.color = '#000';
                            });
                        }
                    } else if (chartType === 'kids') {
                        // Inject Wrapper
                        body.innerHTML = `<h3 style="text-align:center;">Kids Size Chart</h3>${SIZE_CHART_WRAPPER_HTML}`;

                        // Elements
                        const container = body.querySelector('#size-chart-table-container');
                        const btnIn = body.querySelector('#size-chart-unit-in');
                        const btnCm = body.querySelector('#size-chart-unit-cm');

                        // Set Button Labels (Specific to Kids Requirement)
                        if (btnIn) btnIn.textContent = "Imperial (In/Kg)";
                        if (btnCm) btnCm.textContent = "Metric (Cm/Lbs)";

                        // Initial Render (Inches + Kg)
                        if (container) container.innerHTML = KIDS_SIZE_CHART_IN_HTML;

                        // Event Listeners for Toggle
                        if (btnIn && btnCm && container) {
                            btnIn.addEventListener('click', () => {
                                // Switch to Imperial
                                container.innerHTML = KIDS_SIZE_CHART_IN_HTML;

                                // Update Styles
                                btnIn.classList.add('active');
                                btnIn.style.background = '#000';
                                btnIn.style.color = '#fff';

                                btnCm.classList.remove('active');
                                btnCm.style.background = '#fff';
                                btnCm.style.color = '#000';
                            });

                            btnCm.addEventListener('click', () => {
                                // Switch to Metric
                                container.innerHTML = KIDS_SIZE_CHART_CM_HTML;

                                // Update Styles
                                btnCm.classList.add('active');
                                btnCm.style.background = '#000';
                                btnCm.style.color = '#fff';

                                btnIn.classList.remove('active');
                                btnIn.style.background = '#fff';
                                btnIn.style.color = '#000';
                            });
                        }
                    }
                }
                overlay.classList.add('active');
            });
            close.addEventListener('click', () => overlay.classList.remove('active'));
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });
        }
    }


    // --- START: NEW/MODIFIED REVIEW FUNCTIONS ---

    /**
     * Generates the star icons for a review card.
     * @param {number} rating - The numerical rating (e.g., 4, 5, 3).
     * @returns {string} HTML string for 5 stars.
     */
    function generateReviewStars(rating) {
        let stars = '';
        const r = Math.round(rating); // Round to nearest whole number for full stars
        for (let i = 1; i <= 5; i++) {
            // Add 'filled' class for styling
            stars += `<i class="fas fa-star ${i <= r ? 'filled' : ''}"></i>`;
        }
        return `<div class="review-card-stars">${stars}</div>`;
    }

    /**
     * MODIFIED: Renders the top summary block (e.g., "4.1 out of 5") with CIRCLES.
     * @param {number} averageRating - The average rating.
     * @param {number} reviewCount - The total number of reviews.
     * @returns {string} HTML string for the summary block.
     */
    function renderReviewSummary(averageRating, reviewCount) {
        // Hardcoded sub-ratings as they are not in the data model
        const qualityRating = 4.0; // Hardcoded to match image
        const deliveryRating = 4.0; // Hardcoded to match image
        const serviceRating = 5.0;  // Hardcoded to match image

        return
    }

    /**
     * Renders the container and header for the review list.
     * @returns {string} HTML string for the list container.
     */
    function renderReviewListContainer() {
        return
    }

    /**
     * MODIFIED: Renders the list of product reviews with the new card layout.
     * @param {string} prodId - The product ID.
     * @param {boolean} showAll - Whether to show all reviews or just the first few.
     */
    function renderProductReviews(prodId, showAll = false) {
        const list = document.getElementById('review-list-display');
        const btn = document.getElementById('view-all-reviews-btn');
        // We select the <h3> from the *new* container
        const cont = document.querySelector('.review-list-container');

        if (!list || !btn || !cont) {
            console.warn("New review list elements missing. Can't render reviews.");
            return;
        }

        const allReviews = getReviews();
        const productReviews = allReviews.filter(r => r.productId === prodId).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        list.innerHTML = '';
        cont.querySelector('.no-reviews-message')?.remove(); // Remove old no-reviews message if any

        if (productReviews.length === 0) {
            const msg = '<p class="no-reviews-message" style="padding: 20px; text-align: center; color: #777;">';
            list.innerHTML = msg;
            btn.style.display = 'none';
        } else {
            const show = showAll ? productReviews : productReviews.slice(0, 3); // Show 3 by default

            show.forEach(r => {
                const stars = generateReviewStars(r.rating); // Use new star function
                let imgs = '';
                if (r.images?.length > 0) {
                    // Use the first image as a thumbnail
                    imgs = `<img src="${r.images[0]}" alt="Review image" class="review-thumbnail">`;
                }

                let d = 'Date unknown';
                try {
                    if (r.date) {
                        d = new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    }
                } catch (e) { }

                // Get first initial for avatar
                const userInitial = (r.author || 'A').charAt(0).toUpperCase();
                // Generate a simple hash for a color
                let hash = 0;
                for (let i = 0; i < (r.author || 'A').length; i++) {
                    hash = r.author.charCodeAt(i) + ((hash << 5) - hash);
                }
                const avatarColor = `hsl(${hash % 360}, 40%, 60%)`;

                const card = `
                <div class="review-card-new">
                    <div class="review-header">
                        ${stars}
                        <div class="review-user">
                            <span class="review-user-avatar" style="background-color: ${avatarColor}">${userInitial}</span>
                            <span class="review-user-name">${r.author || 'Anonymous'}</span>
                            <span class="review-user-date">${d}</span>
                        </div>
                    </div>
                    <div class="review-tags">
                        <span class="review-tag-item">This item</span>
                        ${r.rating >= 4 ? '<span class="review-tag-recommends"><i class="fas fa-check"></i> Recommends</span>' : ''}
                    </div>
                    <div class="review-body">
                        <p>${r.comment}</p>
                        ${imgs}
                    </div>
                    <button class="review-more-btn" aria-label="More options"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                `;
                list.innerHTML += card;
            });

            if (productReviews.length > 3) {
                btn.style.display = 'block';
                btn.textContent = showAll ? 'Hide Reviews' : `View All (${productReviews.length})`;
                const nBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(nBtn, btn);
                nBtn.addEventListener('click', () => renderProductReviews(prodId, !showAll));
            } else {
                btn.style.display = 'none';
            }
        }
    }

    // --- Core function to render Product Detail Page Content (PDP) ---
    function renderPDPContent() {
        const productDetailWrapper = document.getElementById('product-detail-wrapper');

        if (!product || !productDetailWrapper) {
            if (productDetailWrapper) productDetailWrapper.innerHTML = `<p class="error-message">Product Not Found. Check if the ID exists in the URL and the product catalog.</p>`;
            const s = document.querySelector('.similar-products-section'); if (s) s.style.display = 'none';
            return;
        }

        // NOTE: Auto-select logic moved to setupPDPInteractivity() to run after DOM is ready

        const currentRegion = getSelectedRegion(); // Get region for formatting

        let sizes = [];
        let sizeData = product.size_data; // 👉 Comes from backend

        // Determine if sizes should be shown
        if (sizeData) sizes = Object.keys(sizeData);

        // Check if "Free Size" is the only option
        const isFreeSize = sizes.length === 1 && sizes[0].trim().toLowerCase() === 'free size';
        const showSizes = sizes.length > 0; // Fix ReferenceError

        // MODIFIED: If Free Size, we still render buttons (so auto-select works) but hide the UI.

        // --- Size Chart Visibility Logic ---
        // Use the explicit size_chart_type from backend
        // If it's 'none' (default), don't show. If it has a value (women_general, women_blouse, kids), show it.
        const showSizeChartBtn = product.size_chart_type && product.size_chart_type !== 'none';

        const sizeHTML = (sizes.length > 0) ? `
<div class="size-selector" style="${isFreeSize ? 'display:none!important;' : ''}">
    <h3>Select Size:</h3>
    <div class="size-options">
        ${Object.entries(sizeData).map(([size, data]) => `
            <button class="size-option ${data.stock <= 0 ? 'disabled' : ''}"
                data-size="${size}"
                data-price="${data.price}"
                data-stock="${data.stock}"
                data-discount="${data.discount || 0}"
                data-discounted-price="${data.discounted_price || ''}"
                data-is-sale="${data.is_sale || 'false'}" 
                data-sale-label="${data.sale_label || ''}"
                ${data.stock <= 0 ? "disabled" : ""}>
                ${size}
            </button>
        `).join('')}
    </div>
    <input type="hidden" id="selected-size">
    <input type="hidden" id="selected-price">
</div>
<p id="stock-display" class="stock-status-display"></p>
` : '';
        // --- MODIFICATION: Calculate review data here ---
        const initialRevs = getReviews().filter(r => r.productId === productId);
        const initialAvg = initialRevs.length > 0 ? initialRevs.reduce((s, r) => s + (r.rating || 0), 0) / initialRevs.length : (product.rating || 0);

        // ** MODIFICATION: Build reviewBlockHTML with new functions **
        const reviewSummaryHTML = renderReviewSummary(initialAvg, initialRevs.length);
        const reviewListHTML = renderReviewListContainer(); // Just the container

        // --- START MODIFICATION: Added ID and scroll-margin-top ---
        const reviewBlockHTML = ` `;


        // Regex to find domain to replace for dummy images
        const domainRegex = /pexels\.com|dummyimage\.com|istockphoto\.com|pinimg\.com|etsystatic\.com|bing\.com|media-amazon\.com|rukminim1\.flixcart\.com|assets\.myntassets\.com|studiovirupa\.com|kanchisilksarees\.com|5\.imimg\.com|stylesatlife\.com|static3\.azafashions\.com|assets2\.andaazfashion\.com|m\.media-amazon\.com|images\.meesho\.com|cdn0\.weddingwire\.in|th\.bing\.com|i\.pinimg\.com|images\.pexels\.com|tse4\.mm\.bing\.net|tse3\.mm\.bing\.net|tse2\.mm\.bing\.net|tse1\.mm\.bing\.net|kanchisilks\.com|vogueymen\.com|wallpaperaccess\.com|www\.tiptopgents\.com|www\.thefashionisto\.com|southindianactress\.in|imageswedding\.theweddingcompany\.com|avatar\.iran\.liara\.run|via\.placeholder\.com|googleusercontent\.com|castyou-website\.sgp1\.digitalocean-spaces\.com/i;
        // Logic to build unique gallery images
        const potentialImages = [
            productImageURL,
            product.thumbnail1,
            product.thumbnail2,
            product.thumbnail3
        ].filter(url => url && url.trim() !== '');

        // Remove duplicates and ensure at least one image exists
        const galleryImages = [...new Set(potentialImages)];
        if (galleryImages.length === 0) galleryImages.push('/static/customer/images/placeholder.jpg');


        const thumbnailsHTML = galleryImages.map((imgSrc, index) => `
            <img src="${imgSrc}" 
                alt="Thumbnail ${index + 1}" 
                class="pdp-thumbnail-img ${index === 0 ? 'active' : ''}" 
                data-src="${imgSrc}">
        `).join('');

        const galleryHTML = `
            <section class="product-gallery-container">
                <div class="product-thumbnail-gallery">
                    ${thumbnailsHTML}
                </div>
                <div class="product-main-image">
                    <img src="${galleryImages[0]}" alt="${product.name}" id="pdp-main-image">
                </div>
            </section>
               
                ${product.style_fit && product.style_fit.trim() !== "" ? `
        <details class="accordion-item">
            <summary>Style & Fit</summary>
            <div class="accordion-content">${product.style_fit}</div>
        </details>
    ` : ""}

    ${product.shipping_return && product.shipping_return.trim() !== "" ? `
        <details class="accordion-item">
            <summary>Shipping & Return</summary>
            <div class="accordion-content">${product.shipping_return}</div>
        </details>
    ` : ""}

        `;



        // Preserve any server-rendered accordion if present (don't overwrite DB-driven content)
        const existingServerAccordion = productDetailWrapper.querySelector('.server-rendered-accordion');
        const accordionHTML = existingServerAccordion ? existingServerAccordion.outerHTML : `
            <div class="product-accordion">
                <details class="accordion-item" open>
                    <summary>Details</summary>
                    <div class="accordion-content">${product.description || 'N/A.'}</div>
                </details>
                ${product.style_fit && product.style_fit.trim() !== "" ? `
                    <details class="accordion-item">
                        <summary>Style & Fit</summary>
                        <div class="accordion-content">${product.style_fit}</div>
                    </details>
                ` : ``}
                ${product.shipping_return && product.shipping_return.trim() !== "" ? `
                    <details class="accordion-item">
                        <summary>Shipping/Returns</summary>
                        <div class="accordion-content">${product.shipping_return}</div>
                    </details>
                ` : ``}
            </div>
        `;

        productDetailWrapper.innerHTML = `
            <style>
                /* --- MODIFICATION: Added styles for new quantity input --- */
                .pdp-quantity-selector input.item-quantity {
                    padding: 8px 10px;
                    font-weight: 600;
                    width: 50px; /* Give it a specific width */
                    text-align: center;
                    border: none; /* Remove default input border */
                    border-left: 1px solid var(--border-color);
                    border-right: 1px solid var(--border-color);
                    -moz-appearance: textfield; /* Hide spinners Firefox */
                }
                .pdp-quantity-selector input.item-quantity::-webkit-outer-spin-button,
                .pdp-quantity-selector input.item-quantity::-webkit-inner-spin-button {
                    -webkit-appearance: none; /* Hide spinners Chrome/Safari */
                    margin: 0;
                }
                /* --- END MODIFICATION --- */
            </style>
            <div class="product-detail-container" id="pdp-grid-container">
                
                <section class="product-image-review-column">
                     ${galleryHTML} 
                     ${reviewBlockHTML} 
                </section>
                
                <section class="product-info-section">
                    <div class="product-title-header"><h1 class="product-name">${product.name}</h1><div class="secondary-actions"><button class="action-btn wishlist-action-btn" id="product-wishlist-btn"><i class="far fa-heart"></i></button><button class="action-btn share-btn" id="product-share-btn"><i class="fas fa-share-alt"></i></button></div></div>
                    
                    ${generateLabelsHTML(product)}
                    
                    <div class="product-price"> 
                        ${(() => {
                const hasDiscount = product.discount_price && parseFloat(product.discount_price) > 0;
                const priceVal = parseFloat(product.price || 0);
                const discountPriceVal = hasDiscount ? parseFloat(product.discount_price) : 0;

                const regularPriceConv = convertInrToTargetCurrency(priceVal, currentRegion);
                const discountPriceConv = convertInrToTargetCurrency(discountPriceVal, currentRegion);

                if (hasDiscount) {
                    const discountPercent = Math.round((1 - (discountPriceVal / priceVal)) * 100);
                    return `
                                <div class="price-top-line">
                                    <span class="current-price">${formatCurrency(discountPriceConv, currentRegion)}</span>
                                </div>
                                <div class="price-bottom-line">
                                    <span class="original-price">${formatCurrency(regularPriceConv, currentRegion)}</span>
                                    <span class="discount-badge">(${discountPercent}% OFF)</span>
                                </div>`;
                } else {
                    return `
                                <div class="price-top-line">
                                   <span class="current-price">${formatCurrency(regularPriceConv, currentRegion)}</span>
                               </div>`;
                }
            })()}
                    </div>
                   
                    ${generateRatingHTML(initialAvg, product.id)}
                    ${sizeHTML}
                    <div class="quantity-chart-row" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:30px;">
                        <div class="pdp-quantity-selector" style="margin-bottom:0;">
                            <h3>Quantity:</h3>
                            <div class="quantity-control">
                                <button class="quantity-btn decrease-qty" id="pdp-decrease-qty">-</button>
                                <input type="number" class="item-quantity" id="pdp-quantity" value="1" min="1" max="99" aria-label="Quantity">
                                <button class="quantity-btn increase-qty" id="pdp-increase-qty">+</button>
                            </div>
                        </div>
                        ${showSizes && showSizeChartBtn ? `<button id="view-size-chart-btn" style="background:none;border:none;font-size:0.9rem;color:#777;text-decoration:underline;cursor:pointer;padding:0;line-height:1;">SIZE CHART</button>` : ''}
                    </div>
                    <div class="action-buttons"><button class="action-btn add-to-cart-btn">ADD TO CART</button><button class="action-btn buy-now-btn">BUY NOW</button></div>
                    
                    ${accordionHTML}
                </section>
            </div>`;

        setupPDPInteractivity();
        setupSizeChartModal();

        // --- MODIFICATION: Call the new review renderer *after* the HTML is in the DOM ---
        renderProductReviews(productId, false);
        // --- END MODIFICATION ---

        initializeWishlistButtonState();
        renderSimilarProducts(product);
        updateCartButtonState();
    }


    // --- Setup PDP Button Listeners ---
    function setupPDPInteractivity() {
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            const cartBtn = document.querySelector('.add-to-cart-btn');
            const buyBtn = document.querySelector('.buy-now-btn');
            const wishBtn = document.getElementById('product-wishlist-btn');
            const shareBtn = document.getElementById('product-share-btn');

            const showSizes = product?.size_data && Object.keys(product.size_data).length > 0;
            const decQty = document.getElementById('pdp-decrease-qty');
            const incQty = document.getElementById('pdp-increase-qty');
            const qtyDisp = document.getElementById('pdp-quantity'); // This is now an <input>



            // Size selection handler: update price (region-aware), stock and hidden inputs
            document.addEventListener("click", function (e) {
                const btn = e.target.closest(".size-option, .size-btn");
                if (!btn || btn.classList.contains("disabled") || btn.disabled) return;

                // clear previous selection and mark new
                document.querySelectorAll(".size-option, .size-btn").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");

                // Read values from dataset (price stored in INR on dataset)
                console.log("Size Button Clicked. Dataset:", btn.dataset);
                const size = btn.dataset.size;
                const priceINR = parseFloat(btn.dataset.price) || 0;
                const stock = parseInt(btn.dataset.stock || '0', 10);
                const discountPercent = parseInt(btn.dataset.discount || '0', 10);
                const storedDiscountedPrice = parseFloat(btn.dataset.discountedPrice);
                console.log("Parsed Values - Price:", priceINR, "Stock:", stock, "Discount:", discountPercent, "Stored Discounted:", storedDiscountedPrice);

                // Calculate discounted price if applicable
                let finalPriceINR = priceINR;
                if (!isNaN(storedDiscountedPrice) && storedDiscountedPrice > 0) {
                    // Use the stored discounted price from DB if available
                    finalPriceINR = storedDiscountedPrice;
                } else if (discountPercent > 0) {
                    // Fallback to manual calculation
                    finalPriceINR = priceINR - (priceINR * discountPercent / 100);
                }

                // Convert prices to current region and format
                const currentRegion = (typeof getSelectedRegion === 'function') ? getSelectedRegion() : 'ca';

                // Original price (for strike-through)
                const convertedOriginal = (typeof convertInrToTargetCurrency === 'function') ? convertInrToTargetCurrency(priceINR, currentRegion) : priceINR;
                const formattedOriginal = (typeof formatCurrency === 'function') ? formatCurrency(convertedOriginal, currentRegion) : `₹${convertedOriginal}`;

                // Final price (discounted or regular)
                const convertedFinal = (typeof convertInrToTargetCurrency === 'function') ? convertInrToTargetCurrency(finalPriceINR, currentRegion) : finalPriceINR;
                const formattedFinal = (typeof formatCurrency === 'function') ? formatCurrency(convertedFinal, currentRegion) : `₹${convertedFinal}`;

                // Update small price display under size selector
                const priceDisplay = document.getElementById("price-display");
                if (priceDisplay) {
                    if (discountPercent > 0) {
                        priceDisplay.innerHTML = `<span style="text-decoration: line-through; color: #999; margin-right: 5px;">${formattedOriginal}</span> <span>${formattedFinal}</span> <span style="color: green; font-size: 0.9em;">(${discountPercent}% OFF)</span>`;
                    } else {
                        priceDisplay.textContent = formattedFinal;
                    }
                }

                // Update stock display
                const stockDisplay = document.getElementById("stock-display");
                if (stockDisplay) {
                    if (stock <= 0) {
                        stockDisplay.textContent = "Out of Stock";
                        stockDisplay.style.color = '#e74c3c';
                    } else if (stock <= 5) {
                        stockDisplay.textContent = `Only ${stock} left`;
                        stockDisplay.style.color = '#e67e22';
                    } else {
                        stockDisplay.textContent = `${stock} left`;
                        stockDisplay.style.color = '#27ae60';
                    }
                }

                // Update main PDP price element (current-price span)
                const mainCurrentPrice = document.querySelector('.product-price .current-price');
                const mainPriceContainer = document.querySelector('.product-info-section .product-price');

                // Logic to update main price with discount visual
                let priceHTML = '';
                if (discountPercent > 0) {
                    priceHTML = `
                    <div class="price-top-line">
                        <span class="current-price">${formattedFinal}</span>
                    </div>
                    <div class="price-bottom-line">
                        <span class="original-price">${formattedOriginal}</span>
                        <span class="discount-badge">(${discountPercent}% OFF)</span>
                    </div>`;
                } else {
                    priceHTML = `
                    <div class="price-top-line">
                        <span class="current-price">${formattedFinal}</span>
                    </div>`;
                }

                if (mainPriceContainer) {
                    mainPriceContainer.innerHTML = priceHTML;
                } else if (mainCurrentPrice) {
                    // Fallback: try to update specific elements if main container not found
                    mainCurrentPrice.textContent = formattedFinal;
                    const oldOriginal = document.querySelector('.product-price .original-price');
                    if (oldOriginal) {
                        if (discountPercent > 0) {
                            oldOriginal.textContent = formattedOriginal;
                            oldOriginal.style.display = 'inline';
                        } else {
                            oldOriginal.style.display = 'none';
                        }
                    }
                }

                // --- NEW: Also update the 'Buy Now' / 'Add to Cart' total if visible ---
                // (Optional, depending on UI design)

                // Save to hidden inputs for cart actions
                const selectedSizeInput = document.getElementById("selected-size");
                const selectedPriceInput = document.getElementById("selected-price");
                if (selectedSizeInput) {
                    selectedSizeInput.value = size;
                    // Trigger change event just in case other listeners need it
                    selectedSizeInput.dispatchEvent(new Event('change'));
                }
                if (selectedPriceInput) {
                    selectedPriceInput.value = finalPriceINR;
                }

                // --- Enforce Stock Limits ---
                const qtyPdpInput = document.getElementById('pdp-quantity');
                if (qtyPdpInput) {
                    // Update max attribute
                    // If stock is 0 (out of stock), max should theoretically be 0 or 1 (disabled elsewhere), but let's set to stock
                    const maxStockLimit = stock > 0 ? stock : 1;
                    qtyPdpInput.max = maxStockLimit;

                    // STRICT RESET: Always reset to 1 when switching sizes as per user request
                    qtyPdpInput.value = 1;

                    // Hide any existing error
                    const err = document.getElementById('pdp-qty-error');
                    if (err) err.style.display = 'none';
                }

                // --- NEW: Update Sale Label based on size ---
                const isSale = btn.dataset.isSale === 'true';
                const saleLabel = btn.dataset.saleLabel || 'SALE';
                const titleHeader = document.querySelector('.product-title-header');
                let labelsContainer = document.querySelector('.product-labels');

                // Helper to render label content
                const renderLabels = () => {
                    let content = '';
                    if (typeof product !== 'undefined' && product && product.isNew) {
                        content += '<span class="product-label-new">NEW</span>';
                    }
                    if (isSale) {
                        content += `<span class="product-label-sale">${saleLabel}</span>`;
                    }
                    return content;
                };

                const newContent = renderLabels();

                if (newContent) {
                    if (!labelsContainer && titleHeader) {
                        labelsContainer = document.createElement('div');
                        labelsContainer.className = 'product-labels';
                        titleHeader.insertAdjacentElement('afterend', labelsContainer);
                    }
                    if (labelsContainer) {
                        labelsContainer.innerHTML = newContent;
                        labelsContainer.style.display = 'block';
                    }
                } else {
                    if (labelsContainer) {
                        labelsContainer.style.display = 'none';
                        labelsContainer.innerHTML = '';
                    }
                }

                // Update product object pricing if available (keeps consistency)
                if (typeof product !== 'undefined' && product) {
                    product.final_price = priceINR;
                    // product.priceConverted = convertedPrice; // This variable 'convertedPrice' was undefined in original code context, skipping assignment to avoid error
                }

                // Re-evaluate cart button state, quantity limits, etc.
                if (typeof updateCartButtonState === 'function') updateCartButtonState();
            });


            console.log('Setting up PDP interactivity. Buttons found:', {
                cartBtn: !!cartBtn,
                buyBtn: !!buyBtn,
                wishBtn: !!wishBtn,
                shareBtn: !!shareBtn,
                product: !!product
            });

            // --- MODIFICATION START: Add Gallery Thumbnail Click Logic ---
            const gallery = document.querySelector('.product-thumbnail-gallery');
            const mainImage = document.getElementById('pdp-main-image');

            if (gallery && mainImage) {
                gallery.addEventListener('click', (e) => {
                    if (e.target.classList.contains('pdp-thumbnail-img')) {
                        // Check if it's already active
                        if (e.target.classList.contains('active')) return;

                        const newSrc = e.target.dataset.src;

                        // Update main image
                        mainImage.src = newSrc;

                        // Update active state
                        gallery.querySelector('.pdp-thumbnail-img.active')?.classList.remove('active');
                        e.target.classList.add('active');
                    }
                });
            }
            // --- MODIFICATION END ---

            /*
            // --- REMOVED REDUNDANT LISTENER ---
            // The delegated listener above handles all this logic now.
            if (showSizes) {
                document.querySelectorAll('.size-option:not(.disabled)').forEach(o => {
                    o.addEventListener('click', () => {
                        document.querySelector('.size-option.selected')?.classList.remove('selected');
                        o.classList.add('selected');
 
                        // 🔹 Update product price to the selected size's price
                        const sizePrice = parseFloat(o.dataset.price);
                        const sizeStock = o.dataset.stock;
                        const currentRegion = getSelectedRegion();
 
                        if (!isNaN(sizePrice)) {
                            // Convert size price from INR to user's currency
                            const sizeConvertedPrice = convertInrToTargetCurrency(sizePrice, currentRegion);
                            product.priceConverted = sizeConvertedPrice;
                            product.regularPriceConverted = sizeConvertedPrice;
                            product.final_price = sizePrice;
                            product.price = sizePrice.toString();
 
                            console.log('Size option clicked:', {
                                size: o.dataset.size,
                                priceINR: sizePrice,
                                priceConverted: sizeConvertedPrice,
                                stock: sizeStock,
                                selectedClass: o.classList.contains('selected'),
                                hasDataSize: !!o.dataset.size,
                                textContent: o.textContent.trim()
                            });
                        }
 
                        updateCartButtonState();
                    });
                });
            }
            */

            // --- HELPER: Get maximum available stock for current product ---
            const getMaxStock = () => {
                if (!product || !product.size_data) return 99;
                if (Object.keys(product.size_data).length > 0) {
                    const sel = document.querySelector('.size-option.selected');
                    if (sel) {
                        const sizeStock = parseInt(sel.dataset.stock);
                        return isNaN(sizeStock) ? 99 : sizeStock;
                    }
                }
                return 99;
            };

            const showQtyError = (show = true, message = 'Maximum quantity limit reached') => {
                let errorDiv = document.getElementById('pdp-qty-error');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.id = 'pdp-qty-error';
                    errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.9rem; margin-top: 8px; font-weight: 600; display: none;';
                    if (qtyDisp && qtyDisp.parentElement) {
                        qtyDisp.parentElement.appendChild(errorDiv);
                    }
                }
                if (show) {
                    errorDiv.textContent = message;
                    errorDiv.style.display = 'block';
                } else {
                    errorDiv.style.display = 'none';
                }
            };

            // --- MODIFICATION: Update Qty listeners to use .value ---
            if (decQty && incQty && qtyDisp) {
                // Prevent attaching multiple listeners
                if (!decQty.hasAttribute('data-listener')) {
                    decQty.addEventListener('click', (e) => {
                        e.preventDefault(); e.stopPropagation();
                        let q = parseInt(qtyDisp.value);
                        if (isNaN(q)) q = 1;
                        if (q > 1) {
                            const n = q - 1;
                            qtyDisp.value = n;
                            showQtyError(false);
                            const cId = getMainProductCartId();
                            if (cId) {
                                let c = getCart();
                                const i = c.find(it => (it.cartId || it.id) === cId);
                                if (i) { i.quantity = n; saveCart(c); updateCartCount(); renderCartItems(); }
                            }
                        }
                    });
                    decQty.setAttribute('data-listener', 'true');
                }

                if (!incQty.hasAttribute('data-listener')) {
                    incQty.addEventListener('click', (e) => {
                        e.preventDefault(); e.stopPropagation();
                        let q = parseInt(qtyDisp.value);
                        if (isNaN(q)) q = 1;
                        const maxStock = getMaxStock();
                        if (q >= maxStock) {
                            showQtyError(true, 'Maximum quantity limit reached');
                            return;
                        }
                        showQtyError(false);
                        const n = q + 1;
                        qtyDisp.value = n;
                        const cId = getMainProductCartId();
                        if (cId) {
                            let c = getCart();
                            const i = c.find(it => (it.cartId || it.id) === cId);
                            if (i) { i.quantity = n; saveCart(c); updateCartCount(); renderCartItems(); }
                        }
                    });
                    incQty.setAttribute('data-listener', 'true');
                }

                // --- MODIFICATION: Add listener for typing in the input (guarded) ---
                if (!qtyDisp.hasAttribute('data-listener')) {
                    qtyDisp.addEventListener('input', (e) => {
                        e.stopPropagation();
                        let q = parseInt(qtyDisp.value);
                        const maxStock = getMaxStock();

                        // Validate input
                        if (isNaN(q) || q < 1) {
                            q = 1;
                            qtyDisp.value = 1; // Correct invalid input immediately
                            showQtyError(false);
                        } else if (q > maxStock) {
                            q = maxStock;
                            qtyDisp.value = maxStock;
                            showQtyError(true, `Maximum quantity limit reached (${maxStock} available)`);
                        } else {
                            showQtyError(false);
                        }

                        const cId = getMainProductCartId();
                        if (cId) { // If item is already in cart, update its quantity
                            let c = getCart();
                            const i = c.find(it => (it.cartId || it.id) === cId);
                            if (i) {
                                i.quantity = q;
                                saveCart(c);
                                updateCartCount();
                                renderCartItems();
                            }
                        }
                    });
                    qtyDisp.setAttribute('data-listener', 'true');
                }
                // --- END MODIFICATION ---
            }

            // Add to Cart button handler
            if (cartBtn && product) {
                // Remove any existing listeners by cloning the button
                const newCartBtn = cartBtn.cloneNode(true);
                cartBtn.parentNode.replaceChild(newCartBtn, cartBtn);

                newCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from bubbling up
                    console.log('Add to Cart clicked - preventing default and propagation');

                    let size = 'N/A';
                    const qty = parseInt(qtyDisp?.value || '1');
                    let sizePriceUSD = null;
                    let sizeDiscountPriceUSD = null; // Declare in outer scope

                    if (showSizes) {
                        // Prefer .size-option.selected (used by PDP)
                        const sel = document.querySelector('.size-option.selected');
                        if (!sel) {
                            showCustomAlert('Please select a size before adding to cart.', 'Size Required');
                            return;
                        }
                        // Get size from dataset.size first, fallback to textContent, ensure it's trimmed
                        // Check if dataset.size exists and is not empty
                        if (sel.dataset.size && sel.dataset.size.trim() !== '') {
                            size = sel.dataset.size.trim();
                        } else if (sel.textContent && sel.textContent.trim() !== '') {
                            size = sel.textContent.trim();
                        } else {
                            size = 'N/A';
                        }
                        // Get size-specific price directly from the selected size button
                        sizePriceUSD = parseFloat(sel.dataset.price) || null;

                        // Get size-specific discount price
                        sizeDiscountPriceUSD = parseFloat(sel.dataset.discountedPrice) || null;

                        console.log('Add to Cart: Size extracted:', {
                            datasetSize: sel.dataset.size,
                            hasDatasetSize: !!sel.dataset.size,
                            textContent: sel.textContent.trim(),
                            finalSize: size,
                            sizeType: typeof size,
                            price: sizePriceUSD,
                            discountPrice: sizeDiscountPriceUSD
                        });
                    }

                    let cart = getCart();
                    const idx = cart.findIndex(i => i.id === product.id && i.size === size);
                    const isAdding = !newCartBtn.classList.contains('in-cart');
                    console.log('DEBUG Add to Cart: isAdding =', isAdding, ', hasInCartClass =', newCartBtn.classList.contains('in-cart'));

                    // Use size-specific price if available, otherwise use product price
                    // Prices are stored in USD, so no conversion needed
                    const priceUSD = sizePriceUSD !== null ? sizePriceUSD : parseFloat(product.price || 0);

                    // Determine discount price to store
                    // If size specific discount exists, use it. Otherwise fall back to product level discount only if no size was selected (generic product)
                    let discountPriceUSD = null;
                    if (sizeDiscountPriceUSD !== null && sizeDiscountPriceUSD !== undefined) {
                        discountPriceUSD = sizeDiscountPriceUSD;
                    } else if (!showSizes && product.discount_price) {
                        discountPriceUSD = parseFloat(product.discount_price);
                    }

                    if (isAdding) {
                        if (idx > -1) {
                            cart[idx].quantity = qty;
                            // Update size and price if size-specific price is available
                            cart[idx].size = size; // Update size
                            if (sizePriceUSD !== null) {
                                cart[idx].price = sizePriceUSD.toString();
                            }
                            // Always update discount_price to match the current selection
                            cart[idx].discount_price = discountPriceUSD !== null ? discountPriceUSD.toString() : null;
                        } else {
                            const cId = `${product.id}-${size}-${Date.now()}`;
                            const cartItem = {
                                id: product.id,
                                cartId: cId,
                                quantity: qty,
                                size: size, // Ensure size is explicitly set
                                image: productImageURL,
                                price: priceUSD.toString(), // Use size-specific price in USD
                                discount_price: discountPriceUSD !== null ? discountPriceUSD.toString() : null, // Store discount price
                                name: product.name || 'Product', // Add product name for checkout display
                                // include size-specific stock so client can enforce limits in cart
                                stock: (function () {
                                    try {
                                        const selBtn = document.querySelector('.size-option.selected');
                                        if (selBtn && selBtn.dataset && selBtn.dataset.stock) return parseInt(selBtn.dataset.stock, 10) || 0;
                                    } catch (e) { }
                                    try { return product.stock || 0; } catch (e) { return 0; }
                                })()
                            };
                            console.log('Add to Cart: Cart item being added:', cartItem);
                            cart.push(cartItem);
                        }
                    } else {
                        if (idx > -1) cart.splice(idx, 1);
                    }

                    saveCart(cart);
                    updateCartCount();
                    updateCartButtonState();
                    renderCartItems();

                    // Show confirmation popup
                    console.log('DEBUG: About to check isAdding for popup. isAdding =', isAdding);
                    if (isAdding) {
                        console.log('DEBUG: Calling showAddedToCartPopup NOW');
                        showAddedToCartPopup();
                    } else {
                        console.log('DEBUG: Calling showRemovedFromCartPopup NOW');
                        showRemovedFromCartPopup();
                    }
                });
            } else {
                console.warn('Cart button or product not found:', { cartBtn: !!cartBtn, product: !!product });
            }

            // Buy Now button handler
            if (buyBtn && product) {
                // Remove any existing listeners by cloning the button
                const newBuyBtn = buyBtn.cloneNode(true);
                buyBtn.parentNode.replaceChild(newBuyBtn, buyBtn);

                newBuyBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Buy Now clicked');

                    // Validate product data before proceeding
                    if (!product || !product.id) {
                        console.error('Buy Now: Product data is missing!', product);
                        alert('Error: Product information is not available. Please refresh the page and try again.');
                        return;
                    }

                    if (!productImageURL || productImageURL === '') {
                        console.warn('Buy Now: productImageURL is empty, using product.image');
                        productImageURL = product.image || '/static/customer/images/placeholder.jpg';
                    }

                    if (!product.name || product.name === '') {
                        console.warn('Buy Now: product.name is empty');
                        product.name = 'Product';
                    }

                    console.log('Buy Now: Product data validated:', {
                        id: product.id,
                        name: product.name,
                        image: productImageURL,
                        priceConverted: product.priceConverted
                    });

                    let size = 'N/A';
                    const qty = parseInt(qtyDisp?.value || '1');
                    let sizePriceUSD = null;
                    let sizeDiscountPriceUSD = null; // Declare in outer scope

                    if (showSizes) {
                        // Prefer .size-option.selected (used by PDP)
                        const sel = document.querySelector('.size-option.selected');
                        if (!sel) {
                            showCustomAlert('Please select a size before buying.', 'Size Required');
                            return;
                        }
                        // Get size from dataset.size first, fallback to textContent, ensure it's trimmed
                        // Check if dataset.size exists and is not empty
                        if (sel.dataset.size && sel.dataset.size.trim() !== '') {
                            size = sel.dataset.size.trim();
                        } else if (sel.textContent && sel.textContent.trim() !== '') {
                            size = sel.textContent.trim();
                        } else {
                            size = 'N/A';
                        }
                        // Get size-specific price directly from the selected size button
                        sizePriceUSD = parseFloat(sel.dataset.price) || null;

                        // Get size-specific discount price
                        sizeDiscountPriceUSD = parseFloat(sel.dataset.discountedPrice) || null;

                        console.log('Buy Now: Selected size element:', {
                            element: sel,
                            dataSize: sel.dataset.size,
                            hasDatasetSize: !!sel.dataset.size,
                            dataPrice: sel.dataset.price,
                            dataDiscountedPrice: sel.dataset.discountedPrice,
                            sizePriceUSD: sizePriceUSD,
                            sizeDiscountPriceUSD: sizeDiscountPriceUSD,
                            textContent: sel.textContent.trim(),
                            finalSize: size,
                            sizeType: typeof size
                        });
                    } else {
                        console.log('Buy Now: showSizes is false, size will be N/A');
                    }

                    const cId = `${product.id}-${size}-${Date.now()}`;
                    let cart = getCart();
                    const idx = cart.findIndex(i => i.id === product.id && i.size === size);

                    // Use size-specific price if available, otherwise use product price
                    // Prices are stored in USD, so no conversion needed
                    const priceUSD = sizePriceUSD !== null ? sizePriceUSD : parseFloat(product.price || 0);

                    // Determine discount price to store
                    let discountPriceUSD = null;
                    if (sizeDiscountPriceUSD !== null && sizeDiscountPriceUSD !== undefined) {
                        discountPriceUSD = sizeDiscountPriceUSD;
                    } else if (!showSizes && product.discount_price) {
                        discountPriceUSD = parseFloat(product.discount_price);
                    }

                    // Create cart item object (include size-specific stock so cart enforces limits)
                    const cartItem = {
                        id: product.id,
                        cartId: cId,
                        quantity: qty,
                        size: size, // Ensure size is explicitly set
                        image: productImageURL,
                        price: priceUSD.toString(), // Use size-specific price in USD
                        discount_price: discountPriceUSD !== null ? discountPriceUSD.toString() : null, // Store discount price
                        name: product.name,
                        stock: (function () {
                            try {
                                const selBtn = document.querySelector('.size-option.selected');
                                if (selBtn && selBtn.dataset && selBtn.dataset.stock) return parseInt(selBtn.dataset.stock, 10) || 0;
                            } catch (e) { }
                            try { return product.stock || 0; } catch (e) { return 0; }
                        })()
                    };

                    console.log('Buy Now: Cart item to add:', cartItem);
                    console.log('Buy Now: Size value:', size, 'Type:', typeof size);
                    console.log('Buy Now: Price:', priceUSD, 'Discount Price:', discountPriceUSD);
                    console.log('Buy Now: Cart item price field:', cartItem.price);
                    console.log('Buy Now: Cart item discount_price field:', cartItem.discount_price);

                    // --- BUY NOW FIX: Store ONLY this item for checkout, don't add to regular cart ---
                    // Store the Buy Now item in sessionStorage for exclusive checkout
                    sessionStorage.setItem('buy_now_item', JSON.stringify(cartItem));
                    console.log('Buy Now: Stored item in sessionStorage for exclusive checkout');

                    // Redirect to checkout immediately
                    console.log('Buy Now: Redirecting to checkout...');
                    window.location.href = '/checkout/';
                });
            } else {
                console.warn('Buy Now button or product not found:', { buyBtn: !!buyBtn, product: !!product });
            }

            if (wishBtn && product) {
                // Remove old event listener
                const newWishBtn = wishBtn.cloneNode(true);
                wishBtn.parentNode.replaceChild(newWishBtn, wishBtn);

                newWishBtn.addEventListener('click', () => {
                    let wishlist = getWishlist();
                    const inWishlist = wishlist.some(item => item.id === product.id);

                    if (inWishlist) {
                        // Remove from wishlist
                        wishlist = wishlist.filter(item => item.id !== product.id);
                        newWishBtn.classList.remove('active');
                        newWishBtn.querySelector('i').classList.replace('fas', 'far');
                    } else {
                        // Add to wishlist
                        wishlist.push({
                            id: product.id,
                            name: product.name,
                            price: product.priceConverted,
                            image: productImageURL,
                            size: document.querySelector('.size-option.selected')?.dataset.size || null
                        });
                        newWishBtn.classList.add('active');
                        newWishBtn.querySelector('i').classList.replace('far', 'fas');
                    }

                    // Save & update header count
                    localStorage.setItem(getWishlistKey(), JSON.stringify(wishlist));
                    updateWishlistCount();

                    // ❌ Removed redirect — stays on product page
                });
            }



            if (shareBtn && product) {
                shareBtn.addEventListener('click', async () => {
                    const data = { title: product.name, text: `Check out: ${product.name}`, url: window.location.href };
                    if (navigator.share) {
                        try {
                            await navigator.share(data);
                        } catch (err) {
                            console.error('Share fail:', err);
                        }
                    } else {
                        displayShareModal(data);
                    }
                });
            }


            // --- START MODIFICATION: Add scroll-to-reviews functionality ---
            const ratingDisplay = document.querySelector('.product-info-section .product-rating-display');
            const reviewsSection = document.getElementById('product-reviews-anchor');

            if (ratingDisplay && reviewsSection) {
                ratingDisplay.addEventListener('click', (e) => {
                    e.preventDefault();
                    reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
            // --- END MODIFICATION ---

            // --- AUTO-SELECT AND FREE SIZE HANDLING ---
            // Check if product has Free Size (only one size and it's "Free Size")
            const sizeData = product?.size_data;
            const sizeKeys = sizeData ? Object.keys(sizeData) : [];
            const isFreeSize = sizeKeys.length === 1 && sizeKeys[0].trim().toLowerCase() === 'free size';

            if (isFreeSize) {
                // For Free Size products: directly display stock, price, discount, sale label on page load
                const freeSizeData = sizeData[sizeKeys[0]];
                const stockDisplay = document.getElementById('stock-display');
                const priceDisplay = document.getElementById('price-display');
                const selectedSizeInput = document.getElementById('selected-size');
                const selectedPriceInput = document.getElementById('selected-price');
                const qtyInput = document.getElementById('pdp-quantity');

                // Set hidden inputs for cart/buy operations
                if (selectedSizeInput) selectedSizeInput.value = sizeKeys[0];
                if (selectedPriceInput) selectedPriceInput.value = freeSizeData.discounted_price || freeSizeData.price;

                // Display stock
                if (stockDisplay) {
                    const stock = parseInt(freeSizeData.stock || 0, 10);
                    if (stock <= 0) {
                        stockDisplay.textContent = 'Out of Stock';
                        stockDisplay.style.color = '#e74c3c';
                    } else if (stock <= 5) {
                        stockDisplay.textContent = `Only ${stock} left`;
                        stockDisplay.style.color = '#e67e22';
                    } else {
                        stockDisplay.textContent = `${stock} left`;
                        stockDisplay.style.color = '#27ae60';
                    }
                    // Set max quantity
                    if (qtyInput) qtyInput.max = stock > 0 ? stock : 1;
                }

                // Display price with discount if applicable
                const currentRegion = (typeof getSelectedRegion === 'function') ? getSelectedRegion() : 'ca';
                const priceINR = parseFloat(freeSizeData.price) || 0;
                const discountPercent = parseInt(freeSizeData.discount || 0, 10);
                const storedDiscountedPrice = parseFloat(freeSizeData.discounted_price);

                let finalPriceINR = priceINR;
                if (!isNaN(storedDiscountedPrice) && storedDiscountedPrice > 0) {
                    finalPriceINR = storedDiscountedPrice;
                } else if (discountPercent > 0) {
                    finalPriceINR = priceINR - (priceINR * discountPercent / 100);
                }

                const convertedOriginal = (typeof convertInrToTargetCurrency === 'function') ? convertInrToTargetCurrency(priceINR, currentRegion) : priceINR;
                const formattedOriginal = (typeof formatCurrency === 'function') ? formatCurrency(convertedOriginal, currentRegion) : `₹${convertedOriginal}`;
                const convertedFinal = (typeof convertInrToTargetCurrency === 'function') ? convertInrToTargetCurrency(finalPriceINR, currentRegion) : finalPriceINR;
                const formattedFinal = (typeof formatCurrency === 'function') ? formatCurrency(convertedFinal, currentRegion) : `₹${convertedFinal}`;

                // Update main price display
                const mainPriceContainer = document.querySelector('.product-info-section .product-price');
                if (mainPriceContainer) {
                    if (discountPercent > 0) {
                        mainPriceContainer.innerHTML = `
                            <div class="price-top-line">
                                <span class="current-price">${formattedFinal}</span>
                            </div>
                            <div class="price-bottom-line">
                                <span class="original-price">${formattedOriginal}</span>
                                <span class="discount-badge">(${discountPercent}% OFF)</span>
                            </div>`;
                    }
                }

                // Update sale label if exists
                const isSale = freeSizeData.is_sale === true || freeSizeData.is_sale === 'true';
                const saleLabel = freeSizeData.sale_label || 'SALE';
                if (isSale) {
                    const titleHeader = document.querySelector('.product-title-header');
                    let labelsContainer = document.querySelector('.product-labels');
                    if (!labelsContainer && titleHeader) {
                        labelsContainer = document.createElement('div');
                        labelsContainer.className = 'product-labels';
                        titleHeader.insertAdjacentElement('afterend', labelsContainer);
                    }
                    if (labelsContainer) {
                        // Check if NEW label exists, preserve it
                        const hasNew = labelsContainer.querySelector('.product-label-new');
                        let content = hasNew ? '<span class="product-label-new">NEW</span>' : '';
                        content += `<span class="product-label-sale">${saleLabel}</span>`;
                        labelsContainer.innerHTML = content;
                        labelsContainer.style.display = 'block';
                    }
                }

                // Mark the hidden Free Size button as selected for cart operations
                const freeSizeBtn = document.querySelector('.size-option[data-size="Free Size"], .size-option[data-size="free size"]');
                if (freeSizeBtn) {
                    freeSizeBtn.classList.add('selected');
                }

                console.log('Free Size product: auto-displayed stock, price, discount, sale label');
            } else {
                // For normal sized products: auto-select first available size button
                const firstAvailableBtn = document.querySelector('.size-option:not(.disabled)');
                if (firstAvailableBtn) {
                    firstAvailableBtn.click();  // Triggers size click handler to update stock, price, etc.
                }
            }
            // --- END AUTO-SELECT AND FREE SIZE HANDLING ---
        }, 100); // Small delay to ensure DOM is ready
    }

    // --- Fallback Share Modal ---
    function displayShareModal(d) {
        document.getElementById('share-modal-container')?.remove(); const u = encodeURIComponent(d.url), t = encodeURIComponent(d.text); const m = `<div class="share-modal-overlay"></div><div class="share-modal"><div class="share-modal-header"><h3>Share</h3><button class="close-share-modal">&times;</button></div><div class="share-modal-body"><p>Copy link or share:</p><div class="share-link-container"><input type="text" value="${d.url}" readonly><button class="copy-link-btn">Copy</button></div><div class="share-socials"><a href="https://facebook.com/sharer/sharer.php?u=${u}" target="_blank"><i class="fab fa-facebook-f"></i></a><a href="https://twitter.com/intent/tweet?url=${u}&text=${t}" target="_blank"><i class="fab fa-twitter"></i></a><a href="https://wa.me/?text=${t}%20${u}" target="_blank"><i class="fab fa-whatsapp"></i></a><a href="mailto:?subject=${encodeURIComponent(d.title)}&body=${t}%20${u}"><i class="fas fa-envelope"></i></a></div></div></div>`; const c = document.createElement('div'); c.id = 'share-modal-container'; c.innerHTML = m; document.body.appendChild(c); c.querySelector('.close-share-modal').addEventListener('click', () => c.remove()); c.querySelector('.share-modal-overlay').addEventListener('click', () => c.remove()); c.querySelector('.copy-link-btn').addEventListener('click', e => { const i = c.querySelector('input'); i.select(); navigator.clipboard.writeText(i.value).then(() => { e.target.textContent = 'Copied!'; setTimeout(() => e.target.textContent = 'Copy', 1500); }).catch(err => console.error('Copy fail:', err)); });
    }

    // --- Set Initial Wishlist Button State ---
    function initializeWishlistButtonState() {
        const w = getWishlist(); if (!product) return; const i = w.some(item => item.id === productId); const b = document.getElementById('product-wishlist-btn'); if (i && b) { b.classList.add('active'); const icon = b.querySelector('i'); if (icon) { icon.classList.remove('far'); icon.classList.add('fas'); } }
    }

    // --- Header Search Setup ---
    function setupSearchFunctionality() {
        const searchForm = document.getElementById("header-search-form"), searchInput = document.getElementById("header-search-input"), headerSearchContainer = document.querySelector(".header-icon.search-container"), headerSearchIcon = document.querySelector(".search-icon-trigger"), searchPopup = document.getElementById("search-results-popup");
        if (headerSearchIcon && headerSearchContainer && searchInput && searchPopup) {
            headerSearchIcon.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); headerSearchContainer.classList.toggle("active"); if (headerSearchContainer.classList.contains("active")) searchInput.focus(); else searchPopup.style.display = 'none'; });
            searchInput.addEventListener('input', () => {
                const term = searchInput.value.trim().toLowerCase();
                const currentRegion = getSelectedRegion();
                searchPopup.innerHTML = ''; if (term.length === 0) { searchPopup.style.display = 'none'; return; }
                const results = originalAllProductsINR.filter(p => p.name.toLowerCase().includes(term)).slice(0, 5);
                if (results.length > 0) results.forEach(pINR => {
                    const item = document.createElement('a');
                    item.href = `/product/${pINR.id}?img=${encodeURIComponent(pINR.image)}`;
                    item.classList.add('popup-item');
                    const priceConverted = convertInrToTargetCurrency(pINR.price, currentRegion);
                    item.innerHTML = `<img src="${pINR.image}" alt="${pINR.name}"><div class="popup-item-info"><h4>${pINR.name}</h4><p>${formatCurrency(priceConverted, currentRegion)}</p></div>`;
                    searchPopup.appendChild(item);
                }); else searchPopup.innerHTML = `<div class="popup-no-results">Not found.</div>`;
                searchPopup.style.display = 'block';
            });
            searchForm?.addEventListener('submit', e => { e.preventDefault(); const term = searchInput.value.trim(); if (term) window.location.href = `search.html?query=${encodeURIComponent(term)}`; });
            document.addEventListener('click', e => { if (headerSearchContainer && !headerSearchContainer.contains(e.target)) { headerSearchContainer.classList.remove('active'); if (searchPopup) searchPopup.style.display = 'none'; } });
        }
    }
    // Helper to update search popup prices
    function updateSearchPopupPrices() {
        const searchPopup = document.getElementById("search-results-popup");
        const searchInput = document.getElementById("header-search-input");
        if (!searchPopup || !searchInput || searchPopup.style.display !== 'block') return;
        const inputEvent = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(inputEvent);
    }


    // --- Side Cart Open/Close Listeners ---
    const sideCartIcon = document.querySelector('.cart-icon'), sideCartOverlay = document.getElementById('cart-overlay'), sideCartSidebar = document.getElementById('cart-sidebar'), sideCartCloseBtn = document.getElementById('close-cart-btn');
    if (sideCartIcon && sideCartOverlay && sideCartSidebar && sideCartCloseBtn) {
        sideCartIcon.addEventListener('click', e => { e.preventDefault(); sideCartOverlay.classList.add('active'); sideCartSidebar.classList.add('active'); renderCartItems(); }); sideCartCloseBtn.addEventListener('click', () => { sideCartOverlay.classList.remove('active'); sideCartSidebar.classList.remove('active'); }); sideCartOverlay.addEventListener('click', e => { if (e.target === sideCartOverlay) { sideCartOverlay.classList.remove('active'); sideCartSidebar.classList.remove('active'); } });
    }

    // --- ****** END ADDITION ****** ---

    // --- Function to Update Prices on the Page (PDP Specific) ---
    function updateDisplayedPrices() {
        const currentRegion = getSelectedRegion();
        console.log("Updating product.js prices for region:", currentRegion);

        // --- RECALCULATION LOGIC ADDED ---
        // 1. Re-calculate the main product's converted price
        if (product) {
            const productINR = originalAllProductsINR.find(p => p.id === product.id);
            if (productINR) {
                // Update the 'priceConverted' on the globally scoped 'product' object
                product.priceConverted = convertInrToTargetCurrency(productINR.price, currentRegion);
            }
        }
        // 2. Re-calculate similar products' converted prices (update the array used by renderSimilarProducts)
        allProductsConverted.forEach(p => {
            const pINR = originalAllProductsINR.find(pi => pi.id === p.id);
            if (pINR) p.priceConverted = convertInrToTargetCurrency(pINR.price, currentRegion);
        });
        // --- END RECALCULATION LOGIC ---

        // Update the main product price
        const mainPriceElement = document.querySelector('.product-info-section .product-price');
        if (product && mainPriceElement) {
            const currentRegion = getSelectedRegion();
            const regularPriceConverted = convertInrToTargetCurrency(product.price, currentRegion);
            const discountPriceConverted = product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : null;
            const hasDiscount = product.discount_price && parseFloat(product.discount_price) > 0;

            if (hasDiscount) {
                mainPriceElement.innerHTML = `<span class="original-price" style="text-decoration: line-through; color: #999; margin-right: 8px;">${formatCurrency(regularPriceConverted, currentRegion)}</span><span class="current-price">${formatCurrency(discountPriceConverted, currentRegion)}</span>`;
                product.priceConverted = discountPriceConverted;
            } else {
                mainPriceElement.innerHTML = `<span class="current-price">${formatCurrency(regularPriceConverted, currentRegion)}</span>`;
                product.priceConverted = regularPriceConverted;
            }
            product.regularPriceConverted = regularPriceConverted;
            product.discountPriceConverted = discountPriceConverted;
        }

        renderSimilarProducts(product);
        updateSearchPopupPrices();

        if (document.getElementById('cart-overlay')?.classList.contains('active')) {
            renderCartItems();
        }
    }

    // Setup search functionality (will use products from API after they're loaded)
    setupSearchFunctionality();

    // Listen for region changes dispatched by the header script
    document.addEventListener('regionChanged', () => {
        // Recalculates and updates all prices on the page
        updateDisplayedPrices();
        updateSearchPopupPrices();
    });
}); // End DOMContentLoaded