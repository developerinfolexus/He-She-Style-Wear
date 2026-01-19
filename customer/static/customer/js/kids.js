

// --- Price Range Mapping (CAD - Kids Specific) ---
const CAD_PRICE_RANGES = {
    under_16: { min: 0, max: 15.99 },    // ~Under 1000 INR
    '16_40': { min: 16, max: 40 },     // ~1000-2500 INR
    over_40: { min: 40.01, max: Infinity } // ~Over 2500 INR
};



document.addEventListener("DOMContentLoaded", async () => {


    // --- Global State for Products ---
    let originalAllProductsINR = [];
    let allProducts = [];

    // (Initial fetch and mapping blocks removed to prevent double-loading. 
    // Data is now fetched via applyUrlCategoryFilterLocal -> filterAndSortProductsLocal)

    let fabricListFromDB = [];

    async function loadFabricsKids() {
        try {
            const res = await fetch("/api/kids/fabrics/");
            const data = await res.json();
            fabricListFromDB = data.fabrics || [];

            const container = document.querySelector("#fabric-filter-list");
            if (!container) return;

            container.innerHTML = "";

            fabricListFromDB.forEach(fab => {
                const displayName = fab.charAt(0).toUpperCase() + fab.slice(1);
                container.insertAdjacentHTML(
                    "beforeend",
                    `<li><label><input type="checkbox" name="fabric" value="${fab}"> ${displayName}</label></li>`
                );
            });

            // Bind fabric checkbox events
            document.querySelectorAll('input[name="fabric"]').forEach(cb => {
                cb.addEventListener("change", filterAndSortProductsLocal);
            });

        } catch (err) {
            console.error("Kids Fabric Load Failed", err);
        }
    }

    // ✅ call function
    await loadFabricsKids();


    // --- Helper Functions (Storage Access - Scoped) ---
    function getWishlistLocal() { return getWishlist(); } // Use global getter
    function getReviewsLocal() { return getReviews(); } // Use global getter

    // --- Wishlist Update (Scoped) ---
    function updateWishlistLocal(productData, isAdding) {
        let list = getWishlistLocal();
        const currentRegion = getSelectedRegion();
        const priceInr = convertDisplayedToInr(productData.price, currentRegion); // Use global converter
        const itemToStore = { ...productData, price: priceInr.toString() };

        if (isAdding) { if (!list.some(item => item.id === itemToStore.id)) { list.push(itemToStore); } }
        else { list = list.filter(item => item.id !== itemToStore.id); }
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
        updateWishlistCount(); // Call global count update function
    }

    // --- Initialize Wishlist Hearts (Scoped) ---
    function initializeWishlistHeartsLocal() {
        const wishlistedIds = getWishlistLocal().map((item) => item.id);
        document.querySelectorAll("#product-grid .product-card").forEach((card) => {
            const productId = card.getAttribute("data-product-id");
            const button = card.querySelector(".wishlist-btn");
            if (button) {
                const icon = button.querySelector("i");
                if (icon) {
                    const isActive = wishlistedIds.includes(productId);
                    button.classList.toggle("active", isActive);
                    icon.classList.toggle("far", !isActive); icon.classList.toggle("fas", isActive);
                }
            }
        });
    }


    // --- Load Kids Subcategories from Database ---
    async function loadKidsSubcategories() {
        try {
            const res = await fetch("/api/kids/subcategories/");
            const data = await res.json();

            // Find the sub-categories filter section by finding accordions with "Sub Categories" in their header text
            let subcatContainer = null;
            const filterItems = document.querySelectorAll(".filter-sidebar .filter-accordion-item");

            for (let item of filterItems) {
                const header = item.querySelector(".filter-header");
                if (header && header.textContent.includes("Sub Categories")) {
                    const contentUl = item.querySelector(".filter-content ul");
                    if (contentUl) {
                        subcatContainer = contentUl;
                        break;
                    }
                }
            }

            if (subcatContainer && data.subcategories && data.subcategories.length > 0) {
                subcatContainer.innerHTML = "";

                data.subcategories.forEach(sub => {
                    subcatContainer.insertAdjacentHTML(
                        "beforeend",
                        `<li><label><input type="checkbox" name="category" value="${sub.toLowerCase()}" /> ${sub}</label></li>`
                    );
                });

                // Bind category checkbox events
                document.querySelectorAll('input[name="category"]').forEach(cb => {
                    cb.addEventListener("change", filterAndSortProductsLocal);
                });
            }

        } catch (err) {
            console.error("Kids subcategory load failed:", err);
        }
    }

    // Call it
    await loadKidsSubcategories();

    // --- Filter Products Logic (Scoped) ---
    async function filterAndSortProductsLocal() {
        const currentRegion = getSelectedRegion();

        let selectedCategories = [];
        let selectedFabrics = [];
        let selectedPriceRanges = [];
        let minPrice = -Infinity, maxPrice = Infinity;

        const searchQuery = (document.getElementById("product-search-input")?.value || "")
            .trim().toLowerCase();

        function readFilters(selector) {
            document.querySelectorAll(`${selector} input[name="category"]:checked`)
                .forEach(cb => selectedCategories.push(cb.value.toLowerCase()));

            document.querySelectorAll(`${selector} input[name="fabric"]:checked`)
                .forEach(cb => selectedFabrics.push(cb.value.toLowerCase()));

            document.querySelectorAll(`${selector} input[name="price_range"]:checked`)
                .forEach(cb => selectedPriceRanges.push(cb.value));

            const min = parseFloat(document.querySelector(`${selector} #price-from`)?.value);
            const max = parseFloat(document.querySelector(`${selector} #price-to`)?.value);

            if (!isNaN(min)) minPrice = Math.max(minPrice, min);
            if (!isNaN(max)) maxPrice = Math.min(maxPrice, max);
        }

        // ... (inside filterAndSortProductsLocal) ...
        readFilters(".filter-sidebar");
        if (document.getElementById("mobile-filter-content")?.innerHTML.trim() !== "") {
            readFilters(".mobile-filter-content");
        }

        if (minPrice > maxPrice) maxPrice = Infinity;

        // --- NEW: Toggle Main Banner Visibility ---
        const mainBanner = document.querySelector(".main-banner-carousel");
        const hasFilters = selectedCategories.length > 0 || selectedFabrics.length > 0 || searchQuery || selectedPriceRanges.length > 0;

        if (mainBanner) {
            mainBanner.style.display = hasFilters ? "none" : "block";
        }
        // ------------------------------------------
        const grid = document.getElementById("product-grid");
        if (grid) {
            grid.classList.add("products-hidden");
        }
        // Build API URL with filters
        let apiUrl = '/api/products/?gender=kids';

        // Add subcategory filters
        if (selectedCategories.length > 0) {
            apiUrl += '&' + selectedCategories.map(cat => `subcategory=${encodeURIComponent(cat)}`).join('&');
        }

        // Add fabric filters
        if (selectedFabrics.length > 0) {
            apiUrl += '&' + selectedFabrics.map(fab => `fabric=${encodeURIComponent(fab)}`).join('&');
        }

        // Fetch filtered products from backend
        // Fetch filtered products from backend
        let filteredProducts = [];
        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    // First, map to our internal format (INR base)
                    originalAllProductsINR = data.products.map(product => ({
                        id: product.id,
                        name: product.name,
                        price: parseFloat(product.price).toString(),
                        discount_price: (product.discount_price && parseFloat(product.discount_price) > 0) ? parseFloat(product.discount_price).toString() : null,
                        image: product.image || '/static/customer/images/placeholder.jpg',
                        category: product.category || '',
                        fabric: product.fabric || '',
                        sub_category: product.sub_category || '',
                        tags: product.tags || '',
                        description: product.description || '',
                        color: '', // Add if available
                        size: ''   // Add if available
                    }));

                    // Then update allProducts with currency conversions
                    allProducts = originalAllProductsINR.map(product => ({
                        ...product,
                        regularPriceConverted: convertInrToTargetCurrency(product.price, currentRegion),
                        discountPriceConverted: product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : null,
                        priceConverted: product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : convertInrToTargetCurrency(product.price, currentRegion)
                    }));

                    filteredProducts = allProducts;
                }
            }
        } catch (error) {
            console.error('Error fetching filtered products:', error);
            // On error, filteredProducts remains empty array
        }

        // Apply client-side filters (price ranges and search)
        let finalProducts = filteredProducts.filter(p => {
            const price = p.priceConverted || 0;

            // 🔍 Search match
            if (searchQuery) {
                const textPool = [
                    (p.name || "").toLowerCase(),
                    (p.category || "").toLowerCase(),
                    (p.description || "").toLowerCase(),
                    (p.tags || "").toLowerCase()
                ].join(" ");
                if (!textPool.includes(searchQuery)) return false;
            }

            // 💰 custom price input match
            if (!(price >= minPrice && price <= maxPrice)) return false;

            // 💰 checkbox price ranges match
            if (selectedPriceRanges.length > 0) {
                const priceMatch = selectedPriceRanges.some(r => {
                    const R = CAD_PRICE_RANGES[r];
                    return R && price >= R.min && price <= R.max;
                });
                if (!priceMatch) return false;
            }

            return true;
        });

        // ✅ Sorting
        const sortValue =
            document.getElementById("desktop-sort-select")?.value ||
            document.getElementById("mobile-sort-select")?.value ||
            "featured";

        if (sortValue === "price_asc") finalProducts.sort((a, b) => a.priceConverted - b.priceConverted);
        if (sortValue === "price_desc") finalProducts.sort((a, b) => b.priceConverted - a.priceConverted);

        window.filteredKidsProducts = finalProducts;
        renderProductGridLocal(finalProducts);
    }
    // --- Render Product Grid (Scoped) ---
    function renderProductGridLocal(productsToRender) {
        const grid = document.getElementById("product-grid");
        if (!grid) return;
        grid.innerHTML = "";
        const currentRegion = getSelectedRegion();

        if (productsToRender.length === 0) { grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px;">No products match your filters.</p>'; return; }

        productsToRender.forEach(product => {
            const regularPriceConverted = convertInrToTargetCurrency(product.price, currentRegion);
            const discountPriceConverted = product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : null;
            const hasDiscount = product.discount_price && parseFloat(product.discount_price) > 0;

            // Display regular price, with discount price shown if available
            const displayPrice = hasDiscount ? discountPriceConverted : regularPriceConverted;
            const formattedPrice = formatCurrency(displayPrice, currentRegion);
            const formattedRegularPrice = formatCurrency(regularPriceConverted, currentRegion);

            const cardHTML = `
                 <article class="product-card" data-product-id="${product.id}" data-category="${product.category || ''}" data-color="${product.color || ''}" data-price="${displayPrice.toFixed(2)}" data-fabric="${product.fabric || ''}" data-size="${product.size || ''}">
                     <a href="/product/${product.id}?img=${encodeURIComponent(product.image)}"> 
                         <div class="product-image-container">
                             <img src="${product.image}" alt="${product.name}" />
                             <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                         </div>
                         <div class="product-info">
                             <h3 class="product-name">${product.name}</h3>
                             <p class="product-price">
                                 ${hasDiscount ? `<span class="original-price" style="text-decoration: line-through; color: #999; margin-right: 8px;">${formattedRegularPrice}</span>` : ''}
                                 <span class="current-price">${formattedPrice}</span>
                             </p>
                         </div>
                     </a>
                 </article>`;
            grid.insertAdjacentHTML('beforeend', cardHTML);
        });

        initializeWishlistHeartsLocal(); // Call scoped init
        initializeProductCardClicksLocal();
        grid.classList.remove("products-hidden");// Call scoped init
    }


    // --- Handle Product Card Clicks (Scoped) ---
    function initializeProductCardClicksLocal() {
        const grid = document.getElementById("product-grid");
        if (!grid) return;

        // Use event delegation
        const handleGridClick = (e) => {
            const wishlistButton = e.target.closest(".wishlist-btn");
            const card = e.target.closest(".product-card");
            const productId = card?.getAttribute("data-product-id");

            if (wishlistButton && card && productId) {
                e.preventDefault(); e.stopPropagation();
                const currentPriceText = card.querySelector(".product-price")?.textContent || '';
                const productData = { id: productId, name: card.querySelector(".product-name")?.textContent || '', price: currentPriceText, image: card.querySelector("img")?.src || '' };
                const isAdding = !wishlistButton.classList.contains("active");
                wishlistButton.classList.toggle("active");
                const icon = wishlistButton.querySelector("i");
                if (icon) { icon.classList.toggle("far", !isAdding); icon.classList.toggle("fas", isAdding); }
                updateWishlistLocal(productData, isAdding); // Use scoped version
            }
            // Let browser handle clicks on <a> for navigation
        };

        // Remove old listener before adding
        grid.removeEventListener('click', handleGridClick);
        grid.addEventListener('click', handleGridClick);
    }

    // --- REMOVED Search Functionality Setup ---
    // function setupSearchFunctionality() { ... }
    // function updateSearchPopupPrices() { ... }

    // --- Accordion Setup (Scoped) ---
    // --- MODIFICATION START ---
    // This function now handles the expand/collapse animation correctly.
    function setupAccordionListenersLocal(containerElement) {
        containerElement.querySelectorAll(".filter-header").forEach(header => {
            // Clone and replace to avoid multiple listeners if this is called more than once
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);

            newHeader.addEventListener("click", () => {
                const item = newHeader.closest(".filter-accordion-item");
                const content = item?.querySelector(".filter-content");
                if (!item || !content) return;

                const wasOpen = item.classList.contains("open");
                item.classList.toggle("open", !wasOpen); // Toggle the class

                if (wasOpen) {
                    // It WAS open, so CLOSE it
                    content.style.maxHeight = null; // Set to null to collapse
                } else {
                    // It WAS closed, so OPEN it
                    // Set max-height to its scrollHeight to animate open
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });
    }

    // This function ensures items marked 'open' in HTML are correctly expanded on load.
    function initializeOpenAccordionsLocal(containerElement) {
        containerElement.querySelectorAll(".filter-accordion-item.open").forEach(item => {
            const content = item.querySelector(".filter-content");
            if (content) {
                // Set max-height to its full scroll height so it's visibly open
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
    // --- MODIFICATION END ---


    // --- Review Modal Helpers (Scoped) ---
    function generateStaticRatingHTMLLocal(rating) { /* ... (keep logic as before) ... */
        const f = '<i class="fas fa-star"></i>', h = '<i class="fas fa-star-half-alt"></i>', e = '<i class="far fa-star"></i>'; let s = ''; const r = Math.round(((typeof rating === 'number' && !isNaN(rating)) ? rating : 0) * 2) / 2; for (let i = 1; i <= 5; i++) { s += (r >= i) ? f : (r >= i - 0.5) ? h : e; } return s;
    }
    function loadAndDisplayReviewsLocal() { /* ... (keep logic as before, using global getReviews, generateStaticRatingHTMLLocal) ... */
        const g = document.querySelector('#reviews-modal-overlay .reviews-grid'); if (!g) return; const r = getReviews(); g.innerHTML = ''; if (r.length === 0) g.innerHTML = '<p class="no-reviews-message" style="grid-column: 1 / -1; text-align: center;">No reviews yet.</p>'; else { r.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).forEach(w => { let i = ''; if (w.images?.length > 0) { i = '<div class="review-images">'; w.images.forEach(u => { if (typeof u === 'string' && (u.startsWith('data:image') || u.match(/\.(jpe?g|gif|png|webp)$/i))) i += `<img src="${u}" alt="Review" style="width:50px;height:50px;object-fit:cover;margin-right:5px;border-radius:4px;">`; }); i += '</div>'; } const m = `<img src="${w.userImage || 'https://via.placeholder.com/40/ccc/808?text=U'}" alt="User" class="review-user-image">`; let d = 'Date unknown'; try { if (w.date) d = new Date(w.date).toLocaleDateString(); } catch (e) { } const pN = w.productId ? `<a href="/product/${w.productId}?img=" class="review-product-link">${w.productName || 'Unknown'}</a>` : (w.productName || 'Unknown'); g.insertAdjacentHTML('beforeend', `<div class="review-card dynamic-review"><div class="review-card-header">${m}<div class="review-author-details"><span class="review-author">${w.author || 'Anon'}</span><span class="review-user-id">(ID: ${w.userId || 'N/A'})</span></div></div><div class="review-rating">${generateStaticRatingHTMLLocal(w.rating)}</div><p class="review-text">"${w.comment}"</p>${i}<p class="review-product-name" style="font-size:0.8rem;color:#777;margin-top:8px;text-align:right;">Product: ${pN}</p><p class="review-date">${d}</p></div>`); }); }
    }


    // --- Main Banner Carousel Logic (Scoped) ---
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


    // --- Category Circle Filters (Scoped) ---
    function setupCategoryCircleFiltersLocal() {
        const circleContainer = document.querySelector('.category-circles-container');
        if (!circleContainer) return;

        // Use event delegation
        const handleCircleClick = (e) => {
            const link = e.target.closest('a[data-category]');
            if (!link) return;

            e.preventDefault();
            const clickedCategory = link.dataset.category;
            const isClearingFilter = link.classList.contains('active');

            // Handle visual active state update
            circleContainer.querySelectorAll('a[data-category]').forEach(a => a.classList.remove('active'));
            const targetCategory = isClearingFilter ? '' : clickedCategory;
            if (!isClearingFilter) link.classList.add('active');

            // Find and update the appropriate filter checkbox in the sidebar
            const updateCheckboxes = (selector) => {
                document.querySelectorAll(`${selector} input[name="category"]`).forEach(cb => {
                    cb.checked = (cb.value === targetCategory);
                    // Also open the accordion if needed 
                    if (cb.checked) {
                        const accordionItem = cb.closest('.filter-accordion-item');
                        // Only force open if we are setting a filter
                        if (accordionItem && !accordionItem.classList.contains('open')) {
                            accordionItem.classList.add('open');
                            // This assumes the underlying accordion logic will adjust max-height on load/render.
                        }
                    }
                });
            };
            updateCheckboxes('.filter-sidebar');
            const mobileContent = document.getElementById('mobile-filter-content');
            if (mobileContent && mobileContent.innerHTML.trim() !== '') { updateCheckboxes('.mobile-filter-content'); }

            filterAndSortProductsLocal(); // Apply filters

            // --- ADDED: Automatic smooth scroll to the products area ---
            const targetElement = document.querySelector('.product-listing');
            if (targetElement) {
                // Scroll the main content area (product-listing container) into view smoothly
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            // --- END ADDED SCROLL LOGIC ---
        };

        // Remove old listener before adding (safe delegation pattern)
        circleContainer.removeEventListener('click', handleCircleClick);
        circleContainer.addEventListener('click', handleCircleClick);
    }


    // --- URL Category Filter (Scoped) ---
    // --- URL Category Filter (Scoped) ---
    function applyUrlCategoryFilterLocal() {
        const urlParams = new URLSearchParams(window.location.search);
        // Support both 'category' and 'subcategory' params
        // Normalize: lowercase, trim, remove trailing 's' to match singular/plural
        const targetCategories = new Set([
            ...urlParams.getAll('category').map(c => c.toLowerCase().trim().replace(/s$/, "").replace(/_/g, " ")),
            ...urlParams.getAll('subcategory').map(c => c.toLowerCase().trim().replace(/s$/, "").replace(/_/g, " ")),
            ...(window.SERVER_SELECTED_SUBCATEGORIES || []).map(c => c.toLowerCase().trim().replace(/s$/, "").replace(/_/g, " "))
        ]);

        if (targetCategories.size > 0) {
            const updateFilters = () => {
                const allCheckboxes = document.querySelectorAll('.filter-sidebar input[name="category"], .mobile-filter-content input[name="category"]');
                let found = false;

                allCheckboxes.forEach(cb => {
                    // Match normalized values
                    const normalizedVal = cb.value.toLowerCase().trim().replace(/s$/, "").replace(/_/g, " ");
                    const isMatch = targetCategories.has(normalizedVal);
                    cb.checked = isMatch;
                    if (isMatch) {
                        found = true;
                        const accordionItem = cb.closest('.filter-accordion-item');
                        if (accordionItem && !accordionItem.classList.contains('open')) {
                            accordionItem.classList.add('open');
                        }
                    }
                });

                const circleContainer = document.querySelector('.category-circles-container');
                if (circleContainer) {
                    circleContainer.querySelectorAll('a[data-category]').forEach(a => a.classList.remove('active'));
                    targetCategories.forEach(cat => {
                        const activeCircle = circleContainer.querySelector(`a[data-category="${cat}"]`);
                        if (activeCircle) activeCircle.classList.add('active');
                    });
                }
                return found;
            };

            if (updateFilters()) {
                filterAndSortProductsLocal(); // Call scoped version
            } else {
                // Modified: ALWAYS fetch, even if no filters are found.
                filterAndSortProductsLocal();
            }
        } else {
            // Modified: Always fetch default set
            filterAndSortProductsLocal();
        }
    }


    // --- Update Prices on THIS Page (Scoped) ---
    function updateDisplayedPricesLocal() {
        const currentRegion = getSelectedRegion();

        // Update runtime product array first
        allProducts.forEach(prod => {
            const originalINR = originalAllProductsINR.find(p => p.id === prod.id);
            if (originalINR) {
                prod.priceConverted = convertInrToTargetCurrency(originalINR.price, currentRegion);
            }
        });

        // Re-render the grid
        renderProductGridLocal(allProducts.filter(p => p)); // Re-render with current filters applied state (or re-call filter func)

        // updateSearchPopupPrices(); // Handled globally
        updateFilterPriceLabelsLocal(); // Update filter labels
    }

    // --- Update price filter labels (Scoped) ---
    function updateFilterPriceLabelsLocal() {
        const currentRegion = getSelectedRegion();
        const updateLabels = (containerSelector) => { /* ... (keep logic as before using CAD_PRICE_RANGES[rangeKey] for kids) ... */
            document.querySelectorAll(`${containerSelector} input[name="price_range"]`).forEach(input => { const label = input.closest('label'); if (!label) return; const rangeKey = input.value, range = CAD_PRICE_RANGES[rangeKey]; let labelText = ''; if (range) { if (range.max === Infinity) labelText = ` Over ${formatCurrency(range.min - 0.01, currentRegion)}`; else if (range.min === 0) labelText = ` Under ${formatCurrency(range.max + 0.01, currentRegion)}`; else labelText = ` ${formatCurrency(range.min, currentRegion)} - ${formatCurrency(range.max, currentRegion)}`; label.textContent = ''; label.appendChild(input); label.appendChild(document.createTextNode(labelText)); } });
            const fromLabel = document.querySelector(`${containerSelector} label[for="price-from"]`); const toLabel = document.querySelector(`${containerSelector} label[for="price-to"]`); const regionSymbol = (EXCHANGE_RATES[currentRegion] || EXCHANGE_RATES['ca']).symbol; if (fromLabel) fromLabel.textContent = `From ${regionSymbol}`; if (toLabel) toLabel.textContent = `To ${regionSymbol}`;
        };
        updateLabels('.filter-sidebar');
        const mobileContent = document.getElementById('mobile-filter-content');
        if (mobileContent && mobileContent.innerHTML.trim() !== '') { updateLabels('.mobile-filter-content'); }
    }

    // --- REMOVED: Region Flag Dropdown Setup (Handled Globally) ---
    // function setupRegionFlagDropdown() { ... }

    // --- DOM Elements (Scoped) ---
    const mobileFilterOverlay = document.getElementById('mobile-filter-overlay');
    const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
    const mobileFilterContent = document.getElementById('mobile-filter-content');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const mobileFilterTriggerBtn = document.querySelector('.mobile-filter-sort button:first-child');
    const originalFilterSidebar = document.querySelector('.filter-sidebar');
    const mobileSortSelect = document.getElementById('mobile-sort-select');
    const desktopSortSelect = document.getElementById('desktop-sort-select');

    // --- Initial Page Setup ---
    updateFilterPriceLabelsLocal(); // Initial labels based on region
    setupMainBannerCarouselLocal(); // Setup banner carousel
    setupCategoryCircleFiltersLocal(); // <<< ADDED CALL

    // Promo Bar Animation
    const promoContainer = document.querySelector(".promo-slides");
    if (promoContainer) { const s = promoContainer.querySelectorAll(".promo-slide"); if (s.length > 1) { let c = 0; setInterval(() => { c = (c + 1) % s.length; promoContainer.style.transform = `translateX(-${c * 100}%)`; }, 3000); } }


    // --- Mobile Filter Drawer Logic ---
    if (mobileFilterTriggerBtn && mobileFilterOverlay && mobileFilterDrawer && closeFilterBtn && applyFiltersBtn && originalFilterSidebar && mobileFilterContent) {
        function setupMobileFilters() {
            if (mobileFilterContent.children.length === 0) {
                const c = originalFilterSidebar.cloneNode(true);
                c.style.display = '';
                mobileFilterContent.appendChild(c);
                setupAccordionListenersLocal(mobileFilterContent);
                initializeOpenAccordionsLocal(mobileFilterContent);
                updateFilterPriceLabelsLocal();
            }
        }

        mobileFilterTriggerBtn.addEventListener('click', () => {
            setupMobileFilters();
            mobileFilterOverlay.classList.add('active');
            mobileFilterDrawer.classList.add('active');
            initializeOpenAccordionsLocal(mobileFilterContent);

            // Sync Desktop -> Mobile values when opening
            const deskMin = document.getElementById('price-from')?.value;
            const deskMax = document.getElementById('price-to')?.value;

            const mobMin = mobileFilterContent.querySelector('#price-from');
            const mobMax = mobileFilterContent.querySelector('#price-to');

            if (mobMin) mobMin.value = deskMin || '';
            if (mobMax) mobMax.value = deskMax || '';

            // Sync checkboxes
            ['category', 'fabric', 'price_range'].forEach(name => {
                const deskCbs = document.querySelectorAll(`.filter-sidebar input[name="${name}"]:checked`);
                const vals = Array.from(deskCbs).map(cb => cb.value);
                mobileFilterContent.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
                    cb.checked = vals.includes(cb.value);
                });
            });
        });

        closeFilterBtn.addEventListener('click', () => { mobileFilterOverlay.classList.remove('active'); mobileFilterDrawer.classList.remove('active'); });

        mobileFilterOverlay.addEventListener('click', (e) => {
            if (e.target === mobileFilterOverlay) {
                mobileFilterOverlay.classList.remove('active');
                mobileFilterDrawer.classList.remove('active');
            }
        });

        applyFiltersBtn.addEventListener('click', () => {
            // SYNC Mobile -> Desktop
            const mobMin = mobileFilterContent.querySelector('#price-from')?.value;
            const mobMax = mobileFilterContent.querySelector('#price-to')?.value;

            const deskMin = document.getElementById('price-from');
            const deskMax = document.getElementById('price-to');

            if (deskMin) deskMin.value = mobMin || '';
            if (deskMax) deskMax.value = mobMax || '';

            ['category', 'fabric', 'price_range'].forEach(name => {
                const mobCbs = mobileFilterContent.querySelectorAll(`input[name="${name}"]:checked`);
                const vals = Array.from(mobCbs).map(cb => cb.value);
                document.querySelectorAll(`.filter-sidebar input[name="${name}"]`).forEach(cb => {
                    cb.checked = vals.includes(cb.value);
                });
            });

            filterAndSortProductsLocal();
            mobileFilterOverlay.classList.remove('active'); mobileFilterDrawer.classList.remove('active');
        });

    } else { console.warn("Mobile filter elements incomplete."); }

    // Filter change listeners are now set up during loadKidsSubcategories and loadFabricsKids

    // --- Desktop Filter/Sort Logic ---
    if (originalFilterSidebar) {
        setupAccordionListenersLocal(originalFilterSidebar);
        originalFilterSidebar.querySelectorAll('input[type="checkbox"], input[type="number"]').forEach(input => {
            input.addEventListener('input', filterAndSortProductsLocal);
            input.addEventListener('change', filterAndSortProductsLocal);
        });
        if (desktopSortSelect) desktopSortSelect.addEventListener('change', filterAndSortProductsLocal);
    }

    // Add price range and input listeners
    document.querySelectorAll('input[name="price_range"], #price-from, #price-to').forEach(el => {
        el.addEventListener("change", filterAndSortProductsLocal);
        el.addEventListener("input", filterAndSortProductsLocal);
    });

    // --- Mobile Sort Logic ---
    if (mobileSortSelect) mobileSortSelect.addEventListener('change', filterAndSortProductsLocal);

    // --- Apply URL Filter and Render Initial Grid ---
    applyUrlCategoryFilterLocal();
    if (originalFilterSidebar) initializeOpenAccordionsLocal(originalFilterSidebar);


    // --- Review Modal ---
    const reviewsLink = document.getElementById('footer-reviews-link');
    const reviewsModalOverlay = document.getElementById('reviews-modal-overlay');
    const closeReviewsModalBtn = document.getElementById('close-reviews-modal');
    if (reviewsLink && reviewsModalOverlay && closeReviewsModalBtn) { reviewsLink.addEventListener('click', (e) => { e.preventDefault(); loadAndDisplayReviewsLocal(); reviewsModalOverlay.classList.add('active'); }); closeReviewsModalBtn.addEventListener('click', () => reviewsModalOverlay.classList.remove('active')); reviewsModalOverlay.addEventListener('click', (e) => { if (e.target === reviewsModalOverlay) reviewsModalOverlay.classList.remove('active'); }); } else console.warn("Review modal elements missing.");

    // --- Listen for region changes dispatched by the header script ---
    document.addEventListener('regionChanged', () => {
        updateDisplayedPricesLocal(); // Update prices on THIS page's grid
        filterAndSortProductsLocal(); // Re-apply filters which might depend on converted price ranges
    });

    // --- Initial Header Count Update ---
    // Moved here to ensure they run after DOM is ready but don't rely on header being loaded yet
    updateCartCount();
    updateWishlistCount();


}); // End DOMContentLoaded


