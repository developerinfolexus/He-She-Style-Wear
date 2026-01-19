/**
 * Global function to hide all reset forms and show only one specified form.
 * This ensures only one step of the password reset is visible at a time.
 * @param {string} formId - The ID of the form to show (e.g., 'login-form-div').
 */
function showForm(formId) {
    // Get all form sections that participate in the multi-step flow
    const allForms = [
        'login-form-div',
        'forgot-password-form',
        'otp-form-div',
        'new-password-form'
    ];

    allForms.forEach(id => {
        const form = document.getElementById(id);
        if (form) {
            if (id === formId) {
                form.classList.remove('hidden');
            } else {
                form.classList.add('hidden');
            }
        }
    });
}

/**
 * 🟢 Displays a custom website message notification.
 * @param {string} message - The message text to display.
 * @param {string} type - The type of message ('info' or 'success').
 */
function showWebsiteMessage(message, type = 'info') {
    const notification = document.getElementById('custom-notification');
    if (notification) {
        // Clear previous state
        notification.classList.remove('show', 'success', 'info');
        
        // Set message and type
        notification.textContent = message;
        notification.classList.add(type);
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}


// --- Step-by-step navigation functions ---

function showLoginForm(event) {
    if (event) event.preventDefault();
    showForm('login-form-div');
}

function showForgotPassword(event) {
    if (event) event.preventDefault();
    // 🟢 Replaced browser alert() with custom message
    showWebsiteMessage('OTP has been requested and simulated as sent to your email.');
    showForm('forgot-password-form');
}

function showOtpForm(event) {
    if (event) event.preventDefault();
    // Transition from Email Entry to OTP Entry
    showForm('otp-form-div');
}

function showNewPasswordForm(event) {
    if (event) event.preventDefault();
    // Transition from OTP Entry to New Password setup
    showForm('new-password-form');
}

// Ensure the default view is the login form on load
document.addEventListener('DOMContentLoaded', () => {
    // Start by showing only the main login form
    showForm('login-form-div');
});