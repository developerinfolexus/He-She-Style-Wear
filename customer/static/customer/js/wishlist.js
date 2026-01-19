// --- Constants (Global Scope for Header Functions) ---
const WISHLIST_KEY = "he_she_wishlist";
const CART_KEY = "he_she_cart";
const SELECTED_REGION_KEY = "he_she_selected_region";

// --- Exchange Rates (Global Scope for Header Functions - Prices stored in USD) ---
const EXCHANGE_RATES = {
    ca: { rate: 1.33, symbol: "CA$", flag: 'https://flagcdn.com/w20/ca.png' }, // USD to CAD (1 USD = 1.33 CAD)
    us: { rate: 1.0, symbol: "US$", flag: 'https://flagcdn.com/w20/us.png' }  // USD to USD (no conversion)
};

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

// --- Product Catalog (Global Scope - MUST BE COMPLETE) ---
const originalAllProductsINR = [
 
];

// --- Global Helper Functions needed by Header Initialization ---
function getSelectedRegion() { return localStorage.getItem(SELECTED_REGION_KEY) || 'ca'; }
function setSelectedRegion(region) { if (EXCHANGE_RATES[region]) { localStorage.setItem(SELECTED_REGION_KEY, region); } else { console.error("Invalid region selected:", region); } }
function convertInrToTargetCurrency(priceInrStr, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['ca'], p = parseInt(String(priceInrStr).replace(/[^0-9]/g,''),10); return isNaN(p)?0:(p*r.rate); }
function formatCurrency(amount, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['ca']; return `${r.symbol}${amount.toFixed(2)}`; }
function convertDisplayedToInr(priceDisplayedStr, region) { const r = EXCHANGE_RATES[region] || EXCHANGE_RATES['ca'], p = parseFloat(String(priceDisplayedStr).replace(/[^0-9.]/g,'')); return (isNaN(p)||r.rate===0)?0:Math.round(p/r.rate); }
function getCart() { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
function getWishlist() { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
function updateCartCount() { const c=getCart(), t=c.reduce((s,i)=>s+(i.quantity||0),0), e=document.getElementById("cartCount"); if(e){e.textContent=t;e.style.display=t>0?"flex":"none";} }
function updateWishlistCount() { const c=getWishlist().length, e=document.getElementById("wishlistCount"); if(e){e.textContent=c;e.style.display=c>0?"flex":"none";} }

function closeOtherDropdowns(currentDropdownContainer) { /* ... (keep as before) ... */
    const profileContainer = document.getElementById('profileIconContainer'); if (profileContainer && profileContainer !== currentDropdownContainer && profileContainer.classList.contains('active')) { profileContainer.classList.remove('active'); }
    const regionContainer = document.getElementById('region-selector-container'); if (regionContainer && regionContainer !== currentDropdownContainer && regionContainer.classList.contains('active')) { regionContainer.classList.remove('active'); }
    document.querySelectorAll('.main-nav li.nav-item-with-hover.dropdown-active').forEach(item => { if(item !== currentDropdownContainer) item.classList.remove('dropdown-active');});
}

// --- Header Setup Functions (Defined Globally) ---
function setupSearchFunctionality() { /* ... (keep as before) ... */
    const searchForm=document.getElementById('header-search-form'), searchInput=document.getElementById("header-search-input"), headerSearchContainer=document.querySelector(".header-icon.search-container"), headerSearchIcon=document.querySelector(".search-icon-trigger"), searchPopup=document.getElementById("search-results-popup");
    if(!headerSearchIcon || !headerSearchContainer || !searchInput || !searchPopup) return;
    headerSearchIcon.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();headerSearchContainer.classList.toggle("active");if(headerSearchContainer.classList.contains("active")) searchInput.focus(); else searchPopup.style.display='none';});
    searchInput.addEventListener('input',()=>{const t=searchInput.value.trim().toLowerCase(), r=getSelectedRegion(); searchPopup.innerHTML=''; if(t.length===0){searchPopup.style.display='none';return;} const results=originalAllProductsINR.filter(p=>p.name.toLowerCase().includes(t)).slice(0,5); if(results.length>0){results.forEach(pINR=>{const i=document.createElement('a');i.href=`/product/${pINR.id}?img=${encodeURIComponent(pINR.image)}`;i.classList.add('popup-item');const pConv=convertInrToTargetCurrency(pINR.price,r), pFmt=formatCurrency(pConv,r);i.innerHTML=`<img src="${pINR.image}" alt="${pINR.name}"><div class="popup-item-info"><h4>${pINR.name}</h4><p>${pFmt}</p></div>`;searchPopup.appendChild(i);});}else{searchPopup.innerHTML=`<div class="popup-no-results">Not found.</div>`;} searchPopup.style.display='block';});
    if(searchForm) searchForm.addEventListener('submit',e=>{e.preventDefault();const t=searchInput.value.trim();if(t)window.location.href=`search.html?query=${encodeURIComponent(t)}`;});
    document.addEventListener('click', e => { if (headerSearchContainer && !headerSearchContainer.contains(e.target)) { headerSearchContainer.classList.remove('active'); if(searchPopup) searchPopup.style.display='none'; } });
}
function setupProfileDropdown() { /* ... (keep as before) ... */
    const pCont=document.getElementById('profileIconContainer'), pIcon=pCont?.querySelector('.profile-icon-trigger'), pDrop=document.getElementById('profileDropdown');
    if(pIcon && pDrop && pCont){pIcon.addEventListener('click',e=>{e.stopPropagation();pCont.classList.toggle('active');closeOtherDropdowns(pCont);}); const logoutBtn=document.getElementById('logoutButton'); if(logoutBtn){logoutBtn.addEventListener('click',e=>{e.preventDefault();alert("Logout clicked (simulation)");pCont.classList.remove('active');});}}
}
function setupNavDropdowns() { /* No JS needed for CSS hover */ }
function setupRegionFlagDropdown() { /* ... (keep as before, dispatches 'regionChanged') ... */
    const rCont=document.getElementById('region-selector-container'), rTrig=document.getElementById('selected-region-trigger'), rFlag=document.getElementById('selected-region-flag'), rDrop=document.getElementById('region-dropdown-menu');
    if(!rCont || !rTrig || !rFlag || !rDrop) return;
    const updateFlag=(regionCode)=>{const d=EXCHANGE_RATES[regionCode];if(d&&d.flag){rFlag.src=d.flag;rFlag.alt=regionCode.toUpperCase()+" flag";}}; updateFlag(getSelectedRegion());
    rTrig.addEventListener('click',e=>{e.stopPropagation();rCont.classList.toggle('active');closeOtherDropdowns(rCont);});
    rDrop.querySelectorAll('.region-option').forEach(opt=>{opt.addEventListener('click',e=>{const newR=opt.getAttribute('data-value');if(EXCHANGE_RATES[newR]){setSelectedRegion(newR);updateFlag(newR);rCont.classList.remove('active');
        document.dispatchEvent(new CustomEvent('regionChanged')); // Dispatch event
    }});});
    // Add document listener if not already present
    if (!document.body.hasAttribute('data-global-click-listener')) {
        document.addEventListener('click', e => { closeOtherDropdowns(null); });
        document.body.setAttribute('data-global-click-listener', 'true');
    }
}

// --- Wishlist Update (Unified Logic, used by the click handler) ---
function updateWishlist(productData, isAdding) {
    let list = getWishlist();

    const priceUSD = parseFloat(
        productData.price.replace(/[^0-9.]/g, '')
    );

    const itemToStore = {
        id: productData.id,
        name: productData.name,
        priceUSD: priceUSD, // ✅ store USD only
        image: productData.image
    };

    if (isAdding) {
        if (!list.some(i => i.id === itemToStore.id)) list.push(itemToStore);
    } else {
        list = list.filter(item => item.id !== itemToStore.id);
    }

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    updateWishlistCount();
}


// --- Render Wishlist function (Core Logic) ---
function renderWishlistLocal() {
    const wishlist = getWishlist();
    const grid = document.getElementById("wishlist-grid");
    const emptyContainer = document.getElementById("empty-message-container");
    const currentRegion = getSelectedRegion(); // Use global getter

    if (!grid || !emptyContainer) { console.error("Wishlist elements not found."); return; }
    grid.innerHTML = ""; emptyContainer.innerHTML = "";

    if (wishlist.length === 0) {
    emptyContainer.innerHTML = `
<div class="empty-wishlist-message">
    <i class="far fa-heart"></i>
    <p>Your wishlist is empty.</p>
    <p><a href="/" id="continue-shopping" style="text-decoration:underline;">Continue Shopping</a></p>
</div>`;

    } else {
        wishlist.forEach((product) => {
            // ✅ CORRECT: USD → CA display only
            const priceUSD = Number(product.priceUSD || product.price || 0);
            const exchange = EXCHANGE_RATES[currentRegion] || EXCHANGE_RATES.us;
            const formattedPrice = `${exchange.symbol}${(priceUSD * exchange.rate).toFixed(2)}`;
            
            // --- MODIFICATION START ---
            // Moved the <button> inside the <div class="product-image-container">
            const cardHTML = `
            <article class="product-card" data-product-id="${product.id}">
                <a href="/product/${product.id}?img=${encodeURIComponent(product.image)}">
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}"/>
                        <button class="wishlist-btn"><i class="fas fa-heart"></i></button>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">${formattedPrice}</p>
                    </div>
                </a>
            </article>`;
            // --- MODIFICATION END ---
            
            grid.insertAdjacentHTML('beforeend', cardHTML); // Use insertAdjacentHTML
        });
    }
    addEventListenersToGridLocal(); // Attach listeners AFTER rendering
}

// --- Event Listeners for Wishlist Grid (Core Logic) ---
function addEventListenersToGridLocal() {
     const grid = document.getElementById("wishlist-grid");
     if (!grid) return;

     // Ensure listener isn't added multiple times
     if (grid.hasAttribute('data-wishlist-listener')) return;

     grid.addEventListener("click", (e) => {
         const target = e.target;
         const wishlistButton = target.closest(".wishlist-btn");
         const card = target.closest(".product-card");
         const productId = card?.getAttribute("data-product-id");

         if (wishlistButton && card && productId) {
             e.preventDefault();
             e.stopPropagation();

             const currentPriceText = card.querySelector('.product-price')?.textContent || '';
             const productData = {
                 id: productId,
                 name: card.querySelector(".product-name")?.textContent || '',
                 price: currentPriceText, // Pass displayed price
                 image: card.querySelector("img")?.src || '',
             };

             updateWishlist(productData, false); // Remove from wishlist (isAdding=false)
             renderWishlistLocal(); // Re-render the grid
         }
     });
     grid.setAttribute('data-wishlist-listener', 'true'); // Mark as listener added
}

// --- DOMContentLoaded Event Listener (main execution block) ---
document.addEventListener("DOMContentLoaded", () => {
    
    renderWishlistLocal(); // Initial render

    // --- Listen for region change event ---
    document.addEventListener('regionChanged', renderWishlistLocal);

});