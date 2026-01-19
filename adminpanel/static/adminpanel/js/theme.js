document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggler ---
    const themeToggle = document.getElementById('theme-toggle');

    // Check local storage on page load
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) {
            themeToggle.checked = true;
        }
    }

    // Add event listener to the toggle
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});