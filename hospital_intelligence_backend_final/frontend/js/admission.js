import { api } from './api.js';

// State to hold staff lists
let availableDoctors = [];
let availableNurses = [];

async function loadStaff() {
    try {
        console.log("🔵 Fetching staff list...");

        // 1. Fetch from /users endpoint
        let allUsers = await api.request('/users'); 
        
        if (Array.isArray(allUsers)) {
            // 2. Filter using Case-Insensitive Check
            availableDoctors = allUsers.filter(u => u.role && u.role.toUpperCase() === 'DOCTOR');
            availableNurses = allUsers.filter(u => u.role && u.role.toUpperCase() === 'NURSE');

            console.log(`🟢 Loaded: ${availableDoctors.length} Doctors, ${availableNurses.length} Nurses.`);
        }
        
        // Refresh UI
        if(document.getElementById('dynamicSection').innerHTML !== "") {
            window.toggleType();
        }

    } catch (e) {
        console.error("🔴 Error loading staff:", e);
    }
}

function renderOptions(staffList, defaultLabel) {
    if (!staffList || staffList.length === 0) {
        return `<option value="" disabled selected>No ${defaultLabel} Found</option>`;
    }
    return staffList.map(user => 
        `<option value="${user.username}">${user.username}</option>`
    ).join('');
}

window.toggleType = () => {
    const type = document.querySelector('input[name="pType"]:checked').value;
    const container = document.getElementById('dynamicSection');
    
    container.style.opacity = '0';
    
    setTimeout(() => {
        const doctorOptions = renderOptions(availableDoctors, "Doctors");
        const nurseOptions = renderOptions(availableNurses, "Nurses");

        if(type === 'IN_PATIENT') {
            container.innerHTML = `
                <div class="glass-panel" style="padding:1rem; background:rgba(59,130,246,0.1); border:1px solid var(--primary);">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div>
                            <label class="text-xs" style="color:var(--primary);">ASSIGN DOCTOR</label>
                            <select id="docSelect" required class="input-glow">
                                ${doctorOptions}
                            </select>
                        </div>
                        <div>
                            <label class="text-xs" style="color:var(--primary);">ASSIGN NURSE</label>
                            <select id="nurseSelect" required class="input-glow">
                                ${nurseOptions}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                 <div class="glass-panel" style="padding:1rem; background:rgba(245, 158, 11, 0.1); border:1px solid var(--warning);">
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                        <div>
                            <label class="text-xs" style="color:var(--warning);">ASSIGN ROOM</label>
                            <select id="roomSelect">
                                <option value="101">101 - Ward A</option>
                                <option value="202">202 - ICU</option>
                                <option value="305">305 - General</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs" style="color:var(--warning);">DOCTOR</label>
                            <select id="docSelect" required>
                                ${doctorOptions}
                            </select>
                        </div>
                        <div>
                            <label class="text-xs" style="color:var(--warning);">NURSE</label>
                            <select id="nurseSelect" required>
                                ${nurseOptions}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }
        container.style.opacity = '1';
    }, 200);
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadStaff();

    const radios = document.querySelectorAll('input[name="pType"]');
    radios.forEach(radio => radio.addEventListener('change', window.toggleType));
    window.toggleType(); 

    document.getElementById('admissionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalHtml = btn.innerHTML;
        
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> SAVING...`;
        btn.disabled = true;
        
        const patientData = {
            name: document.getElementById('pName').value,
            age: parseInt(document.getElementById('pAge').value),
            gender: document.getElementById('pGender').value,
            contact: document.getElementById('pContact').value,
            type: document.querySelector('input[name="pType"]:checked').value,
            doctor: document.getElementById('docSelect').value,
            nurse: document.getElementById('nurseSelect').value,
            // Add Room if OUT_PATIENT (or handle logic)
            room: document.getElementById('roomSelect') ? document.getElementById('roomSelect').value : null
        };

        // --- UPDATED URL HERE ---
        const res = await api.request('/patients/register', 'POST', patientData);
        
        if (res) {
            btn.style.background = 'var(--success)';
            btn.innerHTML = `<i class="fas fa-check"></i> REGISTERED`;
            setTimeout(() => {
                alert(`Patient registered! Assigned to Nurse: ${patientData.nurse}`);
                e.target.reset();
                document.querySelector('input[value="IN_PATIENT"]').checked = true;
                window.toggleType();
                btn.style.background = 'var(--primary)';
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }, 1000);
        } else {
            alert("Error registering patient. Check console.");
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    });
});