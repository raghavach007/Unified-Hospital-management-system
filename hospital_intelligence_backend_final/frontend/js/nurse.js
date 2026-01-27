import { api } from './api.js';

let currentPatientId = null;
let simulationInterval = null;
let isCritical = false;

// --- AUDIO SYSTEM (No external files needed) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let alarmInterval = null;

// 1. Gentle "Blip" for Heartbeat / Success Action
function playHeartbeatSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.value = 800; // Pitch
    gainNode.gain.value = 0.05; // Volume (Keep it low)
    
    osc.start();
    // Fade out quickly
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1); 
    osc.stop(audioCtx.currentTime + 0.1);
}

// 2. Emergency Siren (The "Code Blue" sound)
function startAlarmSound() {
    if (alarmInterval) return; // Already running
    
    const playSirenNote = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'square'; // harsher sound
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High A
        osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.3); // Drop pitch
        
        gainNode.gain.value = 0.1; 
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    };

    // Play pattern: Beep... Beep... Beep...
    playSirenNote();
    alarmInterval = setInterval(playSirenNote, 800); 
}

function stopAlarmSound() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
}
// -----------------------------------------------

// 1. Initialize
async function initNurseDashboard() {
    // FALLBACK: Default to 'jai' if login is missing
    const username = localStorage.getItem('username') || 'jai';
    
    const display = document.getElementById('nurseNameDisplay');
    if(display) display.innerText = `(Nurse ${username})`;

    try {
        const patients = await api.request(`/patients/nurse/${username}`);
        renderPatientList(patients || []);
    } catch (e) {
        console.error("Error:", e);
    }
}

// 2. Render List
function renderPatientList(patients) {
    const list = document.getElementById('patientList');
    if(!patients || patients.length === 0) {
        list.innerHTML = `<div style="padding:1rem; opacity:0.6; text-align:center;">No patients.</div>`;
        return;
    }
    list.innerHTML = patients.map(p => `
        <div class="patient-item" onclick="window.startMonitoring(${p.id}, '${p.name}', '${p.doctor || 'Unassigned'}')" 
             style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;">
            <strong>${p.name}</strong>
            <div style="font-size: 0.8rem; opacity: 0.7;">Dr. ${p.doctor || 'Unassigned'}</div>
        </div>
    `).join('');
}

// 3. START MONITORING (Vitals + Meds)
window.startMonitoring = (id, name, doctor) => {
    // Reset previous state
    if(simulationInterval) clearInterval(simulationInterval);
    stopAlarmSound();
    
    currentPatientId = id;
    isCritical = false;
    
    // Resume Audio Context on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Setup UI
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('patientDetailView').style.display = 'block';
    
    document.getElementById('pName').innerText = name;
    document.getElementById('pId').innerText = "#" + id;
    document.getElementById('pDoctor').innerText = doctor;
    
    // Clear Red Flash & Reset Colors
    document.getElementById('patientDetailView').classList.remove('critical-flash');
    document.getElementById('alertBox').style.display = 'none';
    document.getElementById('dispHR').style.color = '#10b981'; // Green

    // --- NEW: Load Medications for this patient ---
    loadNurseMeds(id);
    // ---------------------------------------------

    // Start Simulation Loop (Update every 2 seconds)
    simulationInterval = setInterval(() => {
        updateVitals();
    }, 2000);

    updateVitals();
};

// 4. Generate & Check Vitals
async function updateVitals() {
    if(!currentPatientId) return;

    // --- A. Generate Randoms ---
    let hr = Math.floor(Math.random() * (100 - 60) + 60);
    let sys = Math.floor(Math.random() * (130 - 110) + 110);
    let dia = Math.floor(Math.random() * (85 - 70) + 70);
    let spo2 = Math.floor(Math.random() * (100 - 96) + 96);

    // --- B. Critical Logic ---
    if (isCritical) {
        // FORCE CRITICAL VALUES
        hr = Math.floor(Math.random() * (160 - 145) + 145); // Very High
        spo2 = Math.floor(Math.random() * (88 - 80) + 80);  // Very Low
        
        // Update UI
        document.getElementById('dispHR').innerText = hr;
        document.getElementById('dispBP').innerText = `${sys}/${dia}`;
        document.getElementById('dispO2').innerText = `${spo2}%`;
        
        handleCriticalState(hr, spo2);
    } else {
        // NORMAL STATE
        document.getElementById('dispHR').innerText = hr;
        document.getElementById('dispBP').innerText = `${sys}/${dia}`;
        document.getElementById('dispO2').innerText = `${spo2}%`;
        
        // Play gentle heartbeat blip
        playHeartbeatSound();
    }
}

// 5. Handle Critical Event
async function handleCriticalState(hr, spo2) {
    const hrDisplay = document.getElementById('dispHR');
    const panel = document.getElementById('patientDetailView');
    const alertBox = document.getElementById('alertBox');

    // 1. Visual Alarm
    hrDisplay.style.color = '#ef4444'; // Red Numbers
    panel.classList.add('critical-flash'); // Flashing Screen
    alertBox.style.display = 'block';

    // 2. AUDIO ALARM
    startAlarmSound();

    // 3. Backend Alert (Throttled log)
    console.log(`🚨 CRITICAL: HR ${hr} / SPO2 ${spo2}`);
    
    try {
        await api.request(`/patients/${currentPatientId}/condition`, 'PUT', 'Critical');
    } catch(e) { console.error(e); }
}

// 6. Force Emergency (Hackathon Button)
window.triggerCriticalAction = () => {
    isCritical = true;
    updateVitals(); // Trigger immediately
};

// ==========================================
// NEW: MEDICATION ADMINISTRATION LOGIC
// ==========================================

// 7. Load Meds
async function loadNurseMeds(patientId) {
    const container = document.getElementById('nurseMedList');
    container.innerHTML = '<div style="opacity:0.5;">Checking orders...</div>';
    
    try {
        const meds = await api.request(`/medications/patient/${patientId}`);
        
        if(!meds || meds.length === 0) {
            container.innerHTML = '<div style="opacity:0.5; grid-column: span 2;">No active orders.</div>';
            return;
        }

        container.innerHTML = meds.map(m => `
            <div style="background: rgba(0,0,0,0.3); padding: 0.8rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: bold; font-size: 0.9rem;">${m.medicineName}</div>
                ${m.status === 'PENDING' 
                    ? `<button onclick="administerMed(${m.id})" class="btn-sm" style="background: var(--primary); padding: 5px 10px; font-size: 0.8rem;">GIVE</button>` 
                    : `<span style="color: var(--success); font-weight: bold; font-size: 0.8rem;"><i class="fas fa-check"></i> GIVEN</span>`
                }
            </div>
        `).join('');
    } catch(e) { 
        console.error(e);
        container.innerHTML = '<div style="color:red; font-size:0.8rem;">Error loading meds</div>';
    }
}

// 8. Administer Med Action
window.administerMed = async (medId) => {
    try {
        // Send update to backend
        await api.request(`/medications/${medId}/give`, 'PUT');
        
        // Play success sound (reusing heartbeat blip)
        if(audioCtx.state === 'suspended') audioCtx.resume();
        playHeartbeatSound();
        
        // Refresh the list to show the checkmark
        loadNurseMeds(currentPatientId);
    } catch(e) { 
        console.error(e);
        alert("Failed to update medication status");
    }
};

document.addEventListener('DOMContentLoaded', initNurseDashboard);