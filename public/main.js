let currentUserId = null;
let currentUsername = null;
let isAdmin = false;
let buildingData = {};

// ---------------------------
// Check Persistent Login
// ---------------------------
if (localStorage.getItem('currentUserId')) {
  currentUserId = localStorage.getItem('currentUserId');
  currentUsername = localStorage.getItem('currentUsername');
  document.getElementById('userLoginModal').style.display = 'none';
  document.getElementById('userInfo').style.display = 'block';
  document.getElementById('currentUsername').textContent = currentUsername;
  restoreFilters();  // restore filters on load
  restoreCheckboxes();
} else {
  document.getElementById('userLoginModal').style.display = 'block';
}

// ---------------------------
// Load Roadmap Data
// ---------------------------
function loadRoadmapData() {
  fetch('/api/roadmap')
    .then(res => res.json())
    .then(data => {
      buildingData = data;
      console.log("Loaded buildingData", buildingData);
    })
    .catch(err => console.error("Error loading roadmap data", err));
}

// ---------------------------
// User Login and Registration
// ---------------------------
document.getElementById('loginBtn').addEventListener('click', function() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }
  fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Login failed: " + data.error);
      } else {
        currentUserId = data.userId;
        currentUsername = username;
        localStorage.setItem('currentUserId', currentUserId);
        localStorage.setItem('currentUsername', currentUsername);
        alert("Login successful!");
        document.getElementById('userLoginModal').style.display = 'none';
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('currentUsername').textContent = currentUsername;
        restoreFilters();
        restoreCheckboxes();
        document.getElementById('applyBtn').click()
      }
    })
    .catch(err => {
      console.error("Error logging in", err);
      alert("Error logging in.");
    });
});

document.getElementById('showRegisterBtn').addEventListener('click', function() {
  document.getElementById('userLoginModal').style.display = 'none';
  document.getElementById('userRegisterModal').style.display = 'block';
});

document.getElementById('registerBtn').addEventListener('click', function() {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }
  fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Registration failed: " + data.error);
      } else {
        alert("Registration successful! Please log in.");
        document.getElementById('userRegisterModal').style.display = 'none';
        document.getElementById('userLoginModal').style.display = 'block';
      }
    })
    .catch(err => {
      console.error("Error during registration", err);
      alert("Error during registration.");
    });
});

document.getElementById('cancelRegisterBtn').addEventListener('click', function() {
  document.getElementById('userRegisterModal').style.display = 'none';
  document.getElementById('userLoginModal').style.display = 'block';
});

// User Logout
document.getElementById('userLogoutBtn').addEventListener('click', function() {
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('currentUsername');
  currentUserId = null;
  currentUsername = null;
  location.reload();
});

// ---------------------------
// Admin Login and Panel (same as before)
// ---------------------------
document.addEventListener('keydown', function(e){
  if(e.ctrlKey && e.altKey && e.key === 'a'){
    document.getElementById('adminLoginModal').style.display = 'block';
  }
});

document.getElementById('adminLoginCancelBtn').addEventListener('click', function() {
  document.getElementById('adminLoginModal').style.display = 'none';
});

document.getElementById('adminLoginBtn').addEventListener('click', function() {
  const adminId = document.getElementById('adminIdInput').value.trim();
  const adminPassword = document.getElementById('adminPasswordInput').value;
  if(adminId === "admin" && adminPassword === "adminpass"){
    isAdmin = true;
    alert("Admin logged in.");
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminLoginLink').style.display = 'block';
  } else {
    alert("Invalid admin credentials.");
  }
});

document.getElementById('adminLogoutBtn').addEventListener('click', function(){
  isAdmin = false;
  alert("Admin logged out.");
  document.getElementById('adminLoginLink').style.display = 'none';
  document.getElementById('adminPanelModal').style.display = 'none';
});

document.getElementById('openAdminPanelBtn').addEventListener('click', function(){
  populateAdminPanel();
  document.getElementById('adminPanelModal').style.display = 'block';
});

document.getElementById('closeAdminPanelBtn').addEventListener('click', function(){
  document.getElementById('adminPanelModal').style.display = 'none';
});

function populateAdminPanel() {
  const buildingSelect = document.getElementById('buildingSelect');
  buildingSelect.innerHTML = '';
  for(let key in buildingData) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = buildingData[key].name;
    buildingSelect.appendChild(option);
  }
  populateSectionSelect(buildingSelect.value);
}

function populateSectionSelect(buildingKey) {
  const sectionSelect = document.getElementById('sectionSelect');
  sectionSelect.innerHTML = '';
  const building = buildingData[buildingKey];
  if(building && building.sections) {
    building.sections.forEach((sec, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = sec.Section || "Unnamed Section";
      sectionSelect.appendChild(option);
    });
    loadSectionDetails(buildingKey, 0);
  }
}

document.getElementById('buildingSelect').addEventListener('change', function(){
  populateSectionSelect(this.value);
});

document.getElementById('sectionSelect').addEventListener('change', function(){
  const buildingKey = document.getElementById('buildingSelect').value;
  loadSectionDetails(buildingKey, this.value);
});

function loadSectionDetails(buildingKey, sectionIndex) {
  const section = buildingData[buildingKey].sections[sectionIndex];
  document.getElementById('sectionTitleInput').value = section.Section || "";
  document.getElementById('sectionDescInput').value = section.Description || "";
  if(section.Requirements && Array.isArray(section.Requirements)){
    const reqs = section.Requirements.filter(r => typeof r === 'string');
    document.getElementById('sectionReqInput').value = reqs.join(", ");
  } else {
    document.getElementById('sectionReqInput').value = "";
  }
  if(section.NeedToCompleteOnSite && Array.isArray(section.NeedToCompleteOnSite)){
    document.getElementById('sectionNeedInput').value = section.NeedToCompleteOnSite.join(", ");
  } else {
    document.getElementById('sectionNeedInput').value = "";
  }
  document.getElementById('sectionPOCInput').value = section.POC || "";
  document.getElementById('sectionDSNInput').value = section.DSN || "";
  document.getElementById('sectionHoursInput').value = section.Hours || "";
}

document.getElementById('saveSectionBtn').addEventListener('click', function(){
  const buildingKey = document.getElementById('buildingSelect').value;
  const sectionIndex = document.getElementById('sectionSelect').value;
  const sectionData = {
    Section: document.getElementById('sectionTitleInput').value,
    Description: document.getElementById('sectionDescInput').value,
    Requirements: document.getElementById('sectionReqInput').value.split(",").map(s => s.trim()).filter(s => s),
    NeedToCompleteOnSite: document.getElementById('sectionNeedInput').value.split(",").map(s => s.trim()).filter(s => s),
    POC: document.getElementById('sectionPOCInput').value,
    DSN: document.getElementById('sectionDSNInput').value,
    Hours: document.getElementById('sectionHoursInput').value
  };

  fetch(`/api/roadmap/${buildingKey}/${sectionIndex}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminId: "admin",
      adminPassword: "adminpass",
      sectionData: sectionData
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("Section updated successfully!");
        buildingData[buildingKey] = data.buildingData;
        populateAdminPanel();
      }
    })
    .catch(err => {
      console.error("Error updating section:", err);
      alert("Error updating section.");
    });
});

// Delete Section button event listener
document.getElementById('deleteSectionBtn').addEventListener('click', function() {
  const buildingKey = document.getElementById('buildingSelect').value;
  const sectionIndex = document.getElementById('sectionSelect').value;
  if (confirm("Are you sure you want to delete this section?")) {
    fetch(`/api/roadmap/${buildingKey}/${sectionIndex}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: "admin", adminPassword: "adminpass" })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Error: " + data.error);
        } else {
          alert("Section deleted successfully!");
          buildingData[buildingKey] = data.roadmap;
          populateAdminPanel();
        }
      })
      .catch(err => {
        console.error("Error deleting section:", err);
        alert("Error deleting section.");
      });
  }
});

// Delete Building button event listener
document.getElementById('deleteBuildingBtn').addEventListener('click', function() {
  const buildingKey = document.getElementById('buildingSelect').value;
  if (confirm("Are you sure you want to delete this building? This will delete all its sections.")) {
    fetch(`/api/roadmap/${buildingKey}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: "admin", adminPassword: "adminpass" })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Error: " + data.error);
        } else {
          alert("Building deleted successfully!");
          buildingData = data.roadmap;
          populateAdminPanel();
        }
      })
      .catch(err => {
        console.error("Error deleting building:", err);
        alert("Error deleting building.");
      });
  }
});



// ---------------------------
// Filter Functions (Persistent via SQLite)
// ---------------------------
function restoreFilters() {
  if (!currentUserId) return;
  fetch(`/api/user/${currentUserId}/filters`)
    .then(res => res.json())
    .then(data => {
      const filters = data.filters || {};
      if (filters.rank) document.getElementById('rankSelect').value = filters.rank;
      if (filters.dependents !== undefined) document.getElementById('dependentsCk').checked = filters.dependents;
      if (filters.drivers !== undefined) document.getElementById('driversCk').checked = filters.drivers;
      if (filters.vision !== undefined) document.getElementById('visionCk').checked = filters.vision;
      if (filters.intel !== undefined) document.getElementById('intelCk').checked = filters.intel;
    })
    .catch(err => console.error("Error restoring filters:", err));
}

function updateFilters() {
  if (!currentUserId) return;
  const filters = {
    rank: document.getElementById('rankSelect').value,
    dependents: document.getElementById('dependentsCk').checked,
    drivers: document.getElementById('driversCk').checked,
    vision: document.getElementById('visionCk').checked,
    intel: document.getElementById('intelCk').checked
  };
  fetch(`/api/user/${currentUserId}/filters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters })
  })
    .then(res => res.json())
    .then(data => console.log("Filters updated", data))
    .catch(err => console.error("Error updating filters:", err));
}

// *** New: Save filters immediately on change ***
document.getElementById('rankSelect').addEventListener('change', updateFilters);
document.getElementById('dependentsCk').addEventListener('change', updateFilters);
document.getElementById('driversCk').addEventListener('change', updateFilters);
document.getElementById('visionCk').addEventListener('change', updateFilters);
document.getElementById('intelCk').addEventListener('change', updateFilters);

// When the Apply Filter button is clicked, we also update the filters.
document.getElementById('applyBtn').addEventListener('click', () => {
  applyQuestionnaireFilters();
  updateFilters();
  slidingContainer.style.display = 'none';
  currentSlideIndex = 0;
});

// ---------------------------
// Checklist Functions (Persistent via SQLite)
// ---------------------------
function restoreCheckboxes() {
  if (!currentUserId) return;
  fetch(`/api/user/${currentUserId}/checklist`)
    .then(response => response.json())
    .then(data => {
      const savedChecklist = data.checklist || {};
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
      allCheckboxes.forEach(cb => {
        const key = cb.getAttribute('data-id');
        if (savedChecklist[key]) {
          cb.checked = true;
        }
        cb.addEventListener('change', () => {
          savedChecklist[key] = cb.checked;
          updateUserChecklist(savedChecklist);
        });
      });
    })
    .catch(err => {
      console.error("Error loading checklist:", err);
    });
}

function updateUserChecklist(checklist) {
  if (!currentUserId) return;
  fetch(`/api/user/${currentUserId}/checklist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checklist })
  })
    .then(response => response.json())
    .then(data => console.log("Updated checklist", data))
    .catch(err => console.error("Error updating checklist:", err));
}

// ---------------------------
// Roadmap & Slider Functions 
// ---------------------------
let currentSlideIndex = 0;
let totalSlides = 0;
let intelAccess = false;

const oneStopItem = document.getElementById('oneStopItem');
const cifItem = document.getElementById('cifItem');
const batt1Item = document.getElementById('batt1Item');
const postOfficeItem = document.getElementById('postOfficeItem');
const batt2Item = document.getElementById('batt2Item');
const companyItem = document.getElementById('companyItem');
const batt3Item = document.getElementById('batt3Item');
const divisionItem = document.getElementById('divisionItem');
const s7010Item = document.getElementById('s7010Item');
const housingItem = document.getElementById('housingItem');
const medicalBldgItem = document.getElementById('medicalBldgItem');
const midtownItem = document.getElementById('midtownItem');

const roadmapItems = document.querySelectorAll('.roadmap-item');
const slidingContainer = document.getElementById('slidingContainer');
const modalTitle = document.getElementById('modalTitle');
const sliderTrack = document.getElementById('sliderTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const closeWindow = document.getElementById('closeWindow');

function applyQuestionnaireFilters() {
  const rank = document.getElementById('rankSelect').value;
  const hasDependents = document.getElementById('dependentsCk').checked;
  const needsDriver = document.getElementById('driversCk').checked;
  const needsVision = document.getElementById('visionCk').checked;
  intelAccess = document.getElementById('intelCk').checked;

  const highRanks = ["E7","E8","E9","WO1","CW2","CW3","CW4","CW5","O1","O2","O3","O4","O5","O6","O7","O8","O9","O10"];
  if (highRanks.includes(rank) || hasDependents) {
    housingItem.classList.remove('hidden');
  } else {
    housingItem.classList.add('hidden');
  }
  if (needsDriver) {
    s7010Item.classList.remove('hidden');
  } else {
    s7010Item.classList.add('hidden');
  }
  if (needsVision) {
    midtownItem.classList.remove('hidden');
  } else {
    midtownItem.classList.add('hidden');
  }
  alert("Filter Applied. Roadmap updated!");
}

function loadBuildingSlides(buildingKey) {
  sliderTrack.innerHTML = '';
  currentSlideIndex = 0;
  const building = buildingData[buildingKey];
  if (!building) {
    console.error("No building found:", buildingKey);
    modalTitle.textContent = "Details for: (Not Found)";
    totalSlides = 0;
    updateButtonStates();
    return;
  }
  modalTitle.textContent = `Details for: ${building.name}`;
  if (!building.sections || building.sections.length === 0) {
    console.warn("No sections for building:", buildingKey);
    totalSlides = 0;
    updateButtonStates();
    return;
  }
  building.sections.forEach((sec, idx) => {
    const slide = document.createElement('div');
    slide.classList.add('slide');
    const sectionBlock = document.createElement('div');
    sectionBlock.classList.add('section-block');
    const h3 = document.createElement('h3');
    h3.textContent = sec.Section || 'Unnamed Section';
    sectionBlock.appendChild(h3);
    if (sec.Description) {
      const pDesc = document.createElement('p');
      pDesc.innerHTML = `<strong>Description:</strong> ${sec.Description}`;
      sectionBlock.appendChild(pDesc);
    }
    if (sec.Requirements && sec.Requirements.length > 0) {
      const reqTitle = document.createElement('p');
      reqTitle.innerHTML = `<strong>Requirements:</strong>`;
      sectionBlock.appendChild(reqTitle);
      const reqList = document.createElement('ul');
      reqList.classList.add('checklist');
      sec.Requirements.forEach((r, i2) => {
        if (typeof r === 'object' && r.url) {
          const uniqueId = `${buildingKey}-sec${idx}-req${i2}-${r.id}`;
          const li = document.createElement('li');
          let linkHTML = `<label><input type="checkbox" data-id="${uniqueId}" />`;
          if (r.id === "indoPacom" && !intelAccess) {
            linkHTML += `<span style="color:#999;text-decoration:line-through;">${r.title}</span></label>`;
          } else if (r.id === "range operations" && ["E6", "E7", "E8", "WO1", "CW2", "O1", "O2", "O3", "O4"].includes(rankSelect.value)) {
            linkHTML += `<span style="color:#999;text-decoration:line-through;">${r.title}</span></label>`;
          } else {
            linkHTML += `<a href="${r.url}" target="_blank">${r.title}</a></label>`;
          }
          if (r.frequency) linkHTML += ` – ${r.frequency}`;
          if (r.note) linkHTML += `<br><em>${r.note}</em>`;
          li.innerHTML = linkHTML;
          reqList.appendChild(li);
        } else {
          const uniqueId = `${buildingKey}-sec${idx}-req${i2}`;
          const li = document.createElement('li');
          li.innerHTML = `<label><input type="checkbox" data-id="${uniqueId}" /> ${r}</label>`;
          reqList.appendChild(li);
        }
      });
      sectionBlock.appendChild(reqList);
    }
    if (sec.NeedToCompleteOnSite && sec.NeedToCompleteOnSite.length > 0) {
      const needTitle = document.createElement('p');
      needTitle.innerHTML = `<strong>Need to Complete on Site:</strong>`;
      sectionBlock.appendChild(needTitle);
      const needList = document.createElement('ul');
      needList.classList.add('checklist');
      sec.NeedToCompleteOnSite.forEach((n, i3) => {
        const uniqueId = `${buildingKey}-sec${idx}-need${i3}`;
        const li = document.createElement('li');
        li.innerHTML = `<label><input type="checkbox" data-id="${uniqueId}" /> ${n}</label>`;
        needList.appendChild(li);
      });
      sectionBlock.appendChild(needList);
    }
    if (sec.POC && sec.POC !== '-') {
      const pPOC = document.createElement('p');
      pPOC.innerHTML = `<strong>POC:</strong> ${sec.POC}`;
      sectionBlock.appendChild(pPOC);
    }
    if (sec.DSN && sec.DSN !== '-') {
      const pDSN = document.createElement('p');
      pDSN.innerHTML = `<strong>DSN:</strong> ${sec.DSN}`;
      sectionBlock.appendChild(pDSN);
    }
    if (sec.Hours && sec.Hours !== '-') {
      const pHours = document.createElement('p');
      pHours.innerHTML = `<strong>Hours of Operation:</strong> ${sec.Hours}`;
      sectionBlock.appendChild(pHours);
    }
    slide.appendChild(sectionBlock);
    sliderTrack.appendChild(slide);
  });
  totalSlides = building.sections.length;
  sliderTrack.style.width = `${totalSlides * 100}%`;
  updateSliderPosition();
  restoreCheckboxes();
  updateButtonStates();
}

function updateSliderPosition() {
  if (totalSlides === 0) return;
  const offset = -currentSlideIndex * (100 / totalSlides);
  sliderTrack.style.transform = `translateX(${offset}%)`;
}

function updateButtonStates() {
  prevBtn.disabled = (currentSlideIndex <= 0);
  nextBtn.disabled = (currentSlideIndex >= totalSlides - 1);
}

roadmapItems.forEach(item => {
  item.addEventListener('click', () => {
    const buildingKey = item.getAttribute('data-building');
    loadBuildingSlides(buildingKey);
    slidingContainer.style.display = 'block';
  });
});

closeWindow.addEventListener('click', () => {
  slidingContainer.style.display = 'none';
});

nextBtn.addEventListener('click', () => {
  if (totalSlides === 0) return;
  currentSlideIndex++;
  if (currentSlideIndex > totalSlides - 1) currentSlideIndex = totalSlides - 1;
  updateSliderPosition();
  updateButtonStates();
});

prevBtn.addEventListener('click', () => {
  if (totalSlides === 0) return;
  currentSlideIndex--;
  if (currentSlideIndex < 0) currentSlideIndex = 0;
  updateSliderPosition();
  updateButtonStates();
});

// ---------------------------
// Initialize Data on Page Load
// ---------------------------
document.addEventListener('DOMContentLoaded', function() {
  loadRoadmapData();
});
