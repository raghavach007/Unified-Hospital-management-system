import { api } from './api.js';

// 1. Initialize Dashboard
async function initDashboard() {
    // Fetch real stats from backend
    try {
        const stats = await api.request('/admin/stats');
        
        // Safety check if stats are null (e.g., DB empty)
        const safeStats = stats || { 
            totalPatients: 0, 
            occupancy: 0, 
            doctorsActive: 0, 
            critical: 0 
        };

        const animate = (id, val) => {
            const el = document.getElementById(id);
            if(el) el.innerText = val;
        };
        
        animate('stat-patients', safeStats.totalPatients);
        animate('stat-occupancy', safeStats.occupancy + '%');
        animate('stat-doctors', safeStats.doctorsActive);
        animate('stat-critical', safeStats.critical);

        initCharts(safeStats);

    } catch (e) {
        console.error("Failed to load admin stats", e);
    }
}

// 2. Initialize Charts (Visual Analytics)
function initCharts(stats) {
    // Chart 1: Admission Trends (Line Chart)
    const ctx1 = document.getElementById('admissionChart');
    if (ctx1) {
        // Destroy existing instance if any (prevents glitching on reload)
        if(window.admissionChartInstance) window.admissionChartInstance.destroy();

        window.admissionChartInstance = new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Admissions',
                    data: [12, 19, 15, 25, 22, 30, stats.totalPatients], // Last point is real data
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: { 
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }, 
                    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } 
                } 
            }
        });
    }

    // Chart 2: Room Distribution (Doughnut Chart)
    const ctx2 = document.getElementById('roomChart');
    if (ctx2) {
        if(window.roomChartInstance) window.roomChartInstance.destroy();

        window.roomChartInstance = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available'],
                datasets: [{
                    data: [stats.occupancy, 100 - stats.occupancy],
                    backgroundColor: ['#ef4444', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                cutout: '75%', 
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } } 
                } 
            }
        });
    }
}

// 3. Account Creation Logic (UPDATED)
const createAccountForm = document.getElementById('createAccountForm');

if (createAccountForm) {
    createAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        
        // Show Loading State
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> SAVING...`;
        btn.disabled = true;

        // 1. Get Values
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;
        const department = document.getElementById('newDepartment').value; // NEW

        // 2. Construct Payload
        const userData = {
            username: username,
            password: password,
            role: role,
            department: department, // Explicitly sending selected department
            active: 1
        };

        console.log("Creating User:", userData);

        // 3. Send to Backend
        try {
            const res = await api.request('/admin/create-user', 'POST', userData);

            if (res) {
                alert(`SUCCESS: User '${username}' created as ${role} in ${department}.`);
                e.target.reset(); // Clear form
            } else {
                alert("Error: Username might already exist.");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to connect to server.");
        }
        
        // Reset Button
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// 4. Start
document.addEventListener('DOMContentLoaded', initDashboard);
window.logout = () => { localStorage.clear(); window.location.href='login.html'; };