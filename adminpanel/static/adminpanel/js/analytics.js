// HeShe/js/analytics.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Global Chart Variables ---
    let salesOverviewChart;
    
    // --- Helper function to get CSS variables ---
    const getCssVar = (variable) => {
        return getComputedStyle(document.body).getPropertyValue(variable).trim();
    };

    // --- Get theme-aware colors from your global.css ---
    const accentColor = getCssVar('--accent-primary');
    const textColorPrimary = getCssVar('--text-primary');
    const textColorSecondary = getCssVar('--text-secondary');
    const gridColor = getCssVar('--border-color');


    // --- Chart Default Settings ---
    Chart.defaults.font.family = 'Roboto, sans-serif'; // Was 'Inter' -> Use Roboto
    Chart.defaults.plugins.legend.labels.color = textColorSecondary;
    Chart.defaults.plugins.tooltip.backgroundColor = getCssVar('--bg-secondary-solid');
    Chart.defaults.plugins.tooltip.titleColor = textColorPrimary;
    Chart.defaults.plugins.tooltip.bodyColor = textColorSecondary;

    // --- Data Objects for Filters ---
    const salesOverviewData = {
        '6months': {
            labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            data: [18000, 21000, 19000, 23000, 25000, 27000]
        },
        '30days': {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            data: [5000, 5800, 6200, 5500]
        },
        '7days': {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [700, 850, 800, 900, 1100, 1350, 1300]
        },
        'custom': { 
            labels: ['Custom Range'],
            data: [42000]
        }
    };
    

    // --- 1. Sales Overview (Line Chart) ---
    const salesOverviewCtx = document.getElementById('salesOverviewChart');
    const salesOverviewFilter = document.getElementById('salesOverviewFilter');
    const salesOverviewDateFilterBox = document.getElementById('salesOverviewDateFilter');
    const salesOverviewApplyBtn = document.getElementById('salesOverviewApplyBtn');

    function updateSalesOverviewChart(filterValue) {
        const newData = salesOverviewData[filterValue];
        if (salesOverviewChart) {
            salesOverviewChart.data.labels = newData.labels;
            salesOverviewChart.data.datasets[0].data = newData.data;
            salesOverviewChart.update();
        }
    }

    if (salesOverviewCtx && salesOverviewFilter && salesOverviewDateFilterBox && salesOverviewApplyBtn) {
        salesOverviewChart = new Chart(salesOverviewCtx, {
            type: 'line',
            data: {
                labels: [], datasets: [{
                    label: 'Sales', data: [],
                    borderColor: accentColor, backgroundColor: 'transparent', tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { color: textColorSecondary }, grid: { color: gridColor } },
                    x: { ticks: { color: textColorSecondary }, grid: { display: false } }
                }
            }
        });

        salesOverviewFilter.addEventListener('change', (e) => {
            const value = e.target.value;
            salesOverviewDateFilterBox.classList.toggle('visible', value === 'custom');
            if (value !== 'custom') {
                updateSalesOverviewChart(value);
            }
        });

        salesOverviewApplyBtn.addEventListener('click', () => {
            const fromDate = document.getElementById('salesOverviewFrom').value;
            const toDate = document.getElementById('salesOverviewTo').value;
            console.log('Fetching Sales data from:', fromDate, 'to:', toDate);
            salesOverviewData.custom.labels = [`${fromDate} to ${toDate}`];
            updateSalesOverviewChart('custom');
        });

        updateSalesOverviewChart(salesOverviewFilter.value);
    }
});