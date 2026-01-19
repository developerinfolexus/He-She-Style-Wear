// --- Constants (Global Scope for Header Functions - Assume defined elsewhere, e..g., index.js) ---
const CART_KEY = "he_she_cart";
const WISHLIST_KEY = "he_she_wishlist";
const REVIEWS_KEY = "he_she_reviews";
const SELECTED_REGION_KEY = "he_she_selected_region";

// --- Ensure EXCHANGE_RATES includes flags (Prices stored in USD) ---
const EXCHANGE_RATES = {
    ca: { rate: 1.33, symbol: "CA$", flag: 'https://flagcdn.com/w20/ca.png' }, // USD to CAD (1 USD = 1.33 CAD)
    us: { rate: 1.0, symbol: "US$", flag: 'https://flagcdn.com/w20/us.png' }  // USD to USD (no conversion)
};

// --- Global Helper Functions needed by Header ---
function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { console.error("Error parsing cart:", e); localStorage.removeItem(CART_KEY); return []; } }
function getReviews() { try { const stored = localStorage.getItem(REVIEWS_KEY); return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Error parsing reviews:", e); localStorage.removeItem(REVIEWS_KEY); return []; } }
function getSelectedRegion() { return localStorage.getItem(SELECTED_REGION_KEY) || 'ca'; }
function setSelectedRegion(region) { if (EXCHANGE_RATES[region]) { localStorage.setItem(SELECTED_REGION_KEY, region); } else { console.error("Invalid region selected:", region); } }
function convertUsdToTargetCurrency(priceUsdStr, region) {
    const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'];
    // Use parseFloat to preserve decimal places, remove non-numeric characters except decimal point
    const p = parseFloat(String(priceUsdStr).replace(/[^0-9.]/g, '')) || 0;
    return isNaN(p) ? 0 : (p * r.rate);
}
// Keep old function name for backward compatibility
function convertInrToTargetCurrency(priceUsdStr, region) {
    return convertUsdToTargetCurrency(priceUsdStr, region);
}
function formatCurrency(amount, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['us']; return `${r.symbol}${amount.toFixed(2)}`; }
function convertDisplayedToUsd(priceDisplayedStr, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'], p = parseFloat(String(priceDisplayedStr).replace(/[^0-9.]/g, '')); return (isNaN(p) || r.rate === 0) ? 0 : (p / r.rate); }
// Keep old function name for backward compatibility
function convertDisplayedToInr(priceDisplayedStr, region) {
    return convertDisplayedToUsd(priceDisplayedStr, region);
}


//header function - moved inside DOMContentLoaded

// --- Global Header Count Update Functions ---
function updateWishlistCount() {
    const count = getWishlist().length;
    const countElement = document.getElementById("wishlistCount");
    if (countElement) {
        countElement.textContent = count;
        countElement.style.display = count > 0 ? "flex" : "none";
    }
}
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const countElement = document.getElementById("cartCount");
    if (countElement) {
        countElement.textContent = totalItems;
        countElement.style.display = totalItems > 0 ? "flex" : "none";
    }
}


// --- Global Header Initialization Functions ---
function setupSearchFunctionality() {
    const searchForm = document.getElementById('header-search-form');
    const searchContainer = document.querySelector(".header-icon.search-container"); // More specific selector
    const searchIconTrigger = searchContainer?.querySelector(".search-icon-trigger"); // Find within container
    const searchInput = document.getElementById("header-search-input");
    const searchPopup = document.getElementById("search-results-popup");

    if (!searchIconTrigger || !searchContainer || !searchInput || !searchPopup) {
        console.warn("Search elements not found for initialization.");
        return;
    }

    // Clone and replace to remove listeners on the elements themselves
    const newSearchContainer = searchContainer.cloneNode(true);
    searchContainer.parentNode.replaceChild(newSearchContainer, searchContainer);

    // Re-select elements from the cloned container
    const newSearchForm = document.getElementById('header-search-form'); // Assumes ID is within the form
    const newSearchIconTrigger = newSearchContainer.querySelector(".search-icon-trigger");
    const newSearchInput = document.getElementById("header-search-input"); // Assuming ID remains the same
    const newSearchPopup = document.getElementById("search-results-popup"); // Assuming ID remains the same

    if (!newSearchIconTrigger || !newSearchInput || !newSearchPopup) {
        console.error("Cloned search elements not found.");
        return; // Exit if cloning failed or elements lost
    }
    // --- End cleanup ---

    // --- MODIFICATION START: Get the current page path ---
    const currentPath = window.location.pathname;

    // --- MODIFICATION: Added all pages to this list ---
    const isToggleSearchPage = currentPath.endsWith('/') ||
        currentPath.endsWith('/index.html') ||
        currentPath === '' ||
        currentPath.endsWith('/women.html') ||
        currentPath.endsWith('/kids.html') ||
        currentPath.endsWith('/cart.html') ||
        currentPath.endsWith('/profile.html') ||
        currentPath.endsWith('/checkout.html') ||
        currentPath.endsWith('/product.html') ||
        currentPath.endsWith('/orders.html');
    // --- END MODIFICATION ---

    newSearchIconTrigger.addEventListener("click", e => {

        if (isToggleSearchPage) {
            e.preventDefault();
            e.stopPropagation();

            // Toggle the search bar to wrap on mobile
            newSearchContainer.classList.toggle("active");
            if (newSearchContainer.classList.contains("active")) {
                newSearchInput.focus();
            } else {
                newSearchPopup.style.display = 'none';
            }
        } else {
            // --- Behavior for: Any other page ---
            // Go directly to the search page
            e.preventDefault(); // Prevent form submission
            window.location.href = 'search.html';
        }
    });

    newSearchInput.addEventListener('input', () => {
        // This logic will now only run on the pages defined in isToggleSearchPage
        const searchTerm = newSearchInput.value.trim().toLowerCase();
        const currentRegion = getSelectedRegion();
        newSearchPopup.innerHTML = '';

        if (searchTerm.length === 0) {
            newSearchPopup.style.display = 'none';
            return;
        }

        // Use the comprehensive list for search suggestions
        const results = allStoreProductsINRForSearch.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);

        if (results.length > 0) {
            results.forEach(pINR => {
                const item = document.createElement('a');
                item.href = `/product/${pINR.id}?img=${encodeURIComponent(pINR.image)}`;
                item.classList.add('popup-item');
                const pConv = convertInrToTargetCurrency(pINR.price, currentRegion);
                item.innerHTML = `<img src="${pINR.image}" alt="${pINR.name}"><div class="popup-item-info"><h4>${pINR.name}</h4><p>${formatCurrency(pConv, currentRegion)}</p></div>`;
                newSearchPopup.appendChild(item);
            });
        } else {
            newSearchPopup.innerHTML = `<div class="popup-no-results">No products found.</div>`;
        }

        newSearchPopup.style.display = 'block';
    });

    if (newSearchForm) newSearchForm.addEventListener('submit', event => {
        event.preventDefault();
        const searchTerm = newSearchInput.value.trim();
        if (searchTerm) {
            // If on a toggle page, submit takes you to search.html
            window.location.href = `search.html?query=${encodeURIComponent(searchTerm)}`;
        }
    });

    // Add document listener to close popup (ensure it's added only once globally)
    if (!document.body.hasAttribute('data-search-popup-listener')) {
        document.addEventListener('click', e => {
            // Check against the potentially replaced container
            const currentSearchContainer = document.querySelector(".header-icon.search-container");
            if (currentSearchContainer && !currentSearchContainer.contains(e.target) && currentSearchContainer.classList.contains('active')) {
                currentSearchContainer.classList.remove('active');

                const popup = currentSearchContainer.querySelector("#search-results-popup");
                if (popup) popup.style.display = 'none';
            }
        });
        document.body.setAttribute('data-search-popup-listener', 'true');
    }
}

function closeOtherDropdowns(currentDropdownContainer) { // Global helper
    document.querySelectorAll('.profile-icon-container.active, .region-flag-selector.active').forEach(container => {
        if (container !== currentDropdownContainer) {
            container.classList.remove('active');
        }
    });
}

function setupProfileDropdown() {
    const profileContainer = document.getElementById('profileIconContainer');
    const profileIcon = profileContainer?.querySelector('.profile-icon-trigger');
    const profileDropdown = document.getElementById('profileDropdown'); // Dropdown menu itself
    const logoutButton = document.getElementById('logoutButton');

    if (!profileIcon || !profileDropdown || !profileContainer) {
        // console.warn("Profile dropdown elements not found for initialization.");
        return;
    }

    // --- Clean up old listeners ---
    const newProfileIcon = profileIcon.cloneNode(true);
    profileIcon.parentNode.replaceChild(newProfileIcon, profileIcon);
    const newLogoutButton = logoutButton ? logoutButton.cloneNode(true) : null;
    if (logoutButton && newLogoutButton) logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
    // --- End cleanup ---

    newProfileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        profileContainer.classList.toggle('active');
        closeOtherDropdowns(profileContainer);
    });
    // Event listener removed to allow normal link navigation for logout

    // Add document listener to close (ensure only once)
    if (!document.body.hasAttribute('data-profile-dropdown-listener')) {
        document.addEventListener('click', (e) => {
            const currentProfileContainer = document.getElementById('profileIconContainer'); // Re-select in case it was replaced
            if (currentProfileContainer && !currentProfileContainer.contains(e.target) && currentProfileContainer.classList.contains('active')) {
                currentProfileContainer.classList.remove('active');
            }
        });
        document.body.setAttribute('data-profile-dropdown-listener', 'true');
    }
}

function setupNavDropdowns() { /* No JS needed for CSS hover */ }

// --- MODIFIED Region Flag Dropdown Setup ---
function setupRegionFlagDropdown() {
    const regionContainer = document.getElementById('region-selector-container');
    const selectedRegionTrigger = document.getElementById('selected-region-trigger');
    const selectedRegionFlag = document.getElementById('selected-region-flag'); // The <img> tag
    const regionDropdownMenu = document.getElementById('region-dropdown-menu');

    if (!regionContainer || !selectedRegionTrigger || !selectedRegionFlag || !regionDropdownMenu) {
        console.warn("Region flag dropdown elements not found for initialization.");
        return;
    }

    // --- Function to Update Flag Display ---
    const updateFlagDisplay = (regionCode) => {
        const regionData = EXCHANGE_RATES[regionCode];
        // Ensure selectedRegionFlag is still valid in the current DOM
        const currentFlagImg = document.getElementById('selected-region-flag');
        if (!currentFlagImg) {
            console.error("selected-region-flag <img> not found during updateFlagDisplay.");
            return;
        }
        if (regionData && regionData.flag) {
            currentFlagImg.src = regionData.flag;
            currentFlagImg.alt = regionCode.toUpperCase() + " flag";
            console.log("Flag set for:", regionCode, "URL:", regionData.flag);
        } else {
            console.warn("Flag URL not found for region:", regionCode);
            currentFlagImg.src = "";
            currentFlagImg.alt = "No flag";
        }
    };
    // --- END Function ---

    // --- Function to detect URL query param "region" (added for Login Redirection) ---
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region');
    if (regionParam && EXCHANGE_RATES[regionParam.toLowerCase()]) {
        console.log("Region param detected:", regionParam);
        setSelectedRegion(regionParam.toLowerCase());
    }
    // ---------------------------------------------------------------------------------

    // Initial Display Setup
    updateFlagDisplay(getSelectedRegion());

    // --- Clean up potential old listeners ---
    const newSelectedRegionTrigger = selectedRegionTrigger.cloneNode(true);
    selectedRegionTrigger.parentNode.replaceChild(newSelectedRegionTrigger, selectedRegionTrigger);
    const newRegionDropdownMenu = regionDropdownMenu.cloneNode(true);
    regionDropdownMenu.parentNode.replaceChild(newRegionDropdownMenu, regionDropdownMenu);
    // --- End cleanup ---


    // Add listeners to the *new* elements
    newSelectedRegionTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        regionContainer.classList.toggle('active'); // Use original container ref for class toggle
        closeOtherDropdowns(regionContainer);
    });

    newRegionDropdownMenu.querySelectorAll('.region-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const newRegion = option.getAttribute('data-value');
            if (EXCHANGE_RATES[newRegion]) {
                const currentRegion = getSelectedRegion();
                if (newRegion !== currentRegion) { // Only proceed if region actually changed
                    setSelectedRegion(newRegion);
                    updateFlagDisplay(newRegion); // Update the flag image
                    regionContainer.classList.remove('active'); // Use original ref
                    // Dispatch event for other scripts to listen to
                    document.dispatchEvent(new CustomEvent('regionChanged'));
                    console.log("Region changed to:", newRegion);
                } else {
                    regionContainer.classList.remove('active'); // Close if same region clicked
                }
            }
        });
    });

    // Add document listener to close (ensure only once)
    if (!document.body.hasAttribute('data-region-dropdown-listener')) {
        document.addEventListener('click', (e) => {
            // Re-select container inside listener in case it was replaced
            const currentRegionContainer = document.getElementById('region-selector-container');
            if (currentRegionContainer && !currentRegionContainer.contains(e.target) && currentRegionContainer.classList.contains('active')) {
                currentRegionContainer.classList.remove('active');
            }
        });
        document.body.setAttribute('data-region-dropdown-listener', 'true');
    }
}

// --- 
// --- 
// --- THIS IS THE MODIFIED FUNCTION ---
// --- 
// --- 
function setupMobileMenuToggle() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const overlay = document.getElementById("mobile-menu-overlay");
    const menuContainer = document.getElementById("mobile-menu-container");

    const navToClone = document.querySelector(".main-header .main-nav");

    if (!toggleBtn || !overlay || !menuContainer) {
        console.warn("Mobile menu elements not found.");
        return;
    }

    // Only clone the nav if the container is empty
    if (navToClone && menuContainer.children.length === 0) {
        const clonedNav = navToClone.cloneNode(true);
        menuContainer.appendChild(clonedNav);
    }

    let isMenuOpen = false;

    // Clone the button to remove any old listeners
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

    function openMenu() {
        menuContainer.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
        const icon = newToggleBtn.querySelector("i"); // Use the new button
        if (icon) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-times");
        }
        isMenuOpen = true;
    }

    function closeMenu() {
        menuContainer.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
        const icon = newToggleBtn.querySelector("i"); // Use the new button
        if (icon) {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
        isMenuOpen = false;
    }

    // Attach the listener to the *new* button
    newToggleBtn.onclick = function () {
        isMenuOpen ? closeMenu() : openMenu();
    };

    overlay.onclick = closeMenu;

    // --- START: New Accordion Logic ---
    // Add listeners to the accordion buttons *inside* the mobile menu
    menuContainer.querySelectorAll('.accordion-toggle').forEach(button => {
        // Clone and replace to prevent duplicate listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        const icon = newButton.querySelector('i');
        const panelId = newButton.getAttribute('aria-controls');
        const panel = menuContainer.querySelector('#' + panelId);

        if (!panel || !icon) return;

        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop click from propagating to the <a> link

            const isOpening = newButton.getAttribute('aria-expanded') === 'false';

            if (isOpening) {
                newButton.setAttribute('aria-expanded', 'true');
                panel.classList.add('active'); // Use class for CSS
                panel.style.maxHeight = panel.scrollHeight + 'px';
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-minus');
            } else {
                newButton.setAttribute('aria-expanded', 'false');
                panel.classList.remove('active');
                panel.style.maxHeight = null;
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            }
        });
    });
    // --- END: New Accordion Logic ---


    // Close when clicking a main link (not an accordion button)
    menuContainer.addEventListener("click", (e) => {
        // Only close if clicking an <a> tag directly,
        // and not one inside an accordion trigger
        if (e.target.tagName === "A" && !e.target.closest('.mobile-nav-trigger')) {
            closeMenu();
        }
        // Also close if clicking the main <a> in the trigger
        if (e.target.tagName === "A" && e.target.closest('.mobile-nav-trigger')) {
            closeMenu();
        }
    });

    console.log("✅ Mobile menu initialized (with Accordion)");
}
// --- END OF MODIFIED FUNCTION ---

// --- Running Banners (Promo Bar) ---
function initRunningBanners() {
    const endpoint = document.body.dataset.runningBannersUrl || '/api/running-banners/';

    fetch(endpoint)
        .then(res => res.json())
        .then(data => {
            const bannersRaw = data.banners || [];
            const banners = bannersRaw.map(b => String(b || '').trim()).filter(Boolean);
            if (!banners.length) return;

            const bar = document.getElementById('promo-bar');
            const textEl = document.getElementById('promo-text');
            if (!bar || !textEl) return;

            // Build the promo text content
            textEl.innerHTML = banners
                .map(b => `<span class="promo-item">${b}</span>`)
                .join('<span class="promo-sep">•</span>');

            textEl.classList.add('promo-track');
            bar.style.display = 'block';

            // 🛑 Clone only if needed (to enable smooth infinite scroll)
            requestAnimationFrame(() => {
                if (textEl.scrollWidth < bar.clientWidth) {
                    textEl.innerHTML += textEl.innerHTML; // Clone only when short
                }
            });
        })
        .catch(err => console.warn('Promo Banner Load Failed:', err));
}




// --- DOMContentLoaded for index.html specific logic ---
document.addEventListener("DOMContentLoaded", () => {
    // Load header first
    let baseUrl = document.body.dataset.headerUrl || '/api/header/';
    const headerUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    console.log("Loading header from:", headerUrl);
    fetch(headerUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                // Extract style tags from the header HTML and add them to document head
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data;
                const styleTags = tempDiv.querySelectorAll('style');
                styleTags.forEach(styleTag => {
                    const newStyle = document.createElement('style');
                    newStyle.textContent = styleTag.textContent;
                    document.head.appendChild(newStyle);
                });

                // Extract the actual header content (everything except style tags)
                const headerContent = tempDiv.innerHTML.replace(/<style[\s\S]*?<\/style>/gi, '');
                headerPlaceholder.innerHTML = headerContent;
                setupHoverSubcategoryNavigation();

                console.log("Header loaded successfully");
                console.log("Header content length:", headerContent.length);
                console.log("Header placeholder has content:", headerPlaceholder.innerHTML.length > 0);
                // --- Hover Subcategory Arrow Navigation (Women) ---



                // Check if header is actually visible
                const mainHeader = headerPlaceholder.querySelector('.main-header');
                if (mainHeader) {
                    console.log("Main header element found:", mainHeader);
                    console.log("Header display:", window.getComputedStyle(mainHeader).display);
                    console.log("Header visibility:", window.getComputedStyle(mainHeader).visibility);
                    console.log("Header opacity:", window.getComputedStyle(mainHeader).opacity);
                } else {
                    console.error("Main header element not found in loaded content");
                }

                // Re-initialize dynamic header parts handled by index.js:
                if (typeof setupSearchFunctionality === 'function') setupSearchFunctionality();
                if (typeof setupProfileDropdown === 'function') setupProfileDropdown();
                if (typeof setupNavDropdowns === 'function') setupNavDropdowns();
                if (typeof setupRegionFlagDropdown === 'function') setupRegionFlagDropdown();
                if (typeof updateCartCount === 'function') updateCartCount();
                if (typeof updateWishlistCount === 'function') updateWishlistCount();

                // --- MODIFICATION START: Call the mobile menu setup function ---
                if (typeof setupMobileMenuToggle === 'function') setupMobileMenuToggle();
                // --- MODIFICATION END ---

                // Initialize running banners (promo bar) after header HTML inserted
                if (typeof initRunningBanners === 'function') initRunningBanners();

                // Re-set active nav link based on current page
                const navLinks = document.querySelectorAll(".main-nav li");
                const currentPath = window.location.pathname.split('/').pop();
                navLinks.forEach(link => {
                    const anchor = link.querySelector('a');
                    if (anchor) {
                        const href = anchor.getAttribute('href');
                        link.classList.remove('active'); // Remove active from all first
                        if (((currentPath === '' || currentPath === 'index.html') && href === 'index.html')) {
                            link.classList.add('active'); // Set active for index
                        }
                    }
                });
            } else {
                console.error("Header placeholder element not found");
            }
        })
        .catch(error => {
            console.error('Error loading header:', error);
            console.error("Header URL was:", headerUrl);
        });

    // --- Fetch and render recently added products ---
    const productGrid = document.querySelector('.product-grid');
    let indexPageProducts = [];
    let indexPageProductsConverted = [];

    async function loadAndRenderProducts() {
        try {
            // Fetch recently added products (ordered by created_at, limit removed to show all)
            const response = await fetch('/api/products/?order_by=-created_at');
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    // Convert API format to expected format
                    indexPageProducts = data.products.map(product => ({
                        id: product.id, // API returns slug as id
                        name: product.name,
                        price: parseFloat(product.price).toString(), // Ensure proper numeric conversion
                        discount_price: (product.discount_price && parseFloat(product.discount_price) > 0) ? parseFloat(product.discount_price).toString() : null, // Store discount price only if valid
                        image: product.image || '/static/customer/images/placeholder.jpg',
                        category: product.category || ''
                    }));

                    // Convert prices for current region
                    const initialRegion = getSelectedRegion();
                    indexPageProductsConverted = indexPageProducts.map(product => {
                        // Use discount price if available, otherwise use regular price
                        const displayPrice = product.discount_price || product.price;
                        return {
                            ...product,
                            priceConverted: convertInrToTargetCurrency(displayPrice, initialRegion),
                            regularPriceConverted: convertInrToTargetCurrency(product.price, initialRegion)
                        };
                    });

                    // Render card carousel with recently added products (first 5-8 products)
                    // renderCardCarousel(indexPageProducts); // DISABLED: Using server-side Traditional Look items

                    // Render products in the grid
                    if (productGrid) {
                        productGrid.innerHTML = '';
                        indexPageProductsConverted.forEach(product => {
                            const displayPrice = product.discount_price || product.price;
                            const priceInTargetCurrency = convertInrToTargetCurrency(displayPrice, initialRegion);
                            const formattedPrice = formatCurrency(priceInTargetCurrency, initialRegion);
                            const regularPriceInTargetCurrency = convertInrToTargetCurrency(product.price, initialRegion);
                            const hasDiscount = product.discount_price && parseFloat(product.discount_price) > 0;

                            const cardHTML = `
                                    <article class="product-card" data-product-id="${product.id}" data-price="${priceInTargetCurrency.toFixed(2)}">
                                        <div class="product-image-container">
                                            <img src="${product.image}" alt="${product.name}" />
                                            <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                                            <div class="product-rating"><i class="fas fa-star"></i> 4.5</div>
                                            <div class="wishlist-success-overlay"></div>
                                        </div>
                                        <div class="product-info">
                                            <h3 class="product-name">${product.name}</h3>
                                            <p class="product-price">
                                                ${hasDiscount ? `<span class="original-price" style="text-decoration: line-through; color: #999; margin-right: 8px;">${formatCurrency(regularPriceInTargetCurrency, initialRegion)}</span>` : ''}
                                                <span class="current-price">${formattedPrice}</span>
                                            </p>
                                        </div>
                                    </article>
                                `;
                            productGrid.insertAdjacentHTML('beforeend', cardHTML);
                        });

                        // Initialize wishlist and click handlers
                        initializeWishlistHeartsLocal();
                        initializeProductCardClicksLocal();
                        updateDisplayedPricesLocal();
                    }
                } else {
                    // No products found - show message
                    if (productGrid) {
                        productGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">No products available at the moment.</p>';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
            if (productGrid) {
                productGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">Error loading products. Please try again later.</p>';
            }
        }
    }

    // Load products when page loads
    loadAndRenderProducts();

    // Initialize Card Carousel for server-rendered Traditional Look items
    initializeCardCarousel();

    // --- Price Conversion for index page products ---
    const initialRegion = getSelectedRegion();

    // --- Wishlist Update (Scoped for index page context) ---
    function updateWishlistLocal(productData, isAdding) { /* ... (keep as before, calls global updateWishlistCount) ... */
        let list = getWishlist(); const currentRegion = getSelectedRegion(); const priceInr = convertDisplayedToInr(productData.price, currentRegion); const itemToStore = { ...productData, price: priceInr.toString() };
        if (isAdding) { if (!list.some(item => item.id === itemToStore.id)) list.push(itemToStore); } else { list = list.filter(item => item.id !== itemToStore.id); }
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); updateWishlistCount();
    }

    // --- Initialize Wishlist Hearts (Scoped) ---
    function initializeWishlistHeartsLocal() { /* ... (keep as before, calls global getWishlist) ... */
        const wishlistedIds = getWishlist().map(item => item.id); document.querySelectorAll(".product-grid .product-card").forEach(card => { const productId = card.getAttribute("data-product-id"); const button = card.querySelector(".wishlist-btn"); const icon = button?.querySelector("i"); if (button && icon) { const isActive = wishlistedIds.includes(productId); button.classList.toggle("active", isActive); icon.classList.toggle("far", !isActive); icon.classList.toggle("fas", isActive); } });
    }

    // --- Function to Update Prices on THIS Page (Scoped) ---
    function updateDisplayedPricesLocal() {
        const currentRegion = getSelectedRegion();
        console.log("Updating index.js prices for region:", currentRegion);
        document.querySelectorAll(".product-grid .product-card").forEach(card => {
            const productId = card.getAttribute("data-product-id");
            const priceElement = card.querySelector(".product-price");
            const productINRData = indexPageProducts.find(p => p.id === productId);
            if (productINRData && priceElement) {
                // Use discount price if available, otherwise regular price
                const displayPrice = productINRData.discount_price || productINRData.price;
                const priceInTargetCurrency = convertInrToTargetCurrency(displayPrice, currentRegion);
                const regularPriceInTargetCurrency = convertInrToTargetCurrency(productINRData.price, currentRegion);
                const hasDiscount = productINRData.discount_price && parseFloat(productINRData.discount_price) > 0;

                // Update price display
                if (hasDiscount) {
                    priceElement.innerHTML = `<span class="original-price" style="text-decoration: line-through; color: #999; margin-right: 8px;">${formatCurrency(regularPriceInTargetCurrency, currentRegion)}</span><span class="current-price">${formatCurrency(priceInTargetCurrency, currentRegion)}</span>`;
                } else {
                    priceElement.innerHTML = `<span class="current-price">${formatCurrency(priceInTargetCurrency, currentRegion)}</span>`;
                }

                card.dataset.price = priceInTargetCurrency.toFixed(2);

                // Update runtime product data
                const runtimeProduct = indexPageProductsConverted.find(p => p.id === productId);
                if (runtimeProduct) {
                    runtimeProduct.priceConverted = priceInTargetCurrency;
                    runtimeProduct.regularPriceConverted = regularPriceInTargetCurrency;
                }
            }
        });
    }

    setupMainBannerCarouselLocal();

    // --- Initialize Product Card Clicks (Scoped) ---
    function initializeProductCardClicksLocal() {
        document.querySelectorAll(".product-grid .product-card").forEach(card => {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            newCard.addEventListener("click", e => {
                const isWishlistClick = e.target.closest(".wishlist-btn");
                const productId = newCard.getAttribute("data-product-id");

                if (isWishlistClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    const button = isWishlistClick;
                    const currentPriceText = newCard.querySelector(".product-price")?.textContent || '';
                    const productData = {
                        id: productId,
                        name: newCard.querySelector(".product-name")?.textContent || '',
                        price: currentPriceText,
                        image: newCard.querySelector("img")?.src || ''
                    };
                    const isAdding = !button.classList.contains("active");
                    button.classList.toggle("active");
                    const icon = button.querySelector("i");
                    if (icon) {
                        icon.classList.toggle("far");
                        icon.classList.toggle("fas");
                    }
                    updateWishlistLocal(productData, isAdding);

                    // --- MODIFICATION START: This block is now removed ---
                    /*
                    const overlayContainer = newCard.querySelector('.product-image-container'); 
                    if (overlayContainer) { 
                        overlayContainer.querySelector('.wishlist-success-overlay')?.remove(); 
                        if (isAdding) { 
                            const overlay = document.createElement('div'); 
                            overlay.classList.add('wishlist-success-overlay'); 
                            overlay.style.animation = 'fadeInOut 3s forwards'; 
                            overlay.innerHTML = `<p>Added to Wishlist!</p><a href="wishlist.html">View Wishlist</a>`; 
                            overlayContainer.appendChild(overlay); 
                            setTimeout(() => { 
                                overlay.remove(); 
                            }, 3000); 
                        } 
                    }
                    */
                    // --- MODIFICATION END ---

                } else if (productId) {
                    e.preventDefault();
                    const imageUrl = newCard.querySelector("img")?.src;
                    const url = `/product/${productId}${imageUrl ? '?img=' + encodeURIComponent(imageUrl) : ''}`;
                    window.location.href = url;
                }
            });
        });
    }


    // --- Promo Bar Slider ---
    const promoContainer = document.querySelector(".promo-slides");
    if (promoContainer) { /* ... (keep as before) ... */
        const promoSlides = promoContainer.querySelectorAll(".promo-slide"); if (promoSlides.length > 1) { let currentIndex = 0; setInterval(() => { currentIndex = (currentIndex + 1) % promoSlides.length; promoContainer.style.transform = `translateX(-${currentIndex * 100}%)`; }, 2000); }
    }

    // --- Main Banner Carousel Logic ---
    function initializeCarousel() {
        const mainCarouselSlide = document.getElementById("carouselSlide");
        if (!mainCarouselSlide) return;

        const carouselItems = mainCarouselSlide.querySelectorAll(".carousel-item");
        const carouselDotsContainer = document.getElementById("carouselDots");
        const prevArrow = document.getElementById("prevArrow");
        const nextArrow = document.getElementById("nextArrow");

        console.log("Carousel elements found:", {
            carouselSlide: !!mainCarouselSlide,
            carouselItems: carouselItems.length,
            carouselDotsContainer: !!carouselDotsContainer,
            prevArrow: !!prevArrow,
            nextArrow: !!nextArrow
        });

        if (carouselItems.length > 0 && carouselDotsContainer && prevArrow && nextArrow) {
            const totalSlides = carouselItems.length;
            let currentIndex = 0;
            let autoSlideInterval;

            function createDots() {
                carouselDotsContainer.innerHTML = '';
                for (let i = 0; i < totalSlides; i++) {
                    const dot = document.createElement('span');
                    dot.classList.add('dot');
                    dot.dataset.index = i;
                    dot.addEventListener('click', () => {
                        goToSlide(i);
                        resetAutoSlide();
                    });
                    carouselDotsContainer.appendChild(dot);
                }
            }

            function updateDots() {
                const dots = carouselDotsContainer.querySelectorAll('.dot');
                if (dots.length !== totalSlides) return;
                dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
            }

            function goToSlide(index) {
                currentIndex = (index + totalSlides) % totalSlides;
                mainCarouselSlide.style.transform = `translateX(${-currentIndex * 100}%)`;
                updateDots();
            }

            function nextSlide() {
                goToSlide(currentIndex + 1);
            }

            function prevSlide() {
                goToSlide(currentIndex - 1);
            }

            function startAutoSlide() {
                clearInterval(autoSlideInterval);
                autoSlideInterval = setInterval(nextSlide, 3000);
            }

            function resetAutoSlide() {
                clearInterval(autoSlideInterval);
                startAutoSlide();
            }

            nextArrow.addEventListener('click', () => {
                nextSlide();
                resetAutoSlide();
            });

            prevArrow.addEventListener('click', () => {
                prevSlide();
                resetAutoSlide();
            });

            createDots();
            goToSlide(0);
            startAutoSlide();
            console.log("Carousel initialized successfully");
        } else {
            console.warn("Carousel elements missing:", {
                carouselItems: carouselItems.length,
                carouselDotsContainer: !!carouselDotsContainer,
                prevArrow: !!prevArrow,
                nextArrow: !!nextArrow
            });
        }
    }

    // Function to render card carousel (Traditional Look) with recently added products
    function renderCardCarousel(products) {
        const cardCarousel = document.getElementById('cardCarousel');
        if (!cardCarousel) {
            console.warn('Card carousel not found');
            return;
        }

        if (!products || products.length === 0) {
            console.warn('No products to display in card carousel');
            return;
        }

        cardCarousel.innerHTML = '';

        // Create card carousel items from products (limit to 8 for better UX)
        products.slice(0, 8).forEach((product, index) => {
            // Get product image URL, encode it for URL parameter
            const imageUrl = encodeURIComponent(product.image);
            const productUrl = `/product/${product.id}/?img=${imageUrl}`;

            const cardLink = document.createElement('a');
            cardLink.href = productUrl;
            cardLink.className = 'card-link-wrapper';

            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.index = index;

            card.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" />
                    <div class="card-overlay">
                        <div class="card-header">
                            <span>${product.name}</span>
                            <div class="icons"></div>
                        </div>
                    </div>
                `;

            cardLink.appendChild(card);
            cardCarousel.appendChild(cardLink);
        });

        // Re-initialize 3D card carousel after rendering
        initializeCardCarousel();
    }

    // Function to initialize 3D card carousel
    function initializeCardCarousel() {
        const carouselCardsContainer = document.getElementById('cardCarousel');
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");

        if (!carouselCardsContainer || !prevBtn || !nextBtn) {
            console.warn("3D Card Carousel elements not found.");
            return;
        }

        const carouselCards = carouselCardsContainer.querySelectorAll(".card");
        if (carouselCards.length === 0) {
            console.warn("No cards found within .card-carousel for initialization.");
            return;
        }

        let carouselCurrentIndex = 0;
        const totalCards = carouselCards.length;
        let cardAutoScrollInterval;

        // Remove old event listeners by cloning buttons
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        function updateCarousel() {
            carouselCards.forEach((card, index) => {
                const offset = (index - carouselCurrentIndex + totalCards) % totalCards;
                card.classList.remove("active");
                let transform = "", opacity = 1, zIndex = totalCards, filter = "blur(0px)";

                if (offset === 0) { // Center card
                    card.classList.add("active");
                    transform = `translateX(0) rotateY(0) scale(1)`;
                    zIndex = totalCards + 1;
                } else if (offset === 1) { // Right card
                    transform = `translateX(55%) rotateY(-45deg) scale(0.85)`;
                    zIndex = totalCards - 1;
                    opacity = 0.7;
                    filter = "blur(2px)";
                } else if (offset === totalCards - 1) { // Left card
                    transform = `translateX(-55%) rotateY(45deg) scale(0.85)`;
                    zIndex = totalCards - 1;
                    opacity = 0.7;
                    filter = "blur(2px)";
                } else if (offset === 2) { // Far right card
                    transform = `translateX(90%) rotateY(-55deg) scale(0.7)`;
                    zIndex = totalCards - 2;
                    opacity = 0.4;
                    filter = "blur(4px)";
                } else if (offset === totalCards - 2) { // Far left card
                    transform = `translateX(-90%) rotateY(55deg) scale(0.7)`;
                    zIndex = totalCards - 2;
                    opacity = 0.4;
                    filter = "blur(4px)";
                } else { // Other cards (hidden further away)
                    transform = `translateX(${offset > totalCards / 2 ? "-120%" : "120%"}) scale(0.6)`;
                    opacity = 0;
                    zIndex = 0;
                    filter = "blur(6px)";
                }

                card.style.transform = transform;
                card.style.opacity = opacity;
                card.style.zIndex = zIndex;
                card.style.filter = filter;
            });
        }

        function showNextCard() {
            carouselCurrentIndex = (carouselCurrentIndex + 1) % totalCards;
            updateCarousel();
        }

        function showPrevCard() {
            carouselCurrentIndex = (carouselCurrentIndex - 1 + totalCards) % totalCards;
            updateCarousel();
        }

        function startCardAutoScroll() {
            clearInterval(cardAutoScrollInterval);
            cardAutoScrollInterval = setInterval(showNextCard, 3000);
        }

        newNextBtn.addEventListener("click", () => {
            showNextCard();
            startCardAutoScroll();
        });

        newPrevBtn.addEventListener("click", () => {
            showPrevCard();
            startCardAutoScroll();
        });

        updateCarousel(); // Initial setup
        startCardAutoScroll();
    }

    // Card carousel will be initialized after products are loaded via renderCardCarousel()

    // --- Review Modal Logic ---
    const reviewsLink = document.getElementById('footer-reviews-link');
    const reviewsModalOverlay = document.getElementById('reviews-modal-overlay');
    const closeReviewsModalBtn = document.getElementById('close-reviews-modal');
    const reviewsGridContainer = document.querySelector('#reviews-modal-overlay .reviews-grid');
    if (reviewsLink && reviewsModalOverlay && closeReviewsModalBtn && reviewsGridContainer) { /* ... (keep as before, using global getReviews) ... */
        reviewsLink.addEventListener('click', (e) => { e.preventDefault(); loadAndDisplayReviewsLocal(); reviewsModalOverlay.classList.add('active'); });
        closeReviewsModalBtn.addEventListener('click', () => reviewsModalOverlay.classList.remove('active'));
        reviewsModalOverlay.addEventListener('click', (e) => { if (e.target === reviewsModalOverlay) reviewsModalOverlay.classList.remove('active'); });
    } else { console.warn("Review modal elements not found in index.js"); }
    function loadAndDisplayReviewsLocal() { /* ... (keep as before, using global getReviews, generateStaticRatingHTMLLocal) ... */
        if (!reviewsGridContainer) return; const storedReviews = getReviews(); reviewsGridContainer.innerHTML = ''; if (storedReviews.length === 0) { reviewsGridContainer.innerHTML = '<p class="no-reviews-message" style="grid-column: 1 / -1; text-align: center; color: #888; padding: 20px;">No customer reviews yet.</p>'; } else { storedReviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)); storedReviews.forEach(review => { const ratingStars = generateStaticRatingHTMLLocal(review.rating); let reviewImagesHTML = ''; if (review.images && review.images.length > 0) { reviewImagesHTML = '<div class="review-images">'; review.images.forEach(imgDataUrl => { if (typeof imgDataUrl === 'string' && (imgDataUrl.startsWith('data:image') || imgDataUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i))) { reviewImagesHTML += `<img src="${imgDataUrl}" alt="Review image" style="width: 50px; height: 50px; object-fit: cover; margin-right: 5px; border-radius: 4px;">`; } }); reviewImagesHTML += '</div>'; } const userImageHTML = `<img src="${review.userImage || 'https://via.placeholder.com/40/cccccc/808080?text=User'}" alt="User" class="review-user-image">`; let reviewDate = 'Date unknown'; try { if (review.date) reviewDate = new Date(review.date).toLocaleDateString(); } catch (e) { } const productName = review.productName || 'Unknown Product'; const productId = review.productId || ''; let productNameHTML = productName; const productFromCatalog = allStoreProductsINRForSearch.find(p => p.id === productId); if (productId && productFromCatalog && productFromCatalog.image) { const productUrl = `/product/${productId}?img=${encodeURIComponent(productFromCatalog.image)}`; productNameHTML = `<a href="${productUrl}" class="review-product-link">${productName}</a>`; } else if (productId) { productNameHTML = `<a href="/product/${productId}?img=" class="review-product-link">${productName}</a>`; } const reviewCardHTML = `<div class="review-card dynamic-review"><div class="review-card-header"> ${userImageHTML} <div class="review-author-details"> <span class="review-author">${review.author || 'Anonymous'}</span> <span class="review-user-id">(ID: ${review.userId || 'N/A'})</span> </div> </div><div class="review-rating"> ${ratingStars} </div><p class="review-text">"${review.comment}"</p> ${reviewImagesHTML}<p class="review-product-name">Product: ${productNameHTML}</p><p class="review-date">${reviewDate}</p></div>`; reviewsGridContainer.insertAdjacentHTML('beforeend', reviewCardHTML); }); }
    }
    function generateStaticRatingHTMLLocal(rating) { /* ... (keep as before) ... */
        const fullStar = '<i class="fas fa-star"></i>', halfStar = '<i class="fas fa-star-half-alt"></i>', emptyStar = '<i class="far fa-star"></i>'; let stars = ''; const validRating = (typeof rating === 'number' && !isNaN(rating)) ? rating : 0; const roundedRating = Math.round(validRating * 2) / 2; for (let i = 1; i <= 5; i++) { if (roundedRating >= i) stars += fullStar; else if (roundedRating >= i - 0.5) stars += halfStar; else stars += emptyStar; } return stars;
    }

    function setupMainBannerCarouselLocal() {
        const mainCarouselSlide = document.getElementById("carouselSlide");
        if (mainCarouselSlide) {
            const carouselItems = mainCarouselSlide.querySelectorAll(".carousel-item");
            const carouselDotsContainer = document.getElementById("carouselDots");
            const prevArrow = document.getElementById("prevArrow");
            const nextArrow = document.getElementById("nextArrow");
            if (carouselItems.length > 0 && carouselDotsContainer && prevArrow && nextArrow) {
                const totalSlides = carouselItems.length; let currentIndex = 0; let autoSlideInterval;
                function createDots() { carouselDotsContainer.innerHTML = ''; for (let i = 0; i < totalSlides; i++) { const dot = document.createElement('span'); dot.classList.add('dot'); dot.dataset.index = i; dot.addEventListener('click', () => { goToSlide(i); resetAutoSlide(); }); carouselDotsContainer.appendChild(dot); } }
                function updateDots() { const dots = carouselDotsContainer.querySelectorAll('.dot'); if (dots.length !== totalSlides) return; dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex)); }
                function goToSlide(index) { currentIndex = (index + totalSlides) % totalSlides; mainCarouselSlide.style.transform = `translateX(${-currentIndex * 100}%)`; updateDots(); }
                function nextSlide() { goToSlide(currentIndex + 1); }
                function prevSlide() { goToSlide(currentIndex - 1); }
                function startAutoSlide() { clearInterval(autoSlideInterval); autoSlideInterval = setInterval(nextSlide, 3000); }
                function resetAutoSlide() { clearInterval(autoSlideInterval); startAutoSlide(); }
                nextArrow.addEventListener('click', () => { nextSlide(); resetAutoSlide(); });
                prevArrow.addEventListener('click', () => { prevSlide(); resetAutoSlide(); });
                createDots(); goToSlide(0); startAutoSlide();
            } else { console.warn("Initialization failed: Main banner carousel elements missing."); }
        } else { console.warn("Carousel slide container (#carouselSlide) not found."); }
    }

    // --- Initializations specific to index page elements ---
    // Note: Products are loaded dynamically, so initialization happens after loadAndRenderProducts()

    // --- Listen for region changes dispatched by the header script ---
    document.addEventListener('regionChanged', () => {
        if (document.querySelector('.product-grid')) {
            updateDisplayedPricesLocal(); // Update prices on THIS page
        }
    });

    // Initial Header Count Update (call global functions)
    updateCartCount();
    updateWishlistCount();

}); // End of DOMContentLoaded listener



// --- NEW: Global Page Transition Logic ---
document.addEventListener("DOMContentLoaded", () => {

    // 1. Fade in the page on load
    // Use setTimeout to ensure the class is added after the initial render
    setTimeout(() => {
        document.body.classList.add('body-fade-in');
    }, 10); // A small delay is sometimes needed

    // 2. Intercept navigation clicks
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');

        // Skip external links, anchor links (#), javascript: links, and links opening in a new tab
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank') {
            return;
        }

        // Check if it's an internal navigation link
        // This simple check works for this site's structure (e.g., ends in .html)
        if (href.endsWith('.html') || !href.includes('://')) {

            link.addEventListener('click', (e) => {
                // Don't intercept if modifier key is pressed (e.g., Ctrl+Click to open in new tab)
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    return;
                }

                e.preventDefault(); // Stop immediate navigation
                const destination = link.href; // Get the absolute URL

                // Add fade-out class to body
                document.body.classList.remove('body-fade-in'); // Remove fade-in
                document.body.classList.add('body-fade-out'); // Add fade-out

                // Wait for animation to finish (matching CSS duration), then navigate
                setTimeout(() => {
                    window.location.href = destination;
                }, 400); // This duration *must* match the one in your CSS
            });
        }
    });
});
function setupHoverSubcategoryNavigation() {
    // Target all slider wrappers (Women, Kids, etc.)
    const sliders = document.querySelectorAll('.subcat-slider-wrapper');

    sliders.forEach(wrapper => {
        const track = wrapper.querySelector('.slider-track'); // The list moving
        const nextBtn = wrapper.querySelector('.slider-next');
        const prevBtn = wrapper.querySelector('.slider-prev');
        const viewport = wrapper.querySelector('.subcat-slider-viewport');

        if (!track || !nextBtn || !prevBtn || !viewport) {
            console.warn("Slider elements missing in wrapper", wrapper);
            return;
        }

        const items = track.children;
        if (!items.length) return;

        // Configuration
        const visibleItems = 7;
        let currentIndex = 0;
        const totalItems = items.length;

        // Helper to get stride dynamically (must be called when visible)
        const getStride = () => {
            if (items.length > 0) {
                const style = window.getComputedStyle(items[0]);
                const w = items[0].offsetWidth;
                const ml = parseFloat(style.marginLeft) || 0;
                const mr = parseFloat(style.marginRight) || 0;
                if (w > 0) return w + ml + mr;
            }
            return 180; // Fallback
        };

        const updateSlider = () => {
            // Force layout update for desktop
            if (window.innerWidth >= 992) {
                track.style.width = 'max-content';
            }

            const stride = getStride();
            const maxIndex = Math.max(0, totalItems - visibleItems);

            // Clamp index
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex > maxIndex) currentIndex = maxIndex;

            // Slide (Horizontal)
            track.style.transform = `translateX(-${currentIndex * stride}px)`;

            // Update button states
            // We use opacity/pointer-events so they take space but are unclickable
            if (currentIndex <= 0) {
                prevBtn.style.opacity = '0.3';
                prevBtn.style.pointerEvents = 'none';
            } else {
                prevBtn.style.opacity = '1';
                prevBtn.style.pointerEvents = 'auto';
            }

            if (currentIndex >= maxIndex) {
                nextBtn.style.opacity = '0.3';
                nextBtn.style.pointerEvents = 'none';
            } else {
                nextBtn.style.opacity = '1';
                nextBtn.style.pointerEvents = 'auto';
            }
        };

        // --- NEW: Attach to Parent Hover ---
        // Find the parent nav item (li.nav-item-with-hover)
        const navItem = wrapper.closest('.nav-item-with-hover');
        if (navItem) {
            navItem.addEventListener('mouseenter', () => {
                // When user hovers, the menu becomes display:block (via CSS)
                // We verify/update layout immediately
                requestAnimationFrame(() => {
                    updateSlider();
                });
            });
        }

        // Click Listeners
        // Remove old listeners by cloning (simple way for this context)
        const newNext = nextBtn.cloneNode(true);
        const newPrev = prevBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);

        newNext.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const maxIndex = Math.max(0, totalItems - visibleItems);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateSlider();
            }
        });

        newPrev.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentIndex > 0) {
                currentIndex--;
                updateSlider();
            }
        });

        // Initial setup (best effort, though usually hidden)
        updateSlider();
    });
}
// --- END: Global Page Transition Logic ---