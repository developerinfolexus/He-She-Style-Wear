// Wait for the document to be fully loaded before running script
document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Handle the "Assign Admin" Form Submission ---
    const assignForm = document.getElementById("assign-admin-form");
    const modal = document.getElementById("statusModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const closeModalElements = document.querySelectorAll(".close-modal, #modalOkBtn");

    function showModal(title, message, isSuccess) {
        if (!modal) return;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalTitle.style.color = isSuccess ? "#28a745" : "#dc3545"; // Green or Red
        modal.classList.add("show");
    }

    function closeModal() {
        if (modal) modal.classList.remove("show");
    }

    closeModalElements.forEach(el => el.addEventListener("click", closeModal));
    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    if (assignForm) {
        assignForm.addEventListener("submit", async (event) => {
            // Prevent the form from actually submitting and reloading the page
            event.preventDefault();

            // Get the values from the form fields
            const email = document.getElementById("userEmail").value;
            const accessLevel = document.getElementById("accessLevel").value;
            const notifyUserCheckbox = document.getElementById("notifyUser");
            const notifyUser = notifyUserCheckbox ? notifyUserCheckbox.checked : false;

            const submitBtn = assignForm.querySelector("button[type='submit']");
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-symbols-outlined spin">sync</span> Processing...';

            try {
                const response = await fetch('/adminpanel/api/grant-access/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        access_level: accessLevel,
                        notify_user: notifyUser
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showModal("Success", data.message, true);
                    assignForm.reset();
                    // Reload the page after 2 seconds to update the admin list
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    showModal("Error", data.message, false);
                }
            } catch (error) {
                console.error('Error:', error);
                showModal("Error", "An unexpected error occurred. Please try again.", false);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // --- 3. Handle Revoke Admin Access ---
    window.confirmRevoke = (email, role) => {
        showConfirm(
            `Are you sure you want to remove <strong>${role}</strong> access for <strong>${email}</strong>?`,
            () => performRevoke(email),
            null,
            'Revoke Access',
            'Revoke',
            'btn-danger'
        );
    };

    // window.closeConfirmModal is no longer needed with generic modal

    async function performRevoke(email) {
        // closeConfirmModal() call removed


        // Show processing state?
        // Reuse statusModal or just wait?
        // Let's show a "Processing" modal or similar.
        // Or just go straight to API.

        try {
            const response = await fetch('/adminpanel/api/revoke-access/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (data.success) {
                showModal("Success", data.message, true);
                // Reload page after a delay to reflect changes
                document.getElementById("modalOkBtn").onclick = () => window.location.reload();
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showModal("Error", data.message, false);
            }
        } catch (error) {
            console.error('Error:', error);
            showModal("Error", "An unexpected error occurred.", false);
        }
    }

    // Close buttons for confirm modal
    const closeConfirmElements = document.querySelectorAll(".close-confirm");
    closeConfirmElements.forEach(el => el.addEventListener("click", window.closeConfirmModal));

    // --- 4. Handle Permission Toggles ---
    let managersData = [];  // Store managers data globally
    let currentPermissionToggle = null;  // Track current toggle being changed

    // Fetch managers data on page load
    async function loadManagersData() {
        try {
            const response = await fetch('/adminpanel/api/get-manager-permissions/');
            const data = await response.json();

            if (data.success) {
                managersData = data.managers;
                // Update toggle states based on current permissions
                updateToggleStates();
            }
        } catch (error) {
            console.error('Error loading managers:', error);
        }
    }

    // Update toggle states based on manager permissions
    function updateToggleStates() {
        const permissionToggles = document.querySelectorAll('.permission-toggle');

        permissionToggles.forEach(toggle => {
            const permission = toggle.dataset.permission;
            // Check if ANY manager has this permission
            const anyHasPermission = managersData.some(m => m.permissions[permission]);
            toggle.checked = anyHasPermission;
        });
    }

    // Handle permission toggle clicks
    const permissionToggles = document.querySelectorAll('.permission-toggle');
    permissionToggles.forEach(toggle => {
        toggle.addEventListener('change', function (e) {
            const permission = this.dataset.permission;
            const willBeEnabled = this.checked;

            // Store current toggle reference
            currentPermissionToggle = this;

            // Show manager selection modal
            showManagerSelectionModal(permission, willBeEnabled);
        });
    });

    window.showManagerSelectionModal = (permission, willBeEnabled) => {
        const modal = document.getElementById('managerSelectModal');
        const modalTitle = document.getElementById('managerModalTitle');
        const modalMessage = document.getElementById('managerModalMessage');
        const managerList = document.getElementById('managerList');
        const confirmBtn = document.getElementById('confirmManagerBtn');

        // Update modal content
        const action = willBeEnabled ? 'grant' : 'revoke';
        const permissionName = permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        modalTitle.textContent = `${willBeEnabled ? 'Grant' : 'Revoke'} ${permissionName}`;
        modalMessage.textContent = `Select which manager admins to ${action} this permission:`;

        // Build manager checkboxes
        if (managersData.length === 0) {
            managerList.innerHTML = '<p style="color: #999;">No manager admins found.</p>';
            confirmBtn.disabled = true;
        } else {
            let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

            managersData.forEach(manager => {
                const currentlyHas = manager.permissions[permission];
                // Pre-select managers based on action
                const shouldCheck = willBeEnabled ? !currentlyHas : currentlyHas;

                html += `
                    <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #eee; border-radius: 4px; cursor: pointer;">
                        <input type="checkbox" class="manager-checkbox" value="${manager.id}" ${shouldCheck ? 'checked' : ''}>
                        <div>
                            <div style="font-weight: 500;">${manager.username}</div>
                            <div style="font-size: 0.8rem; color: #777;">${manager.email}</div>
                            <div style="font-size: 0.75rem; color: ${currentlyHas ? '#1e7e34' : '#999'};">
                                ${currentlyHas ? '✓ Has permission' : '○ No permission'}
                            </div>
                        </div>
                    </label>
                `;
            });

            html += '</div>';
            managerList.innerHTML = html;
            confirmBtn.disabled = false;
        }

        // Set up confirm button
        confirmBtn.onclick = () => applyPermissionChange(permission, action);

        // Show modal
        modal.classList.add('show');
    };

    window.closeManagerModal = () => {
        const modal = document.getElementById('managerSelectModal');
        modal.classList.remove('show');
        currentPermissionToggle = null;
    };

    async function applyPermissionChange(permission, action) {
        // Get selected manager IDs
        const selectedCheckboxes = document.querySelectorAll('.manager-checkbox:checked');
        const managerIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

        if (managerIds.length === 0) {
            showModal('Warning', 'Please select at least one manager.', false);
            return;
        }

        closeManagerModal();

        try {
            const response = await fetch('/adminpanel/api/manage-permissions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    permission: permission,
                    action: action,
                    manager_ids: managerIds
                })
            });

            const data = await response.json();

            if (data.success) {
                showModal('Success', data.message, true);
                // Reload managers data and update toggles
                await loadManagersData();
            } else {
                showModal('Error', data.message, false);
            }
        } catch (error) {
            console.error('Error:', error);
            showModal('Error', 'An unexpected error occurred.', false);
        }
    }

    // Close manager modal on X click
    const closeManagerElements = document.querySelectorAll(".close-manager-modal");
    closeManagerElements.forEach(el => el.addEventListener("click", window.closeManagerModal));

    // Load managers data on page load
    loadManagersData();

    // Existing toggle handler for non-permission toggles...
    const toggles = document.querySelectorAll(".switch input[type='checkbox']:not(.permission-toggle)");

    toggles.forEach(toggle => {
        toggle.addEventListener("change", (event) => {

            // Find the title of the toggle item
            const toggleItem = event.target.closest(".toggle-item");
            const title = toggleItem.querySelector("h4").textContent;

            // Check the new state (on or off)
            const state = event.target.checked ? "ON" : "OFF";

            // Log the change to the console for demonstration
            console.log(`Permission '${title}' was turned ${state}`);
        });
    });

});