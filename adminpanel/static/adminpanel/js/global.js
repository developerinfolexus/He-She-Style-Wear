// HeShe/js/global.js

document.addEventListener('DOMContentLoaded', function () {
    // 1. Get the current page's URL path (e.g., "/admin/products/")
    var currentPath = window.location.pathname;

    // 2. Map Django URLs to link identifiers for active state
    var urlToLinkMap = {
        '/admin/': 'admin_dashboard',
        '/admin/products/': 'admin_products',
        '/admin/add-product/': 'admin_add_product',
        '/admin/addmedia/': 'admin_addmedia',
        '/admin/orders/': 'admin_orders',
        '/admin/customers/': 'admin_customers',
        '/admin/analytics/': 'admin_analytics',
        '/admin/settings/': 'admin_settings',
        // <-- added discount mapping
        '/admin/discount/': 'admin_discount'
    };

    // 3. Normalize current path (remove trailing slash for comparison)
    var normalizedPath = currentPath.endsWith('/') && currentPath !== '/' ? currentPath.slice(0, -1) : currentPath;
    var currentPageId = urlToLinkMap[normalizedPath] || urlToLinkMap[currentPath];

    // 4. Select all sidebar navigation links
    var sidebarLinks = document.querySelectorAll('.sidebar-nav a');

    // 5. Loop through all the links
    sidebarLinks.forEach(function (link) {
        // 6. Remove any 'active' class just in case
        link.classList.remove('active');

        // 7. Get the href from the link
        var linkHref = link.getAttribute('href');

        // 8. Extract the URL name from Django URL pattern (e.g., from href="{% url 'admin_products' %}")
        // Since we can't parse Django template tags in JS, we'll match by URL path
        // Try to match the link's href with the current path
        if (linkHref) {
            // Normalize link href (remove trailing slash)
            var normalizedHref = linkHref.endsWith('/') && linkHref !== '/' ? linkHref.slice(0, -1) : linkHref;

            // Match if the normalized paths are equal
            if (normalizedHref === normalizedPath || normalizedHref === currentPath) {
                link.classList.add('active');
            }
        }
    });

    // --- START: NEW MOBILE MENU LOGIC ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const adminPanel = document.querySelector('.admin-panel');

    if (mobileMenuBtn && adminPanel) {
        mobileMenuBtn.addEventListener('click', () => {
            adminPanel.classList.toggle('sidebar-open');
        });
    }
    // --- END: NEW MOBILE MENU LOGIC ---
});

// --- DIALOG & TOAST MANAGER ---
class DialogManager {
    constructor() {
        this.init();
    }

    init() {
        // Create Toast Container
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create Global Modal Structure
        if (!document.getElementById('globalModal')) {
            const modalHTML = `
                <div id="globalModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 id="globalModalTitle">Message</h2>
                            <span class="modal-close" onclick="window.dialogManager.closeModal()">&times;</span>
                        </div>
                        <div id="globalModalBody" class="modal-body">
                            <!-- Content goes here -->
                        </div>
                        <div id="globalModalFooter" class="modal-footer">
                            <!-- Buttons go here -->
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.modal = document.getElementById('globalModal');
        this.modalTitle = document.getElementById('globalModalTitle');
        this.modalBody = document.getElementById('globalModalBody');
        this.modalFooter = document.getElementById('globalModalFooter');
    }

    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Generic Modal
    showModal(title, content, showFooter = true) {
        this.modalTitle.innerText = title;
        this.modalBody.innerHTML = content;
        this.modalFooter.style.display = showFooter ? 'flex' : 'none';
        this.modalFooter.innerHTML = `<button class="btn-confirm" onclick="window.dialogManager.closeModal()">OK</button>`;
        this.modal.classList.add('show');
    }

    // Confirm Dialog
    showConfirm(message, onConfirm, onCancel, title = 'Confirm Action', confirmText = 'Confirm', confirmClass = 'btn-confirm') {
        this.modalTitle.innerText = title;
        this.modalBody.innerHTML = `<p>${message}</p>`;
        this.modalFooter.style.display = 'flex';

        this.modalFooter.innerHTML = '';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.innerText = 'Cancel';
        cancelBtn.onclick = () => {
            this.closeModal();
            if (onCancel) onCancel();
        };

        const confirmBtn = document.createElement('button');
        confirmBtn.className = confirmClass;
        confirmBtn.innerText = confirmText;
        confirmBtn.onclick = () => {
            this.closeModal();
            if (onConfirm) onConfirm();
        };

        this.modalFooter.appendChild(cancelBtn);
        this.modalFooter.appendChild(confirmBtn);

        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
    }
}

// Initialize and Expose Globally
window.dialogManager = new DialogManager();

// Overwrite Native/Existing Helpers or create aliases
window.showAlert = (msg, type = 'info') => window.dialogManager.showToast(msg, type);
window.showConfirm = (...args) => window.dialogManager.showConfirm(...args);
// Note: We don't overwrite window.confirm() directly because it's synchronous and our modal is async (callback-based).
// We must refactor the code to use callbacks.

