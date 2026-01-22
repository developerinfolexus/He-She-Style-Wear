// --- GLOBAL CONSTANTS ---
const WISHLIST_KEY = "he_she_wishlist";
const CART_KEY = "he_she_cart";
const REVIEWS_KEY = "he_she_reviews";
const SELECTED_REGION_KEY = "he_she_selected_region";

// --- EXCHANGE RATES (Prices stored in USD) ---
const EXCHANGE_RATES = {
    ca: { rate: 1.33, symbol: "CA$", flag: 'https://flagcdn.com/w20/ca.png' }, // USD to CAD (1 USD = 1.33 CAD)
    us: { rate: 1.0, symbol: "US$", flag: 'https://flagcdn.com/w20/us.png' }  // USD to USD (no conversion)
};

// --- GLOBAL HELPER FUNCTIONS (From index.js) ---
// --- GLOBAL HELPER FUNCTIONS (From index.js) ---
function getWishlistKey() {
    return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(WISHLIST_KEY) : WISHLIST_KEY;
}
function getCartKey() {
    return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(CART_KEY) : CART_KEY;
}
function getReviewsKey() {
    return (window.getStorageKey && typeof window.getStorageKey === 'function') ? window.getStorageKey(REVIEWS_KEY) : REVIEWS_KEY;
}

function getWishlist() { return JSON.parse(localStorage.getItem(getWishlistKey())) || []; }
function getCart() { try { return JSON.parse(localStorage.getItem(getCartKey())) || []; } catch (e) { console.error("Error parsing cart:", e); localStorage.removeItem(getCartKey()); return []; } }
function getReviews() { try { const stored = localStorage.getItem(getReviewsKey()); return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Error parsing reviews:", e); localStorage.removeItem(getReviewsKey()); return []; } }
function getSelectedRegion() { return localStorage.getItem(SELECTED_REGION_KEY) || 'ca'; }
// *** ADDED/MODIFIED: Setter for Region ***
function setSelectedRegion(region) { if (EXCHANGE_RATES[region]) { localStorage.setItem(SELECTED_REGION_KEY, region); } else { console.error("Invalid region selected:", region); } }

function convertUsdToTargetCurrency(priceUsdStr, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'], p = parseFloat(String(priceUsdStr).replace(/[^0-9.]/g, '')) || 0; return isNaN(p) ? 0 : (p * r.rate); }
// Keep old function name for backward compatibility
function convertInrToTargetCurrency(priceUsdStr, region) { return convertUsdToTargetCurrency(priceUsdStr, region); }
function formatCurrency(amount, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['us']; return `${r.symbol}${amount.toFixed(2)}`; }
function convertDisplayedToUsd(priceDisplayedStr, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['us'], p = parseFloat(String(priceDisplayedStr).replace(/[^0-9.]/g, '')); return (isNaN(p) || r.rate === 0) ? 0 : (p / r.rate); }
// Keep old function name for backward compatibility
function convertDisplayedToInr(priceDisplayedStr, region) { return convertDisplayedToUsd(priceDisplayedStr, region); }

// --- GLOBAL HEADER COUNT UPDATE FUNCTIONS (From index.js) ---
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

// *** ADDED: Function to initialize region flag display and listeners ***
function setupRegionFlagAndListeners() {
    const regionContainer = document.getElementById('region-selector-container');
    const selectedRegionTrigger = document.getElementById('selected-region-trigger');
    const selectedRegionFlag = document.getElementById('selected-region-flag');
    const regionDropdownMenu = document.getElementById('region-dropdown-menu');

    const updateFlagDisplay = (regionCode) => {
        const regionData = EXCHANGE_RATES[regionCode];
        if (selectedRegionFlag && regionData && regionData.flag) {
            selectedRegionFlag.src = regionData.flag;
            selectedRegionFlag.alt = regionCode.toUpperCase() + " flag";
        }
    };

    updateFlagDisplay(getSelectedRegion()); // Initial display

    if (regionContainer && selectedRegionTrigger && regionDropdownMenu) {
        // Helper to close other dropdowns (minimal implementation for profile/region)
        const closeOtherDropdownsLocal = (current) => {
            document.querySelectorAll('.profile-icon-container.active, .region-flag-selector.active').forEach(container => {
                if (container !== current) {
                    container.classList.remove('active');
                }
            });
        };

        const handleToggle = (e) => {
            e.stopPropagation();
            regionContainer.classList.toggle('active');
            closeOtherDropdownsLocal(regionContainer);
        };

        // Set up the click listeners
        selectedRegionTrigger.removeEventListener('click', handleToggle);
        selectedRegionTrigger.addEventListener('click', handleToggle);

        regionDropdownMenu.querySelectorAll('.region-option').forEach(option => {
            // Clone and replace pattern ensures no duplicate listeners from dynamic inclusion
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);

            newOption.addEventListener('click', (e) => {
                const newRegion = newOption.getAttribute('data-value');
                if (EXCHANGE_RATES[newRegion] && newRegion !== getSelectedRegion()) {
                    setSelectedRegion(newRegion);
                    updateFlagDisplay(newRegion);
                    regionContainer.classList.remove('active');
                    // Dispatch event to trigger price/filter updates on the page
                    document.dispatchEvent(new CustomEvent('regionChanged'));
                } else {
                    regionContainer.classList.remove('active'); // Close if same region
                }
            });
        });
    }
}
// --- END ADDED FUNCTION ---

// --- START: Functions copied from index.js for Header interactivity ---

// Helper for dropdowns
function closeOtherDropdowns(currentDropdownContainer) {
    document.querySelectorAll('.profile-icon-container.active, .region-flag-selector.active').forEach(container => {
        if (container !== currentDropdownContainer) {
            container.classList.remove('active');
        }
    });
}
async function loadAllProducts() {
    try {
        const res = await fetch("/api/products/"); // your Django API endpoint
        const data = await res.json();

        // clear and insert API products into array
        originalAllProductsINR.splice(0, originalAllProductsINR.length, ...data.products);

        console.log("✅ Products loaded:", originalAllProductsINR.length);
    } catch (err) {
        console.error("❌ Failed to load products for search bar", err);
    }
}


// Header Search Bar
function setupSearchFunctionality() {
    const searchForm = document.getElementById('header-search-form');
    const searchContainer = document.querySelector(".header-icon.search-container");
    const searchIconTrigger = searchContainer?.querySelector(".search-icon-trigger");
    const searchInput = document.getElementById("header-search-input");
    const searchPopup = document.getElementById("search-results-popup");

    if (!searchIconTrigger || !searchContainer || !searchInput || !searchPopup) {
        console.warn("Search elements not found for initialization.");
        return;
    }

    const newSearchContainer = searchContainer.cloneNode(true);
    searchContainer.parentNode.replaceChild(newSearchContainer, searchContainer);
    const newSearchForm = document.getElementById('header-search-form');
    const newSearchIconTrigger = newSearchContainer.querySelector(".search-icon-trigger");
    const newSearchInput = document.getElementById("header-search-input");
    const newSearchPopup = document.getElementById("search-results-popup");

    if (!newSearchIconTrigger || !newSearchInput || !newSearchPopup) {
        console.error("Cloned search elements not found.");
        return;
    }

    newSearchIconTrigger.addEventListener("click", e => {
        // Check if active AND has value -> Submit
        if (newSearchContainer.classList.contains("active") && newSearchInput.value.trim().length > 0) {
            // Let the form submit naturally or force it
            // If we preventDefault, we must submit manually:
            if (newSearchForm) newSearchForm.submit();
            return;
        }

        e.preventDefault(); e.stopPropagation();
        newSearchContainer.classList.toggle("active");
        if (newSearchContainer.classList.contains("active")) newSearchInput.focus();
        else newSearchPopup.style.display = 'none';
    });
    newSearchInput.addEventListener('input', () => {
        const searchTerm = newSearchInput.value.trim().toLowerCase();
        const currentRegion = getSelectedRegion();
        newSearchPopup.innerHTML = '';
        if (searchTerm.length === 0) { newSearchPopup.style.display = 'none'; return; }

        const results = originalAllProductsINR.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
        if (results.length > 0) {
            results.forEach(pINR => {
                const item = document.createElement('a');
                //   item.href = `/product/${pINR.id}?img=${encodeURIComponent(pINR.image)}`; 
                item.href = `/product/${pINR.id}?img=${encodeURIComponent(pINR.image_url)}`;
                item.classList.add('popup-item');
                const pConv = convertInrToTargetCurrency(pINR.price, currentRegion);
                item.innerHTML = `<img src="${pINR.image}" alt="${pINR.name}"><div class="popup-item-info"><h4>${pINR.name}</h4><p>${formatCurrency(pConv, currentRegion)}</p></div>`;
                //   item.innerHTML = `
                //   <img src="${pINR.image_url}" alt="${pINR.name}">
                //   <div class="popup-item-info">
                //       <h4>${pINR.name}</h4>
                //       <p>${formatCurrency(pConv, currentRegion)}</p>
                //   </div>`;
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
        if (searchTerm) window.location.href = `/search/?q=${encodeURIComponent(searchTerm)}`;
    });

    if (!document.body.hasAttribute('data-search-popup-listener')) {
        document.addEventListener('click', e => {
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

// Profile Dropdown
function setupProfileDropdown() {
    const profileContainer = document.getElementById('profileIconContainer');
    const profileIcon = profileContainer?.querySelector('.profile-icon-trigger');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutButton = document.getElementById('logoutButton');

    if (!profileIcon || !profileDropdown || !profileContainer) {
        return;
    }

    const newProfileIcon = profileIcon.cloneNode(true);
    profileIcon.parentNode.replaceChild(newProfileIcon, profileIcon);
    const newLogoutButton = logoutButton ? logoutButton.cloneNode(true) : null;
    if (logoutButton && newLogoutButton) logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);

    newProfileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        profileContainer.classList.toggle('active');
        closeOtherDropdowns(profileContainer);
    });
    if (newLogoutButton) newLogoutButton.addEventListener('click', (e) => {
        e.preventDefault(); alert("Logout clicked (simulation)"); profileContainer.classList.remove('active');
    });

    if (!document.body.hasAttribute('data-profile-dropdown-listener')) {
        document.addEventListener('click', (e) => {
            const currentProfileContainer = document.getElementById('profileIconContainer');
            if (currentProfileContainer && !currentProfileContainer.contains(e.target) && currentProfileContainer.classList.contains('active')) {
                currentProfileContainer.classList.remove('active');
            }
        });
        document.body.setAttribute('data-profile-dropdown-listener', 'true');
    }
}

// Mobile Menu Toggle
function setupMobileMenuToggle() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const overlay = document.getElementById("mobile-menu-overlay");
    const menuContainer = document.getElementById("mobile-menu-container");
    const navToClone = document.querySelector(".main-header .main-nav");

    if (!toggleBtn || !overlay || !menuContainer) {
        console.warn("Mobile menu elements not found.");
        return;
    }

    if (navToClone && menuContainer.children.length === 0) {
        const clonedNav = navToClone.cloneNode(true);
        menuContainer.appendChild(clonedNav);
    }

    let isMenuOpen = false;

    function openMenu() {
        menuContainer.classList.add("active");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
        const icon = toggleBtn.querySelector("i");
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
        const icon = toggleBtn.querySelector("i");
        if (icon) {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
        isMenuOpen = false;
    }

    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

    newToggleBtn.onclick = function () {
        isMenuOpen ? closeMenu() : openMenu();
    };

    overlay.onclick = closeMenu;

    menuContainer.addEventListener("click", (e) => {
        if (e.target.tagName === "A") closeMenu();
    });

    console.log("✅ Mobile menu initialized");
}
// --- END: Functions copied from index.js ---


// --- Price Range Mapping (CAD - Based on Filter Values) ---
const CAD_PRICE_RANGES = {
    under_80: { min: 0, max: 79.99 },
    '80_160': { min: 80, max: 160 },
    over_160: { min: 160.01, max: Infinity }
};

const originalAllProductsINR = [];



let initialSearchResults = []; // Store the initial search results (INR prices)
let currentRenderedProducts = []; // Store the currently rendered products (INR prices, used by filters)

// --- Update Wishlist Function (Specific to Search Page) ---
function updateWishlist(productData, isAdding) {
    let list = getWishlist(); // Assumes getWishlist() is global
    const currentRegion = getSelectedRegion(); // Assumes global

    // Product data passed might have displayed price, need INR for storage
    const priceInr = convertDisplayedToInr(productData.price, currentRegion); // Assumes global
    const itemToStore = { ...productData, price: priceInr.toString() }; // Store INR price

    if (isAdding) {
        if (!list.some(item => item.id === itemToStore.id)) {
            list.push(itemToStore);
        }
    } else {
        list = list.filter(item => item.id !== itemToStore.id);
    }
    localStorage.setItem(getWishlistKey(), JSON.stringify(list)); // Save updated list
    updateWishlistCount(); // Update header count (assumes global)
}

// --- Initialize Wishlist Button States ---
function initializeWishlistHearts(productContainer) {
    const wishlistedIds = getWishlist().map((item) => item.id); // Assumes getWishlist is global
    productContainer.querySelectorAll(".product-card").forEach((card) => {
        const productId = card.getAttribute("data-product-id");
        const button = card.querySelector(".wishlist-btn");
        if (button && productId) {
            const icon = button.querySelector("i");
            if (icon) {
                const isActive = wishlistedIds.includes(productId);
                button.classList.toggle("active", isActive);
                icon.classList.toggle("far", !isActive); // Ensure it's 'far' if not active
                icon.classList.toggle("fas", isActive); // Ensure it's 'fas' if active
            }
        }
    });
}

// --- Add Listeners to Wishlist Buttons ---
function addWishlistListeners(productContainer) {
    // Use event delegation on the container for dynamically added/removed listeners
    productContainer.addEventListener('click', e => {
        const wishlistButton = e.target.closest(".wishlist-btn");
        if (!wishlistButton) return; // Exit if the click wasn't on a wishlist button

        e.preventDefault();
        e.stopPropagation();

        const card = wishlistButton.closest('.product-card');
        const productId = card?.getAttribute('data-product-id');
        if (!productId) return;

        // Find product in initial search results to ensure we have original data
        const product = initialSearchResults.find(p => p.id === productId);
        if (!product) {
            console.error("Product details not found in initial search results for wishlist:", productId);
            return;
        }

        const currentPriceText = card.querySelector('.product-price')?.textContent || ''; // Get displayed price

        // Pass displayed price to updateWishlist
        const productData = {
            id: product.id,
            name: product.name,
            price: currentPriceText, // Pass displayed price
            image: card.querySelector('img')?.src || product.image
        };

        const isAdding = !wishlistButton.classList.contains('active');
        wishlistButton.classList.toggle('active');
        const icon = wishlistButton.querySelector('i');
        if (icon) {
            icon.classList.toggle('far', !isAdding);
            icon.classList.toggle('fas', isAdding);
        }
        updateWishlist(productData, isAdding); // updateWishlist handles conversion back to INR for storage
    });
}


// --- Accordion Setup ---
function setupAccordionListeners(containerElement) {
    containerElement.querySelectorAll(".filter-header").forEach((header) => {
        // Clone and replace to prevent duplicate listeners if called multiple times
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener("click", () => {
            const item = newHeader.closest(".filter-accordion-item");
            const content = item?.querySelector(".filter-content");
            if (!item || !content) return;

            const wasOpen = item.classList.contains("open");
            item.classList.toggle("open", !wasOpen);

            // Animate height toggle
            if (!wasOpen) {
                // Set max-height to scrollHeight to animate open
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                // Set max-height to null/0 to animate closed
                content.style.maxHeight = null;
            }
        });
    });
}

// Ensure initially open accordions have correct max-height for animation
function initializeOpenAccordions(containerElement) {
    containerElement.querySelectorAll(".filter-accordion-item.open").forEach((item) => {
        const content = item.querySelector(".filter-content");
        if (content) {
            // Set initial max-height to content's scroll height if open
            // Use timeout to ensure scrollHeight is calculated correctly after potential layout shifts
            setTimeout(() => {
                if (item.classList.contains("open")) { // Double check it's still open
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }, 0);
        }
    });
}

// --- Render Products Function ---
function renderProducts(productsToRender) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.innerHTML = ""; // Clear previous results
    const currentRegion = getSelectedRegion(); // Assumes global
    currentRenderedProducts = productsToRender; // Update the list of currently shown products

    if (productsToRender.length === 0) {
        grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i><p>No products match your search or filters.</p></div>`;
        return;
    }

    productsToRender.forEach((product) => {
        // Convert INR price from catalog to the target currency for display
        const priceConverted = convertInrToTargetCurrency(product.price, currentRegion); // Assumes global
        const formattedPrice = formatCurrency(priceConverted, currentRegion); // Assumes global

        const cardHTML = `
                  <article class="product-card" data-product-id="${product.id}" data-price="${priceConverted.toFixed(2)}" data-category="${product.category || ''}" data-color="${product.color || ''}">
                      <a href="/product/${product.id}?img=${encodeURIComponent(product.image)}">
                      <div class="product-image-container">
                          <img src="${product.image}" alt="${product.name}" loading="lazy"/>
                          <button class="wishlist-btn" aria-label="Add to wishlist"><i class="far fa-heart"></i></button>
                      </div>
                      <div class="product-info">
                          <h3 class="product-name">${product.name}</h3>
                          <p class="product-price">${formattedPrice}</p>
                      </div>
                      </a>
                  </article>`;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });

    initializeWishlistHearts(grid);
    // Listeners are now added via delegation in DOMContentLoaded
}

// --- ****** START MODIFICATION ****** ---
// This is the modified function to fix the filter bug.
function gatherFilters(containerSelector) {
    const selectedFilters = { price: [], category: [], color: [] }; // Defined *inside* the function

    document.querySelectorAll(`${containerSelector} input[type="checkbox"]:checked`).forEach(cb => {
        let filterName = cb.name;
        let filterValue = cb.value;

        // This block catches category filters that are missing 'name="category"'
        // and assumes their 'name' (like 'indowestern') is the 'value'.
        if (!filterValue && filterName !== 'price' && filterName !== 'color' && filterName !== 'category') {
            filterValue = filterName; // Use the name (e.g., 'indowestern') as the value
            filterName = 'category';  // Force the name to be 'category'
        }

        if (selectedFilters[filterName]) {
            if (!selectedFilters[filterName].includes(filterValue)) {
                selectedFilters[filterName].push(filterValue);
            }
        }
    });
    return selectedFilters;
}
// --- ****** END MODIFICATION ****** ---


// --- Apply Sidebar Filters and Sorting Logic ---
function applyFiltersAndSort() {
    const currentRegion = getSelectedRegion();

    // --- START MODIFICATION ---
    // Gather filters from *both* containers and merge them
    const desktopFilters = gatherFilters('.filter-sidebar');

    let mobileFilters = { price: [], category: [], color: [] };
    const mobileContent = document.getElementById('mobile-filter-content');
    if (mobileContent && mobileContent.innerHTML.trim() !== '') {
        mobileFilters = gatherFilters('.mobile-filter-content');
    }

    // Merge the filter arrays, avoiding duplicates
    const selectedFilters = {
        price: [...new Set([...desktopFilters.price, ...mobileFilters.price])],
        category: [...new Set([...desktopFilters.category, ...mobileFilters.category])],
        color: [...new Set([...desktopFilters.color, ...mobileFilters.color])]
    };
    // --- END MODIFICATION ---



    // Start with the initial search results
    let filteredResults = [...initialSearchResults];

    // Apply Price Filters (using CAD ranges on converted prices)
    if (selectedFilters.price.length > 0) {
        filteredResults = filteredResults.filter(p => {
            const priceConverted = convertInrToTargetCurrency(p.price, currentRegion);
            return selectedFilters.price.some(rangeKey => {
                const range = CAD_PRICE_RANGES[rangeKey];
                return range && priceConverted >= range.min && priceConverted <= range.max;
            });
        });
    }
    // Apply Category Filters
    //   if (selectedFilters.category.length > 0) {
    //       filteredResults = filteredResults.filter(p => selectedFilters.category.includes(p.category || ''));
    //   }

    // ✅ Category Filter — same logic as Women's page
    if (selectedFilters.category.length > 0) {
        const selectedNormalized = selectedFilters.category.map(c =>
            c.toLowerCase().replace(/s$/, "").trim()
        );

        filteredResults = filteredResults.filter(p => {
            const productKeywords = [
                (p.name || "").toLowerCase(),
                (p.category || "").toLowerCase(),
                // (p.description || "").toLowerCase(),
                // (p.tags || "").toLowerCase()
            ].join(" ");

            return selectedNormalized.some(cat =>
                productKeywords.includes(cat)
            );
        });
    }


    // Apply Color Filters
    if (selectedFilters.color.length > 0) {
        filteredResults = filteredResults.filter(p => selectedFilters.color.includes(p.color || ''));
    }
    // Add other filters (Fabric, Work, Size) here if implemented

    // Apply Sorting
    const sortValue = document.getElementById('desktop-sort-select')?.value || document.getElementById('mobile-sort-select')?.value || 'relevance';

    if (sortValue === 'price_asc') {
        filteredResults.sort((a, b) => convertInrToTargetCurrency(a.price, currentRegion) - convertInrToTargetCurrency(a.price, currentRegion));
    } else if (sortValue === 'price_desc') {
        filteredResults.sort((a, b) => convertInrToTargetCurrency(b.price, currentRegion) - convertInrToTargetCurrency(a.price, currentRegion));
    } else if (sortValue === 'newest') {
        // Requires date data on products - not implemented here
    }
    // 'relevance' (default) - uses the order from the initial search filter

    renderProducts(filteredResults); // Re-render the grid with filtered and sorted products
}

// --- Update Price Filter Labels ---
function updateFilterPriceLabels() {
    const currentRegion = getSelectedRegion();
    const updateLabels = (containerSelector) => {
        document.querySelectorAll(`${containerSelector} input[name="price"]`).forEach(input => {
            const label = input.closest('label');
            if (!label) return;
            const rangeKey = input.value;
            const range = CAD_PRICE_RANGES[rangeKey];
            let labelText = '';

            if (range) {
                if (range.max === Infinity) { labelText = ` Over ${formatCurrency(range.min - 0.01, currentRegion)}`; }
                else if (range.min === 0) { labelText = ` Under ${formatCurrency(range.max + 0.01, currentRegion)}`; }
                else { labelText = ` ${formatCurrency(range.min, currentRegion)} - ${formatCurrency(range.max, currentRegion)}`; }
                // Reconstruct label content preserving the input checkbox
                label.textContent = ''; // Clear existing text
                label.appendChild(input); // Re-add checkbox
                label.appendChild(document.createTextNode(labelText)); // Add new text
            }
        });
    };
    updateLabels('.filter-sidebar');
    const mobileContent = document.getElementById('mobile-filter-content');
    if (mobileContent && mobileContent.innerHTML.trim() !== '') { updateLabels('.mobile-filter-content'); }
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener("DOMContentLoaded", async () => {

    await loadAllProducts();

    setupRegionFlagAndListeners();
    setupMobileMenuToggle();
    setupProfileDropdown();
    setupSearchFunctionality();

    updateCartCount();
    updateWishlistCount();

    // Listen for user identification (from header load)
    document.addEventListener('userIdentified', () => {
        console.log("Search Page: User identified, refreshing header counts...");
        updateCartCount();
        updateWishlistCount();
    });

    const mobileFilterOverlay = document.getElementById('mobile-filter-overlay');
    const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
    const mobileFilterContent = document.getElementById('mobile-filter-content');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const mobileFilterTriggerBtn = document.getElementById('mobile-filter-trigger');
    const originalFilterSidebar = document.querySelector('.filter-sidebar');
    const mobileSortSelect = document.getElementById('mobile-sort-select');
    const desktopSortSelect = document.getElementById('desktop-sort-select');

    // --- Initial Search Results Rendering ---
    const urlParams = new URLSearchParams(window.location.search);
    // Support both 'q' (standard) and 'query' (legacy)
    const query = urlParams.get('q') || urlParams.get('query') || "";
    const resultsHeader = document.getElementById("results-header");

    if (resultsHeader) {
        resultsHeader.innerHTML = `<h2 style="font-size:15px;justify-content:"left"">Search Results for: <span>"${query || 'All Products'}"</span></h2>`;
    }

    if (query) {
        const qLower = query.toLowerCase();
        initialSearchResults = originalAllProductsINR.filter(p => {
            const nameMatch = (p.name || "").toLowerCase().includes(qLower);
            const subCatMatch = (p.sub_category || "").toLowerCase().includes(qLower);
            const catMatch = (p.category || "").toLowerCase().includes(qLower);
            const tagsMatch = (p.tags || "").toLowerCase().includes(qLower);
            return nameMatch || subCatMatch || catMatch || tagsMatch;
        });
    } else {
        initialSearchResults = [...originalAllProductsINR];
    }

    renderProducts(initialSearchResults);
    updateFilterPriceLabels();

    // --- Add Wishlist Listeners via Delegation ---
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        addWishlistListeners(productGrid);
    }


    // --- Mobile Filter Drawer Logic ---
    if (mobileFilterTriggerBtn && mobileFilterOverlay && mobileFilterDrawer && closeFilterBtn && applyFiltersBtn && originalFilterSidebar && mobileFilterContent) {

        function setupMobileFilters() {
            if (mobileFilterContent.children.length === 0) {
                const clonedSidebarContent = originalFilterSidebar.cloneNode(true);

                clonedSidebarContent.style.display = 'block';
                mobileFilterContent.appendChild(clonedSidebarContent);
                setupAccordionListeners(mobileFilterContent);
                initializeOpenAccordions(mobileFilterContent);
                updateFilterPriceLabels();
            }
        }

        mobileFilterTriggerBtn.addEventListener('click', () => {
            setupMobileFilters();
            mobileFilterOverlay.classList.add('active');
            mobileFilterDrawer.classList.add('active');
            initializeOpenAccordions(mobileFilterContent);
        });

        closeFilterBtn.addEventListener('click', () => {
            mobileFilterOverlay.classList.remove('active');
            mobileFilterDrawer.classList.remove('active');
        });

        mobileFilterOverlay.addEventListener('click', (e) => {
            if (e.target === mobileFilterOverlay) {
                mobileFilterOverlay.classList.remove('active');
                mobileFilterDrawer.classList.remove('active');
            }
        });

        applyFiltersBtn.addEventListener('click', () => {
            applyFiltersAndSort();
            mobileFilterOverlay.classList.remove('active');
            mobileFilterDrawer.classList.remove('active');
        });

    } else { console.warn("Mobile filter elements missing or incomplete."); }

    // --- Desktop Filter Logic ---
    if (originalFilterSidebar) {
        setupAccordionListeners(originalFilterSidebar);
        initializeOpenAccordions(originalFilterSidebar);

        originalFilterSidebar.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', applyFiltersAndSort);
        });
    }

    // --- Sort Logic ---
    if (mobileSortSelect) mobileSortSelect.addEventListener('change', applyFiltersAndSort);
    if (desktopSortSelect) desktopSortSelect.addEventListener('change', applyFiltersAndSort);

    // --- Listen for region changes dispatched by the header script ---
    document.addEventListener('regionChanged', () => {
        console.log("Region change detected in search.js");
        applyFiltersAndSort();
        updateFilterPriceLabels();
    });

    // --- Review Modal --- 
    const reviewsLink = document.getElementById('footer-reviews-link');
    const reviewsModalOverlay = document.getElementById('reviews-modal-overlay');
    const closeReviewsModalBtn = document.getElementById('close-reviews-modal');
    if (reviewsLink && reviewsModalOverlay && closeReviewsModalBtn) {

        // This is a placeholder as the full review display logic is in index.js
        // You might need to copy loadAndDisplayReviewsLocal from index.js if it's not globally available
        if (typeof loadAndDisplayReviewsLocal === 'function') {
            reviewsLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadAndDisplayReviewsLocal();
                reviewsModalOverlay.classList.add('active');
            });
            closeReviewsModalBtn.addEventListener('click', () => reviewsModalOverlay.classList.remove('active'));
            reviewsModalOverlay.addEventListener('click', (e) => {
                if (e.target === reviewsModalOverlay) reviewsModalOverlay.classList.remove('active');
            });
        } else {
            // Fallback if the function isn't available
            reviewsLink.addEventListener('click', (e) => {
                e.preventDefault();
                alert("Review modal function not found. Ensure index.js is loaded or copy functions.");
            });
            console.warn("Review modal function 'loadAndDisplayReviewsLocal' not found.");
        }
    } else {
        console.warn("Review modal elements missing for footer link.");
    }

}); // End DOMContentLoaded