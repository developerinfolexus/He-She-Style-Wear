// adminpanel/js/discount.js
// Consolidated and extended to support yearly coupon same as new-user coupon

// --------- Helper Functions ----------
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

// --------- Banner edit helpers ----------
function editText(id, btn) {
    if (!id || !btn) return;
    const element = document.getElementById(id);
    if (!element) return;
    const currentText = element.innerText || '';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.className = 'edit-input';
    input.value = currentText;

    element.parentNode.replaceChild(input, element);

    btn.innerText = 'Save';
    btn.onclick = function () { saveText(id, btn); };

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function saveText(id, editBtn, saveBtn, cancelBtn) {
    const input = saveBtn.parentNode.querySelector(".edit-input");
    const newText = input.value.trim();

    // 1. Restore UI
    const p = document.createElement("p");
    p.id = id;
    p.innerText = newText;
    input.parentNode.replaceChild(p, input);

    saveBtn.remove();
    cancelBtn.remove();
    editBtn.style.display = "inline-block";

    // 2. Add visually to banner list
    const list = document.getElementById("bannerList");
    if (list) {
        const item = document.createElement("div");
        item.className = "banner-item-box";
        item.innerHTML = `
            <div class="banner-item-text">${newText}</div>
        `;
        list.appendChild(item);
    }

    // 3. 🔥 **ACTUALLY SAVE TO DJANGO**
    const bannerInput = document.getElementById("bannerInput");
    const bannerForm = document.getElementById("bannerForm");

    if (bannerInput && bannerForm) {
        bannerInput.value = newText;
        bannerForm.submit();   // <-- This was missing / broken
    }
}





// --------- Running banner toggle ----------
// adminpanel/js/discount.js
// Consolidated and extended to support yearly coupon same as new-user coupon

// --------- Banner edit helpers ----------
// NOTE: I'm keeping the second, more complete implementation of editText/saveText
// for the running banner, but ensuring the first functions are removed/merged.
// The provided file had two versions of editText, I'm using the one with Save/Cancel logic.

// The *first* version of editText/saveText is removed/replaced by the second set below
// to ensure Save/Cancel functionality.

// --------- Running banner toggle ----------
let bannerEnabled = true;
function toggleBanner() {
    const banner = document.getElementById("bannerText");
    const editBtn = document.getElementById("bannerEditBtn");
    const toggleBtn = document.getElementById("bannerToggleBtn");

    bannerEnabled = !bannerEnabled;

    if (!bannerEnabled) {
        banner.classList.add("disabled-text");
        editBtn.disabled = true;
        toggleBtn.innerText = "Enable";
        toggleBtn.style.background = "#d9534f";
    } else {
        banner.classList.remove("disabled-text");
        editBtn.disabled = false;
        toggleBtn.innerText = "Disable";
        toggleBtn.style.background = "#444";
    }
}

// --------- Coupon editor (generic) ----------
function editCoupon(id, btn) {
    const element = document.getElementById(id);
    if (!element || !btn) return;

    const existing = element.innerText || "";

    let preCode = "";
    let preAmount = "";
    let preUnit = "%";

    try {
        const m = existing.match(/Use Code:\s*([^\u2013–-]+)\s*[-–]\s*Get\s*(.+?)\s*OFF/i);
        if (m) {
            preCode = m[1].trim();
            const amt = m[2].trim();
            if (amt.endsWith('%')) {
                preUnit = '%';
                preAmount = amt.replace('%', '').trim();
            } else if (/^CA\$/.test(amt)) {
                preUnit = 'CAD';
                preAmount = amt.replace(/^CA\$\s*/, '').replace(/,/g, '').trim();
            } else if (/^\$/.test(amt)) {
                preUnit = 'USD';
                preAmount = amt.replace(/^\$\s*/, '').replace(/,/g, '').trim();
            } else {
                preAmount = parseFloat(amt) || "";
            }
        }
    } catch (e) {
        // ignore parsing errors
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'coupon-edit-wrapper';

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.placeholder = 'Coupon Code (e.g. NEW50)';
    codeInput.value = preCode || '';
    codeInput.className = 'coupon-code-input';
    wrapper.appendChild(codeInput);

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.step = '0.01';
    amountInput.min = '0';
    amountInput.placeholder = 'Amount (e.g. 50)';
    amountInput.value = preAmount || '';
    amountInput.className = 'coupon-amount-input';
    wrapper.appendChild(amountInput);

    const unitSelect = document.createElement('select');
    unitSelect.className = 'coupon-unit-select';
    const optPercent = document.createElement('option');
    optPercent.value = '%';
    optPercent.innerText = '%';
    const optUSD = document.createElement('option');
    optUSD.value = 'USD';
    optUSD.innerText = 'USD';
    const optCAD = document.createElement('option');
    optCAD.value = 'CAD';
    optCAD.innerText = 'CAD';

    unitSelect.appendChild(optPercent);
    unitSelect.appendChild(optUSD);
    unitSelect.appendChild(optCAD);
    unitSelect.value = preUnit || '%';
    wrapper.appendChild(unitSelect);

    // Replace the paragraph element with the editor wrapper
    element.parentNode.replaceChild(wrapper, element);

    // Change Edit → Add
    btn.innerText = 'Add';
    btn.onclick = function () { saveCouponWithCurrency(id, btn, codeInput, amountInput, unitSelect); };

    // focus code input
    codeInput.focus();
}

function saveCouponWithCurrency(id, btn, codeInput, amountInput, unitSelect) {
    if (!id || !btn || !codeInput || !amountInput || !unitSelect) return;

    const code = (codeInput.value || '').trim() || 'NEW';
    const rawAmount = (amountInput.value || '').trim();
    const unit = unitSelect.value || '%';
    const amountNum = parseFloat(rawAmount);
    const hasValidNumber = !isNaN(amountNum) && amountNum >= 0;

    let formattedAmount = '';
    if (unit === '%') {
        formattedAmount = hasValidNumber ? `${amountNum}%` : '0%';
    } else if (unit === 'USD') {
        const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
        formattedAmount = hasValidNumber ? nf.format(amountNum) : nf.format(0);
    } else if (unit === 'CAD') {
        const nf = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 });
        formattedAmount = hasValidNumber ? nf.format(amountNum) : nf.format(0);
    } else {
        formattedAmount = hasValidNumber ? String(amountNum) : '0';
    }

    const displayText = `Use Code: ${code} – Get ${formattedAmount} OFF`;

    const p = document.createElement('p');
    p.id = id;
    p.innerText = displayText;

    // wrapper is the parent of codeInput
    const wrapper = codeInput.parentNode;
    wrapper.parentNode.replaceChild(p, wrapper);

    // Restore button to Edit
    btn.innerText = 'Edit';
    btn.onclick = function () { editCoupon(id, btn); };

    // Append to appropriate list if present
    if (id === 'newUserCoupon') {
        const list = document.getElementById('newUserList');
        if (list) {
            const item = document.createElement('div');
            item.className = 'coupon-item';
            item.innerText = displayText;
            list.appendChild(item);
        }
    }

    if (id === 'yearlyCoupon') {
        const list = document.getElementById('yearlyList');
        if (list) {
            const item = document.createElement('div');
            item.className = 'coupon-item';
            // add small remove button for convenience
            const textSpan = document.createElement('span');
            textSpan.innerText = displayText;

            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'Remove';
            removeBtn.className = 'remove-btn';
            removeBtn.onclick = function () { item.remove(); };

            item.appendChild(textSpan);
            item.appendChild(removeBtn);
            list.appendChild(item);
        }
    }
}

// --------- New User enable/disable ----------
let newUserEnabled = true;
function toggleNewUser() {
    const text = document.getElementById("newUserCoupon");
    const editBtn = document.getElementById("newUserEditBtn");
    const toggleBtn = document.getElementById("newUserToggleBtn");

    newUserEnabled = !newUserEnabled;

    if (!newUserEnabled) {
        text.classList.add("disabled-text");
        editBtn.disabled = true;
        toggleBtn.innerText = "Enable";
        toggleBtn.style.background = "#d9534f";
    } else {
        text.classList.remove("disabled-text");
        editBtn.disabled = false;
        toggleBtn.innerText = "Disable";
        toggleBtn.style.background = "#444";
    }
}

// --------- Monthly coupon (existing) ----------
function editMonthly(id, btn) {
    const element = document.getElementById(id);
    if (!element || !btn) return;

    const currText = element.innerText;

    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.className = "edit-input";
    input.value = currText;

    element.parentNode.replaceChild(input, element);

    btn.innerText = "Save";
    btn.onclick = function () { saveMonthly(id, btn); };

    input.focus();
}
function saveMonthly(id, btn) {
    const input = document.getElementById(id);
    if (!input) return;

    const newText = input.value;

    const p = document.createElement("p");
    p.id = id;
    p.innerText = newText;

    input.parentNode.replaceChild(p, input);

    btn.innerText = "Edit";
    btn.onclick = function () { editMonthly(id, btn); };

    // Add new monthly coupon below
    const list = document.getElementById("monthlyList");
    const item = document.createElement("div");
    item.className = "coupon-item";

    const textSpan = document.createElement("span");
    textSpan.innerText = newText;

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "Remove";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = function () {
        item.remove();
    };

    item.appendChild(textSpan);
    item.appendChild(removeBtn);
    list.appendChild(item);
}

let monthlyEnabled = true;
function toggleMonthly() {
    const text = document.getElementById("monthlyCoupon");
    const editBtn = document.getElementById("monthlyEditBtn");
    const toggleBtn = document.getElementById("monthlyToggleBtn");

    monthlyEnabled = !monthlyEnabled;

    if (!monthlyEnabled) {
        text.classList.add("disabled-text");
        editBtn.disabled = true;
        toggleBtn.innerText = "Enable";
        toggleBtn.style.background = "#d9534f";
    } else {
        text.classList.remove("disabled-text");
        editBtn.disabled = false;
        toggleBtn.innerText = "Disable";
        toggleBtn.style.background = "#444";
    }
}

// --------- Yearly enable/disable (new) ----------
let yearlyEnabled = true;
function toggleYearly() {
    const text = document.getElementById("yearlyCoupon");
    const editBtn = document.getElementById("yearlyEditBtn");
    const toggleBtn = document.getElementById("yearlyToggleBtn");

    yearlyEnabled = !yearlyEnabled;

    if (!yearlyEnabled) {
        text.classList.add("disabled-text");
        editBtn.disabled = true;
        toggleBtn.innerText = "Enable";
        toggleBtn.style.background = "#d9534f";
    } else {
        text.classList.remove("disabled-text");
        editBtn.disabled = false;
        toggleBtn.innerText = "Disable";
        toggleBtn.style.background = "#444";
    }
}

// --- New Arrivals: edit with date range + code + amount ---
// --------- Running Banner edit with Save + Cancel ----------
// This set of functions replaces the simpler (and buggy) first set for banner editing.
function editText(id, btn) {
    if (!id || !btn) return;

    const element = document.getElementById(id);
    if (!element) return;

    const currentText = element.innerText;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = currentText;

    const container = element.parentNode;

    // Replace <p> → <input>
    container.replaceChild(input, element);

    // Hide Edit button
    btn.style.display = "none";

    // Create SAVE button
    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save";
    saveBtn.className = "save-btn";
    saveBtn.onclick = function () {
        saveText(id, btn, saveBtn, cancelBtn); // Pass all buttons
    };

    // Create CANCEL button
    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Cancel";
    cancelBtn.className = "cancel-btn";
    cancelBtn.onclick = function () {
        cancelText(id, btn, input, saveBtn, cancelBtn, currentText);
    };

    // Insert Save & Cancel buttons
    container.appendChild(saveBtn);
    container.appendChild(cancelBtn);

    // Focus input
    input.focus();
}

// function saveText(id, editBtn, saveBtn, cancelBtn) {
//     // Find the input element within the same parent as the save button
//     const input = saveBtn.parentNode.querySelector(".edit-input");
//     if (!input) return;

//     const newText = input.value.trim();

//     // 1. Restore UI
//     const p = document.createElement("p");
//     p.id = id;
//     p.innerText = newText;
//     input.parentNode.replaceChild(p, input);

//     saveBtn.remove();
//     cancelBtn.remove();
//     editBtn.style.display = "inline-block"; // Show Edit again

// // 2. Add to banner list (for immediate visual feedback)
// const list = document.getElementById("bannerList");
// if (list) {
//     const item = document.createElement("div");
//     item.className = "banner-item";
//     item.innerText = newText;
//     list.appendChild(item);
//     }
// }

//     // 3. 🔥 SAVE TO DJANGO
//     // This is the essential part for form submission
//     const bannerInput = document.getElementById("bannerInput");
//     if (bannerInput) {
//         bannerInput.value = newText;
//         const bannerForm = document.getElementById("bannerForm");
//         if (bannerForm) {
//              bannerForm.submit(); // Submit the form to save to the backend
//         }
//     }
// }


function cancelText(id, editBtn, input, saveBtn, cancelBtn, oldValue) {
    const p = document.createElement("p");
    p.id = id;
    p.innerText = oldValue;

    input.parentNode.replaceChild(p, input);

    saveBtn.remove();
    cancelBtn.remove();

    editBtn.style.display = "inline-block"; // restore Edit button
}

function editNewUserCoupon(id, btn) {
    const element = document.getElementById(id);
    const currentText = element.innerText;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = currentText;

    const container = element.parentNode;
    container.replaceChild(input, element);

    btn.style.display = "none";

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save";
    saveBtn.className = "save-btn";
    saveBtn.onclick = function () {
        saveNewUserCoupon(id, btn, saveBtn, cancelBtn);
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Cancel";
    cancelBtn.className = "cancel-btn";
    cancelBtn.onclick = function () {
        cancelNewUserCoupon(id, btn, input, saveBtn, cancelBtn, currentText);
    };

    container.appendChild(saveBtn);
    container.appendChild(cancelBtn);
    input.focus();
}

function saveNewUserCoupon(id, editBtn, saveBtn, cancelBtn) {
    const input = saveBtn.parentNode.querySelector(".edit-input");
    const newText = input.value.trim();

    const p = document.createElement("p");
    p.id = id;
    p.innerText = newText;

    input.parentNode.replaceChild(p, input);

    saveBtn.remove();
    cancelBtn.remove();

    editBtn.style.display = "inline-block";

    const list = document.getElementById("newUserList");
    if (list) {
        const item = document.createElement("div");
        item.className = "coupon-item";
        item.innerText = newText;
        list.appendChild(item);
    }
}

function cancelNewUserCoupon(id, editBtn, input, saveBtn, cancelBtn, oldValue) {
    const p = document.createElement("p");
    p.id = id;
    p.innerText = oldValue;

    input.parentNode.replaceChild(p, input);

    saveBtn.remove();
    cancelBtn.remove();

    editBtn.style.display = "inline-block";
}





// ⭐ RUNNING BANNER GRID + SAVE + DELETE ⭐

// After banner saved by backend, add to grid
function addBannerToGrid(id, text) {
    const list = document.getElementById("bannerList");
    if (!list) return;

    const item = document.createElement("div");
    item.className = "banner-item-box";     // 100% width
    item.id = "banner-item-" + id;

    item.innerHTML = `
        <div class="banner-item-text">${text}</div>

        <button class="banner-disable-btn"
            onclick="deleteBanner(${id})">
            Disable
        </button>
    `;

    list.appendChild(item);
}


// ⭐ Save Banner (runs after clicking SAVE inside edit box)
function saveBannerText(newText) {
    document.getElementById("bannerInput").value = newText;
    document.getElementById("bannerForm").submit();
}


// ⭐ DELETE (Disable) banner from DB
function deleteBanner(id) {
    fetch(`/adminpanel/delete_running_banner/${id}/`, {
        method: "DELETE",
        headers: { "X-CSRFToken": getCSRFToken() }
    })
        .then(res => {
            if (res.ok) {
                const item = document.getElementById("banner-item-" + id);
                if (item) item.remove();        // Remove from grid
                return;
            }
            showAlert("Failed to delete banner.", 'error');
        });
}


// Helper to read CSRF cookie
function getCSRFToken() {
    let name = "csrftoken=";
    let decoded = decodeURIComponent(document.cookie);
    let parts = decoded.split(";");
    for (let p of parts) {
        let c = p.trim();
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}


// Load banners from DB on page load
document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/running-banners/")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("bannerList");
            list.innerHTML = ""; // Clear existing

            data.banners.forEach((text, index) => {
                const item = document.createElement("div");
                item.className = "banner-item-box";
                item.innerHTML = `
                    <div class="banner-item-text">${text}</div>
                `;
                list.appendChild(item);
            });
        });
});


function showTab(tabId, btn) {
    // Hide all sections
    document.querySelectorAll(".tab-section").forEach(sec =>
        sec.classList.remove("active")
    );

    // Show selected section
    document.getElementById(tabId).classList.add("active");

    // Switch active button
    document.querySelectorAll(".tab-btn").forEach(b =>
        b.classList.remove("active")
    );
    btn.classList.add("active");
}


function openWomenCategories() {
    document.getElementById("womenCategoryBox").classList.remove("hidden");
    // Hide Kids Section
    document.getElementById("kidsCategoryBox").classList.add("kids-hidden");
}

function addWomenCoupon() {
    let subcat = document.getElementById("womenSubcatSelect").value;
    let code = document.getElementById("womenCouponCode").value.trim().toUpperCase();
    let discount = document.getElementById("womenDiscount").value.trim();
    let unit = document.getElementById("womenDiscountUnit").value;

    if (!subcat) return showAlert("Please select a subcategory.", 'warning');
    if (!code || !discount) return showAlert("Enter coupon code and discount.", 'warning');

    // Save to database
    saveWomenCouponToDatabase(code, discount, unit, subcat);
}

function saveWomenCouponToDatabase(code, discount, unit, subcat) {
    fetch("/admin/api/coupons/save/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            code: code,
            discount_value: discount,
            discount_type: unit === "%" ? "%" : "INR",
            gender: "women",
            sub_category: subcat
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add to UI list after successful save
                let formatted = unit === "%" ? `${discount}%` : `₹${discount}`;
                let productCount = data.coupon.product_count || 0;
                let displayText = `${subcat} — Use Code: ${code} — Get ${formatted} OFF (Applied to ${productCount} product${productCount !== 1 ? 's' : ''})`;

                const list = document.getElementById("womenCouponList");
                const item = document.createElement("div");
                item.className = "coupon-item";
                item.dataset.couponCode = code;

                const textSpan = document.createElement("span");
                textSpan.innerText = displayText;

                const btnContainer = document.createElement('div');
                btnContainer.style.display = 'flex';
                btnContainer.style.gap = '10px';

                const editBtn = document.createElement("button");
                editBtn.className = "save-btn";
                editBtn.innerText = "Edit";
                editBtn.onclick = function () {
                    showWomenEditMode(item, subcat, code, discount, unit);
                };

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'cancel-btn';
                deleteBtn.innerText = 'Delete';
                deleteBtn.onclick = function () {
                    deleteCoupon(code, item);
                };

                btnContainer.appendChild(editBtn);
                btnContainer.appendChild(deleteBtn);

                item.appendChild(textSpan);
                item.appendChild(btnContainer);
                list.appendChild(item);

                document.getElementById("womenCouponCode").value = "";
                document.getElementById("womenDiscount").value = "";
                showAlert(`Coupon saved successfully! Applied to ${productCount} product${productCount !== 1 ? 's' : ''}`, 'success');
            } else {
                showAlert("Error saving coupon: " + data.error, 'error');
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showAlert("Failed to save coupon: " + error, 'error');
        });
}





function openKidsCategories() {
    document.getElementById("kidsCategoryBox").classList.remove("kids-hidden");
    // Hide Women Section
    document.getElementById("womenCategoryBox").classList.add("hidden");
}

function addKidsCoupon() {
    let subcat = document.getElementById("kidsSubcatSelect").value;
    let code = document.getElementById("kidsCouponCode").value.trim().toUpperCase();
    let discount = document.getElementById("kidsDiscount").value.trim();
    let unit = document.getElementById("kidsDiscountUnit").value;

    if (!subcat) return showAlert("Please select a subcategory.", 'warning');
    if (!code || !discount) return showAlert("Enter coupon code and discount.", 'warning');

    // Save to database
    saveKidsCouponToDatabase(code, discount, unit, subcat);
}

function saveKidsCouponToDatabase(code, discount, unit, subcat) {
    fetch("/admin/api/coupons/save/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            code: code,
            discount_value: discount,
            discount_type: unit === "%" ? "%" : "INR",
            gender: "kids",
            sub_category: subcat
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add to UI list after successful save, showing how many products were linked
                let formatted = unit === "%" ? `${discount}%` : `₹${discount}`;
                let productCount = (data.coupon && data.coupon.product_count) ? data.coupon.product_count : 0;
                let displayText = `${subcat} — Use Code: ${code} — Get ${formatted} OFF (Applied to ${productCount} product${productCount !== 1 ? 's' : ''})`;

                const list = document.getElementById("kidsCouponList");
                const item = document.createElement("div");
                item.className = "kids-coupon-item";
                item.dataset.couponCode = code;

                const textSpan = document.createElement("span");
                textSpan.innerText = displayText;

                const btnContainer = document.createElement('div');
                btnContainer.style.display = 'flex';
                btnContainer.style.gap = '10px';

                const editBtn = document.createElement("button");
                editBtn.className = "save-btn";
                editBtn.innerText = "Edit";
                editBtn.onclick = function () {
                    showKidsEditMode(item, subcat, code, discount, unit);
                };

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'cancel-btn';
                deleteBtn.innerText = 'Delete';
                deleteBtn.onclick = function () {
                    deleteCoupon(code, item);
                };

                btnContainer.appendChild(editBtn);
                btnContainer.appendChild(deleteBtn);

                item.appendChild(textSpan);
                item.appendChild(btnContainer);
                list.appendChild(item);

                // Clear inputs for convenience
                const codeInput = document.getElementById("kidsCouponCode");
                const discInput = document.getElementById("kidsDiscount");
                if (codeInput) codeInput.value = "";
                if (discInput) discInput.value = "";

                showAlert(`Coupon saved successfully! Applied to ${productCount} product${productCount !== 1 ? 's' : ''}`, 'success');
            } else {
                showAlert("Error saving coupon: " + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showAlert("Failed to save coupon: " + error, 'error');
        });
}


// --------- Load stored coupons from DB and render ---------
// --- Delete Coupon Function ---
function deleteCoupon(code, itemElement) {
    showConfirm(
        `Are you sure you want to delete coupon "${code}"? This action cannot be undone.`,
        () => {
            // CONFIRMED Action
            performDeleteCoupon(code, itemElement);
        },
        null, // No Cancel action needed
        'Delete Coupon',
        'Delete',
        'btn-danger'
    );
}

function performDeleteCoupon(code, itemElement) {
    fetch("/admin/api/coupons/delete/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ code: code })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (itemElement) itemElement.remove();
                showAlert("Coupon deleted successfully.", 'success');
            } else {
                showAlert("Error deleting coupon: " + data.message, 'error');
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showAlert("Failed to delete coupon.", 'error');
        });
}


// --------- Load stored coupons from DB and render ---------
function renderCouponList(coupons, gender) {
    if (!Array.isArray(coupons)) return;
    const listId = gender === 'women' ? 'womenCouponList' : 'kidsCouponList';
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';

    coupons.forEach(c => {
        const item = document.createElement('div');
        item.className = gender === 'women' ? 'coupon-item' : 'kids-coupon-item';
        item.dataset.couponCode = c.code;

        const formatted = c.discount_type === '%' ? `${c.discount_value}%` : `₹${c.discount_value}`;
        const productCount = c.product_count || 0;
        const displayText = `${c.sub_category || ''} — Use Code: ${c.code} — Get ${formatted} OFF` + (gender === 'women' ? ` (Applied to ${productCount} product${productCount !== 1 ? 's' : ''})` : '');

        const textSpan = document.createElement('span');
        textSpan.innerText = displayText;

        // Container for buttons
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '10px';

        const editBtn = document.createElement('button');
        editBtn.className = 'save-btn';
        editBtn.innerText = 'Edit';

        if (gender === 'women') {
            editBtn.onclick = function () {
                showWomenEditMode(item, c.sub_category, c.code, c.discount_value, c.discount_type);
            };
        } else {
            editBtn.onclick = function () {
                showKidsEditMode(item, c.sub_category, c.code, c.discount_value, c.discount_type);
            };
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'cancel-btn'; // Use cancel-btn style (red)
        deleteBtn.innerText = 'Delete';
        deleteBtn.onclick = function () {
            deleteCoupon(c.code, item);
        };

        btnContainer.appendChild(editBtn);
        btnContainer.appendChild(deleteBtn);

        item.appendChild(textSpan);
        item.appendChild(btnContainer);
        list.appendChild(item);
    });
}

function loadCouponsForGender(gender, sub_category) {
    let url = `/admin/api/coupons/get/?gender=${encodeURIComponent(gender)}`;
    if (sub_category && String(sub_category).trim()) {
        url += `&sub_category=${encodeURIComponent(sub_category)}`;
    }
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data && Array.isArray(data.coupons)) {
                renderCouponList(data.coupons, gender);
            }
        })
        .catch(err => {
            console.error('Failed to load coupons for', gender, err);
        });
}

// Load coupons on page load
document.addEventListener('DOMContentLoaded', function () {
    // Initial load: all coupons per gender
    loadCouponsForGender('women');
    loadCouponsForGender('kids');

    // Populate subcategory selects for admin UI from product DB
    loadAdminSubcategories('women', 'womenSubcatSelect');
    loadAdminSubcategories('kids', 'kidsSubcatSelect');

    // Wire up change listeners so admin sees coupons only for the selected subcategory
    const womenSelect = document.getElementById('womenSubcatSelect');
    if (womenSelect) {
        womenSelect.addEventListener('change', function (e) {
            const val = e.target.value;
            loadCouponsForGender('women', val);
        });
    }

    const kidsSelect = document.getElementById('kidsSubcatSelect');
    if (kidsSelect) {
        kidsSelect.addEventListener('change', function (e) {
            const val = e.target.value;
            loadCouponsForGender('kids', val);
        });
    }
});

// Populate admin subcategory select boxes from /api/subcategories/
async function loadAdminSubcategories(gender, selectId) {
    if (!gender || !selectId) return;
    try {
        const res = await fetch(`/api/subcategories/?gender=${encodeURIComponent(gender)}`);
        if (!res.ok) return;
        const body = await res.json();
        const subs = Array.isArray(body.subcategories) ? body.subcategories : [];
        const sel = document.getElementById(selectId);
        if (!sel) return;
        // clear existing options (keep a placeholder)
        const placeholder = sel.querySelector('option[value=""]') || null;
        sel.innerHTML = '';
        if (placeholder) sel.appendChild(placeholder);
        // ensure there's at least a default option
        if (!sel.querySelector('option')) {
            const d = document.createElement('option'); d.value = ''; d.text = 'Select subcategory'; sel.appendChild(d);
        }
        subs.forEach(sc => {
            if (!sc) return;
            const opt = document.createElement('option');
            opt.value = sc;
            opt.text = sc;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load admin subcategories for', gender, e);
    }
}



function showWomenEditMode(item, oldSubcat, oldCode, oldDiscount, oldUnit) {
    // Get categories dynamically from the main dropdown
    const realSelect = document.getElementById("womenSubcatSelect");
    let optionsHTML = "";

    if (realSelect) {
        for (let i = 0; i < realSelect.options.length; i++) {
            const opt = realSelect.options[i];
            if (!opt.value) continue; // skip placeholder
            const selected = opt.value === oldSubcat ? "selected" : "";
            // Escape double quotes in option values (basic)
            const val = String(opt.value).replace(/"/g, '&quot;');
            optionsHTML += `<option value="${val}" ${selected}>${opt.text}</option>`;
        }
    }

    item.innerHTML = `
        <select class="coupon-code-input women-edit-subcat">
            ${optionsHTML}
        </select>

        <input type="text" class="coupon-code-input women-edit-code" value="${oldCode || ''}">
        <input type="number" class="coupon-amount-input women-edit-discount" value="${oldDiscount || ''}">

        <select class="coupon-unit-select women-edit-unit">
            <option value="%" ${oldUnit === "%" ? "selected" : ""}>%</option>
            <option value="INR" ${oldUnit === "INR" ? "selected" : ""}>₹</option>
        </select>

        <button class="save-btn women-save-btn">Save</button>
        <button class="cancel-btn women-cancel-btn">Cancel</button>
    `;

    // SAVE
    item.querySelector(".women-save-btn").onclick = function () {
        let subcat = item.querySelector(".women-edit-subcat").value;
        let code = item.querySelector(".women-edit-code").value.trim();
        let discount = item.querySelector(".women-edit-discount").value;
        let unit = item.querySelector(".women-edit-unit").value;

        if (!subcat) return alert("Please select a category.");
        if (!code || !discount) return alert("Enter coupon code and discount.");

        let formatted = unit === "%" ? `${discount}%` : `₹${discount}`;
        let updatedText = `${subcat} — Use Code: ${code} — Get ${formatted} OFF`;

        item.innerHTML = `
            <span>${updatedText}</span>
            <button class="save-btn">Edit</button>
        `;

        item.querySelector("button").onclick = function () {
            showWomenEditMode(item, subcat, code, discount, unit);
        };
    };

    // CANCEL
    item.querySelector(".women-cancel-btn").onclick = function () {
        item.innerHTML = `
            <span>${oldSubcat} — Use Code: ${oldCode} — Get ${oldUnit === "%" ? oldDiscount + "%" : "₹" + oldDiscount} OFF</span>
            <button class="save-btn">Edit</button>
        `;

        item.querySelector("button").onclick = function () {
            showWomenEditMode(item, oldSubcat, oldCode, oldDiscount, oldUnit);
        };
    };
}



function showKidsEditMode(item, oldSubcat, oldCode, oldDiscount, oldUnit) {

    item.innerHTML = `
        <select class="kids-code-input kids-edit-subcat">
            <option ${oldSubcat === "Boys Wear" ? "selected" : ""}>Boys Wear</option>
            <option ${oldSubcat === "Girls Wear" ? "selected" : ""}>Girls Wear</option>
            <option ${oldSubcat === "Infant Wear" ? "selected" : ""}>Infant Wear</option>
            <option ${oldSubcat === "School Wear" ? "selected" : ""}>School Wear</option>
            <option ${oldSubcat === "Winter Wear" ? "selected" : ""}>Winter Wear</option>
        </select>

        <input type="text" class="kids-code-input kids-edit-code" value="${oldCode}">
        <input type="number" class="kids-amount-input kids-edit-discount" value="${oldDiscount}">

        <select class="kids-unit-select kids-edit-unit">
            <option value="%" ${oldUnit === "%" ? "selected" : ""}>%</option>
            <option value="INR" ${oldUnit === "INR" ? "selected" : ""}>₹</option>
        </select>

        <button class="save-btn kids-save-btn">Save</button>
        <button class="cancel-btn kids-cancel-btn">Cancel</button>
    `;


    // SAVE button
    item.querySelector(".kids-save-btn").onclick = function () {
        let subcat = item.querySelector(".kids-edit-subcat").value;
        let code = item.querySelector(".kids-edit-code").value;
        let discount = item.querySelector(".kids-edit-discount").value;
        let unit = item.querySelector(".kids-edit-unit").value;

        let formatted = unit === "%" ? `${discount}%` : `₹${discount}`;
        let updatedText = `${subcat} — Use Code: ${code} — Get ${formatted} OFF`;

        // Return to display mode
        item.innerHTML = "";

        const finalText = document.createElement("span");
        finalText.innerText = updatedText;

        const finalEditBtn = document.createElement("button");
        finalEditBtn.className = "save-btn";
        finalEditBtn.innerText = "Edit";
        finalEditBtn.onclick = function () {
            showKidsEditMode(item, subcat, code, discount, unit);
        };

        item.appendChild(finalText);
        item.appendChild(finalEditBtn);
    };

    // CANCEL button
    item.querySelector(".kids-cancel-btn").onclick = function () {

        item.innerHTML = "";

        const originalText = document.createElement("span");
        originalText.innerText =
            `${oldSubcat} — Use Code: ${oldCode} — Get ${oldUnit === "%" ? oldDiscount + "%" : "₹" + oldDiscount} OFF`;

        const originalEditBtn = document.createElement("button");
        originalEditBtn.className = "save-btn";
        originalEditBtn.innerText = "Edit";
        originalEditBtn.onclick = function () {
            showKidsEditMode(item, oldSubcat, oldCode, oldDiscount, oldUnit);
        };

        item.appendChild(originalText);
        item.appendChild(originalEditBtn);
    };
}

// ⭐ MANAGE SUBCATEGORIES LOGIC ⭐

let currentSubcatGender = 'women';

function toggleSubcatGender(gender) {
    currentSubcatGender = gender;

    // Update buttons
    document.getElementById('subcatWomenBtn').classList.toggle('active', gender === 'women');
    document.getElementById('subcatKidsBtn').classList.toggle('active', gender === 'kids');

    // Update modal hidden input
    document.getElementById('editSubcatGender').value = gender;

    // Load data
    loadSubcategories(gender);
}

function loadSubcategories(gender) {
    const list = document.getElementById('subcatList');
    list.innerHTML = '<p>Loading...</p>';

    fetch(`/adminpanel/api/managed-subcategories/get/?gender=${gender}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderSubcategories(data.subcategories);
            } else {
                list.innerHTML = `<p class="error">Error: ${data.message}</p>`;
            }
        })
        .catch(err => {
            list.innerHTML = `<p class="error">Failed to load subcategories.</p>`;
        });
}

function renderSubcategories(subcategories) {
    const list = document.getElementById('subcatList');
    list.innerHTML = '';

    if (subcategories.length === 0) {
        list.innerHTML = '<p>No subcategories found. Add one!</p>';
        return;
    }

    subcategories.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subcat-card';
        card.innerHTML = `
            <img src="${sub.image_url || '/static/images/placeholder.png'}" alt="${sub.name}">
            <h4>${sub.name}</h4>
            <p style="color: ${sub.is_active ? 'green' : 'red'}; font-size: 12px;">
                ${sub.is_active ? 'Active' : 'Inactive'}
            </p>
            <div class="subcat-actions">
                <button class="save-btn" style="font-size:12px; padding: 5px 10px;" 
                    onclick='openSubcatModal(${JSON.stringify(sub)})'>Edit</button>
                <button class="cancel-btn" style="font-size:12px; padding: 5px 10px;" 
                    onclick="deleteSubcategory(${sub.id})">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function openSubcatModal(subData = null) {
    const modal = document.getElementById('subcatModal');
    const title = document.getElementById('subcatModalTitle');
    const idInput = document.getElementById('editSubcatId');
    const nameInput = document.getElementById('subcatName');
    const activeCheck = document.getElementById('subcatActive');
    const preview = document.getElementById('subcatPreview');
    const imageInput = document.getElementById('subcatImage');

    // Reset form
    document.getElementById('subcatForm').reset();
    preview.style.display = 'none';
    preview.src = '';

    if (subData) {
        // Edit Mode
        title.innerText = 'Edit Subcategory';
        idInput.value = subData.id;
        nameInput.value = subData.name;
        activeCheck.checked = subData.is_active;
        if (subData.image_url) {
            preview.src = subData.image_url;
            preview.style.display = 'block';
        }
    } else {
        // Create Mode
        title.innerText = 'Add Subcategory';
        idInput.value = '';
        activeCheck.checked = true;
    }

    // Ensure gender is set correctly
    document.getElementById('editSubcatGender').value = currentSubcatGender;

    modal.classList.remove('hidden');
}

function closeSubcatModal() {
    document.getElementById('subcatModal').classList.add('hidden');
}

function saveSubcategory(event) {
    event.preventDefault();

    const formData = new FormData();
    const id = document.getElementById('editSubcatId').value;

    if (id) formData.append('id', id);
    formData.append('name', document.getElementById('subcatName').value);
    formData.append('gender', document.getElementById('editSubcatGender').value);
    formData.append('is_active', document.getElementById('subcatActive').checked);

    const imageFile = document.getElementById('subcatImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    fetch('/adminpanel/api/managed-subcategories/save/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert(data.message, 'success');
                closeSubcatModal();
                loadSubcategories(currentSubcatGender);
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showAlert('Error saving subcategory.', 'error');
        });
}

function deleteSubcategory(id) {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    fetch(`/adminpanel/api/managed-subcategories/${id}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showAlert('Subcategory deleted.', 'success');
                loadSubcategories(currentSubcatGender);
            } else {
                showAlert('Failed to delete: ' + data.message, 'error');
            }
        })
        .catch(err => {
            showAlert('Error deleting subcategory.', 'error');
        });
}

// Hook into showTab to load data when tab is switched
const originalShowTab = window.showTab;
window.showTab = function (tabId, btn) {
    if (typeof originalShowTab === 'function') {
        originalShowTab(tabId, btn);
    } else {
        // Fallback if originalShowTab is not defined globally yet (though it is in this file)
        document.querySelectorAll(".tab-section").forEach(sec =>
            sec.classList.remove("active")
        );
        document.getElementById(tabId).classList.add("active");
        document.querySelectorAll(".tab-btn").forEach(b =>
            b.classList.remove("active")
        );
        btn.classList.add("active");
    }

    if (tabId === 'manageSubcatTab') {
        loadSubcategories(currentSubcatGender);
    }
};
