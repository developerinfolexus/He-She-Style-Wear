// // Data for men's products (ensure all necessary attributes are present)
// const allProducts = [
//       { id: 'men-P001', name: 'Embroidered Art Silk Kurta Set', price: '4199', image: 'https://tse3.mm.bing.net/th/id/OIP.Zie1jdfpnN9B1zqYg_DaUQAAAA?w=320&h=480&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'kurtas', color: 'beige', fabric: 'silk', work: 'embroidered' },
//       { id: 'men-P002', name: 'Black Indo-Western Set', price: '7999', image: 'https://tse3.mm.bing.net/th/id/OIP.54VEjESx7ckb1-8TScnAmgHaLG?w=683&h=1024&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'indowestern', color: 'black', fabric: 'brocade', work: 'solid' },
//       { id: 'men-P003', name: 'Printed Cotton Short Kurta', price: '1499', image: 'https://www.thefashionisto.com/wp-content/uploads/2015/01/Brunello-Cucinelli-Fall-Winter-2015-Menswear-Collection-Look-Book-023.jpg', category: 'kurtas', color: 'white', fabric: 'cotton', work: 'printed' },
//       { id: 'men-P004', name: 'Blue Brocade Nehru Jacket', price: '3499', image: 'https://www.thefashionisto.com/wp-content/uploads/2015/01/Brunello-Cucinelli-Fall-Winter-2015-Menswear-Collection-Look-Book-023.jpg', category: 'jackets', color: 'blue', fabric: 'silk', work: 'brocade' },
//       { id: 'men-P005', name: 'Black Designer Bandhgala Set', price: '12499', image: 'https://tse3.mm.bing.net/th/id/OIP.49d8Hqm6cPUsB8D-5yn_RwHaJ4?w=1080&h=1440&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'indowestern', color: 'black', fabric: 'brocade', work: 'embroidered' },
//       { id: 'men-P006', name: 'White Cotton Blend Kurta', price: '1999', image: 'https://tse2.mm.bing.net/th/id/OIP.Z3_muMQPruehPI-yntyIWgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3', category: 'kurtas', color: 'white', fabric: 'cotton', work: 'solid' },
//       { id: 'men-P007', name: 'Royal Blue Silk Sherwani', price: '15999', image: 'https://assets.myntassets.com/h_200,w_200,c_fill,g_auto/h_1440,q_100,w_1080/v1/assets/images/26936900/2024/1/16/c005f8b7-5337-4f0d-8b22-b7b776470dec1705387096406KISAHMenSelf-DesignMandarinCollarSherwaniSet1.jpg', category: 'sherwani', color: 'blue', fabric: 'silk', work: 'embroidered' },
//       { id: 'men-P008', name: 'Burgundy Linen Kurta', price: '2599', image: 'https://i.pinimg.com/474x/db/f5/e4/dbf5e45dff4ceb32efe0d46bf720efcd--banana-republic-looks-men-fashion.jpg', category: 'kurtas', color: 'red', fabric: 'linen', work: 'solid' }, // Mapped burgundy to red filter
//       { id: 'men-P009', name: 'Printed Black Nehru Jacket', price: '4500', image: 'https://tse3.mm.bing.net/th/id/OIP.Zie1jdfpnN9B1zqYg_DaUQAAAA?w=320&h=480&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'jackets', color: 'black', fabric: 'linen', work: 'printed' },
//       { id: 'men-P010', name: 'Beige Embroidered Kurta', price: '3100', image: 'https://assets.myntassets.com/h_200,w_200,c_fill,g_auto/h_1440,q_100,w_1080/v1/assets/images/17332278/2022/5/30/eff4b83e-d4c4-48f4-bea5-407d6b7ad06e1653901867350KISAHMenMaroonWovenDesignCottonSherwani6.jpg', category: 'kurtas', color: 'beige', fabric: 'cotton', work: 'embroidered' },
//       { id: 'men-P011', name: 'Pastel Green Cotton Kurta', price: '2899', image: 'https://tse2.mm.bing.net/th/id/OIP.TiopE81ZXfWu7ShfEqCiWwHaJP?w=734&h=916&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'kurtas', color: 'green', fabric: 'cotton', work: 'solid' },
//       { id: 'men-P012', name: 'Golden Zari Work Sherwani', price: '18500', image: 'https://tse4.mm.bing.net/th/id/OIP.qdgczKMoDJcGwFL4ItVWsQHaJQ?w=1080&h=1350&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'sherwani', color: 'gold', fabric: 'silk', work: 'zari' },
//       { id: 'men-P013', name: 'Maroon Linen Nehru Jacket', price: '3999', image: 'https://www.tiptopgents.com/wp-content/uploads/2023/01/Picsart_22-12-31_21-43-54-733.webp', category: 'jackets', color: 'red', fabric: 'linen', work: 'solid' }, // Mapped maroon to red
//       { id: 'men-P014', name: 'Cream Embroidered Indo-Western', price: '9500', image: 'https://i.pinimg.com/236x/4e-5b-50/4e5b50478e003a1c976f0b05b932575a--indigo-blue-denim-jackets.jpg', category: 'indowestern', color: 'beige', fabric: 'silk', work: 'embroidered' }, // Mapped cream to beige
//       { id: 'men-P015', name: 'Yellow Floral Print Kurta', price: '1899', image: 'https://i.pinimg.com/236x/5f/86/26/5f8626fef5118e9c77b4064022a634c2.jpg', category: 'kurtas', color: 'yellow', fabric: 'cotton', work: 'printed' },
//       { id: 'men-P016', name: 'Asymmetric White Kurta Jacket Set', price: '11500', image: 'https://i.pinimg.com/736x/dd/7e/bb/dd7ebbce04b57700bf5927b0d917bdcf.jpg', category: 'indowestern', color: 'white', fabric: 'silk', work: 'solid' },
//       { id: 'men-P017', name: 'Black Velvet Embellished Sherwani', price: '25000', image: 'https://i.pinimg.com/originals/09/8e/04/098e04af0ab6959bc544269e37bf3b88.png', category: 'sherwani', color: 'black', fabric: 'velvet', work: 'embroidered' },
//       { id: 'men-P018', name: 'Royal Blue Silk Blend Kurta', price: '4999', image: 'https://vogueymen.com/wp-content/uploads/2022/05/avramov.zoran-___CPBM6lOAdQt___-.jpg', category: 'kurtas', color: 'blue', fabric: 'silk', work: 'zari' },
//       { id: 'men-P019', name: 'Multi-Color Floral Print Jacket', price: '4200', image: 'https://wallpaperaccess.com/full/1448075.jpg', category: 'jackets', color: 'multi', fabric: 'brocade', work: 'printed' },
//       { id: 'men-P020', name: 'Light Grey Linen Kurta', price: '2350', image: 'https://i.pinimg.com/originals/01/7b/06/017b06a125a10b22a1d8643cf22dd4be.jpg', category: 'kurtas', color: 'grey', fabric: 'linen', work: 'solid' },
//       { id: 'men-P021', name: 'Navy Blue Printed Cotton Kurta', price: '3299', image: 'https://i.pinimg.com/564x/27/0c/60/270c60623519843a2944b9308f757434.jpg', category: 'kurtas', color: 'blue', fabric: 'cotton', work: 'printed' }, // Mapped navy to blue
//       { id: 'men-P022', name: 'Charcoal Grey Silk Indo-Western', price: '10500', image: 'https://i.pinimg.com/564x/e7/0a/f2/e70af2b311354a3a6a9d19a435881427.jpg', category: 'indowestern', color: 'grey', fabric: 'silk', work: 'solid' }, // Mapped charcoal to grey
//       { id: 'men-P023', name: 'Cream Embroidered Brocade Sherwani', price: '22000', image: 'https://i.pinimg.com/564x/e9/a3/3d/e9a33d02e/07802a4e82b72dec7246132.jpg', category: 'sherwani', color: 'beige', fabric: 'brocade', work: 'embroidered' }, // Mapped cream to beige
//       { id: 'men-P024', name: 'Olive Green Linen Nehru Jacket', price: '4800', image: 'https://i.pinimg.com/564x/d1/1d/3e/d11d3e137f8f480351335b2a0b12fe4c.jpg', category: 'jackets', color: 'green', fabric: 'linen', work: 'solid' }, // Mapped olive to green
//       { id: 'men-P025', name: 'Jet Black Embroidered Kurta', price: '2999', image: 'https://i.pinimg.com/564x/8a/a8/19/8aa81958a74e54823483955635f793e7.jpg', category: 'kurtas', color: 'black', fabric: 'silk', work: 'embroidered' },
//       { id: 'men-P026', name: 'Maroon Velvet Indo-Western Set', price: '13500', image: 'https://i.pinimg.com/564x/5b/c2/f7/5bc2f75a7c5b3806443ca20c64984252.jpg', category: 'indowestern', color: 'red', fabric: 'velvet', work: 'solid' }, // Mapped maroon to red
//       { id: 'men-P027', name: 'Mustard Yellow Printed Kurta', price: '2150', image: 'https://i.pinimg.com/564x/f3/d3/1c/f3d31c6a25b164a259c4a8563c6225a2.jpg', category: 'kurtas', color: 'yellow', fabric: 'cotton', work: 'printed' }, // Mapped mustard to yellow
//       { id: 'men-P028', name: 'Beige Printed Brocade Jacket', price: '3800', image: 'https://i.pinimg.com/564x/e1/9f/f0/e19ff085a11c0f135b9148d47b59e31d.jpg', category: 'jackets', color: 'beige', fabric: 'brocade', work: 'printed' },
//       { id: 'men-P029', name: 'Navy Blue Zari Work Sherwani', price: '28500', image: 'https://i.pinimg.com/564x/4b/58/05/4b5805256e6d1912953f65e2528734e5.jpg', category: 'sherwani', color: 'blue', fabric: 'silk', work: 'zari' }, // Mapped navy to blue
//       { id: 'men-P030', name: 'Teal Green Solid Linen Kurta', price: '3450', image: 'https://i.pinimg.com/564x/01/f9/06/01f90642443a53a992850f7547e7b68b.jpg', category: 'kurtas', color: 'green', fabric: 'linen', work: 'solid' }, // Mapped teal to green
// ];


// const WISHLIST_KEY = "he_she_wishlist";
// const CART_KEY = "he_she_cart";

// // --- Helper Functions ---
// function getWishlist() {
//   const stored = localStorage.getItem(WISHLIST_KEY);
//   return stored ? JSON.parse(stored) : [];
// }

// function getCart() {
//     return JSON.parse(localStorage.getItem(CART_KEY)) || [];
// }

// // --- Update Header Counts ---
// function updateWishlistCount() {
//   const count = getWishlist().length;
//   const countElement = document.getElementById("wishlistCount");
//   if (countElement) {
//     countElement.textContent = count;
//     countElement.style.display = count > 0 ? "flex" : "none";
//   }
// }

// function updateCartCount() {
//     const totalItems = getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
//     const countElement = document.getElementById("cartCount");
//     if (countElement) {
//         countElement.textContent = totalItems;
//         countElement.style.display = totalItems > 0 ? "flex" : "none";
//     }
// }

// // --- Update Wishlist (Add/Remove) ---
// function updateWishlist(productData, isAdding) {
//   let list = getWishlist();
//   if (isAdding) {
//     if (!list.some((item) => item.id === productData.id)) {
//       list.push(productData); // productData includes captured image
//     }
//   } else {
//     list = list.filter((item) => item.id !== productData.id);
//   }
//   localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
//   updateWishlistCount();
// }

// // --- Set Initial Wishlist Heart State ---
// function initializeWishlistHearts() {
//   const wishlistedIds = getWishlist().map((item) => item.id);
//   document.querySelectorAll(".product-card").forEach((card) => {
//     const productId = card.getAttribute("data-product-id");
//     const button = card.querySelector(".wishlist-btn");
//     if (button) {
//       const icon = button.querySelector("i");
//       if (icon) {
//         if (wishlistedIds.includes(productId)) {
//           button.classList.add("active");
//           icon.classList.remove("far");
//           icon.classList.add("fas");
//         } else {
//           button.classList.remove("active");
//           icon.classList.remove("fas");
//           icon.classList.add("far");
//         }
//       }
//     }
//   });
// }

// // --- **MODIFIED**: Filter Products Logic ---
// function filterProducts() {
//     // --- गैदर चेक्ड फिल्टर्स ---
//     const selectedCheckboxes = { category: [], size: [], color: [], fabric: [], work: [] };
//     const selectedPriceRanges = []; // For price range checkboxes
//     let minPrice = -Infinity;
//     let maxPrice = Infinity;

//     // फंक्शन टू गैदर चेक्ड फिल्टर्स
//     function gatherFilters(containerSelector) {
//         // चेकबॉक्सेस (नॉन-प्राइस)
//         document.querySelectorAll(`${containerSelector} input[type="checkbox"]:not([name="price_range"]):checked`).forEach(cb => {
//             if (selectedCheckboxes[cb.name]) {
//                 if (!selectedCheckboxes[cb.name].includes(cb.value)) {
//                     selectedCheckboxes[cb.name].push(cb.value);
//                 }
//             }
//         });
//         // प्राइस रेंज चेकबॉक्सेस
//         document.querySelectorAll(`${containerSelector} input[type="checkbox"][name="price_range"]:checked`).forEach(cb => {
//             if (!selectedPriceRanges.includes(cb.value)) {
//                 selectedPriceRanges.push(cb.value);
//             }
//         });

//         // कस्टम प्राइस इनपुट्स
//         const minPriceInput = document.querySelector(`${containerSelector} #price-from`);
//         const maxPriceInput = document.querySelector(`${containerSelector} #price-to`);
//         const minVal = parseFloat(minPriceInput?.value);
//         const maxVal = parseFloat(maxPriceInput?.value);

//         // अपडेट मिन/मैक्स अगर इनपुट्स में वैलिड वैल्यूज हैं
//         if (!isNaN(minVal) && minVal >= 0) {
//             minPrice = Math.max(minPrice, minVal); // Use the highest minimum if set in both places
//         }
//         if (!isNaN(maxVal) && maxVal >= 0) {
//             maxPrice = Math.min(maxPrice, maxVal); // Use the lowest maximum
//         }
//     }

//     // डेस्कटॉप और मोबाइल से फिल्टर्स गैदर करें
//     gatherFilters('.filter-sidebar');
//     const mobileFilterContent = document.getElementById('mobile-filter-content');
//     if (mobileFilterContent && mobileFilterContent.innerHTML.trim() !== '') {
//         gatherFilters('.mobile-filter-content');
//     }

//     // सुनिश्चित करें कि minPrice <= maxPrice
//     if (minPrice > maxPrice) {
//         maxPrice = Infinity; // या स्वैप करें, या एरर दिखाएं
//     }

//     // --- फिल्टर प्रोडक्ट्स ---
//     const productCards = document.querySelectorAll(".product-card");
//     productCards.forEach((card) => {
//         const productPrice = parseInt(card.dataset.price || '0');
//         const productCategory = card.dataset.category || '';
//         const productColor = card.dataset.color || '';
//         const productFabric = card.dataset.fabric || '';
//         const productWork = card.dataset.work || '';
//         const productSize = card.dataset.size || ''; // Size data (if available on card)

//         let priceMatch = false;
//         const customRangeActive = minPrice > -Infinity || maxPrice < Infinity;
//         const checkboxRangeActive = selectedPriceRanges.length > 0;

//         // 1. प्राइस फिल्टर चेक करें
//         if (!customRangeActive && !checkboxRangeActive) {
//             priceMatch = true;
//         } else {
//             const matchesCustomRange = customRangeActive && (productPrice >= minPrice && productPrice <= maxPrice);
//             const matchesCheckboxRange = checkboxRangeActive && selectedPriceRanges.some(range => {
//                 if (range === "under_2000" && productPrice < 2000) return true;
//                 if (range === "2000_5000" && productPrice >= 2000 && productPrice <= 5000) return true;
//                 if (range === "over_5000" && productPrice > 5000) return true;
//                 return false;
//             });

//             if ((customRangeActive && checkboxRangeActive)) {
//                  priceMatch = matchesCustomRange || matchesCheckboxRange;
//             } else if (customRangeActive) {
//                  priceMatch = matchesCustomRange;
//             } else {
//                  priceMatch = matchesCheckboxRange;
//             }
//         }

//         // 2. अन्य फिल्टर चेक करें (केवल अगर प्राइस मैच होता है)
//         let otherFiltersMatch = true;
//         if (priceMatch) {
//             for (const filterType in selectedCheckboxes) {
//                 const selectedValues = selectedCheckboxes[filterType];
//                 if (selectedValues.length === 0) continue;

//                 let productValue = card.dataset[filterType] || '';
//                  // Handle 'size' specifically if needed, otherwise compare lowercase
//                 // if (filterType === 'size') { ... }
//                 if (!selectedValues.includes(productValue.toLowerCase())) {
//                     otherFiltersMatch = false;
//                     break;
//                 }
//             }
//         }

//         // कार्ड दिखाएं या छिपाएं
//         card.style.display = priceMatch && otherFiltersMatch ? "block" : "none";
//     });
// }


// // --- Handle Product Card Clicks (Wishlist or Navigate) ---
// function initializeProductCardClicks() {
//     document.querySelectorAll(".product-card").forEach((card) => {
//          // Remove existing listener before adding a new one to prevent duplicates
//         const newCard = card.cloneNode(true);
//         card.parentNode.replaceChild(newCard, card);

//         newCard.addEventListener("click", (e) => {
//             const isWishlistClick = e.target.closest(".wishlist-btn");
//             const productId = newCard.getAttribute("data-product-id");

//             if (isWishlistClick) {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 const button = isWishlistClick;
//                  const productData = {
//                     id: productId,
//                     name: newCard.querySelector(".product-name")?.textContent || '',
//                     price: newCard.querySelector(".product-price")?.textContent || '',
//                     image: newCard.querySelector("img")?.src || '',
//                 };
//                 const isAdding = !button.classList.contains("active");
//                 button.classList.toggle("active");
//                 const icon = button.querySelector("i");
//                 if (icon) {
//                     icon.classList.toggle("far");
//                     icon.classList.toggle("fas");
//                 }
//                 updateWishlist(productData, isAdding);
//             } else if (productId) {
//                 e.preventDefault();
//                 const imageUrl = newCard.querySelector("img")?.src;
//                 if (imageUrl) {
//                     window.location.href = `/product/${productId}?img=${encodeURIComponent(imageUrl)}`;
//                 } else {
//                     window.location.href = `/product/${productId}?img=`;
//                 }
//             }
//         });
//     });
// }

// // --- Search Functionality Setup ---
// function setupSearchFunctionality() {
//     const searchForm = document.getElementById('header-search-form');
//     const searchContainer = document.querySelector(".search-container");
//     const searchIconTrigger = document.querySelector(".search-icon-trigger");
//     const searchInput = document.getElementById("header-search-input");
//     const searchPopup = document.getElementById("search-results-popup");

//     if (!searchForm || !searchContainer || !searchIconTrigger || !searchInput || !searchPopup) {
//         console.error("Search elements not found in men.js");
//         return;
//     }

//     const allStoreProducts = [
//         ...allProducts,
//         { id: 'women-P001', name: 'Rose Pink Banarasi Silk Saree', price: '₹4,599', image: 'https://images.pexels.com/photos/1043331/pexels-photo-1043331.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
//         { id: 'kids-P004', name: 'Boys Maroon Silk Blend Sherwani', price: '₹3,499', image: 'https://images.pexels.com/photos/16503306/pexels-photo-16503306/free-photo-of-a-boy-in-a-traditional-indian-outfit.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
//     ];

//     searchIconTrigger.addEventListener("click", (e) => {
//         e.preventDefault(); e.stopPropagation();
//         searchContainer.classList.toggle("active");
//         if (searchContainer.classList.contains("active")) searchInput.focus();
//         else searchPopup.style.display = 'none';
//     });

//     searchInput.addEventListener('input', () => {
//         const searchTerm = searchInput.value.trim().toLowerCase();
//         searchPopup.innerHTML = '';
//         if (searchTerm.length === 0) {
//             searchPopup.style.display = 'none'; return;
//         }
//         const results = allStoreProducts.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
//         if (results.length > 0) {
//             results.forEach(product => {
//                 const item = document.createElement('a');
//                 const priceClean = String(product.price).replace(/[^0-9.]/g, '');
//                 const priceFormatted = `₹${parseInt(priceClean).toLocaleString('en-IN')}`;
//                 item.href = `/product/${product.id}?img=${encodeURIComponent(product.image)}`;
//                 item.classList.add('popup-item');
//                 item.innerHTML = `<img src="${product.image}" alt="${product.name}"><div class="popup-item-info"><h4>${product.name}</h4><p>${priceFormatted}</p></div>`;
//                 searchPopup.appendChild(item);
//             });
//         } else {
//             searchPopup.innerHTML = `<div class="popup-no-results">No products found.</div>`;
//         }
//         searchPopup.style.display = 'block';
//     });

//     searchForm.addEventListener('submit', (event) => {
//         event.preventDefault();
//         const searchTerm = searchInput.value.trim();
//         if (searchTerm) window.location.href = `search.html?query=${encodeURIComponent(searchTerm)}`;
//     });

//     document.addEventListener('click', (e) => {
//         if (searchContainer && !searchContainer.contains(e.target)) {
//             searchContainer.classList.remove('active');
//             if(searchPopup) { searchPopup.style.display = 'none'; }
//         }
//     });
// }

// // --- Function to setup accordion toggling ---
// function setupAccordionListeners(containerElement) {
//     containerElement.querySelectorAll(".filter-header").forEach((header) => {
//         const newHeader = header.cloneNode(true);
//         header.parentNode.replaceChild(newHeader, header);

//         newHeader.addEventListener("click", () => {
//             const item = newHeader.closest(".filter-accordion-item");
//             const content = item?.querySelector(".filter-content");
//             if (!item || !content) return;

//             const wasOpen = item.classList.contains("open");
//             item.classList.toggle("open", !wasOpen);

//             // Don't animate price range content height, just toggle others
//             if (!content.querySelector('.price-range-filter')) {
//                 content.style.maxHeight = !wasOpen ? content.scrollHeight + "px" : null;
//             } else if (wasOpen) {
//                  content.style.maxHeight = null;
//             } else {
//                  content.style.maxHeight = content.scrollHeight + "px"; // Or 'initial'
//             }
//         });
//     });
// }

// // --- Function to ensure initially open accordions are expanded ---
// function initializeOpenAccordions(containerElement) {
//      containerElement.querySelectorAll(".filter-accordion-item.open").forEach((item) => {
//         const content = item.querySelector(".filter-content");
//         if (content) {
//             setTimeout(() => {
//                 if (item.classList.contains("open")) {
//                     // Always calculate scrollHeight for initially open items
//                     content.style.maxHeight = content.scrollHeight + "px";
//                 }
//             }, 0);
//         }
//      });
// }

// // --- DOMContentLoaded Event Listener (MODIFIED) ---
// document.addEventListener("DOMContentLoaded", () => {
//     // Get Filter Elements
//     const mobileFilterOverlay = document.getElementById('mobile-filter-overlay');
//     const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
//     const mobileFilterContent = document.getElementById('mobile-filter-content');
//     const closeFilterBtn = document.getElementById('close-filter-btn');
//     const applyFiltersBtn = document.getElementById('apply-filters-btn');
//     const mobileFilterTriggerBtn = document.querySelector('.mobile-filter-sort button:first-child');
//     const originalFilterSidebar = document.querySelector('.filter-sidebar');

//     // Initial Page Setup
//     updateWishlistCount();
//     updateCartCount();
//     initializeWishlistHearts();
//     filterProducts(); // Initial filter apply
//     initializeProductCardClicks();
//     setupSearchFunctionality();

//     // Promo Bar Animation
//     const promoContainer = document.querySelector(".promo-slides");
//     if (promoContainer) { /* ... rest of promo bar code ... */ }

//     // --- Mobile Filter Drawer Logic (MODIFIED for Price Input) ---
//     if (mobileFilterTriggerBtn && mobileFilterOverlay && mobileFilterDrawer && closeFilterBtn && applyFiltersBtn && originalFilterSidebar && mobileFilterContent) {

//         function setupMobileFilters() {
//             if (mobileFilterContent.children.length === 0) {
//                 const clonedSidebarContent = originalFilterSidebar.cloneNode(true);
//                 clonedSidebarContent.style.display = '';
//                 mobileFilterContent.appendChild(clonedSidebarContent);
//                 setupAccordionListeners(mobileFilterContent);
//                 initializeOpenAccordions(mobileFilterContent);

//                 // Add input/change listeners for price filters in mobile drawer
//                 mobileFilterContent.querySelectorAll('#price-from, #price-to, input[name="price_range"]').forEach(input => {
//                     input.addEventListener('input', () => { // Use 'input'/'change' appropriately
//                         // Rely on Apply button
//                     });
//                 });
//             }
//         }

//         mobileFilterTriggerBtn.addEventListener('click', () => {
//             setupMobileFilters();
//             mobileFilterOverlay.classList.add('active');
//             mobileFilterDrawer.classList.add('active');
//             initializeOpenAccordions(mobileFilterContent); // Re-check heights
//         });
//         closeFilterBtn.addEventListener('click', () => {
//             mobileFilterOverlay.classList.remove('active');
//             mobileFilterDrawer.classList.remove('active');
//         });
//         mobileFilterOverlay.addEventListener('click', (e) => {
//             if (e.target === mobileFilterOverlay) {
//                 mobileFilterOverlay.classList.remove('active');
//                 mobileFilterDrawer.classList.remove('active');
//             }
//         });
//         applyFiltersBtn.addEventListener('click', () => {
//             filterProducts(); // Apply filters based on selections
//             initializeWishlistHearts();
//             initializeProductCardClicks();
//             mobileFilterOverlay.classList.remove('active');
//             mobileFilterDrawer.classList.remove('active');
//         });
//     } else {
//          console.warn("One or more mobile filter elements are missing in men.js.");
//     }

//     // --- Desktop Filter Logic (MODIFIED for Price Input) ---
//     if (originalFilterSidebar) {
//         setupAccordionListeners(originalFilterSidebar);
//         initializeOpenAccordions(originalFilterSidebar);

//         // Add change listeners to ALL checkboxes (including price ranges) for immediate filtering
//         originalFilterSidebar.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
//             checkbox.addEventListener('change', () => {
//                 filterProducts();
//                 initializeWishlistHearts();
//                 initializeProductCardClicks();
//             });
//         });

//         // Add input listeners to price range inputs for immediate filtering
//         originalFilterSidebar.querySelectorAll('#price-from, #price-to').forEach(input => {
//             input.addEventListener('input', () => { // 'input' fires on every change
//                 filterProducts();
//                 initializeWishlistHearts();
//                 initializeProductCardClicks();
//             });
//         });
//     }
// });     