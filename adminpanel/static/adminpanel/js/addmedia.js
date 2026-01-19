document.addEventListener('DOMContentLoaded', () => {

    // --- Sidebar Toggle (from your global.js) ---
    // Note: This logic assumes your sidebar has the class 'sidebar'
    // and a 'collapsed' class toggles its state.
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            // This is a simple toggle. You may have a different class
            // or logic in your global.js.
            sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
        });
    }

    // --- Section 1: Running Banner Carousel Logic ---
    const carouselDropZone = document.getElementById('carousel-drop-zone');
    const carouselUploadInput = document.getElementById('carouselUpload');
    const carouselPreviewContainer = document.getElementById('carousel-preview-container');
    const uploadCarouselBtn = document.getElementById('uploadCarouselBtn');

    // Handle file selection from input
    carouselUploadInput.addEventListener('change', (e) => {
        handleCarouselFiles(e.target.files);
    });

    // Handle drag and drop
    carouselDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        carouselDropZone.classList.add('drag-over');
    });
    carouselDropZone.addEventListener('dragleave', () => {
        carouselDropZone.classList.remove('drag-over');
    });
    carouselDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        carouselDropZone.classList.remove('drag-over');
        handleCarouselFiles(e.dataTransfer.files);
    });

    function handleCarouselFiles(files) {
        // We append files, not replace them
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'img-preview-wrapper';
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = file.name;
                    wrapper.appendChild(img);
                    carouselPreviewContainer.appendChild(wrapper);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // Handle mock upload button
    uploadCarouselBtn.addEventListener('click', () => {
        if (carouselPreviewContainer.children.length === 0) {
            showAlert('Please select files to upload first.', 'warning');
            return;
        }
        showAlert(`Simulating upload for ${carouselPreviewContainer.children.length} carousel images...`, 'info');
        // In a real app, you would loop through the files and send them
        // using fetch() or XMLHttpRequest.
        console.log('Mock Upload: Carousel Images');
        carouselPreviewContainer.innerHTML = ''; // Clear preview after "upload"
    });


    // --- Section 2: Static Offer Banner Logic ---

    // Get all the single upload inputs
    const slotUploadInputs = document.querySelectorAll('.slot-upload-input');

    slotUploadInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const previewId = input.id.replace('Upload', '-preview'); // e.g., 'offer1Upload' -> 'offer1-preview'
            const previewContainer = document.getElementById(previewId);

            if (file && previewContainer) {
                handleSlotFile(file, previewContainer);
            }
        });
    });

    function handleSlotFile(file, previewContainer) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            const img = previewContainer.querySelector('img');

            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Handle individual mock upload buttons for slots
    document.querySelectorAll('.btn-upload-slot').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetInputId = e.target.dataset.target;
            const input = document.getElementById(targetInputId);

            if (!input || input.files.length === 0) {
                showAlert('Please choose an image for this slot first.', 'warning');
                return;
            }

            showAlert(`Simulating upload for ${input.files[0].name}...`, 'info');
            console.log(`Mock Upload: ${targetInputId}`);
            // In a real app, upload this single file.
        });
    });

});