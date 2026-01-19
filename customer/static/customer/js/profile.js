document.addEventListener("DOMContentLoaded", () => {
    // Province/State data
    const LOCATIONS = {
        "Canada": [
            "Alberta", "British Columbia", "Manitoba", "New Brunswick",
            "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island",
            "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"
        ],
        "United States": [
            "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
            "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
            "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
            "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
            "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
            "New Hampshire", "New Jersey", "New Mexico", "New York",
            "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
            "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
            "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
            "West Virginia", "Wisconsin", "Wyoming"
        ]
    };

    let originalData = {};

    function captureInitialData() {
        const countrySelect = document.getElementById('address-country');
        const stateSelect = document.getElementById('address-state');
        const genderChecked = document.querySelector('input[name="gender"]:checked');

        originalData = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            addressLine: document.getElementById('address-line').value,
            addressLocality: document.getElementById('address-locality').value,
            addressCity: document.getElementById('address-city').value,
            addressPincode: document.getElementById('address-pincode').value,
            country: countrySelect ? countrySelect.value : 'Canada',
            addressState: stateSelect ? stateSelect.value : '',
            gender: genderChecked ? genderChecked.value : null
        };
    }

    // Custom Toast Notification
    function showNotification(message, isError = false) {
        const toast = document.getElementById('notification-toast');
        const msgSpan = document.getElementById('notification-message');
        const icon = document.getElementById('notification-icon');

        if (!toast || !msgSpan || !icon) return;

        msgSpan.textContent = message;
        toast.className = 'notification-toast'; // Reset classes

        if (isError) {
            toast.classList.add('notification-error');
            icon.className = 'fas fa-exclamation-circle toast-icon';
        } else {
            toast.classList.add('notification-success');
            icon.className = 'fas fa-check-circle toast-icon';
        }

        // Force reflow
        void toast.offsetWidth;
        toast.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden-toast');
            }, 300); // Wait for transition
        }, 3000);

        // Ensure it's visible (remove hidden-toast if present)
        toast.classList.remove('hidden-toast');
    }

    function updateStateProvinceDropdown(selectedState = null) {
        const countrySelect = document.getElementById('address-country');
        const stateSelect = document.getElementById('address-state');

        if (!countrySelect || !stateSelect) return;

        const selectedCountry = countrySelect.value;
        const stateList = LOCATIONS[selectedCountry] || [];

        // Use passed state or current value or header dataset
        let targetState = selectedState;
        if (targetState === null) {
            targetState = stateSelect.dataset.selected || stateSelect.value;
        }

        stateSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = selectedCountry === 'Canada' ? '--Select Province/Territory--' : '--Select State--';
        stateSelect.appendChild(defaultOption);

        stateList.forEach(stateName => {
            const option = document.createElement('option');
            option.value = stateName;
            option.textContent = stateName;
            if (stateName === targetState) {
                option.selected = true;
            }
            stateSelect.appendChild(option);
        });
    }

    // Revert form to raw data
    function populateForm(data) {
        if (!data) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('first-name', data.firstName);
        setVal('last-name', data.lastName);
        setVal('email', data.email);
        setVal('address-line', data.addressLine);
        setVal('address-locality', data.addressLocality);
        setVal('address-city', data.addressCity);
        setVal('address-pincode', data.addressPincode);

        const countrySelect = document.getElementById('address-country');
        if (countrySelect) {
            countrySelect.value = data.country || 'Canada';
            updateStateProvinceDropdown(data.addressState);
        }

        if (data.gender) {
            document.querySelectorAll('input[name="gender"]').forEach(radio => {
                radio.checked = (radio.value === data.gender);
            });
            updateAvatar(data.firstName, data.gender);
        }
    }

    function updateAvatar(firstName, gender) {
        const avatarImg = document.getElementById('user-avatar');
        if (avatarImg) {
            // Default logic if gender missing
            const avatarType = (gender === 'female') ? 'girl' : 'boy';
            avatarImg.src = `https://avatar.iran.liara.run/public/${avatarType}?username=${firstName || 'User'}`;
        }
    }

    function toggleEditState(formElement, isEditing) {
        if (!formElement) return;

        const inputs = formElement.querySelectorAll('input:not([type="hidden"]), textarea, select');
        const editButton = document.getElementById('edit-profile-btn');
        const actionButtons = document.getElementById('profile-form-actions');

        inputs.forEach(input => {
            // Avoid disabling hidden inputs or unrelated ones if any
            if (input.id === 'user-avatar') return;

            if (input.tagName === 'SELECT') {
                input.disabled = !isEditing;
            } else {
                input.readOnly = !isEditing;
            }

            // Visual styles
            input.style.backgroundColor = isEditing ? '#fff' : '#f8f8f8';
            input.style.borderColor = isEditing ? 'var(--secondary-color)' : '#dcdcdc';

            if (isEditing && input.readOnly === false) { // extra check
                input.style.boxShadow = '0 0 0 1px var(--secondary-color)';
            } else {
                input.style.boxShadow = 'none';
            }
        });

        // Toggle Buttons
        if (editButton) editButton.style.display = isEditing ? 'none' : 'block';
        if (actionButtons) actionButtons.classList.toggle('hidden', !isEditing);

        if (isEditing) {
            const firstEditable = formElement.querySelector('input:not([readonly]):not([type="radio"]), textarea:not([readonly])');
            if (firstEditable) firstEditable.focus();
        }
    }

    // API Call
    async function saveProfileDataAPI(formData) {
        try {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');

            const response = await fetch('/api/profile/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showNotification("Profile updated successfully", false);
                return true;
            } else {
                showNotification(result.message || "Could not save profile data.", true);
                return false;
            }
        } catch (error) {
            console.error("API Error:", error);
            showNotification("Network error. Please try again.", true);
            return false;
        }
    }

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

    function setupEventListeners() {
        const profileForm = document.getElementById('profile-form');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const saveProfileBtn = document.getElementById('save-profile-btn');
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');
        const countrySelect = document.getElementById('address-country');

        if (!profileForm) return;

        if (countrySelect) {
            countrySelect.addEventListener('change', () => {
                updateStateProvinceDropdown();
            });
        }

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                toggleEditState(profileForm, true);
            });
        }

        if (cancelProfileBtn) {
            cancelProfileBtn.addEventListener('click', () => {
                populateForm(originalData); // Revert
                toggleEditState(profileForm, false);
            });
        }

        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', async () => {
                // Collect Data
                const inputs = profileForm.querySelectorAll('input[name], textarea[name], select[name]');
                const newData = {};
                let isValid = true;
                let firstInvalid = null;

                inputs.forEach(input => {
                    let val = input.value.trim();
                    if (input.type === 'radio') {
                        if (input.checked) val = input.value;
                        else return;
                    }

                    // Basic validation
                    if (input.required && !val) {
                        isValid = false;
                        if (!firstInvalid) firstInvalid = input;
                    }
                    if (input.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                        isValid = false;
                        if (!firstInvalid) firstInvalid = input;
                    }

                    newData[input.name] = val;
                });

                if (isValid) {
                    // Show loading state if desired (optional)
                    saveProfileBtn.textContent = "Saving...";
                    saveProfileBtn.disabled = true;

                    const success = await saveProfileDataAPI(newData);

                    saveProfileBtn.textContent = "SAVE CHANGES";
                    saveProfileBtn.disabled = false;

                    if (success) {
                        // Update local originalData
                        originalData = { ...newData };
                        toggleEditState(profileForm, false);
                        // Update Avatar immediately in case changed
                        updateAvatar(newData.firstName, newData.gender);
                    }
                } else {
                    if (firstInvalid) firstInvalid.focus();
                    showNotification("Please check the required fields.", true);
                }
            });
        }

        // Prevent standard submit
        profileForm.addEventListener('submit', (e) => e.preventDefault());
    }

    // Initial Load
    // 1. Populate/Init State Dropdown
    const savedState = document.getElementById('address-state')?.dataset.selected || '';
    updateStateProvinceDropdown(savedState);

    // 2. Capture Initial Data (from server render)
    captureInitialData();

    // 3. Ensure Read-Only Start
    toggleEditState(document.getElementById('profile-form'), false);

    // 4. Setup Listeners
    setupEventListeners();

});