document.addEventListener("DOMContentLoaded", async () => {
    // --- Constants ---
    const WISHLIST_KEY = "he_she_wishlist";
    const CART_KEY = "he_she_cart";
    const REVIEWS_KEY = "he_she_reviews";
    const SELECTED_REGION_KEY = "he_she_selected_region";

    let selectedFabrics = [];
    let currentActiveCategory = null;

    // --- Global State for Products ---
    let originalAllProductsINR = [];
    let allProducts = [];

    // --- Price Range Mapping (CAD) ---
    const CAD_PRICE_RANGES = {
        under_32: { min: 0, max: 31.99 },
        '32_80': { min: 32, max: 80 },
        over_80: { min: 80.01, max: Infinity }
    };

    // --- Load Subcategories Dynamically ---
    async function loadSubcategories() {
        try {
            const response = await fetch('/api/subcategories/?gender=women');
            if (response.ok) {
                const data = await response.json();
                const subcategoryList = document.getElementById('subcategories-filter-list');
                if (subcategoryList && data.subcategories && data.subcategories.length > 0) {
                    subcategoryList.innerHTML = '';

                    // Check URL params for pre-selected subcategories
                    const urlParams = new URLSearchParams(window.location.search);
                    // Support both 'category' and 'subcategory'
                    const preSelectedSubcats = [
                        ...urlParams.getAll('subcategory'),
                        ...urlParams.getAll('category'),
                        ...(window.SERVER_SELECTED_SUBCATEGORIES || [])
                    ];

                    // Normalize for comparison: lower, trim, replace underscores with space
                    // FIXED: Removed .replace(/s$/, "") which was incorrectly removing trailing 's'
                    const normalize = s => s.toLowerCase().trim().replace(/_/g, " ");
                    const preSelectedNorm = preSelectedSubcats.map(normalize);

                    data.subcategories.forEach(subcat => {
                        const li = document.createElement('li');
                        const subcatNorm = normalize(subcat);

                        // Check if normalized versions match
                        const isChecked = preSelectedNorm.includes(subcatNorm) ? 'checked' : '';

                        li.innerHTML = `<label><input type="checkbox" name="subcategory" value="${subcat}" ${isChecked}/> ${subcat}</label>`;
                        subcategoryList.appendChild(li);

                        // Note: Global listener in filter-sidebar handles changes
                    });

                }
            }
            // ✅ FIXED: Initialize category circles AFTER subcategories are loaded
            initializeCategoryCircles();
        } catch (error) {
            console.error('Error loading subcategories:', error);
        }
    }

    // Load subcategories on page load
    await loadSubcategories();
    // Load fabric options from API and populate the fabric filter list (initial)
    await loadFabrics();
    // Initial product load is now handled by applyUrlCategoryFilterLocal() at the end


    // --- Load Fabrics from API and populate fabric filter list ---
    async function loadFabrics() {
        // ... (This function remains largely same, just abbreviated for replaced content context if needed, but I will assume it's stable) ...
        // Re-implementing just enough to be sure it matches target block if I were replacing it all, 
        // but I can just target the surrounding block. 
        // Actually, the TARGET block handles loadFabrics definition too. I'll include the start of it.
        try {
            // If params were passed, use them; otherwise default to gender=women
            let url = '/api/fabrics/?gender=women';
            // allow callers to set a global `loadFabricsParams` variable or pass an argument
            // (function supports being called with a URLSearchParams object)
            if (arguments && arguments.length > 0 && arguments[0]) {
                const p = arguments[0];
                const qs = p instanceof URLSearchParams ? p.toString() : new URLSearchParams(p).toString();
                if (qs) url += '&' + qs;
            }
            const response = await fetch(url);
            if (!response.ok) return;
            const data = await response.json();
            const listEl = document.getElementById('fabric-filter-list');
            if (!listEl || !data.fabrics) return;
            listEl.innerHTML = '';
            // Data may be an array of strings or array of {name, count}
            data.fabrics.forEach(fab => {
                let val = '';
                let count = null;
                if (typeof fab === 'string') {
                    val = fab.trim();
                } else if (fab && typeof fab === 'object') {
                    val = (fab.name || '').trim();
                    count = fab.count;
                }
                if (!val) return;
                const li = document.createElement('li');
                const labelText = count != null ? `${val} (${count})` : val;
                li.innerHTML = `<label><input type="checkbox" name="fabric" value="${val}"/> ${labelText}</label>`;
                listEl.appendChild(li);
                const cb = li.querySelector('input');
                if (cb) cb.addEventListener('change', () => {
                    // Clear any active category-circle selection when filtering manually
                    currentActiveCategory = null;
                    loadProducts();
                });
                // If count is zero, disable the checkbox and ensure it's unchecked
                if (count === 0) {
                    cb.disabled = true;
                    try { cb.parentElement.classList.add('disabled'); } catch (e) { }
                    if (cb.checked) cb.checked = false;
                }
            });
        } catch (err) {
            console.error('Error loading fabrics:', err);
        }
    }

    // Initialize category-circle click handlers mapped to live DB-driven subcategories
    function initializeCategoryCircles() {
        // ... (keeping this logic requires careful text matching, easier to include it if it's small or skip if not modified)
        // The target block is huge (lines 20-204). I should provide the WHOLE content to be safe.
        const subcatInputs = Array.from(document.querySelectorAll("input[name='subcategory']"));
        const subcats = subcatInputs.map(cb => (cb.value || '').trim()).filter(Boolean);
        const normalize = s => (s || '').toLowerCase().trim();
        const tokenize = s => normalize(s).split(/[\s&,-]+/).filter(Boolean);

        document.querySelectorAll('.category-circle-item a').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = normalize(anchor.dataset.category || '');
                let matched = [];
                if (cat) {
                    const catTokens = tokenize(cat);
                    matched = subcats.filter(sc => {
                        const s = normalize(sc);
                        if (s.includes(cat)) return true;
                        const stokens = tokenize(s);
                        return catTokens.some(ct => stokens.includes(ct));
                    });
                }
                if (!matched.length && cat) {
                    matched = subcats.filter(sc => normalize(sc).includes(cat) || cat.includes(normalize(sc)));
                }

                const wasActive = anchor.classList.contains('active');
                document.querySelectorAll('.category-circle-item a.active').forEach(el => el.classList.remove('active'));
                subcatInputs.forEach(cb => cb.checked = false);

                if (!wasActive && matched.length) {
                    anchor.classList.add('active');
                    currentActiveCategory = (anchor.querySelector('p')?.textContent || anchor.dataset.category || '').trim();
                    const matchedNorm = matched.map(m => normalize(m));
                    subcatInputs.forEach(cb => {
                        const v = normalize(cb.value);
                        if (matchedNorm.some(mn => v === mn || v.includes(mn) || mn.includes(v))) cb.checked = true;
                    });
                    loadProducts();
                } else if (!wasActive && !matched.length) {
                    anchor.classList.add('active');
                    currentActiveCategory = (anchor.querySelector('p')?.textContent || anchor.dataset.category || '').trim();
                    renderProductGridLocal([]);
                } else if (wasActive) {
                    currentActiveCategory = null;
                    loadProducts();
                }
            });
        });
    }


    // --- Fetch products from Django API ---
    // --- Fetch products from Django API ---
    // (Initial fetch block removed to prevent double-loading. 
    // loadProducts() is now the single source of truth for fetching.)

    async function fetchProducts(gender) {
        const response = await fetch(`/api/products/?gender=${gender}`);
        const data = await response.json();
        return data.products; // ✅ return only the array
    }

    // Build URLSearchParams for current filter state.
    // If excludeFabric is true, fabric checkbox selections are not included (used for updating counts).
    function buildFilterParams(excludeFabric = false) {
        const params = new URLSearchParams();
        params.append('gender', 'women');

        const selectedSubCats = [...document.querySelectorAll("input[name='subcategory']:checked")].map(cb => cb.value.trim()).filter(Boolean);
        selectedSubCats.forEach(sc => params.append('subcategory', sc));

        // price
        const min = document.getElementById('price-from')?.value;
        const max = document.getElementById('price-to')?.value;
        if (min) params.append('min_price', min);
        if (max) params.append('max_price', max);

        // search
        const search = document.getElementById('product-search-input')?.value?.trim();
        if (search) params.append('search', search);

        if (!excludeFabric) {
            const selectedFabs = [...document.querySelectorAll("input[name='fabric']:checked")].map(cb => cb.value.trim()).filter(Boolean);
            selectedFabs.forEach(f => params.append('fabric', f));
        }

        return params;
    }

    // Attach change listeners to any existing fabric checkboxes (covers static HTML fallback)
    function attachFabricListeners() {
        const fabs = Array.from(document.querySelectorAll("input[name='fabric']"));
        fabs.forEach(cb => {
            // Remove existing to avoid duplicate handlers
            cb.removeEventListener('change', onFabricChangeHandler);
            cb.addEventListener('change', onFabricChangeHandler);
        });
    }

    function onFabricChangeHandler(e) {
        currentActiveCategory = null;
        // Ensure any checked fabric in static markup uses its value (trimmed)
        loadProducts();
    }


    // Function removed: duplicate and incorrect filtering logic. 
    // The correct filterWomenProductsFromDB is defined later and delegates to loadProducts().





    async function loadProducts() {
        const currentRegion = getSelectedRegion();
        const params = new URLSearchParams();
        params.append('gender', 'women');

        // SUBCATEGORIES
        const selectedSubCats = [...document.querySelectorAll("input[name='subcategory']:checked")]
            .map(cb => cb.value.trim())
            .filter(Boolean);
        selectedSubCats.forEach(sc => params.append('subcategory', sc));

        // FABRICS
        const selectedFabs = [...document.querySelectorAll("input[name='fabric']:checked")]
            .map(cb => cb.value.trim())
            .filter(Boolean);
        selectedFabs.forEach(f => params.append('fabric', f));

        // CUSTOM PRICE INPUTS
        // CUSTOM PRICE INPUTS - Client side only now
        const minVal = parseFloat(document.getElementById('price-from')?.value);
        const maxVal = parseFloat(document.getElementById('price-to')?.value);
        // We do NOT send min_price/max_price to backend anymore to avoid currency conflicts


        // SEARCH
        const search = document.getElementById("product-search-input")?.value?.trim();
        if (search) params.append('search', search);

        // SORT
        const sortVal = document.getElementById("desktop-sort-select")?.value || document.getElementById("mobile-sort-select")?.value;
        if (sortVal === "price_asc") params.append('order_by', 'price');
        else if (sortVal === "price_desc") params.append('order_by', '-price');
        else params.append('order_by', '-created_at');

        console.log('loadProducts: requesting /api/products/?' + params.toString());

        // Refresh fabric counts
        try { await loadFabrics(buildFilterParams(true)); } catch (e) { }

        // Fetch
        try {
            const grid = document.getElementById("product-grid");
            if (grid) {
                grid.classList.add("products-hidden");
            }
            const res = await fetch('/api/products/?' + params.toString());
            const data = await res.json();

            // Map to internal format
            const backendProducts = (data.products || []).map(p => ({
                id: p.id,
                name: p.name,
                price: String(p.price),
                discount_price: p.discount_price ? String(p.discount_price) : null,
                image: p.image || '/static/customer/images/placeholder.jpg',
                category: p.sub_category || p.category || '',
                tags: p.tags || '',
                description: p.description || '',
                fabric: p.fabric || '',
                color: p.colors || ''
            }));

            originalAllProductsINR = backendProducts.map(pr => ({ ...pr, price: pr.price }));

            // Convert Currency
            let processedProducts = originalAllProductsINR.map(product => ({
                ...product,
                regularPriceConverted: convertInrToTargetCurrency(product.price, currentRegion),
                discountPriceConverted: product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : null,
                priceConverted: product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : convertInrToTargetCurrency(product.price, currentRegion)
            }));

            // CLIENT-SIDE FILTER: Checkbox Price Ranges (API doesn't handle these specific ranges)
            // CLIENT-SIDE FILTER: Checkbox Price Ranges AND Custom Inputs
            const selectedPriceRanges = [...document.querySelectorAll("input[name='price_range']:checked")].map(cb => cb.value);

            // Custom Inputs
            let customMin = parseFloat(document.getElementById('price-from')?.value);
            let customMax = parseFloat(document.getElementById('price-to')?.value);
            if (isNaN(customMin)) customMin = 0;
            if (isNaN(customMax)) customMax = Infinity;
            if (customMin > customMax) customMax = Infinity; // Basic validation

            processedProducts = processedProducts.filter(p => {
                const price = p.priceConverted || 0;

                // 1. Check Custom Range
                if (price < customMin || price > customMax) return false;

                // 2. Check Checkbox Ranges (if any selected)
                // Logic: If checkboxes selected, product must match AT LEAST ONE of them.
                // If NO checkboxes selected, we don't filter by them (so we keep product).
                if (selectedPriceRanges.length > 0) {
                    const matchesCheckbox = selectedPriceRanges.some(r => {
                        const R = CAD_PRICE_RANGES[r];
                        return R && price >= R.min && price <= R.max;
                    });
                    if (!matchesCheckbox) return false;
                }

                return true;
            });

            allProducts = processedProducts;

            // Toggle Main Banner
            const mainBanner = document.querySelector(".main-banner-carousel");
            const hasFilters = selectedSubCats.length > 0 || selectedFabs.length > 0 || search || selectedPriceRanges.length > 0;
            if (mainBanner) mainBanner.style.display = hasFilters ? "none" : "block";

            renderProductGridLocal(allProducts);

        } catch (err) {
            console.error("Error loading products:", err);
            renderProductGridLocal([]);
        }
    }

    let fabricListFromDB = [];


    // New convenience function to call from listeners (instead of filterAndSortProductsLocal)
    function filterWomenProductsFromDB() {
        // When user changes checkboxes directly, clear any active category-circle selection
        currentActiveCategory = null;
        // Delegate to loadProducts() which builds the URL using checked subcategory checkboxes
        loadProducts();
    }


    // --- Convert Product List to use target currency (runtime) ---
    const initialRegion = getSelectedRegion(); // Use global getter
    // (Initial mapping block removed. loadProducts() handles this transformation now.)

    // --- Helper Functions (Storage Access - Assume defined globally) ---
    function getWishlist() { /* ... return JSON.parse(localStorage.getItem(WISHLIST_KEY)) ... */
        const stored = localStorage.getItem(WISHLIST_KEY); return stored ? JSON.parse(stored) : [];
    }
    function getCart() { /* ... return JSON.parse(localStorage.getItem(CART_KEY)) ... */
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    }
    function getReviews() { /* ... return JSON.parse(localStorage.getItem(REVIEWS_KEY)) ... */
        try { const stored = localStorage.getItem(REVIEWS_KEY); return stored ? JSON.parse(stored) : []; }
        catch (e) { console.error("Error parsing reviews:", e); localStorage.removeItem(REVIEWS_KEY); return []; }
    }
    // updateCartCount, updateWishlistCount assumed defined globally and called by header script

    // --- Wishlist Update (Scoped) ---
    function updateWishlistLocal(productData, isAdding) {
        let list = getWishlist(); // Use global getter
        const currentRegion = getSelectedRegion(); // Use global getter
        const priceInr = convertDisplayedToInr(productData.price, currentRegion); // Use global converter
        const itemToStore = { ...productData, price: priceInr.toString() };

        if (isAdding) { if (!list.some(item => item.id === itemToStore.id)) { list.push(itemToStore); } }
        else { list = list.filter(item => item.id !== itemToStore.id); }
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
        updateWishlistCount(); // Call global count update function
    }

    // --- Initialize Wishlist Hearts (Scoped) ---
    function initializeWishlistHeartsLocal() {
        const wishlistedIds = getWishlist().map((item) => item.id); // Use global getter
        document.querySelectorAll("#product-grid .product-card").forEach((card) => { // Target only this page's grid
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




    function filterAndSortProductsLocal() {
        // Delegate to loadProducts which handles API fetching and client-side range filtering
        loadProducts();
    }



    // --- Render Product Grid (Scoped) ---
    function renderProductGridLocal(productsToRender) {
        const grid = document.getElementById("product-grid");
        if (!grid) return;
        grid.innerHTML = "";
        const currentRegion = getSelectedRegion(); // Use global getter

        if (productsToRender.length === 0) {
            const msg = currentActiveCategory ? `No products available for ${currentActiveCategory}.` : 'No products match your filters.';
            grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #888; padding: 40px;">${msg}</p>`;
            return;
        }

        productsToRender.forEach(product => {
            const regularPriceConverted = convertInrToTargetCurrency(product.price, currentRegion);
            const discountPriceConverted = product.discount_price ? convertInrToTargetCurrency(product.discount_price, currentRegion) : null;
            const hasDiscount = product.discount_price && parseFloat(product.discount_price) > 0;

            // Display regular price, with discount price shown if available
            const displayPrice = hasDiscount ? discountPriceConverted : regularPriceConverted;
            const formattedPrice = formatCurrency(displayPrice, currentRegion);
            const formattedRegularPrice = formatCurrency(regularPriceConverted, currentRegion);

            // We use product.tags here to populate data-attributes, but fallback to category/color/fabric
            // This assumes your filter logic is primary.
            const category = (product.category || product.tags || "").toLowerCase();
            const color = (product.color || product.tags || "").toLowerCase(); // Will get color from tags
            const fabric = (product.fabric || product.tags || "").toLowerCase(); // Will get fabric from tags

            const cardHTML = `
                 <article class="product-card" data-product-id="${product.id}" data-category="${category}" data-color="${color}" data-price="${displayPrice.toFixed(2)}" data-fabric="${fabric}">
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
        grid.classList.remove("products-hidden"); // Call scoped init
    }


    // --- Handle Product Card Clicks (Scoped) ---
    function initializeProductCardClicksLocal() {
        const grid = document.getElementById("product-grid");
        if (!grid) return;

        // Use event delegation on the grid
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
            // Let the browser handle clicks on the <a> tag for navigation
        };

        // Remove old listener before adding new one
        grid.removeEventListener('click', handleGridClick);
        grid.addEventListener('click', handleGridClick);
    }


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
                    content.style.maxHeight = null;
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




    // --- Category Circle Filters (Scoped) ---
    function setupCategoryCircleFiltersLocal() {
        const circleContainer = document.querySelector('.category-circles-container');
        if (!circleContainer) return;

        // Use event delegation
        const handleCircleClick = (e) => {
            const link = e.target.closest('a[data-category]'); if (!link) return;
            e.preventDefault();
            const clickedCategory = link.dataset.category;
            const isClearingFilter = link.classList.contains('active');
            circleContainer.querySelectorAll('a[data-category]').forEach(a => a.classList.remove('active'));
            const targetCategory = isClearingFilter ? '' : clickedCategory;
            if (!isClearingFilter) link.classList.add('active');

            // ✅ Updated: Changed from 'category' to 'subcategory'
            const updateCheckboxes = (selector) => { document.querySelectorAll(`${selector} input[name="subcategory"]`).forEach(cb => { cb.checked = (cb.value === targetCategory); }); };
            updateCheckboxes('.filter-sidebar');
            const mobileContent = document.getElementById('mobile-filter-content');
            if (mobileContent && mobileContent.innerHTML.trim() !== '') updateCheckboxes('.mobile-filter-content');

            filterAndSortProductsLocal();


            // --- ADDED: Automatic smooth scroll to the products area ---
            const targetElement = document.querySelector('.product-listing');
            if (targetElement) {
                // Scroll the main content area (product-listing container) into view smoothly
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
            // --- END ADDED SCROLL LOGIC ---
        };

        // Remove old listener before adding
        circleContainer.removeEventListener('click', handleCircleClick);
        circleContainer.addEventListener('click', handleCircleClick);
    }


    // --- Review Modal Helpers (Scoped) ---
    function generateStaticRatingHTMLLocal(rating) { /* ... (keep logic as before) ... */
        const f = '<i class="fas fa-star"></i>', h = '<i class="fas fa-star-half-alt"></i>', e = '<i class="far fa-star"></i>'; let s = ''; const r = Math.round(((typeof rating === 'number' && !isNaN(rating)) ? rating : 0) * 2) / 2; for (let i = 1; i <= 5; i++) { s += (r >= i) ? f : (r >= i - 0.5) ? h : e; } return s;
    }
    function loadAndDisplayReviewsLocal() { /* ... (keep logic as before, using global getReviews, generateStaticRatingHTMLLocal) ... */
        const g = document.querySelector('#reviews-modal-overlay .reviews-grid'); if (!g) return; const r = getReviews(); g.innerHTML = ''; if (r.length === 0) g.innerHTML = '<p class="no-reviews-message" style="grid-column: 1 / -1; text-align: center;">No reviews yet.</p>'; else { r.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).forEach(w => { let i = ''; if (w.images?.length > 0) { i = '<div class="review-images">'; w.images.forEach(u => { if (typeof u === 'string' && (u.startsWith('data:image') || u.match(/\.(jpe?g|gif|png|webp)$/i))) i += `<img src="${u}" alt="Review" style="width:50px;height:50px;object-fit:cover;margin-right:5px;border-radius:4px;">`; }); i += '</div>'; } const m = `<img src="${w.userImage || 'https://via.placeholder.com/40/ccc/808?text=U'}" alt="User" class="review-user-image">`; let d = 'Date unknown'; try { if (w.date) d = new Date(w.date).toLocaleDateString(); } catch (e) { } const pN = w.productId ? `<a href="/product/${w.productId}?" class="review-product-link">${w.productName || 'Unknown'}</a>` : (w.productName || 'Unknown'); g.insertAdjacentHTML('beforeend', `<div class="review-card dynamic-review"><div class="review-card-header">${m}<div class="review-author-details"><span class="review-author">${w.author || 'Anon'}</span><span class="review-user-id">(ID: ${w.userId || 'N/A'})</span></div></div><div class="review-rating">${generateStaticRatingHTMLLocal(w.rating)}</div><p class="review-text">"${w.comment}"</p>${i}<p class="review-product-name" style="font-size:0.8rem;color:#777;margin-top:8px;text-align:right;">Product: ${pN}</p><p class="review-date">${d}</p></div>`); }); }
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

    // --- MODIFICATION: Updated Logic to handle Category OR Product ID filter from URL ---
    function applyUrlCategoryFilterLocal() {
        const urlParams = new URLSearchParams(window.location.search);
        // Support both 'category' and 'subcategory' params
        const targetCategories = new Set([
            ...urlParams.getAll('category').map(c => c.toLowerCase().trim()),
            ...urlParams.getAll('subcategory').map(c => c.toLowerCase().trim()),
            ...(window.SERVER_SELECTED_SUBCATEGORIES || []).map(c => c.toLowerCase().trim())
        ]);
        const focusProductId = urlParams.get('focusProductId');

        if (focusProductId) {
            // If a specific product ID is requested, display only that one
            const product = allProducts.find(p => p.id === focusProductId);
            // Clear all filters, categories, and circles
            const updateCheckboxes = (selector) => {
                document.querySelectorAll(`${selector} input[type="checkbox"]`).forEach(cb => {
                    cb.checked = false;
                });
            };
            updateCheckboxes('.filter-sidebar');
            const mobileContent = document.getElementById('mobile-filter-content');
            if (mobileContent && mobileContent.innerHTML.trim() !== '') updateCheckboxes('.mobile-filter-content');
            document.querySelector('.category-circles-container')?.querySelectorAll('a[data-category]').forEach(a => a.classList.remove('active'));

            if (product) {
                renderProductGridLocal([product]);
            } else {
                renderProductGridLocal([]); // Show no results if product ID is invalid
            }
        }
        else if (targetCategories.size > 0) {
            const allCheckboxes = document.querySelectorAll('.filter-sidebar input[name="subcategory"], .mobile-filter-content input[name="subcategory"]');
            let found = false;

            allCheckboxes.forEach(cb => {
                const isMatch = targetCategories.has(cb.value.toLowerCase().trim());
                cb.checked = isMatch;
                if (isMatch) {
                    found = true;
                    // Expand accordion
                    const accordionItem = cb.closest('.filter-accordion-item');
                    if (accordionItem && !accordionItem.classList.contains('open')) {
                        accordionItem.classList.add('open');
                    }
                }
            });

            const circles = document.querySelector('.category-circles-container');
            if (circles) {
                circles.querySelectorAll('a[data-category]').forEach(a => a.classList.remove('active'));
                // Highlight corresponding circle(s) - just match first found
                targetCategories.forEach(cat => {
                    const activeCircle = circles.querySelector(`a[data-category="${cat}"]`);
                    if (activeCircle) activeCircle.classList.add('active');
                });
            }

            if (found) {
                filterAndSortProductsLocal();
            } else {
                // Modified: ALWAYS fetch, even if no filters are found.
                // This fetches the default "All Products" (or whatever params are set)
                // ensuring we don't start with an empty screen.
                filterAndSortProductsLocal();
            }
        } else {
            // Modified: Always fetch.
            filterAndSortProductsLocal();
        }
    }


    // --- Update Prices on THIS Page (Scoped) ---
    function updateDisplayedPricesLocal() {
        const currentRegion = getSelectedRegion(); // Use global getter
        console.log("Updating women.js prices for region:", currentRegion);

        // Update runtime product array first
        allProducts.forEach(prod => {
            const originalINR = originalAllProductsINR.find(p => p.id === prod.id);
            if (originalINR) {
                // Update both regular and discount prices converted
                prod.regularPriceConverted = convertInrToTargetCurrency(originalINR.price, currentRegion);
                prod.discountPriceConverted = originalINR.discount_price ? convertInrToTargetCurrency(originalINR.discount_price, currentRegion) : null;
                // Use discount price if available for display, otherwise regular price
                prod.priceConverted = originalINR.discount_price ? prod.discountPriceConverted : prod.regularPriceConverted;
            }
        });

        // Re-render the grid or update existing elements
        const grid = document.getElementById("product-grid");
        if (grid) {
            grid.querySelectorAll(".product-card").forEach(card => {
                const productId = card.getAttribute("data-product-id");
                const priceElement = card.querySelector(".product-price");
                const updatedProduct = allProducts.find(p => p.id === productId);

                if (updatedProduct && priceElement) {
                    const hasDiscount = updatedProduct.discountPriceConverted !== null;
                    const formattedPrice = formatCurrency(updatedProduct.priceConverted, currentRegion);
                    const formattedRegularPrice = formatCurrency(updatedProduct.regularPriceConverted, currentRegion);

                    // Rebuild price HTML to handle discounts appearing/disappearing
                    priceElement.innerHTML = `
                        ${hasDiscount ? `<span class="original-price" style="text-decoration: line-through; color: #999; margin-right: 8px;">${formattedRegularPrice}</span>` : ''}
                        <span class="current-price">${formattedPrice}</span>
                    `;
                    card.dataset.price = updatedProduct.priceConverted.toFixed(2);
                } else if (productId?.startsWith('women-')) {
                    console.warn("Could not find updated product data or price element for card:", productId);
                }
            });
        }

        // updateSearchPopupPrices(); // Handled globally
        updateFilterPriceLabelsLocal(); // Call scoped version
    }

    // --- Update price filter labels (Scoped) ---
    function updateFilterPriceLabelsLocal() {
        const currentRegion = getSelectedRegion(); // Use global getter
        const updateLabels = (containerSelector) => {
            document.querySelectorAll(`${containerSelector} input[name="price_range"]`).forEach(input => {
                const label = input.closest('label');
                if (!label) return;
                const rangeKey = input.value, range = CAD_PRICE_RANGES[rangeKey];
                let labelText = '';
                if (range) {
                    if (range.max === Infinity) labelText = ` Over ${formatCurrency(range.min - 0.01, currentRegion)}`;
                    else if (range.min === 0) labelText = ` Under ${formatCurrency(range.max + 0.01, currentRegion)}`;
                    else labelText = ` ${formatCurrency(range.min, currentRegion)} - ${formatCurrency(range.max, currentRegion)}`;
                    // Preserve the checkbox
                    const checkbox = input;
                    label.textContent = '';
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(labelText));
                }
            });
            const fromLabel = document.querySelector(`${containerSelector} label[for="price-from"]`);
            const toLabel = document.querySelector(`${containerSelector} label[for="price-to"]`);
            const regionSymbol = (EXCHANGE_RATES[currentRegion] || EXCHANGE_RATES['ca']).symbol;
            if (fromLabel) fromLabel.textContent = `From ${regionSymbol}`;
            if (toLabel) toLabel.textContent = `To ${regionSymbol}`;
        };
        updateLabels('.filter-sidebar');
        const mobileContent = document.getElementById('mobile-filter-content');
        if (mobileContent && mobileContent.innerHTML.trim() !== '') { updateLabels('.mobile-filter-content'); }
    }

    // --- REMOVED: Region Flag Dropdown Setup (Handled Globally) ---

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
    setupCategoryCircleFiltersLocal();
    setupMainBannerCarouselLocal();
    updateFilterPriceLabelsLocal(); // Initial labels

    // Promo Bar Animation
    const promoContainer = document.querySelector(".promo-slides");
    if (promoContainer) { const s = promoContainer.querySelectorAll(".promo-slide"); if (s.length > 1) { let i = 0; setInterval(() => { i = (i + 1) % s.length; promoContainer.style.transform = `translateX(-${i * 100}%)`; }, 3000); } }


    // --- Filter Event Listeners ---
    // Add listener for Price Range Inputs (using 'change' and 'input' for better responsiveness)
    const priceInputs = document.querySelectorAll('#price-from, #price-to');
    priceInputs.forEach(input => {
        input.addEventListener('input', () => {
            // Optional: Debounce or wait for 'change' if 'input' is too aggressive. 
            // But for now, calling loadProducts is fine as we filter client-side (no new fetch) except for full reload.
            // Wait, loadProducts DOES fetch. So we should use 'change' or debounce.
        });
        input.addEventListener('change', () => {
            // For client-side price filter, we don't necessarily need to re-fetch if we fetched ALL products.
            // However, our loadProducts function DOES re-fetch from API every time.
            // Optimally, we should just re-filter the 'allProducts' array if only price changed.
            // But to keep it simple and consistent with other filters, we will just call loadProducts().
            // To avoid spamming API on every keystroke, 'change' is better than 'input'.
            loadProducts();
        });
    });

    // Checkbox listeners for static HTML (dynamic ones are handled in loadSubcategories/loadFabrics)
    // But we should also catch the Price Range checkboxes
    document.querySelectorAll('input[name="price_range"]').forEach(cb => {
        cb.addEventListener('change', loadProducts);
    });

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

                // --- NEW: Re-attach listeners to cloned inputs ---
                // Inputs in mobile drawer need to trigger filtering too (or wait for "Apply")
                // For "Apply", we just need to read values. But if we want live feedback or updating states:
                // Actually the "Apply Filters" button calls filterAndSortProductsLocal().
                // But filterAndSortProductsLocal() reads from the DOM.
                // We just need to make sure we are reading from BOTH desktop and mobile inputs inside loadProducts().
                // loadProducts() currently does:
                // const min = document.getElementById('price-from')?.value;
                // document.getElementById searches the whole document. If IDs are duplicated (cloned), it finds the first one.
                // This is a PROBLEM with cloning IDs.
                // We should ensure mobile filters don't duplicate IDs or we strictly target the active drawer.

                // FIX: Remove IDs from cloned content to avoid duplicates, OR rely on class names / scoped selectors.
                // But loadProducts uses getElementById.
                // Let's modify IDs in the cloned content so they don't crash, 
                // BUT loadProducts needs to know which one to read.
                // Actually, if mobile drawer is open, we arguably want to read from THERE.

                // Alternative Strategy: sync values between desktop and mobile inputs?
                // Or just use class-based selection in loadProducts?

                // Let's attach listeners to "Apply" button primarily.
                // But wait, the standard logic is:
                // 1. User changes filter in drawer.
                // 2. Click Apply.
                // 3. Logic reads values.

                // We need to make sure loadProducts reads from the correct place.
                // Currently it does:
                // const min = document.getElementById('price-from')?.value;
                // If sidebar is hidden and drawer is open, getElementById might still find the sidebar one (first in DOM).

                // IMPORTANT: The cleanest way without rewriting everything is:
                // When "Apply" is clicked, copy values from Mobile Inputs -> Desktop Inputs, then trigger load.
                // This keeps desktop sidebar as the "Source of Truth".
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

    // --- Desktop Filter/Sort Logic ---
    if (originalFilterSidebar) {
        setupAccordionListenersLocal(originalFilterSidebar);
        // Note: Event listeners are added at the end of the file to avoid duplicates
    }

    // --- Mobile Sort Logic ---
    if (mobileSortSelect) mobileSortSelect.addEventListener('change', filterAndSortProductsLocal);

    // --- Apply URL Filter and Render Initial Grid ---
    applyUrlCategoryFilterLocal();
    if (originalFilterSidebar) initializeOpenAccordionsLocal(originalFilterSidebar);

    // ✅ Add search event listener here
    document.getElementById("product-search-input")?.addEventListener("input", filterAndSortProductsLocal);


    // --- Review Modal ---
    const reviewsLink = document.getElementById('footer-reviews-link');
    const reviewsModalOverlay = document.getElementById('reviews-modal-overlay');
    const closeReviewsModalBtn = document.getElementById('close-reviews-modal');
    if (reviewsLink && reviewsModalOverlay && closeReviewsModalBtn) { reviewsLink.addEventListener('click', (e) => { e.preventDefault(); loadAndDisplayReviewsLocal(); reviewsModalOverlay.classList.add('active'); }); closeReviewsModalBtn.addEventListener('click', () => reviewsModalOverlay.classList.remove('active')); reviewsModalOverlay.addEventListener('click', (e) => { if (e.target === reviewsModalOverlay) reviewsModalOverlay.classList.remove('active'); }); } else console.warn("Review modal elements missing.");

    // --- Listen for region changes dispatched by the header script ---
    document.addEventListener('regionChanged', () => {
        updateDisplayedPricesLocal(); // Update prices on THIS page's grid
        filterWomenProductsFromDB();

    });

    // ✅ Add filter event listeners here (Consolidated)
    document.querySelectorAll('.filter-sidebar input[type="checkbox"], .filter-sidebar input[type="number"]').forEach(input => {
        input.addEventListener('input', filterAndSortProductsLocal);
        input.addEventListener('change', filterAndSortProductsLocal);
    });
    document.getElementById("product-search-input")?.addEventListener("input", filterAndSortProductsLocal);
    document.getElementById("desktop-sort-select")?.addEventListener("change", filterAndSortProductsLocal);
    document.getElementById("mobile-sort-select")?.addEventListener("change", filterAndSortProductsLocal);


}); // End DOMContentLoaded