import { api } from './api.js';

let currentPatientId = null;
let allPatients = [];
let vitalsInterval = null; // Track the simulation timer

// 1. Initialize Doctor Dashboard
async function initDoctorDashboard() {
    const username = localStorage.getItem('username') || 'bob';
    
    const nameDisplay = document.getElementById('docNameDisplay');
    if(nameDisplay) nameDisplay.innerText = `(Dr. ${username})`;
    
    console.log(`👨‍⚕️ DOCTOR DASHBOARD: Loading for [${username}]...`);

    try {
        const patients = await api.request(`/patients/doctor/${username}`);
        allPatients = patients || [];
        renderPatientList(allPatients);
    } catch (e) {
        console.error("🔴 Error loading patients:", e);
        const list = document.getElementById('patientList');
        if(list) list.innerHTML = `<div style="color: #ef4444; text-align:center; padding:1rem;">Connection Error</div>`;
    }
}

// 2. Render Sidebar List
function renderPatientList(patients) {
    const list = document.getElementById('patientList');
    if(!list) return;

    if(!patients || patients.length === 0) {
        list.innerHTML = `<div style="padding:1rem; opacity:0.6; text-align:center;">No patients assigned.</div>`;
        return;
    }

    list.innerHTML = patients.map(p => `
        <div class="patient-item" onclick="window.selectPatient(${p.id})" 
             style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
            <div style="display: flex; justify-content: space-between;">
                <strong>${p.name}</strong>
                <span class="badge badge-in" style="font-size:0.6rem; background: ${getBadgeColor(p.condition)}">${p.condition || 'Stable'}</span>
            </div>
            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">
                <i class="fas fa-user-nurse"></i> Nurse: ${p.nurse || 'Unassigned'}
            </div>
        </div>
    `).join('');
}

function getBadgeColor(condition) {
    if(!condition) return 'rgba(16, 185, 129, 0.2)';
    const c = condition.toLowerCase();
    if(c === 'critical') return 'var(--critical)';
    if(c === 'recovering') return 'var(--warning)';
    return 'var(--success)';
}

// 4. Select Patient Logic (With Vitals Integration)
window.selectPatient = (id) => {
    console.log(`👉 Clicked ID: ${id}`);
    
    // Clear any existing vitals simulation for previous patient
    if(vitalsInterval) clearInterval(vitalsInterval);

    const p = allPatients.find(patient => patient.id === id);
    if (!p) {
        console.error("Patient not found in memory!");
        return;
    }

    currentPatientId = id;
    
    // Open the Panel
    const emptyState = document.getElementById('emptyState');
    const detailView = document.getElementById('patientDetailView');
    
    if(emptyState) emptyState.style.display = 'none';
    if(detailView) detailView.style.display = 'flex'; 
    
    // Fill Data
    document.getElementById('pName').innerText = p.name;
    document.getElementById('pId').innerText = "#" + p.id;
    document.getElementById('pAge').innerText = p.age;
    document.getElementById('pNurse').innerText = p.nurse || 'None';
    
    updateBadgeUI(p.condition || 'Stable');
    loadMedications(id).catch(err => console.error("Medication load error:", err));

    // --- NEW: Start Live Vitals Simulation ---
    simulateDoctorVitals(p.condition);
};

// Vitals Simulation Helper
function simulateDoctorVitals(condition) {
    const update = () => {
        // Base healthy numbers
        let hr = Math.floor(Math.random() * (90 - 65) + 65);
        let spo2 = Math.floor(Math.random() * (100 - 97) + 97);
        let sys = 115 + Math.floor(Math.random() * 10);
        let dia = 75 + Math.floor(Math.random() * 5);

        // Adjust for Critical condition
        if(condition === 'Critical') {
            hr = Math.floor(Math.random() * (155 - 130) + 130); // Tachycardia
            spo2 = Math.floor(Math.random() * (92 - 85) + 85);   // Hypoxia
            document.getElementById('docHR').style.color = '#ef4444'; 
            document.getElementById('docO2').style.color = '#ef4444';
        } else {
            document.getElementById('docHR').style.color = '#10b981'; 
            document.getElementById('docO2').style.color = '#3b82f6';
        }

        document.getElementById('docHR').innerText = hr;
        document.getElementById('docBP').innerText = `${sys}/${dia}`;
        document.getElementById('docO2').innerText = spo2;
    };

    update(); // Run once immediately
    vitalsInterval = setInterval(update, 2500); // Pulse every 2.5 seconds
}

function updateBadgeUI(condition) {
    const badge = document.getElementById('pStatusBadge');
    if(!badge) return;
    badge.innerText = condition;
    badge.style.background = getBadgeColor(condition);
}

// 5. Update Status (Also updates vitals simulation live)
window.updateStatus = async (newStatus) => {
    if(!currentPatientId) return;
    updateBadgeUI(newStatus);
    
    // Restart simulation immediately with new condition parameters
    if(vitalsInterval) clearInterval(vitalsInterval);
    simulateDoctorVitals(newStatus);

    try {
        await api.request(`/patients/${currentPatientId}/condition`, 'PUT', newStatus);
        const p = allPatients.find(patient => patient.id === currentPatientId);
        if(p) p.condition = newStatus;
        renderPatientList(allPatients);
    } catch(e) { alert("Failed to save status!"); }
};

// 6. Discharge
window.dischargePatient = async () => {
    if(!currentPatientId) return;
    if(confirm(`Discharge patient #${currentPatientId}?`)) {
        try {
            await api.request(`/patients/${currentPatientId}`, 'DELETE');
            if(vitalsInterval) clearInterval(vitalsInterval);
            
            document.getElementById('patientDetailView').style.display = 'none';
            document.getElementById('emptyState').style.display = 'flex';
            
            initDoctorDashboard(); 
            alert("Patient Discharged.");
        } catch (e) { alert("Error discharging patient."); }
    }
};

// 7. Medication Logic
async function loadMedications(patientId) {
    const list = document.getElementById('medicationList');
    if(!list) return;
    list.innerHTML = '<div style="opacity:0.5; font-size:0.8rem;">Loading...</div>';
    
    try {
        const meds = await api.request(`/medications/patient/${patientId}`);
        renderMedList(meds);
    } catch(e) { 
        list.innerHTML = '<div style="color:orange; font-size:0.8rem;">Could not load meds.</div>';
    }
}

function renderMedList(meds) {
    const list = document.getElementById('medicationList');
    if(!list) return;

    if(!meds || meds.length === 0) {
        list.innerHTML = '<div style="opacity:0.5; font-size:0.8rem;">No active prescriptions.</div>';
        return;
    }
    
    list.innerHTML = meds.map(m => `
        <div style="display:flex; justify-content:space-between; padding: 0.8rem; background: rgba(0,0,0,0.2); margin-bottom: 5px; border-radius: 4px; border-left: 3px solid ${m.status === 'GIVEN' ? '#10b981' : '#f59e0b'}">
            <span style="font-size: 0.9rem;">${m.medicineName}</span>
            <span style="font-size:0.7rem; font-weight:bold; color: ${m.status === 'GIVEN' ? '#10b981' : '#f59e0b'}">
                ${m.status === 'GIVEN' ? '<i class="fas fa-check"></i> GIVEN' : 'PENDING'}
            </span>
        </div>
    `).join('');
}

window.addMedication = async () => {
    const nameInput = document.getElementById('newMedName');
    const name = nameInput.value;
    if(!name || !currentPatientId) {
        alert("Enter medicine name.");
        return;
    }
    
    try {
        await api.request('/medications/add', 'POST', { patientId: currentPatientId, medicineName: name });
        nameInput.value = ''; 
        loadMedications(currentPatientId); 
    } catch(e) { alert("Error adding medication"); }
};

document.addEventListener('DOMContentLoaded', initDoctorDashboard);