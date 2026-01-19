document.addEventListener('DOMContentLoaded', () => {
    console.log('Products page DOMContentLoaded fired');

    // --- Exchange Rates & Currency Symbols (Prices stored in USD) ---
    const EXCHANGE_RATES = {
        ca: { rate: 1.33, symbol: "CA$" }, // USD to CAD (1 USD = 1.33 CAD)
        us: { rate: 1.0, symbol: "US$" }   // USD to USD (no conversion)
    };
    const DEFAULT_REGION = 'us'; // Default to USD

    // --- Currency Conversion Functions (Prices stored in USD) ---
    function convertUsdToTargetCurrency(priceUsdStr, region = DEFAULT_REGION) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES[DEFAULT_REGION];
        const priceNum = parseFloat(String(priceUsdStr).replace(/[^0-9.]/g, '')) || 0;
        return isNaN(priceNum) ? 0 : (priceNum * regionData.rate);
    }
    // Keep old function name for backward compatibility
    function convertInrToTargetCurrency(priceUsdStr, region = DEFAULT_REGION) {
        return convertUsdToTargetCurrency(priceUsdStr, region);
    }

    function formatCurrency(amount, region = DEFAULT_REGION) {
        const regionData = EXCHANGE_RATES[region] || EXCHANGE_RATES[DEFAULT_REGION];
        return `${regionData.symbol}${amount.toFixed(2)}`;
    }

    const tableBody = document.getElementById('product-list-body');
    if (!tableBody) {
        console.error('product-list-body not found!');
        return;
    }
    console.log('product-list-body found');

    let allProducts = [];

    // --- Delete Modal Elements ---
    const deleteModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');

    // 🟢 NEW: Add Product Button Logic (Clear LocalStorage)
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            // Clear edit flags so the next page loads as a NEW product
            localStorage.removeItem('editProductId');
            localStorage.removeItem('editProductIndex');
            console.log('Cleared edit flags for new product creation.');
        });
    }
    console.log('Delete modal elements:', {
        deleteModal: !!deleteModal,
        confirmDeleteBtn: !!confirmDeleteBtn,
        cancelDeleteBtn: !!cancelDeleteBtn,
        deleteModalCloseBtn: !!deleteModalCloseBtn
    });
    let idToDelete = null; // Stored stable product ID

    // Function updated to accept the stable product ID
    const openDeleteModal = (id) => {
        console.log('openDeleteModal called with ID:', id);
        idToDelete = id;
        console.log('idToDelete set to:', idToDelete);
        if (deleteModal) {
            deleteModal.classList.add('show');
            console.log('Delete modal shown');
        } else {
            console.error('Delete modal element not found!');
        }
    };
    const closeDeleteModal = () => {
        if (deleteModal) deleteModal.classList.remove('show');
        idToDelete = null;
    };

    // --- Product View Modal Elements ---
    const productModal = document.getElementById('productViewModal');
    const productModalCloseBtn = document.getElementById('productModalCloseBtn');
    const modalEditBtn = document.getElementById('modalEditBtn');
    let indexToEdit = null;

    // Get all modal elements to populate
    const modalProductName = document.getElementById('modalProductName');
    const modalProductImageContainer = document.getElementById('modalProductImageContainer');
    const modalProductPrice = document.getElementById('modalProductPrice');
    const modalProductSalePrice = document.getElementById('modalProductSalePrice');
    const modalProductStatus = document.getElementById('modalProductStatus');
    const modalProductQuantity = document.getElementById('modalProductQuantity');
    const modalProductSku = document.getElementById('modalProductSku');
    const modalProductCode = document.getElementById('modalProductCode');
    const modalProductDesc = document.getElementById('modalProductDesc');
    const modalProductCategory = document.getElementById('modalProductCategory');
    const modalProductGender = document.getElementById('modalProductGender');
    const modalProductSizes = document.getElementById('modalProductSizes');
    const modalProductTags = document.getElementById('modalProductTags');

    // --- START: MODIFIED openProductModal function ---
    const openProductModal = (index) => {
        indexToEdit = index;
        const product = allProducts[index];
        if (!product) return;

        const quantity = product.productQuantity || product.stock || 0;
        const { statusClass, statusText } = getStatusInfo(quantity);

        // Populate modal text content
        modalProductName.textContent = product.productName || product.name || 'Product Details';
        // Handle price - convert from INR to CAD (matching customer side)
        let regularPrice = product.regularPrice || product.price || '0.00';
        regularPrice = parseFloat(regularPrice) || 0;
        const regularPriceCAD = convertInrToTargetCurrency(regularPrice);
        modalProductPrice.textContent = formatCurrency(regularPriceCAD);

        // Handle sale price - convert from INR to CAD
        let offerPrice = product.salePrice || product.discount_price || null;
        if (offerPrice !== null && offerPrice !== '') {
            offerPrice = parseFloat(offerPrice) || 0;
            const offerPriceCAD = convertInrToTargetCurrency(offerPrice);
            modalProductSalePrice.textContent = offerPrice > 0 ? formatCurrency(offerPriceCAD) : 'N/A';
        } else {
            modalProductSalePrice.textContent = 'N/A';
        }
        modalProductStatus.innerHTML = `<span class="status ${statusClass}">${statusText}</span>`;
        modalProductQuantity.textContent = quantity;
        modalProductSku.textContent = product.productSku || 'N/A';
        modalProductCode.textContent = product.productCode || 'N/A';
        modalProductDesc.textContent = product.subDescription || 'No description provided.';
        modalProductCategory.textContent = product.productCategory || 'N/A';
        modalProductGender.textContent = product.genders || 'N/A';
        modalProductSizes.textContent = product.sizes && product.sizes.length > 0 ? product.sizes.join(', ') : 'N/A';
        modalProductTags.textContent = product.productTags || 'N/A';

        // Populate image container
        if (modalProductImageContainer) {
            modalProductImageContainer.innerHTML = ''; // Clear old images
            if (product.images && product.images.length > 0) {
                product.images.forEach(imageSrc => {
                    if (imageSrc) { // Check if src is not null
                        const img = document.createElement('img');
                        img.src = imageSrc;
                        img.alt = product.productName;
                        modalProductImageContainer.appendChild(img);
                    }
                });
            } else {
                modalProductImageContainer.innerHTML = '<p>No images for this product.</p>';
            }
        }

        if (productModal) productModal.classList.add('show');
    };
    // --- END: MODIFIED openProductModal function ---

    const closeProductModal = () => {
        if (productModal) productModal.classList.remove('show');
        indexToEdit = null;
    };


    // --- Helper function to get status from stock ---
    const getStatusInfo = (stock) => {
        const stockNum = parseInt(stock, 10) || 0;
        if (stockNum === 0) {
            return { statusClass: 'cancelled', statusText: 'Out of Stock' };
        } else if (stockNum > 0 && stockNum <= 15) {
            return { statusClass: 'processing', statusText: 'Low Stock' };
        } else {
            return { statusClass: 'delivered', statusText: 'In Stock' };
        }
    };

    // --- Function to load and render products ---
    const loadProducts = async () => {
        tableBody.innerHTML = '';

        // Try to load from Django API first
        try {
            const response = await fetch('/admin/api/products/');
            if (response.ok) {
                const data = await response.json();
                if (data.products && data.products.length > 0) {
                    // Convert API product format to match localStorage format
                    allProducts = data.products.map(product => ({
                        id: product.id,
                        productName: product.name,
                        productCategory: product.category_display || product.category,
                        regularPrice: product.price ? String(product.price) : '0.00',
                        salePrice: product.discount_price ? String(product.discount_price) : null,
                        discount_price: product.discount_price ? String(product.discount_price) : null,
                        productQuantity: product.stock || 0,
                        productSku: product.slug || 'N/A',
                        productCode: product.slug || 'N/A',
                        subDescription: product.description || '',
                        genders: product.gender || 'N/A',
                        sizes: product.sizes || [],
                        productTags: product.tags?.join(', ') || '',
                        images: product.image_url ? [product.image_url] : []
                    }));
                    // Save to localStorage for consistency
                    localStorage.setItem('products', JSON.stringify(allProducts));
                } else {
                    // Fallback to localStorage if API returns empty
                    allProducts = JSON.parse(localStorage.getItem('products')) || [];
                }
            } else {
                // Fallback to localStorage if API fails
                allProducts = JSON.parse(localStorage.getItem('products')) || [];
            }
        } catch (error) {
            console.error('Error loading products from API:', error);
            // Fallback to localStorage if API fails
            allProducts = JSON.parse(localStorage.getItem('products')) || [];
        }

        allProducts.forEach((product, index) => {

            // 🟢 MODIFIED: Use the stable product.id to generate the display ID
            // This ensures the display ID is permanent and won't shift when an item is deleted.
            const stableId = product.id ? parseInt(product.id, 10) : (index + 1);
            const newIdNumber = String(stableId).padStart(3, '0');
            const newProductId = `#P-${newIdNumber}`; // <-- ID is now stable

            const quantity = product.productQuantity || product.stock || 0;
            const { statusClass, statusText } = getStatusInfo(quantity);

            const productName = (product.productName && product.productName !== "undefined") ? product.productName : (product.name || 'Unnamed Product');
            const productCategory = (product.productCategory && product.productCategory !== "undefined") ? product.productCategory : (product.category_display || product.category || 'Uncategorized');
            // Handle price - convert from INR to CAD (matching customer side)
            let regularPrice = product.regularPrice || product.price || '0.00';
            regularPrice = parseFloat(regularPrice) || 0;
            const regularPriceCAD = convertInrToTargetCurrency(regularPrice);
            const productPrice = formatCurrency(regularPriceCAD);

            // Check for offer price in multiple possible fields - convert from INR to CAD
            let offerPrice = product.salePrice || product.discount_price || null;
            let offerPriceCAD = null;
            if (offerPrice !== null && offerPrice !== '') {
                offerPrice = parseFloat(offerPrice) || 0;
                if (offerPrice > 0) {
                    offerPriceCAD = convertInrToTargetCurrency(offerPrice);
                }
            }
            const productOfferPrice = (offerPriceCAD !== null && offerPriceCAD > 0)
                ? formatCurrency(offerPriceCAD)
                : '—';

            // Customer price (what customers see) - discount_price if available, otherwise regular price
            // Convert from INR to CAD to match customer side display
            const customerPriceINR = (offerPrice !== null && offerPrice !== '' && offerPrice > 0)
                ? offerPrice
                : regularPrice;
            const customerPriceCAD = convertInrToTargetCurrency(customerPriceINR);
            const productCustomerPrice = formatCurrency(customerPriceCAD);

            const productQuantity = (product.productQuantity && product.productQuantity !== "undefined") ? product.productQuantity : (product.stock || 0);

            const placeholderImage = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='60' height='60' fill='%23e2e8f0'/%3E%3Cpath d='M48 42L36 30L24 42L12 30L12 54H48V42Z' fill='%2394a3b8'/%3E%3Ccircle cx='20' cy='24' r='4' fill='%2394a3b8'/%3E%3C/svg%3E";

            // Use the first image from the 'images' array or image_url
            const imageSrc = (product.images && product.images.length > 0 && product.images[0])
                ? product.images[0]
                : (product.image_url || placeholderImage);

            const newRow = document.createElement('tr');

            newRow.innerHTML = `
                <td>${newProductId}</td>
                <td><img src="${imageSrc}" alt="${productName}" class="product-table-image"></td>
                <td>${productName}</td>
                <td>${productCategory}</td>
                <td>${productPrice}</td>
                <td style="color: ${productOfferPrice !== '—' ? '#e74c3c' : 'inherit'}; font-weight: ${productOfferPrice !== '—' ? 'bold' : 'normal'};">${productOfferPrice}</td>
                <td style="color: ${productOfferPrice !== '—' ? '#27ae60' : 'inherit'}; font-weight: bold;">${productCustomerPrice}</td>
                <td>${productQuantity}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <a href="#" class="btn-action btn-view" data-product-index="${index}" title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </a>
                        <a href="#" class="btn-action btn-delete" data-product-id="${product.id}" title="Delete Product">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </a>
                    </div>
                </td>
            `;
            tableBody.appendChild(newRow);
        });
    };

    // --- Event listener for action buttons ---
    tableBody.addEventListener('click', (event) => {
        const viewButton = event.target.closest('.btn-view');
        const deleteButton = event.target.closest('.btn-delete');

        if (deleteButton) {
            event.preventDefault();
            // Get the stable product ID for deletion
            const productId = parseInt(deleteButton.dataset.productId, 10);
            console.log('Delete button clicked in table, product ID:', productId);
            openDeleteModal(productId);
            console.log('Delete modal opened, idToDelete set to:', idToDelete);
        }

        if (viewButton) {
            event.preventDefault();
            const productIndex = parseInt(viewButton.dataset.productIndex, 10);
            openProductModal(productIndex);
        }
    });

    // --- Initial load ---
    loadProducts();

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

    // --- Delete Modal Event Listeners ---
    console.log('Setting up delete button listener. confirmDeleteBtn:', confirmDeleteBtn);
    if (confirmDeleteBtn) {
        console.log('Delete button found, attaching event listener');
        confirmDeleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Delete button clicked! idToDelete:', idToDelete);
            if (idToDelete !== null) {
                // Disable button to prevent multiple clicks
                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.textContent = 'Deleting...';

                try {
                    const csrfToken = getCookie('csrftoken');
                    console.log('Attempting to delete product ID:', idToDelete);
                    console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');

                    // Make API call to delete product from database
                    const response = await fetch(`/admin/api/products/${idToDelete}/delete/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken || ''
                        },
                        credentials: 'same-origin'
                    });

                    console.log('Delete response status:', response.status);
                    console.log('Delete response OK:', response.ok);

                    const responseText = await response.text();
                    console.log('Delete response text:', responseText);

                    let result;
                    try {
                        result = JSON.parse(responseText);
                    } catch (e) {
                        console.error('Failed to parse response as JSON:', responseText);
                        throw new Error('Invalid response from server');
                    }

                    if (response.ok && result.success) {
                        console.log('Product deleted successfully:', result);

                        // Clear localStorage to force reload from database
                        localStorage.removeItem('products');

                        // Reload the products list to reflect the deletion
                        await loadProducts();
                        closeDeleteModal();

                        // Show success message
                        showAlert('Product deleted successfully!', 'success');
                    } else {
                        console.error('Failed to delete product:', result);
                        const errorMsg = result.message || 'Failed to delete product. Please try again.';
                        showAlert(`Error: ${errorMsg}`, 'error');
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                    showAlert(`Error deleting product: ${error.message || 'Please check the console for details'}`, 'error');
                } finally {
                    // Re-enable button
                    confirmDeleteBtn.disabled = false;
                    confirmDeleteBtn.textContent = 'Delete Product';
                }
            }
        });
    }
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModalCloseBtn) deleteModalCloseBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (event) => {
            if (event.target === deleteModal) closeDeleteModal();
        });
    }

    // --- Product View Modal Listeners ---
    if (modalEditBtn) {
        modalEditBtn.addEventListener('click', () => {
            if (indexToEdit !== null && allProducts[indexToEdit]) {
                const product = allProducts[indexToEdit];
                // Store product ID for editing (prefer database ID over localStorage index)
                if (product.id) {
                    localStorage.setItem('editProductId', product.id);
                    localStorage.removeItem('editProductIndex'); // Clear old index method
                } else {
                    // Fallback to index if no ID
                    localStorage.setItem('editProductIndex', indexToEdit);
                }
                window.location.href = '/admin/add-product/';
            }
        });
    }
    if (productModalCloseBtn) productModalCloseBtn.addEventListener('click', closeProductModal);
    if (productModal) {
        productModal.addEventListener('click', (event) => {
            if (event.target === productModal) closeProductModal();
        });
    }
});