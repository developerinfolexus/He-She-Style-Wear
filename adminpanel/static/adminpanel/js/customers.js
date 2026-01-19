// HeShe/js/customers.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Admin Panel Customers Page Loaded ===');
    console.log('Initializing customers page...');

    // --- Load Customers from Django API ---
    let allCustomersData = []; // Will be populated from API
    let currentCustomer = null; // Track currently open customer for modal logic

    // Helper to format the date string consistently
    const formatDate = (date) => {
        if (!date) return 'N/A';
        if (date instanceof Date) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }
        // Try to parse string dates
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return 'N/A';
        return parsedDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // --- START: DOM Element Selectors ---
    const tableBody = document.getElementById('customers-table-body');
    const searchInput = document.getElementById('customerSearch');
    const statusFilterEl = document.getElementById('statusFilter'); // This is the date filter
    const spendingFilterEl = document.getElementById('spendingFilter');
    const sortByEl = document.getElementById('sortBy');

    const customDateRangeEl = document.getElementById('customDateRange');
    const startDateEl = document.getElementById('startDate');
    const endDateEl = document.getElementById('endDate');
    const applyDateRangeBtn = document.getElementById('applyDateRange');

    const startDateIcon = document.getElementById('startDateIcon');
    const endDateIcon = document.getElementById('endDateIcon');

    const totalCustomersEl = document.getElementById('totalCustomers');
    const totalSpendEl = document.getElementById('totalSpend');
    const newCustomersEl = document.getElementById('newCustomers');

    // Modal Elements
    const modal = document.getElementById('customerDetailsModal');
    const modalCloseBtn = document.getElementById('customerModalCloseBtn');

    // --- END: DOM Element Selectors ---

    // --- START: Helper Functions ---
    const getStatusSpan = (status) => {
        const statusClass = status ? status.toLowerCase() : 'inactive';
        const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inactive';
        return `<span class="status ${statusClass}">${statusText}</span>`;
    };

    const formatCurrency = (amount) => `$${(amount || 0).toFixed(2)}`;
    // --- END: Helper Functions ---

    // --- START: API Loading Function ---
    async function loadCustomersFromAPI() {
        console.log('=== Loading Customers from API ===');
        console.log('API Endpoint: /admin/api/customers/');
        try {
            const response = await fetch('/admin/api/customers/');
            console.log('Customers API Response Status:', response.status);
            console.log('Customers API Response OK:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('Customers API Response Data:', data);
                console.log('Number of customers in response:', data.customers ? data.customers.length : 0);

                if (data.customers && data.customers.length > 0) {
                    // Convert API format to expected format
                    allCustomersData = data.customers.map(customer => {
                        const joinedDate = new Date(customer.joined);

                        return {
                            id: customer.id || 'N/A',
                            name: customer.name || 'N/A',
                            email: customer.email || 'N/A',
                            phone: customer.phone || 'N/A',
                            status: 'active', // Default status
                            joinedDate: joinedDate,
                            type: customer.type || 'Retail',
                            address: {
                                shipping: customer.shippingAddress || 'N/A',
                                billing: customer.billingAddress || 'N/A'
                            },
                            shippingAddress: customer.shippingAddress || 'N/A',
                            billingAddress: customer.billingAddress || 'N/A',
                            prefPayment: customer.prefPayment || 'N/A',
                            lastPayment: customer.lastPayment || 'N/A',
                            lastOrder: customer.lastOrder || null,
                            lastOrderDate: customer.lastOrder ? new Date(customer.lastOrder) : null,
                            orders: customer.orders || [],
                            totalOrders: customer.totalOrders || 0,
                            totalSpend: customer.totalSpent || 0
                        };
                    });

                    console.log('Customers loaded from API:', allCustomersData.length);
                    console.log('Customers data:', allCustomersData);

                    // Update statistics from API response
                    if (data.statistics) {
                        if (totalCustomersEl) totalCustomersEl.textContent = data.statistics.totalCustomers || 0;
                        if (totalSpendEl) totalSpendEl.textContent = formatCurrency(data.statistics.totalSpend || 0);
                        if (newCustomersEl) newCustomersEl.textContent = data.statistics.newCustomersThisMonth || 0;
                    }

                    // Render customers after loading
                    filterAndRender();
                } else {
                    console.warn('No customers found in API response');
                    allCustomersData = [];
                    filterAndRender();
                }
            } else {
                console.error('Failed to fetch customers from API. Status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                allCustomersData = [];
                filterAndRender();
            }
        } catch (error) {
            console.error('Error loading customers from API:', error);
            console.error('Error stack:', error.stack);
            allCustomersData = [];
            filterAndRender();
        }
        console.log('=== Finished Loading Customers ===');
    }
    // --- END: API Loading Function ---

    // --- START: Main Rendering Functions ---

    /**
     * Renders the main customers table based on filtered data.
     */
    function renderCustomersTable(filteredData) {
        if (!tableBody) return;
        tableBody.innerHTML = ''; // Clear existing table

        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px;">No customers found.</td></tr>`;
            return;
        }

        filteredData.forEach(cust => {
            const row = document.createElement('tr');
            row.dataset.id = cust.id;
            row.style.cursor = 'pointer'; // Make row clickable
            row.innerHTML = `
                <td>${cust.id || 'N/A'}</td>
                <td>${cust.name || 'N/A'}</td>
                <td>${cust.email || 'N/A'}</td>
                <td>${cust.phone || 'N/A'}</td>
                <td>${cust.totalOrders || 0}</td>
                <td>${formatCurrency(cust.totalSpend || 0)}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Updates the summary cards based on the provided data array.
     */
    function updateSummaryCards(data) {
        // Calculate stats based on the *provided* data array
        const totalCustomers = data.length;
        const totalSpend = data.reduce((sum, c) => sum + (c.totalSpend || 0), 0);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const newCustomers = data.filter(c => {
            if (!c.joinedDate) return false;
            const joinedDate = c.joinedDate instanceof Date ? c.joinedDate : new Date(c.joinedDate);
            return !isNaN(joinedDate.getTime()) && joinedDate >= oneMonthAgo;
        }).length;

        // Update DOM
        if (totalCustomersEl) totalCustomersEl.textContent = totalCustomers;
        if (totalSpendEl) totalSpendEl.textContent = formatCurrency(totalSpend);
        if (newCustomersEl) newCustomersEl.textContent = newCustomers;
    }

    /**
     * Filters and sorts the master list, AND updates summary cards.
     * Includes logic for custom date range.
     */
    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const dateFilter = statusFilterEl.value; // This is the date filter
        const spendingFilter = spendingFilterEl.value;
        const sortBy = sortByEl.value;

        // --- START: MODIFIED DATE FILTER LOGIC ---
        let minDate = null;
        let maxDate = null; // For custom range 'end date'

        if (dateFilter === 'Custom range') {
            // Read value from the flatpickr input
            if (startDateEl.value) {
                // The 'dateFormat' option ensures the value is "Y-m-d"
                minDate = new Date(startDateEl.value.replace(/-/g, '\/'));
                minDate.setHours(0, 0, 0, 0); // Set to start of the day
            }
            if (endDateEl.value) {
                // The 'dateFormat' option ensures the value is "Y-m-d"
                maxDate = new Date(endDateEl.value.replace(/-/g, '\/'));
                maxDate.setHours(23, 59, 59, 999); // Set to END of the selected day
            }
        } else {
            // Get the start of today (local time)
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            switch (dateFilter) {
                case 'All Time':
                    minDate = null;
                    break;
                case 'Today':
                    minDate = todayStart;
                    break;
                case 'Last 7 days':
                    minDate = new Date(todayStart);
                    minDate.setDate(minDate.getDate() - 7);
                    break;
                case 'Last 30 days':
                    minDate = new Date(todayStart);
                    minDate.setDate(minDate.getDate() - 30);
                    break;
                case 'Last 6 months':
                    minDate = new Date(todayStart);
                    minDate.setMonth(minDate.getMonth() - 6);
                    break;
                default:
                    minDate = null; // No date filter
            }
        }
        // --- END: MODIFIED DATE FILTER LOGIC ---


        let filteredData = allCustomersData.filter(cust => {
            // 1. Search filter
            const matchesSearch = (
                (cust.name && cust.name.toLowerCase().includes(searchTerm)) ||
                (cust.email && cust.email.toLowerCase().includes(searchTerm)) ||
                (cust.phone && cust.phone.includes(searchTerm)) ||
                (cust.id && cust.id.toLowerCase().includes(searchTerm))
            );

            // 2. Date filter (filters by customer *joinedDate*)
            const joinedDate = cust.joinedDate instanceof Date ? cust.joinedDate : new Date(cust.joinedDate);
            const matchesDate = (
                (!minDate || (joinedDate && joinedDate >= minDate)) &&
                (!maxDate || (joinedDate && joinedDate <= maxDate))
            );

            // 3. Spending filter
            let matchesSpending = true;
            if (spendingFilter) {
                const parts = spendingFilter.split('-');
                if (parts.length === 2 && parts[1] === '+') {
                    // Range like "10001+"
                    matchesSpending = (cust.totalSpend || 0) >= parseInt(parts[0]);
                } else if (parts.length === 2) {
                    // Range like "0-1000"
                    const min = parseInt(parts[0]);
                    const max = parseInt(parts[1]);
                    matchesSpending = (cust.totalSpend || 0) >= min && (cust.totalSpend || 0) <= max;
                }
            }

            return matchesSearch && matchesDate && matchesSpending;
        });

        // Update the summary cards *using the filtered data*.
        updateSummaryCards(filteredData);

        // 4. Sorting (applied *after* filtering)
        switch (sortBy) {
            case 'mostOrders':
                filteredData.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
                break;
            case 'highestSpend':
                filteredData.sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
                break;
            case 'newest':
            default:
                filteredData.sort((a, b) => {
                    const dateA = a.joinedDate instanceof Date ? a.joinedDate : new Date(a.joinedDate);
                    const dateB = b.joinedDate instanceof Date ? b.joinedDate : new Date(b.joinedDate);
                    return dateB - dateA;
                });
                break;
        }

        // Render the table with the *same* filtered and sorted data
        renderCustomersTable(filteredData);
    }
    // --- END: Main Rendering Functions ---


    // --- START: Modal Functions ---

    /**
     * Opens and populates the customer detail modal.
     */
    function openCustomerModal(customerId) {
        const customer = allCustomersData.find(c => c.id === customerId);
        if (!customer) {
            console.error('Customer not found:', customerId);
            return;
        }
        currentCustomer = customer;

        // 1. Populate Personal & Purchase Info
        document.getElementById('modalCustomerNameTitle').textContent = customer.name || 'N/A';
        document.getElementById('modalCustId').textContent = customer.id || 'N/A';
        document.getElementById('modalCustName').textContent = customer.name || 'N/A';
        document.getElementById('modalCustEmail').textContent = customer.email || 'N/A';
        document.getElementById('modalCustPhone').textContent = customer.phone || 'N/A';
        document.getElementById('modalCustJoined').textContent = formatDate(customer.joinedDate);
        document.getElementById('modalCustType').textContent = customer.type || 'N/A';

        document.getElementById('modalCustTotalOrders').textContent = customer.totalOrders || 0;
        document.getElementById('modalCustTotalSpent').textContent = formatCurrency(customer.totalSpend || 0);

        const aov = customer.totalOrders > 0 ? (customer.totalSpend || 0) / customer.totalOrders : 0;
        document.getElementById('modalCustAov').textContent = formatCurrency(aov);

        // 2. Populate Addresses
        const shippingAddr = customer.address?.shipping || customer.shippingAddress || 'N/A';
        const billingAddr = customer.address?.billing || customer.billingAddress || 'N/A';
        document.getElementById('modalCustShippingAddress').textContent = shippingAddr;
        document.getElementById('modalCustBillingAddress').textContent = billingAddr;

        // 3. Populate Order History
        const orderHistoryBody = document.getElementById('modalCustOrderHistory');
        const orderCountEl = document.getElementById('modalCustOrderCount');

        const customerOrders = customer.orders || [];
        orderCountEl.textContent = customerOrders.length;
        orderHistoryBody.innerHTML = ''; // Clear previous

        if (customerOrders.length === 0) {
            orderHistoryBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">No order history.</td></tr>`;
        } else {
            // Sort orders newest first
            customerOrders.sort((a, b) => {
                const dateA = a.dateObj instanceof Date ? a.dateObj : new Date(a.date || a.dateObj);
                const dateB = b.dateObj instanceof Date ? b.dateObj : new Date(b.date || b.dateObj);
                return dateB - dateA;
            }).forEach(order => {
                const itemsCount = order.items ? (Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.qty || item.quantity || 0), 0) : order.items) : (order.items || 0);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><a href="#" class="order-id-link" data-order-id="${order.id}" style="color: var(--primary-color, #007bff); text-decoration: underline; font-weight: 500;">${order.id || 'N/A'}</a></td>
                    <td>${formatDate(order.dateObj || order.date)}</td>
                    <td>${itemsCount}</td>
                    <td>${formatCurrency(order.payment?.total || order.total || 0)}</td>
                    <td>${getStatusSpan(order.orderStatus || order.status || 'pending')}</td>
                    <td>${getStatusSpan(order.payment?.status || order.payment || 'pending')}</td>
                    <td><a href="/admin/orders/" class="btn-action-view">View</a></td> `;
                orderHistoryBody.appendChild(row);
            });
        }

        // Find preferred payment method
        const paymentMethods = customerOrders.reduce((acc, order) => {
            const method = order.payment?.method || order.payment || 'N/A';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});
        const preferredMethod = Object.keys(paymentMethods).sort((a, b) => paymentMethods[b] - paymentMethods[a])[0] || 'N/A';
        document.getElementById('modalCustPrefPayment').textContent = preferredMethod;
        document.getElementById('modalCustLastPayment').textContent = formatDate(customer.lastOrderDate || customer.lastOrder || customer.lastPayment);

        // 4. Show the modal
        modal.classList.add('show');
    }

    /**
     * Closes the customer detail modal.
     */
    function closeCustomerModal() {
        modal.classList.remove('show');
    }
    // --- END: Modal Functions ---


    // --- START: Event Listeners ---

    // Initialize Choices.js for filters
    if (window.Choices) {
        new Choices(statusFilterEl, { searchEnabled: false, itemSelectText: '' });
        new Choices(spendingFilterEl, { searchEnabled: false, itemSelectText: '' });
        new Choices(sortByEl, { searchEnabled: false, itemSelectText: '' });
    }

    // --- START: MODIFIED FOR ICON CLICK ---
    if (window.flatpickr) {
        const fpConfig = {
            dateFormat: "Y-m-d", // How the date is stored (for filtering)
        };
        // Initialize flatpickr and store instances in variables
        const fpStart = flatpickr("#startDate", fpConfig);
        const fpEnd = flatpickr("#endDate", fpConfig);

        // Add click listeners to the ICONS
        if (startDateIcon) {
            startDateIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop click from bubbling up
                fpStart.open(); // Manually open the start calendar
            });
        }
        if (endDateIcon) {
            endDateIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                fpEnd.open(); // Manually open the end calendar
            });
        }
    }
    // --- END: MODIFIED FOR ICON CLICK ---


    // Filter listeners
    searchInput.addEventListener('input', filterAndRender);
    spendingFilterEl.addEventListener('change', filterAndRender);
    sortByEl.addEventListener('change', filterAndRender);

    // Shows/hides the custom date range fields
    statusFilterEl.addEventListener('change', () => {
        if (statusFilterEl.value === 'Custom range') {
            customDateRangeEl.style.display = 'flex';
        } else {
            customDateRangeEl.style.display = 'none';
            // If another option is chosen, filter immediately
            filterAndRender();
        }
    });

    // Applies the custom date range
    applyDateRangeBtn.addEventListener('click', () => {
        filterAndRender(); // Re-run the filter function with the new date values
    });


    // Modal open listener
    tableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            e.preventDefault();
            const customerId = row.dataset.id;
            openCustomerModal(customerId);
        }
    });

    // Address Dynamically Update Listener (For clicking Order ID in history)
    const orderHistoryBody = document.getElementById('modalCustOrderHistory');
    if (orderHistoryBody) {
        orderHistoryBody.addEventListener('click', (e) => {
            const link = e.target.closest('.order-id-link');
            if (link) {
                e.preventDefault();
                e.stopPropagation(); // Prevent row click from bubbling if row has other listeners

                const orderId = link.dataset.orderId;

                if (currentCustomer && currentCustomer.orders) {
                    const selectedOrder = currentCustomer.orders.find(o => o.id === orderId);
                    if (selectedOrder) {
                        // Update Address Section with FROZEN order address
                        const shippingEl = document.getElementById('modalCustShippingAddress');
                        const billingEl = document.getElementById('modalCustBillingAddress');

                        // Use textContent to prevent XSS, though addresses should be safe
                        if (shippingEl) shippingEl.textContent = selectedOrder.shippingAddress || 'N/A';
                        if (billingEl) billingEl.textContent = selectedOrder.billingAddress || 'N/A';

                        // Highlight the selected row
                        const allRows = orderHistoryBody.querySelectorAll('tr');
                        allRows.forEach(r => r.style.backgroundColor = '');
                        const row = link.closest('tr');
                        if (row) row.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';

                        console.log(`Updated address details for Selected Order: ${orderId}`);
                    } else {
                        console.error('Order not found in current customer data:', orderId);
                    }
                }
            }
        });
    }

    // Modal close listeners
    modalCloseBtn.addEventListener('click', closeCustomerModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeCustomerModal();
        }
    });

    // --- END: Event Listeners ---


    // --- START: Initial Load ---
    // Load customers from API first, then render
    loadCustomersFromAPI();
    // --- END: Initial Load ---


});
