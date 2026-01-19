document.addEventListener('DOMContentLoaded', () => {
    // DEBUG: Confirm new script is loaded
    console.log("Safe Pricing Script v3 Loaded");
    // Currency Change — Update Price Header Text
    // ---- Change price heading based on currency ----
    function initCurrencySwitcher() {
        // these exist inside HTML, but only after page loads
        const currencySelect = document.getElementById("inputCurrency");
        const priceHeader = document.getElementById("priceHeader");

        if (!currencySelect || !priceHeader) {
            console.log("Currency switch elements missing. Waiting...");
            setTimeout(initCurrencySwitcher, 500);
            return;
        }

        function updateCurrencyLabel() {
            if (currencySelect.value === "cad") {
                priceHeader.textContent = "Price (CA$)";
            } else {
                priceHeader.textContent = "Price ($)";
            }
        }

        currencySelect.addEventListener("change", updateCurrencyLabel);

        // run once in case edit mode has CAD
        updateCurrencyLabel();
    }

    // call the function
    initCurrencySwitcher();


    const EXCHANGE_RATES = {
        ca: { rate: 1.33, symbol: "CA$" }, // USD to CAD (1 USD = 1.33 CAD)
        us: { rate: 1.0, symbol: "US$" }   // USD to USD (no conversion)
    };
    const DEFAULT_REGION = 'us'; // Default to USD

    // Convert USD to CAD (for display when region is CAD)
    function convertUsdToCad(priceUsd) {
        const priceNum = parseFloat(priceUsd) || 0;
        return priceNum * EXCHANGE_RATES.ca.rate;
    }

    // Convert CAD to USD (for converting CAD back to USD if needed)
    function convertCadToUsd(priceCad) {
        const priceNum = parseFloat(priceCad) || 0;
        return priceNum / EXCHANGE_RATES.ca.rate;
    }

    // --- Get elements ---
    const productForm = document.getElementById('newProductForm');
    const pageTitle = document.querySelector('.main-header h1');
    const submitButton = productForm.querySelector('button[type="submit"]');

    // --- Check for Edit Mode ---
    const editProductId = localStorage.getItem('editProductId');
    const editProductIndex = localStorage.getItem('editProductIndex');
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let productToEdit = null;
    const removedFields = new Set(); // Track Removed Fields

    // Prefer loading from database by ID, fallback to localStorage by index
    if (editProductId) {
        // Set title and button immediately to show we're in edit mode
        if (pageTitle) pageTitle.textContent = 'Edit Product';
        if (submitButton) submitButton.textContent = 'Update Product';

        // Load product from database API
        fetch(`/admin/api/products/`)
            .then(response => response.json())
            .then(data => {
                if (data.products && data.products.length > 0) {
                    // Convert both to numbers for comparison
                    const editId = parseInt(editProductId, 10);
                    const productFromDB = data.products.find(p => parseInt(p.id, 10) === editId);
                    if (productFromDB) {
                        console.log('Product found for editing:', productFromDB);
                        // Convert API format to expected format
                        productToEdit = {
                            id: productFromDB.id,
                            productName: productFromDB.name,
                            // Fix: Use raw category (lowercase) and map 'kids' -> 'kid' to match HTML value
                            productCategory: (productFromDB.category || "").toLowerCase() === 'kids' ? 'kid' : (productFromDB.category || "").toLowerCase(),
                            regularPrice: String(productFromDB.price),
                            salePrice: productFromDB.discount_price ? String(productFromDB.discount_price) : null,
                            discount_price: productFromDB.discount_price ? String(productFromDB.discount_price) : null,
                            productQuantity: productFromDB.stock || 0,
                            productSku: productFromDB.product_sku || productFromDB.slug || 'N/A',
                            productCode: productFromDB.product_code || productFromDB.slug || 'N/A',
                            subCategory: productFromDB.sub_category || '',
                            subDescription: productFromDB.description || '',
                            styleFit: productFromDB.style_fit || '',
                            shippingReturn: productFromDB.shipping_return || '',
                            productColors: productFromDB.colors || '',
                            fabric: productFromDB.fabric || '',
                            genders: productFromDB.gender || 'N/A',
                            sizes: productFromDB.sizes || [],
                            productTags: productFromDB.tags?.join(', ') || '',
                            images: productFromDB.image_url ? [productFromDB.image_url] : [],

                            // 🟢 SIZE-WISE STOCK
                            stock_s: productFromDB.stock_s || 0,
                            stock_m: productFromDB.stock_m || 0,
                            stock_l: productFromDB.stock_l || 0,
                            stock_xl: productFromDB.stock_xl || 0,
                            stock_xxl: productFromDB.stock_xxl || 0,

                            // 🟢 SIZE-WISE PRICE
                            price_s: productFromDB.price_s || '',
                            price_m: productFromDB.price_m || '',
                            price_l: productFromDB.price_l || '',
                            price_xl: productFromDB.price_xl || '',
                            price_xxl: productFromDB.price_xxl || '',

                            // 🟢 SIZE-WISE DISCOUNT
                            discount_s: productFromDB.discount_s || 0,
                            discount_m: productFromDB.discount_m || 0,
                            discount_l: productFromDB.discount_l || 0,
                            discount_xl: productFromDB.discount_xl || 0,
                            discount_xxl: productFromDB.discount_xxl || 0,

                            // 🟢 IMAGES STRUCTURE
                            images_structure: productFromDB.images_structure || {}
                        };
                        // Populate form with product data
                        populateForm(productToEdit).then(() => {
                            setupToggle('saleToggle', 'saleLabelGroup');
                            setupToggle('newToggle', 'newLabelGroup');
                            renderPreviews();
                        });
                    } else {
                        console.error('Product not found with ID:', editProductId);
                        showAlert('Product not found. Please try again.', 'error');
                        // Fallback to localStorage
                        if (editProductIndex !== null) {
                            productToEdit = products[parseInt(editProductIndex, 10)];
                            if (productToEdit) {
                                populateForm(productToEdit).then(() => {
                                    setupToggle('saleToggle', 'saleLabelGroup');
                                    setupToggle('newToggle', 'newLabelGroup');
                                    renderPreviews();
                                });
                            }
                        }
                    }
                } else {
                    console.error('No products returned from API');
                    // Fallback to localStorage
                    if (editProductIndex !== null) {
                        productToEdit = products[parseInt(editProductIndex, 10)];
                        if (productToEdit) {
                            populateForm(productToEdit).then(() => {
                                setupToggle('saleToggle', 'saleLabelGroup');
                                setupToggle('newToggle', 'newLabelGroup');
                                renderPreviews();
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error loading product from API:', error);
                // Fallback to localStorage
                if (editProductIndex !== null) {
                    productToEdit = products[parseInt(editProductIndex, 10)];
                    if (productToEdit) {
                        populateForm(productToEdit).then(() => {
                            setupToggle('saleToggle', 'saleLabelGroup');
                            setupToggle('newToggle', 'newLabelGroup');
                            renderPreviews();
                        });
                    }
                }
            });
    } else if (editProductIndex !== null) {
        productToEdit = products[parseInt(editProductIndex, 10)];
    }

    // ----------------------------------------------------------------------
    // 🟢 START: STABLE ID GENERATION LOGIC
    // ----------------------------------------------------------------------

    /**
     * Finds the maximum existing product ID and increments it to generate a new unique ID.
     */
    const generateUniqueId = (products) => {
        if (!products || products.length === 0) {
            return 1;
        }
        // Find the maximum existing ID (ensure product.id is treated as a number)
        const maxId = products.reduce((max, product) => {
            const currentId = product.id ? parseInt(product.id, 10) : 0;
            return Math.max(max, currentId);
        }, 0);
        return maxId + 1;
    };

    /**
     * Determines the stable ID for the product being created or edited.
     * This handles new products, and preserves existing IDs for edited products.
     * It also assigns an ID to legacy products that don't have one (if editing for the first time).
     */
    const getStableId = () => {
        if (productToEdit && productToEdit.id) {
            // If editing and ID exists, preserve it.
            return productToEdit.id;
        }
        // If adding NEW product OR editing a legacy product without an ID, generate a new, stable ID.
        return generateUniqueId(products);
    };

    // ----------------------------------------------------------------------
    // 🟢 END: STABLE ID GENERATION LOGIC
    // ----------------------------------------------------------------------


    // --- File Input & Drag/Drop Logic ---
    const dropZone = document.getElementById('image-drop-zone');
    const fileInput = document.getElementById('productImage');
    const fileNameSpan = document.getElementById('fileName');
    const previewContainer = document.getElementById('image-preview-container');

    // fileBuffer ONLY holds NEW files (File objects)
    let fileBuffer = [];
    // We will use the form's dataset to hold existing images (Data URLs)
    if (productForm) {
        productForm.dataset.existingImages = '[]';
    }

    // ----------------------------------------------------------------------
    // 🚀 START: CATEGORY LOGIC INTEGRATION
    // ----------------------------------------------------------------------

    // ----------------------------------------------------------------------
    // 🚀 START: CATEGORY LOGIC INTEGRATION
    // ----------------------------------------------------------------------

    // --- Element References for Sub-Categories ---
    const mainCategorySelect = document.getElementById('productCategory');
    const subCategoryGroup = document.getElementById('subCategoryGroup'); // Assuming you use this ID
    const subCategoryLabel = document.getElementById('subCategoryLabel'); // Assuming you use this ID
    const subCategorySelect = document.getElementById('subCategory'); // Assuming you use this ID

    // --- Rendering Function for Sub-Categories ---
    async function populateSubCategories(categoryKey) {
        // Clear previous options
        if (!subCategorySelect) return;
        subCategorySelect.innerHTML = '<option value="" disabled selected>Select Sub-Category</option>';

        // Map 'kid' to 'kids' (DB expects 'kids')
        const apiGender = categoryKey === 'kid' ? 'kids' : categoryKey;

        // Only fetch for supported genders
        if (!['women', 'kids', 'men'].includes(apiGender)) {
            // Hide if unknown category or not supported
            if (subCategoryGroup) subCategoryGroup.style.display = 'none';
            subCategorySelect.removeAttribute('required');
            return;
        }

        try {
            // Fetch dynamic options from Managed SubCategories API
            const response = await fetch(`/adminpanel/api/managed-subcategories/get/?gender=${encodeURIComponent(apiGender)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.subcategories) && data.subcategories.length > 0) {

                    data.subcategories.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.name; // Use the name from DB as value
                        option.textContent = sub.name; // Display name as is
                        subCategorySelect.appendChild(option);
                    });

                    if (subCategoryGroup) {
                        subCategoryGroup.style.display = 'block';
                        // Update label if needed
                        if (apiGender === 'women' && subCategoryLabel) subCategoryLabel.textContent = 'Dress Type';
                        else if (apiGender === 'kids' && subCategoryLabel) subCategoryLabel.textContent = 'Kids Garment Type';
                        else if (subCategoryLabel) subCategoryLabel.textContent = 'Sub-Category';
                    }
                    subCategorySelect.setAttribute('required', 'required');
                } else {
                    // No subcategories found for this gender
                    if (subCategoryGroup) subCategoryGroup.style.display = 'none';
                    subCategorySelect.value = '';
                    subCategorySelect.removeAttribute('required');
                }
            } else {
                console.error("API response not ok");
                if (subCategoryGroup) subCategoryGroup.style.display = 'none';
            }
        } catch (e) {
            console.error("Failed to fetch subcategories", e);
            if (subCategoryGroup) subCategoryGroup.style.display = 'none';
        }
    }

    // --- Event Listeners for Adding New Sub-Category ---
    // const addSubCategoryBtn = document.getElementById('addSubCategoryBtn');
    // const newSubCategoryContainer = document.getElementById('newSubCategoryContainer');
    // const saveSubCategoryBtn = document.getElementById('saveSubCategoryBtn');
    // const cancelSubCategoryBtn = document.getElementById('cancelSubCategoryBtn');
    // const newSubCategoryInput = document.getElementById('newSubCategoryInput');

    if (addSubCategoryBtn && newSubCategoryContainer && saveSubCategoryBtn && cancelSubCategoryBtn && newSubCategoryInput) {

        // Show input
        addSubCategoryBtn.addEventListener('click', () => {
            newSubCategoryContainer.style.display = 'block';
            newSubCategoryInput.focus();
        });

        // Hide input
        cancelSubCategoryBtn.addEventListener('click', () => {
            newSubCategoryContainer.style.display = 'none';
            newSubCategoryInput.value = '';
        });

        // Save new sub-category (Client-side only until product save)
        saveSubCategoryBtn.addEventListener('click', () => {
            const newVal = newSubCategoryInput.value.trim();
            if (newVal) {
                // Create option
                const option = document.createElement('option');
                option.value = newVal;
                option.textContent = newVal.charAt(0).toUpperCase() + newVal.slice(1);
                option.selected = true;
                subCategorySelect.appendChild(option);

                // Trigger change if needed
                subCategorySelect.dispatchEvent(new Event('change'));

                // Cleanup
                newSubCategoryContainer.style.display = 'none';
                newSubCategoryInput.value = '';
            }
        });
    }

    // ------------ FABRIC SECTION ------------
    const fabricOptionsData = {
        women: {
            label: "Fabric Type",
            options: [
                { value: "georgette", name: "Georgette" },
                { value: "silk", name: "Silk" },
                { value: "cotton", name: "Cotton" },
                { value: "chiffon", name: "Chiffon" },
                { value: "velvet", name: "Velvet" },
                { value: "net", name: "Net" }
            ]
        },
        men: {
            label: "Fabric Type",
            options: [
                { value: "cotton", name: "Cotton" },
                { value: "linen", name: "Linen" },
                { value: "silk", name: "Silk" },
                { value: "velvet", name: "Velvet" },
                { value: "rayon", name: "Rayon" }
            ]
        },
        kid: {
            label: "Fabric Type",
            options: [
                { value: "cotton", name: "Cotton" },
                { value: "silk blend", name: "Silk Blend" },
                { value: "net", name: "Net" },
                { value: "rayon", name: "Rayon" },
                { value: "denim", name: "Denim" },
                { value: "linen", name: "linen" }
            ]
        }
    };

    function populateFabricDropdown(categoryKey) {
        if (!fabricSelect) return;
        fabricSelect.innerHTML = '<option value="" disabled selected>Select Fabric</option>';

        const fabricInfo = fabricOptionsData[categoryKey];

        if (fabricInfo && fabricInfo.options) {
            fabricInfo.options.forEach(item => {
                const option = document.createElement("option");
                option.value = item.value;
                option.textContent = item.name;
                fabricSelect.appendChild(option);
            });

            // Add custom option
            fabricSelect.innerHTML += `<option value="other">Other</option>`;
        }
    }



    const fabricSelect = document.getElementById("productFabric");
    const customFabricInput = document.getElementById("customFabric");

    // function updateFabrics(cat) {
    //     const fabrics = fabricOptions[cat] || [];
    //     fabricSelect.innerHTML = `<option value="" disabled selected>Select Fabric</option>`;

    //     fabrics.forEach(f => {
    //         fabricSelect.innerHTML += `<option value="${f.toLowerCase()}">${f}</option>`;
    //     });

    //     fabricSelect.innerHTML += `<option value="other">Other</option>`;
    // }

    // // Show custom fabric field when "Other"
    // fabricSelect.addEventListener("change", () => {
    //     if (fabricSelect.value === "other") {
    //         customFabricInput.style.display = "block";
    //         customFabricInput.required = true;
    //     } else {
    //         customFabricInput.style.display = "none";
    //         customFabricInput.required = false;
    //     }
    // });

    // Default on page load
    if (mainCategorySelect) {
        populateFabricDropdown(mainCategorySelect.value);
    }


    // --- Event Listener for Main Category Change ---
    if (mainCategorySelect) {
        mainCategorySelect.addEventListener('change', function () {
            populateSubCategories(this.value);
            populateFabricDropdown(this.value);
        });

    }

    // ----------------------------------------------------------------------
    // 🚀 END: CATEGORY LOGIC INTEGRATION
    // ----------------------------------------------------------------------


    // --- START: MODIFIED RENDER PREVIEWS ---
    const renderPreviews = () => {
        if (!previewContainer || !fileNameSpan) return;

        // 1. Clear existing previews
        previewContainer.innerHTML = '';

        // 2. Get existing images (as data URLs)
        const existingImages = JSON.parse(productForm.dataset.existingImages || '[]');

        // 3. Render existing images
        existingImages.forEach((imageSrc, index) => {
            if (imageSrc) {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';

                const img = document.createElement('img');
                img.src = imageSrc;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image-btn';
                removeBtn.textContent = '×';
                removeBtn.type = 'button';
                removeBtn.dataset.index = index;
                removeBtn.dataset.type = 'existing'; // Mark as existing

                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                previewContainer.appendChild(wrapper);
            }
        });

        // 4. Render NEW images from fileBuffer (File objects)
        fileBuffer.forEach((file, index) => {
            // Ensure it's an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'image-preview-wrapper';

                    const img = document.createElement('img');
                    img.src = e.target.result;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-image-btn';
                    removeBtn.textContent = '×';
                    removeBtn.type = 'button';
                    removeBtn.dataset.index = index;
                    removeBtn.dataset.type = 'new'; // Mark as new

                    wrapper.appendChild(img);
                    wrapper.appendChild(removeBtn);
                    previewContainer.appendChild(wrapper);
                };

                reader.readAsDataURL(file);
            }
        });

        // 5. Update the text display
        const totalImages = existingImages.length + fileBuffer.length;
        if (totalImages > 1) {
            fileNameSpan.textContent = `${totalImages} files selected`;
        } else if (totalImages === 1) {
            // Get the name (either from existing URL or new file)
            const name = existingImages.length === 1 ? 'Existing image' : fileBuffer[0].name;
            fileNameSpan.textContent = name;
        } else {
            fileNameSpan.textContent = 'or drag files here';
        }

        // 6. Update the hidden file input (only with NEW files)
        const dataTransfer = new DataTransfer();
        fileBuffer.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    };
    // --- END: MODIFIED RENDER PREVIEWS ---


    function previewImage(inputId, previewId, btnId) {
        const fileInput = document.getElementById(inputId);
        const previewImg = document.getElementById(previewId);
        const removeBtn = document.getElementById(btnId);

        if (fileInput) {
            fileInput.addEventListener("change", function () {
                if (this.files && this.files[0]) {
                    previewImg.src = URL.createObjectURL(this.files[0]);
                    if (removeBtn) removeBtn.style.display = 'block';
                }
            });
        }
    }

    previewImage("productImage1", "preview1", "removeThumb1");
    previewImage("productImage2", "preview2", "removeThumb2");
    previewImage("productImage3", "preview3", "removeThumb3");

    // This function ADDS new files to the buffer
    const handleNewFiles = (files) => {
        fileBuffer.push(...Array.from(files));
        renderPreviews();
    };


    // --- Helper function to populate the form ---
    const populateForm = async (product) => {
        if (!product) return;

        // Set simple text/number/select values
        const safeSetValue = (id, value) => {
            const elem = document.getElementById(id);
            if (elem) elem.value = value || '';
        };

        safeSetValue('productName', product.productName);
        safeSetValue('subDescription', product.subDescription);
        safeSetValue('styleFit', product.styleFit);
        safeSetValue('shippingReturn', product.shippingReturn);
        // safeSetValue('productContent', product.productContent);
        safeSetValue('productCode', product.productCode);
        safeSetValue('productSku', product.productSku);
        safeSetValue('productQuantity', product.productQuantity || 0);
        safeSetValue('productCategory', product.productCategory || 'women');
        safeSetValue('regularPrice', product.regularPrice); // Fix: Ensure price is populated

        // 🚀 NEW: Populate Sub-Category 
        // Must await populateSubCategories BEFORE setting its value
        await populateSubCategories(product.productCategory);

        // Debugging: Check what we are trying to set
        console.log("Setting sub-category to:", product.subCategory);

        if (product.subCategory && subCategorySelect) {
            // Trim and match robustly
            const valToSet = product.subCategory.trim();

            // Allow setting value even if not in options (by adding it dynamically if missing - handled by populateSubCategories implicitly if API is consistent, but let's be safe)
            // Actually populateSubCategories fetches distinct vals, so it SHOULD be there.

            // Iterate and find match (case-insensitive)
            let matched = false;
            for (let i = 0; i < subCategorySelect.options.length; i++) {
                if (subCategorySelect.options[i].value.toLowerCase() === valToSet.toLowerCase()) {
                    subCategorySelect.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            // If not matched (maybe new custom category not yet in API/Defaults?), force add it
            if (!matched && valToSet) {
                const option = document.createElement('option');
                option.value = valToSet;
                option.textContent = valToSet.charAt(0).toUpperCase() + valToSet.slice(1);
                option.selected = true;
                subCategorySelect.appendChild(option);
            }
        }

        safeSetValue('productColors', product.productColors);
        safeSetValue('productTags', product.productTags);

        // Prices are now stored in USD, display directly
        // Prices are now stored in USD, display directly
        // (Legacy pricing fields are removed)

        if (product.genders) {
            // Uncheck all first
            document.querySelectorAll('input[name="gender"]').forEach(el => el.checked = false);
            const genderRadio = document.querySelector(`input[name="gender"][value="${product.genders}"]`);
            if (genderRadio) genderRadio.checked = true;
        }

        if (product.sizes && Array.isArray(product.sizes)) {
            // Uncheck all first
            document.querySelectorAll('input[name="sizes"]').forEach(el => el.checked = false);
            product.sizes.forEach(size => {
                const sizeCheckbox = document.querySelector(`input[name="sizes"][value="${size}"]`);
                if (sizeCheckbox) sizeCheckbox.checked = true;
            });
        }

        // 🟢 SIZE-WISE SALE LABELS (Population)
        const sizes = ['s', 'm', 'l', 'xl', 'xxl'];
        sizes.forEach(size => {
            // Toggle
            const toggleId = `saleToggle_${size}`;
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                // Check if is_sale_[size] is true (bool or 'on', handle api response flexibility)
                // API usually returns bool for is_sale_x
                const isSale = product[`is_sale_${size}`] === true || product[`is_sale_${size}`] === 'on' || product[`is_sale_${size}`] === 1;
                toggle.checked = isSale;
            }

            // Label
            const labelInputId = `saleLabel_${size}`;
            const labelVal = product[`sale_label_${size}`];
            if (labelVal) {
                safeSetValue(labelInputId, labelVal);
            }
        });

        // Remove legacy global sale label logic
        if (product.salePrice || product.discount_price) {
            // Prices are now stored in USD, display directly (Legacy support for old data fields if needed visually, but UI is removed)
            const salePriceUSD = parseFloat(product.salePrice || product.discount_price || '0.00');
            // safeSetValue('salePrice', salePriceUSD > 0 ? salePriceUSD.toFixed(2) : '0.00');
        }
        if (product.newLabel) {
            const newTog = document.getElementById('newToggle');
            if (newTog) newTog.checked = true;
            safeSetValue('newLabel', product.newLabel);

            // Show the group
            const newGroup = document.getElementById('newLabelGroup');
            if (newGroup) newGroup.style.display = 'block';
        }

        const pubTog = document.getElementById('publishToggle');
        if (pubTog) pubTog.checked = product.isPublished !== false;

        // --- NEW: Populate Discount and Coupon Fields ---
        // --- NEW: Populate Discount and Coupon Fields ---
        // (Discount logic moved to size-specific fields)

        // Set default: if allowCoupons is not defined, check the box (true)
        const couponElem = document.getElementById('allowCoupons');
        if (couponElem) couponElem.checked = product.allowCoupons !== false;

        // --- Manually trigger the discount UI update on load (REMOVED) ---
        // (Legacy discount UI removed)
        // --- END NEW ---

        // 🟢 POPULATE SIZE-WISE DISCOUNTS & STOCK & PRICE
        // Helper for setting inputs safely
        const setInput = (name, val) => {
            const input = document.querySelector(`input[name="${name}"]`);
            if (input) input.value = val !== undefined && val !== null ? val : '';
        };

        setInput('discount_s', product.discount_s);
        setInput('discount_m', product.discount_m);
        setInput('discount_l', product.discount_l);
        setInput('discount_xl', product.discount_xl);
        setInput('discount_xxl', product.discount_xxl);

        setInput('stock_s', product.stock_s);
        setInput('stock_m', product.stock_m);
        setInput('stock_l', product.stock_l);
        setInput('stock_xl', product.stock_xl);
        setInput('stock_xxl', product.stock_xxl);

        setInput('price_s', product.price_s);
        setInput('price_m', product.price_m);
        setInput('price_l', product.price_l);
        setInput('price_xl', product.price_xl);
        setInput('price_xxl', product.price_xxl);

        // 🟢 POPULATE FABRIC
        populateFabricDropdown(product.productCategory || 'women');
        if (product.fabric && fabricSelect) {
            // Check if fabric is standard
            let found = false;
            for (let i = 0; i < fabricSelect.options.length; i++) {
                if (fabricSelect.options[i].value === product.fabric.toLowerCase()) {
                    fabricSelect.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found && product.fabric) {
                // Set to 'other' and fill custom
                fabricSelect.value = 'other';
                // We don't have custom fabric input exposed in this snippet, but valid logic
            }
        }


        // MODIFICATION: Handle Structured Images (Main + Thumbnails)
        if (product.images_structure) {
            // 1. Main Image -> previewContainer
            if (product.images_structure.image) {
                productForm.dataset.existingImages = JSON.stringify([product.images_structure.image]);
            } else {
                productForm.dataset.existingImages = '[]';
            }

            // 2. Thumbnails -> preview1, preview2, preview3
            const setThumb = (key, imgId, btnId) => {
                const url = product.images_structure[key];
                const img = document.getElementById(imgId);
                const btn = document.getElementById(btnId);
                if (url && img) {
                    img.src = url;
                    if (btn) btn.style.display = 'block';
                }
            };
            setThumb('thumbnail1', 'preview1', 'removeThumb1');
            setThumb('thumbnail2', 'preview2', 'removeThumb2');
            setThumb('thumbnail3', 'preview3', 'removeThumb3');

        } else if (product.images) {
            // Fallback for old data format
            productForm.dataset.existingImages = JSON.stringify(product.images);
        }
    };
    // --- END: Helper function ---


    // --- Helper function for toggles ---
    const setupToggle = (toggleId, targetGroupId) => {
        const toggle = document.getElementById(toggleId);
        const targetGroup = document.getElementById(targetGroupId);

        if (!toggle || !targetGroup) return;

        const targetInput = targetGroup.querySelector('input[type="text"], input[type="number"]');

        const updateState = () => {
            const isEnabled = toggle.checked;
            targetGroup.style.opacity = isEnabled ? '1' : '0.5';
            if (targetInput) {
                targetInput.disabled = !isEnabled;
            }
        };
        updateState();
        toggle.addEventListener('change', updateState);
    };

    // --- Initialize Toggles ---
    setupToggle('saleToggle', 'saleLabelGroup');
    setupToggle('newToggle', 'newLabelGroup');

    // ----------------------------------------------------------------------
    // 🚀 START: NEW DISCOUNT SCRIPT ADDED HERE (Legacy removed)
    // ---------------------------------------------------------------------- 
    // ----------------------------------------------------------------------
    // 🚀 END: NEW DISCOUNT SCRIPT
    // ----------------------------------------------------------------------


    // --- File Input Event Listeners ---
    if (dropZone && fileInput && fileNameSpan && previewContainer) {

        // 1. "Browse" button REPLACES all images
        fileInput.addEventListener('change', () => {
            fileBuffer = []; // Clear new file buffer
            productForm.dataset.existingImages = '[]'; // Clear existing images
            handleNewFiles(fileInput.files);
        });

        // 2. Drag and Drop Event Listeners
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });



        // 3. "Drop" event ADDS to existing images (Main Image Only)
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleNewFiles(files); // Add new files
        }, false);

        // 🟢 Remove Logic for Thumbnails
        const setupRemoveThumb = (btnId, key, previewId, inputId) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // prevent label click

                    // Mark as removed
                    removedFields.add(key);
                    console.log(`Marked ${key} for removal`);

                    // Reset Preview
                    const img = document.getElementById(previewId);
                    if (img) img.src = '/static/adminpanel/images/no-image.png'; // Use valid static path or placeholder

                    // Hide Button
                    btn.style.display = 'none';

                    // Clear Input if any new file was selected
                    const input = document.getElementById(inputId);
                    if (input) input.value = '';
                });
            }
        };

        setupRemoveThumb('removeThumb1', 'thumbnail1', 'preview1', 'productImage1');
        setupRemoveThumb('removeThumb2', 'thumbnail2', 'preview2', 'productImage2');
        setupRemoveThumb('removeThumb3', 'thumbnail3', 'preview3', 'productImage3');

        // Also handle removing Main Image (via renderPreviews)
        // Note: renderPreviews handles 'existing' images by splicing dataset.existingImages
        // We need to intercept that to add to removedFields if it's the main image.


        // 4. MODIFIED: Event listener for remove buttons
        previewContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-image-btn')) {
                const indexToRemove = parseInt(e.target.dataset.index, 10);
                const type = e.target.dataset.type;

                if (type === 'existing') {
                    // Remove from existing images dataset
                    const existing = JSON.parse(productForm.dataset.existingImages || '[]');
                    existing.splice(indexToRemove, 1);
                    productForm.dataset.existingImages = JSON.stringify(existing);

                    // If index 0 was the main image and it was existing, mark 'image' as removed
                    // But wait, existingImages could be a list. 
                    // However, we populated it with just [product.images_structure.image] (if existed).
                    // So if index 0 is removed, it IS the main image.
                    if (indexToRemove === 0) {
                        removedFields.add('image');
                        console.log('Marked main image for removal');
                    }
                } else if (type === 'new') {
                    // Remove from new file buffer
                    fileBuffer.splice(indexToRemove, 1);
                }

                // Re-render all previews
                renderPreviews();
            }
        });
    }


    // --- Helper function to read file as Data URL ---
    const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // Helper to read all files
    const readAllFilesAsDataURLs = (files) => {
        const promises = files.map(file => readFileAsDataURL(file));
        return Promise.all(promises);
    };

    //     const fabricSelect = document.getElementById("productFabric");
    // const customFabricInput = document.getElementById("customFabric");

    fabricSelect.addEventListener("change", function () {
        if (this.value === "custom") {
            customFabricInput.style.display = "block";
            customFabricInput.required = true;
        } else {
            customFabricInput.style.display = "none";
            customFabricInput.required = false;
        }
    });



    // --- MODIFIED: Form Submission Logic ---
    if (productForm) {
        productForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const getCheckedValues = (name) => {
                return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
                    .map(cb => cb.value);
            };

            const getRadioValue = (name) => {
                const selected = document.querySelector(`input[name="${name}"]:checked`);
                return selected ? selected.value : null;
            };

            // Helper function to convert data URL to File object
            const dataURLtoFile = (dataurl, filename) => {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], filename, { type: mime });
            };

            try {
                // Helper to safely get element value
                const safeGetValue = (id) => {
                    const elem = document.getElementById(id);
                    return elem ? elem.value : '';
                };

                // Prepare FormData for Django submission
                const formData = new FormData();

                // Basic product information
                formData.append('productName', safeGetValue('productName'));
                formData.append('subDescription', safeGetValue('subDescription'));
                // formData.append('productContent', safeGetValue('productContent'));
                formData.append('productCode', safeGetValue('productCode'));
                formData.append('productSku', safeGetValue('productSku'));
                formData.append('stock', safeGetValue('productQuantity') || 0);

                // ✅ Normalize subcategory to lowercase to prevent duplicates
                const rawSubCategory = safeGetValue('subCategory');
                const normalizedSubCategory = rawSubCategory ? rawSubCategory.trim().toLowerCase() : '';
                formData.append('subCategory', normalizedSubCategory);

                // Fix: 'colors' was mismatching with 'productColors' expected by views.py
                formData.append('productColors', safeGetValue('productColors'));
                formData.append('fabric', safeGetValue('productFabric'));
                formData.append('tags', safeGetValue('productTags'));
                formData.append('styleFit', safeGetValue('styleFit'));
                formData.append('shippingReturn', safeGetValue('shippingReturn'));

                // Helper for safe query selector
                const safeQueryValue = (selector, fallback = '') => {
                    const el = document.querySelector(selector);
                    return el ? el.value : fallback;
                };

                // 🟢 SIZE-WISE STOCK
                formData.append('stock_s', safeQueryValue('input[name="stock_s"]', '0'));
                formData.append('stock_m', safeQueryValue('input[name="stock_m"]', '0'));
                formData.append('stock_l', safeQueryValue('input[name="stock_l"]', '0'));
                formData.append('stock_xl', safeQueryValue('input[name="stock_xl"]', '0'));
                formData.append('stock_xxl', safeQueryValue('input[name="stock_xxl"]', '0'));

                // 🟢 SIZE-WISE PRICE
                formData.append('price_s', safeQueryValue('input[name="price_s"]'));
                formData.append('price_m', safeQueryValue('input[name="price_m"]'));
                formData.append('price_l', safeQueryValue('input[name="price_l"]'));
                formData.append('price_xl', safeQueryValue('input[name="price_xl"]'));
                formData.append('price_xxl', safeQueryValue('input[name="price_xxl"]'));

                // 🟢 SIZE-WISE DISCOUNT (%)
                formData.append('discount_s', safeQueryValue('input[name="discount_s"]', '0'));
                formData.append('discount_m', safeQueryValue('input[name="discount_m"]', '0'));
                formData.append('discount_l', safeQueryValue('input[name="discount_l"]', '0'));
                formData.append('discount_xl', safeQueryValue('input[name="discount_xl"]', '0'));
                formData.append('discount_xxl', safeQueryValue('input[name="discount_xxl"]', '0'));

                // 🟢 SIZE-WISE SALE LABELS
                const appendSaleInfo = (size) => {
                    const isSale = document.getElementById(`saleToggle_${size}`)?.checked;
                    formData.append(`is_sale_${size}`, isSale ? 'on' : '');
                    formData.append(`sale_label_${size}`, isSale ? safeQueryValue(`input[name="sale_label_${size}"]`) : '');
                };
                ['s', 'm', 'l', 'xl', 'xxl'].forEach(appendSaleInfo);




                // Category and gender
                const categoryElem = document.getElementById('productCategory');
                const category = categoryElem ? categoryElem.value : 'women'; // Default or handle error
                formData.append('category', category);

                const gender = getRadioValue('gender');
                if (gender) {
                    formData.append('gender', gender);
                }

                // Sizes
                const sizes = getCheckedValues('sizes');
                sizes.forEach(size => {
                    formData.append('sizes', size);
                });

                // ... (pricing logic follows) ...

                // Pricing - Store prices in USD directly (no conversion needed)
                // AUTO-CALCULATION: Get max price from sizes
                const currencyElem = document.getElementById('inputCurrency');
                const inputCurrency = currencyElem ? currencyElem.value : 'usd';

                // Convert CAD to USD
                function convertToUSD(amount) {
                    amount = parseFloat(amount) || 0;
                    if (inputCurrency === "cad") {
                        return amount / 1.33;
                    }
                    return amount;  //new
                }
                const getPrice = (name) => {
                    const el = document.querySelector(`input[name="${name}"]`);
                    return el ? parseFloat(el.value) || 0 : 0; //old
                };

                // const priceS = getPrice('price_s');
                // const priceM = getPrice('price_m');
                // const priceL = getPrice('price_l'); //old
                // const priceXL = getPrice('price_xl');
                // const priceXXL = getPrice('price_xxl');
                const priceS = convertToUSD(getPrice('price_s'));
                const priceM = convertToUSD(getPrice('price_m')); //new
                const priceL = convertToUSD(getPrice('price_l'));
                const priceXL = convertToUSD(getPrice('price_xl'));
                const priceXXL = convertToUSD(getPrice('price_xxl'));

                // Use the highest price as the base "regularPrice"
                const computedRegularPrice = Math.max(priceS, priceM, priceL, priceXL, priceXXL);
                const regularPriceUSD = computedRegularPrice > 0 ? computedRegularPrice : 0;

                formData.append('price', regularPriceUSD.toFixed(2));

                // Remove Sale Price / Discount Price logic as per request to remove fields
                // const salePrice = document.getElementById('saleToggle').checked ? document.getElementById('salePrice').value : '';
                // if (salePrice) {
                //     const salePriceUSD = parseFloat(salePrice) || 0;
                //     formData.append('discountPrice', salePriceUSD.toFixed(2));
                // }
                formData.append('discountPrice', ''); // Clear it if it was set

                // Tags
                const tagsElem = document.getElementById('productTags');
                formData.append('productTags', tagsElem ? tagsElem.value : '');

                // Featured status
                const publishToggle = document.getElementById('publishToggle');
                formData.append('isFeatured', (publishToggle && publishToggle.checked) ? 'on' : '');

                // Product ID if editing
                if (productToEdit && productToEdit.id) {
                    formData.append('productId', productToEdit.id);
                }

                // Handle images - convert data URLs to File objects
                // 1. Get NEW images (from fileBuffer)
                const newImageSrcs = await readAllFilesAsDataURLs(fileBuffer);

                // 2. Get REMAINING existing images
                const existingImages = JSON.parse(productForm.dataset.existingImages || '[]');

                // 3. Combine them
                const finalImages = existingImages.concat(newImageSrcs);

                // Add the first image as the main product image (Django expects a single file)
                if (finalImages.length > 0 && finalImages[0]) {
                    // Check if it's a data URL or a URL
                    if (finalImages[0].startsWith('data:')) {
                        const imageFile = dataURLtoFile(finalImages[0], `product-image-${Date.now()}.png`);
                        formData.append('productImage', imageFile);
                    } else {
                        // If it's already a URL, we might need to fetch it or skip
                        // For now, we'll handle data URLs only
                        console.warn('Skipping non-data URL image:', finalImages[0]);
                    }
                }

                formData.append('removed_fields', JSON.stringify(Array.from(removedFields)));

                /** ✅ Upload 3 thumbnail images (same image or separate if selected) **/
                const thumb1Input = document.getElementById("productImage1");
                const thumb2Input = document.getElementById("productImage2");
                const thumb3Input = document.getElementById("productImage3");

                // Thumbnail 1: Check explicit input first, then fallback to drag/drop queue
                if (thumb1Input && thumb1Input.files && thumb1Input.files[0]) {
                    formData.append("thumbnail1", thumb1Input.files[0]);
                } else if (finalImages.length > 1 && finalImages[1] && finalImages[1].startsWith('data:')) {
                    formData.append("thumbnail1", dataURLtoFile(finalImages[1], `thumbnail1-${Date.now()}.png`));
                }

                // Thumbnail 2
                if (thumb2Input && thumb2Input.files && thumb2Input.files[0]) {
                    formData.append("thumbnail2", thumb2Input.files[0]);
                } else if (finalImages.length > 2 && finalImages[2] && finalImages[2].startsWith('data:')) {
                    formData.append("thumbnail2", dataURLtoFile(finalImages[2], `thumbnail2-${Date.now()}.png`));
                }

                // Thumbnail 3
                if (thumb3Input && thumb3Input.files && thumb3Input.files[0]) {
                    formData.append("thumbnail3", thumb3Input.files[0]);
                } else if (finalImages.length > 3 && finalImages[3] && finalImages[3].startsWith('data:')) {
                    formData.append("thumbnail3", dataURLtoFile(finalImages[3], `thumbnail3-${Date.now()}.png`));
                }


                // Submit to Django backend
                const response = await fetch('/admin/add-product/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                });

                if (response.ok) {
                    // Redirect to products page
                    window.location.href = '/admin/products/';
                } else {
                    const errorText = await response.text();
                    try {
                        const errJson = JSON.parse(errorText);
                        showAlert(errJson.message || 'Error saving product', 'error');
                    } catch (e) {
                        // Fallback to text if not JSON (e.g. server crash HTML)
                        showAlert('Error saving product: ' + errorText, 'error');
                    }
                    console.error('Error response:', errorText);
                }
            } catch (error) {
                console.error('Error submitting product:', error);
                showAlert('Error submitting product: ' + error.message, 'error');
            }
        });
    }

    // Helper function to get CSRF token from cookies
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



    // --- Run logic if in Edit Mode (from localStorage) ---
    // Note: If editProductId is set, product will be loaded from API above
    if (productToEdit && !editProductId) {
        if (pageTitle) pageTitle.textContent = 'Edit Product';
        if (submitButton) submitButton.textContent = 'Update Product';

        populateForm(productToEdit);

        // Toggles are already set up within populateForm, but re-run just in case
        setupToggle('newToggle', 'newLabelGroup');

        // Setup size-wise toggles
        const sizes = ['s', 'm', 'l', 'xl', 'xxl'];
        sizes.forEach(size => {
            const toggleId = `saleToggle_${size}`;
            const labelInputId = `saleLabel_${size}`;
            const toggle = document.getElementById(toggleId);
            const labelInput = document.getElementById(labelInputId);

            if (toggle && labelInput) {
                const updateState = () => {
                    labelInput.disabled = !toggle.checked;
                    if (!toggle.checked) labelInput.value = ''; // Optional: clear value on disable
                };
                toggle.addEventListener('change', updateState);
                updateState(); // Initial state
            }
        });
    }




    // --- MODIFICATION: Initial render
    // This will render existing images if in edit mode, or nothing if in add mode
    renderPreviews();

    // 🚀 NEW: Auto-Select Gender based on Category Change
    const productCategorySelect = document.getElementById('productCategory');

    // Define logic to sync gender
    const syncGenderWithCategory = () => {
        if (!productCategorySelect) return;

        const selectedCat = productCategorySelect.value; // 'women' or 'kid'

        // Map category value to gender value
        let genderValue = 'women'; // default
        if (selectedCat === 'kid' || selectedCat === 'kids') {
            genderValue = 'kids';
        } else if (selectedCat === 'women') {
            genderValue = 'women';
        }

        // Find and check the radio button
        const genderRadio = document.querySelector(`input[name="gender"][value="${genderValue}"]`);
        if (genderRadio) {
            genderRadio.checked = true;
        }
    };

    if (productCategorySelect) {
        productCategorySelect.addEventListener('change', syncGenderWithCategory);
    }

    // 🚀 NEW: Trigger category logic on initial load 
    // This ensures the correct sub-category dropdown appears in both Add and Edit modes.
    // We explicitly call populateSubCategories using the value that should be selected.
    const initialCategory = productToEdit ? productToEdit.productCategory : (productCategorySelect ? productCategorySelect.value : null);

    // Sync gender on load (unless it's an edit with existing gender potentially?)
    if (!productToEdit || (productToEdit && !productToEdit.genders)) {
        syncGenderWithCategory();
    }

    if (initialCategory) {
        populateSubCategories(initialCategory);
    }

    // Initialize size toggles for Add Mode as well
    if (!productToEdit) {
        const sizes = ['s', 'm', 'l', 'xl', 'xxl'];
        sizes.forEach(size => {
            const toggleId = `saleToggle_${size}`;
            const labelInputId = `saleLabel_${size}`;
            const toggle = document.getElementById(toggleId);
            const labelInput = document.getElementById(labelInputId);

            if (toggle && labelInput) {
                const updateState = () => {
                    labelInput.disabled = !toggle.checked;
                };
                toggle.addEventListener('change', updateState);
                // initial state is disabled (checked=false by default)
                updateState();
            }
        });
    }
});