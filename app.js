// Default Data models
const DEFAULT_CATTLE = [];
const DEFAULT_MILK_RECORDS = [];
const DEFAULT_EVENTS = [];
const DEFAULT_TRANSACTIONS = [];

// Utility for Sanitization to prevent XSS
window.escapeHTML = function(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
};

// State Management
let appState = {
  cattle: JSON.parse(localStorage.getItem('cattle')) || DEFAULT_CATTLE,
  milkRecords: JSON.parse(localStorage.getItem('milkRecords')) || DEFAULT_MILK_RECORDS,
  events: JSON.parse(localStorage.getItem('events')) || DEFAULT_EVENTS,
  transactions: JSON.parse(localStorage.getItem('transactions')) || DEFAULT_TRANSACTIONS,
  farmers: JSON.parse(localStorage.getItem('farmers')) || [],
  users: JSON.parse(localStorage.getItem('users')) || [{ username: 'admin', password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', role: 'owner', realName: 'Farm Owner' }],
  auditLogs: JSON.parse(localStorage.getItem('auditLogs')) || [],
  chatMessages: JSON.parse(localStorage.getItem('chatMessages')) || [],
  jobs: JSON.parse(localStorage.getItem('jobs')) || [],
  notifications: JSON.parse(localStorage.getItem('notifications')) || [],
  role: localStorage.getItem('userRole') || 'owner',
  realName: localStorage.getItem('currentUserRealName') || 'Farm Owner',
  username: localStorage.getItem('currentUsername') || 'admin',
  isLoggedIn: localStorage.getItem('isLoggedIn') === 'true'
};

function saveState() {
  localStorage.setItem('cattle', JSON.stringify(appState.cattle));
  localStorage.setItem('milkRecords', JSON.stringify(appState.milkRecords));
  localStorage.setItem('events', JSON.stringify(appState.events));
  localStorage.setItem('transactions', JSON.stringify(appState.transactions));
  localStorage.setItem('farmers', JSON.stringify(appState.farmers));
  localStorage.setItem('users', JSON.stringify(appState.users));
  localStorage.setItem('auditLogs', JSON.stringify(appState.auditLogs));
  localStorage.setItem('chatMessages', JSON.stringify(appState.chatMessages));
  localStorage.setItem('jobs', JSON.stringify(appState.jobs));
  localStorage.setItem('notifications', JSON.stringify(appState.notifications));
  localStorage.setItem('userRole', appState.role);
  localStorage.setItem('currentUserRealName', appState.realName);
  localStorage.setItem('isLoggedIn', appState.isLoggedIn);
}

// Router Logic
function handleRouting() {
  if (!appState.isLoggedIn) {
      window.location.href = 'login.html';
      return;
  }

  let hash = window.location.hash || '#dashboard';

  // Security route protection
  if ((hash === '#security-logs' || hash === '#workers') && appState.role !== 'owner') {
      window.location.hash = '#dashboard';
      return;
  }

  const sections = document.querySelectorAll('.view-section');
  sections.forEach(section => {
    if (`#${section.id}` === hash) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });

  // Call specific render functions based on route
  if (hash === '#cattle') renderCattleList();
  if (hash === '#farmers') renderFarmersList();
  if (hash === '#workers') renderWorkersList();
  if (hash === '#milk') renderMilkRecords();
  if (hash === '#dashboard') updateDashboardStats();
  if (hash === '#events') renderEvents();
  if (hash === '#transactions') renderTransactions();
  if (hash === '#reports') renderReports();
  if (hash === '#security-logs') renderSecurityLogs();
  if (hash === '#jobs') renderJobs();
}

window.addEventListener('hashchange', handleRouting);

// Cross-tab syncing for live updates
window.addEventListener('storage', (e) => {
    if (e.key === 'chatMessages') {
        appState.chatMessages = JSON.parse(e.newValue) || [];
        renderChat();
    }
    if (e.key === 'jobs') {
        appState.jobs = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#jobs') renderJobs();
    }
    if (e.key === 'notifications') {
        appState.notifications = JSON.parse(e.newValue) || [];
        renderNotifications();
    }
    if (e.key === 'users') {
        appState.users = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#workers') renderWorkersList();
    }
    if (e.key === 'cattle') {
        appState.cattle = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#cattle') renderCattleList();
        if (window.location.hash === '#reports') renderReports();
        updateDashboardStats();
    }
    if (e.key === 'milkRecords') {
        appState.milkRecords = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#milk') renderMilkRecords();
        if (window.location.hash === '#reports') renderReports();
        updateDashboardStats();
    }
    if (e.key === 'farmers') {
        appState.farmers = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#farmers') renderFarmersList();
        populateFarmerDropdown();
    }
    if (e.key === 'events') {
        appState.events = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#events') renderEvents();
    }
    if (e.key === 'transactions') {
        appState.transactions = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#transactions') renderTransactions();
        if (window.location.hash === '#reports') renderReports();
    }
    if (e.key === 'auditLogs') {
        appState.auditLogs = JSON.parse(e.newValue) || [];
        if (window.location.hash === '#security-logs') renderSecurityLogs();
    }
});

window.addEventListener('DOMContentLoaded', () => {
  handleRouting();
  populateCattleDropdowns();
  populateFarmerDropdown();
  populateChatTargets();
  populateWorkerDropdown();
  renderNotifications();
  setupFormListeners();
  applyRoleRestrictions();
});

// Close popups on outside click
document.addEventListener('click', (e) => {
    // Notifications Popup
    const notifPopup = document.getElementById('notifications-popup');
    const notifBtn = document.querySelector('button[title="Notifications"]');
    if (notifPopup && notifPopup.classList.contains('active')) {
        if (!notifPopup.contains(e.target) && (!notifBtn || !notifBtn.contains(e.target))) {
            notifPopup.classList.remove('active');
        }
    }

    // Chat Popup
    const chatPopup = document.getElementById('chat-popup');
    const chatBtn = document.querySelector('.chat-fab');
    if (chatPopup && chatPopup.classList.contains('active')) {
        if (!chatPopup.contains(e.target) && (!chatBtn || !chatBtn.contains(e.target))) {
            chatPopup.classList.remove('active');
        }
    }

    // Cattle Detail Modal
    const cattleModal = document.getElementById('cattle-detail-modal');
    if (cattleModal && cattleModal.classList.contains('active')) {
        if (e.target === cattleModal) {
            closeCattleDetails();
        }
    }
});

// Role Restrictions
function applyRoleRestrictions() {
    const ownerElements = document.querySelectorAll('.owner-only');
    const workerElements = document.querySelectorAll('.worker-only');
    
    // Auth status header display
    const authStatus = document.getElementById('auth-status');
    const roleDisplay = document.getElementById('user-role-display');
    const chatTitle = document.getElementById('chat-header-title');
    const chatBody = document.getElementById('chat-body');

    if (authStatus) {
        authStatus.style.display = appState.isLoggedIn ? 'block' : 'none';
        if(roleDisplay) {
            const displayRole = appState.role === 'owner' ? 'Admin' : 'Worker';
            roleDisplay.textContent = `${appState.realName} (${displayRole})`;
        }
    }

    if (appState.role === 'worker') {
        ownerElements.forEach(el => el.style.display = 'none');
        workerElements.forEach(el => el.style.display = 'flex');
        if (chatTitle) chatTitle.textContent = "💬 Admin Support";
        renderChat();
    } else {
        ownerElements.forEach(el => el.style.display = ''); // reset to default
        workerElements.forEach(el => el.style.display = 'none');
        if (chatTitle) chatTitle.textContent = "💬 Worker Chat";
        renderChat();
    }
}

// Toast Notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// UI Rendering Functions
function populateChatTargets() {
    const chatTarget = document.getElementById('chat-target');
    if (!chatTarget) return;
    
    let optionsHTML = '<option value="public">📢 Public (Everyone)</option>';
    
    if (appState.role === 'owner') {
        const workers = appState.users.filter(u => u.role === 'worker');
        workers.forEach(w => {
            optionsHTML += `<option value="${w.username}">🔒 Private: ${w.realName}</option>`;
        });
    } else {
        optionsHTML += `<option value="admin">🔒 Private: Admin</option>`;
    }
    
    chatTarget.innerHTML = optionsHTML;
}

function renderChat() {
    const chatBody = document.getElementById('chat-body');
    if (!chatBody) return;

    const visibleMessages = appState.chatMessages.filter(msg => {
        if (msg.target === 'public') return true;
        if (msg.senderUsername === appState.username) return true;
        if (msg.target === appState.username) return true;
        if (appState.role === 'owner' && msg.target === 'admin') return true;
        return false;
    });
    
    if (visibleMessages.length === 0) {
        chatBody.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">No messages yet. Start the conversation!</div>`;
        return;
    }

    chatBody.innerHTML = visibleMessages.map(msg => {
        let msgClass = msg.role === 'owner' ? 'admin' : 'worker';
        let prefix = msg.target === 'public' ? '📢 [Public]' : '🔒 [Private]';
        return `<div class="chat-msg ${msgClass}"><div style="font-size: 0.7rem; color: #888; margin-bottom: 2px;">${prefix}</div><strong>${msg.senderName || msg.sender}:</strong> ${msg.text}</div>`;
    }).join('');
    
    chatBody.scrollTop = chatBody.scrollHeight;
}

function populateWorkerDropdown() {
    const workerSelect = document.getElementById('job-worker');
    if (!workerSelect) return;
    
    const workers = appState.users.filter(u => u.role === 'worker');
    workerSelect.innerHTML = '<option value="">Select Worker...</option>' + 
        workers.map(w => `<option value="${w.username}">${w.realName}</option>`).join('');
}

function renderJobs() {
    const tbody = document.getElementById('jobs-table-body');
    if(!tbody) return;

    // Filter jobs based on role
    let visibleJobs = appState.jobs;
    if (appState.role === 'worker') {
        visibleJobs = appState.jobs.filter(j => j.workerUsername === appState.username);
    }

    const sortedJobs = [...visibleJobs].sort((a,b) => new Date(b.date) - new Date(a.date));

    if (sortedJobs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No tasks available.</td></tr>`;
        return;
    }

    tbody.innerHTML = sortedJobs.map(job => {
        const dateStr = new Date(job.date).toLocaleDateString();
        const statusColor = job.status === 'Completed' ? '#2b8b3b' : '#ff9800';
        return `
            <tr>
                <td>${dateStr}</td>
                <td><strong>${job.workerName}</strong></td>
                <td>${job.task}</td>
                <td><span style="color: ${statusColor}; font-weight: bold;">${job.status}</span></td>
                <td>${job.status === 'Completed' ? '✅' : '⏳'}</td>
            </tr>
        `;
    }).join('');
}

function renderNotifications() {
    const notifList = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    if (!notifList || !badge) return;

    const myNotifs = appState.notifications.filter(n => n.targetUsername === appState.username || n.targetRole === appState.role || n.targetUsername === 'all');
    const unreadCount = myNotifs.filter(n => !n.read).length;

    if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.textContent = unreadCount;
    } else {
        badge.style.display = 'none';
    }

    if (myNotifs.length === 0) {
        notifList.innerHTML = `<div style="padding: 1rem; text-align: center; color: #888;">No notifications.</div>`;
        return;
    }

    const sortedNotifs = [...myNotifs].sort((a,b) => new Date(b.date) - new Date(a.date));

    notifList.innerHTML = sortedNotifs.map(n => {
        let actionHtml = '';
        if (!n.read && n.jobId) {
            actionHtml = `<button class="btn btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; margin-top: 0.5rem;" onclick="markJobComplete('${n.jobId}', '${n.id}')">Mark Completed</button>`;
        }
        return `
            <div class="notification-item ${n.read ? '' : 'unread'}" style="padding: 0.8rem; border-bottom: 1px solid #eee;">
                <div class="notif-content">
                    <p style="margin:0; font-size: 0.9rem; font-weight: ${n.read ? 'normal' : 'bold'};">${n.message}</p>
                    <small style="color: #888;">${new Date(n.date).toLocaleString()}</small>
                    <div style="display:block;">${actionHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

window.markJobComplete = async function(jobId, notifId) {
    const job = appState.jobs.find(j => j.id === jobId);
    if (job) job.status = 'Completed';

    const notif = appState.notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;

    appState.notifications.push({
        id: 'notif_' + Date.now(),
        targetRole: 'owner',
        message: `Task Completed by ${appState.realName}: ${job ? job.task : ''}`,
        date: new Date().toISOString(),
        read: false
    });

    await logSecurityEvent(`Completed Task: ${job ? job.task : ''}`);
    saveState();
    renderNotifications();
    showToast('Task marked as completed!');
}

window.markAllNotificationsRead = function() {
    let changed = false;
    appState.notifications.forEach(n => {
        if ((n.targetUsername === appState.username || n.targetRole === appState.role || n.targetUsername === 'all') && !n.read) {
            n.read = true;
            changed = true;
        }
    });
    if (changed) {
        saveState();
        renderNotifications();
        showToast('All notifications cleared');
    }
}

function renderCattleList() {
  const tbody = document.getElementById('cattle-table-body');
  if(!tbody) return;
  
  const filterSelect = document.getElementById('cattle-filter-farmer');
  const filterVal = filterSelect ? filterSelect.value : 'all';

  let filteredCattle = appState.cattle;
  if (filterVal !== 'all' && filterVal !== '') {
      filteredCattle = appState.cattle.filter(c => c.farmerId === filterVal);
  }

  tbody.innerHTML = filteredCattle.map(c => {
    let healthColor = c.health === 'Sick' ? '#c62828' : (c.health === 'Under Treatment' ? '#ff9800' : '#2b8b3b');
    let healthDisplay = c.health ? `<span style="color: ${healthColor}; font-weight: bold;">${c.health}</span>` : `<span style="color: #2b8b3b; font-weight: bold;">Healthy</span>`;
    
    let farmerName = '-';
    if (c.farmerId) {
        const farmer = appState.farmers.find(f => f.id === c.farmerId);
        if (farmer) farmerName = `${farmer.name} (${farmer.farmName})`;
    }

    return `
    <tr>
      <td><strong>${c.tag || c.id}</strong></td>
      <td>${farmerName}</td>
      <td>${c.name}</td>
      <td>${c.breed}</td>
      <td>${c.age}</td>
      <td>${c.weight} kg</td>
      <td><span class="status-badge" style="background-color: var(--primary-light);">${c.stage}</span></td>
      <td>${healthDisplay}</td>
      <td><button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="showCattleDetails('${c.id}')">View</button></td>
    </tr>
    `;
  }).join('');
}

window.showCattleDetails = function(id) {
    const cow = appState.cattle.find(c => c.id === id || c.tag === id);
    if (!cow) return;

    const modal = document.getElementById('cattle-detail-modal');
    const body = document.getElementById('cattle-detail-body');

    const milk = appState.milkRecords.filter(m => m.cattleId === cow.tag || m.cattleId === cow.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const events = appState.events.filter(e => e.cattleId === cow.tag || e.cattleId === cow.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    body.innerHTML = `
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
                <h4 style="color: var(--primary-dark); margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Profile</h4>
                <p style="margin-bottom: 0.5rem;"><strong>Tag ID:</strong> ${cow.tag || cow.id}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Name:</strong> ${cow.name}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Breed:</strong> ${cow.breed}</p>
                <p style="margin-bottom: 0.5rem;"><strong>Age:</strong> ${cow.age} Years</p>
                <p style="margin-bottom: 0.5rem;"><strong>Weight:</strong> ${cow.weight} kg</p>
                <p style="margin-bottom: 0.5rem;"><strong>Stage:</strong> <span class="status-badge" style="background-color: var(--primary-light); padding: 0.2rem 0.5rem; border-radius: 10px; color: white; font-size: 0.8rem;">${cow.stage}</span></p>
                <p style="margin-bottom: 0.5rem;"><strong>Health:</strong> <span style="font-weight: bold; color: ${cow.health === 'Sick' ? '#c62828' : (cow.health === 'Under Treatment' ? '#ff9800' : '#2b8b3b')}">${cow.health || 'Healthy'}</span></p>
                ${cow.favoriteFood ? `<p style="margin-bottom: 0.5rem;"><strong>Favorite Food:</strong> ${cow.favoriteFood}</p>` : ''}
            </div>
            ${cow.cattleImage || cow.shelterImage ? `
            <div style="flex: 1; min-width: 250px;">
                <h4 style="color: var(--primary-dark); margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Images</h4>
                ${cow.cattleImage ? `<div style="margin-bottom: 1rem;"><p style="font-weight: bold; margin-bottom: 0.2rem; font-size: 0.9rem;">Cattle Image</p><img src="${cow.cattleImage}" style="max-width: 100%; border-radius: 8px;"></div>` : ''}
                ${cow.shelterImage ? `<div style="margin-bottom: 1rem;"><p style="font-weight: bold; margin-bottom: 0.2rem; font-size: 0.9rem;">Living Shelter</p><img src="${cow.shelterImage}" style="max-width: 100%; border-radius: 8px;"></div>` : ''}
            </div>` : ''}
            <div style="flex: 1; min-width: 250px;">
                <h4 style="color: var(--primary-dark); margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Recent Milk Records</h4>
                ${milk.length ? milk.map(m => `<div style="margin-bottom: 0.5rem; font-size: 0.9rem;"><strong>${m.date}</strong> (${m.session}): ${m.yield} L</div>`).join('') : '<p style="color: var(--text-muted); font-size: 0.9rem;">No records found.</p>'}
                
                <h4 style="color: var(--primary-dark); margin-top: 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Recent Events</h4>
                ${events.length ? events.map(e => `<div style="margin-bottom: 0.5rem; font-size: 0.9rem;"><strong>${e.date}</strong> (${e.type}): ${e.notes}</div>`).join('') : '<p style="color: var(--text-muted); font-size: 0.9rem;">No events found.</p>'}
            </div>
        </div>
    `;

    modal.classList.add('active');
}

window.closeCattleDetails = function() {
    const modal = document.getElementById('cattle-detail-modal');
    if(modal) modal.classList.remove('active');
}

function renderSecurityLogs() {
    const tbody = document.getElementById('security-table-body');
    if(!tbody) return;
    
    const sortedLogs = [...appState.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    tbody.innerHTML = sortedLogs.map(log => {
        const dateObj = new Date(log.timestamp);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
        const statusColor = log.status === 'Success' ? '#2b8b3b' : '#c62828';
        const locHtml = log.location 
            ? `<a href="https://maps.google.com/?q=${log.location.lat},${log.location.lng}" target="_blank" title="View on Map">📍 Map</a>` 
            : 'Unknown';

        return `
            <tr>
                <td><span style="font-size: 0.85rem; color: var(--text-muted);">${dateStr}</span></td>
                <td><strong>${log.usernameAttempt}</strong></td>
                <td><span style="color: ${statusColor}; font-weight: bold;">${log.status}</span></td>
                <td>${locHtml}</td>
            </tr>
        `;
    }).join('');
}

function renderEvents() {
    const tbody = document.getElementById('events-table-body');
    if(!tbody) return;
    tbody.innerHTML = appState.events.map(e => `
        <tr>
            <td>${e.date}</td>
            <td><strong>${e.type}</strong></td>
            <td>${e.cattleId || 'General'}</td>
            <td>${e.notes}</td>
            <td><span style="font-size: 0.8rem; color: var(--text-muted);">${e.loggedBy || 'System'}</span></td>
            <td>${e.location ? `<a href="https://maps.google.com/?q=${e.location.lat},${e.location.lng}" target="_blank" title="View on Map">📍</a>` : '-'}</td>
        </tr>
    `).join('');
}

function renderTransactions() {
    const tbody = document.getElementById('trans-table-body');
    if(!tbody) return;
    tbody.innerHTML = appState.transactions.map(t => {
        let farmerName = '-';
        if (t.farmerId) {
            const farmer = appState.farmers.find(f => f.id === t.farmerId);
            if (farmer) farmerName = farmer.name;
        }
        return `
        <tr>
            <td>${t.date}</td>
            <td><span class="status-badge" style="background-color: ${t.type === 'Income' ? '#2b8b3b' : '#c62828'};">${t.type}</span></td>
            <td>${farmerName}</td>
            <td>${t.description}</td>
            <td><strong>${parseFloat(t.amount).toLocaleString('en-US')}</strong></td>
            <td><span style="font-size: 0.8rem; color: var(--text-muted);">${t.loggedBy || 'System'}</span></td>
            <td>${t.location ? `<a href="https://maps.google.com/?q=${t.location.lat},${t.location.lng}" target="_blank" title="View on Map">📍</a>` : '-'}</td>
        </tr>
        `;
    }).join('');
}

// Global chart instances
let financeChartInstance = null;
let milkChartInstance = null;

function renderReports() {
    const incomeEl = document.getElementById('report-income');
    const expenseEl = document.getElementById('report-expense');
    const profitEl = document.getElementById('report-profit');
    const milkVolEl = document.getElementById('report-milk-vol');

    const filterSelect = document.getElementById('report-filter-farmer');
    const filterVal = filterSelect ? filterSelect.value : 'all';

    let filteredTransactions = appState.transactions;
    let filteredMilkRecords = appState.milkRecords;

    if (filterVal !== 'all' && filterVal !== '') {
        filteredTransactions = appState.transactions.filter(t => t.farmerId === filterVal);
        const farmerCattleIds = appState.cattle.filter(c => c.farmerId === filterVal).map(c => c.id).concat(
            appState.cattle.filter(c => c.farmerId === filterVal).map(c => c.tag)
        );
        filteredMilkRecords = appState.milkRecords.filter(m => farmerCattleIds.includes(m.cattleId));
    }

    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
        if(t.type === 'Income') income += parseFloat(t.amount);
        else expense += parseFloat(t.amount);
    });
    
    let profit = income - expense;
    let milkVol = filteredMilkRecords.reduce((sum, r) => sum + parseFloat(r.yield), 0);

    if(incomeEl) incomeEl.textContent = `LKR ${income.toLocaleString('en-US')}`;
    if(expenseEl) expenseEl.textContent = `LKR ${expense.toLocaleString('en-US')}`;
    if(profitEl) {
        profitEl.textContent = `LKR ${profit.toLocaleString('en-US')}`;
        profitEl.style.color = profit >= 0 ? '#2b8b3b' : '#c62828';
    }
    if(milkVolEl) milkVolEl.textContent = `${milkVol.toFixed(1)} L`;

    // Financial Chart
    const ctxFinance = document.getElementById('financeChart');
    if (ctxFinance && window.Chart) {
        if (financeChartInstance) financeChartInstance.destroy();
        financeChartInstance = new Chart(ctxFinance, {
            type: 'bar',
            data: {
                labels: ['Total Income', 'Total Expenses', 'Net Profit'],
                datasets: [{
                    label: 'Amount (LKR)',
                    data: [income, expense, profit],
                    backgroundColor: ['#2b8b3b', '#c62828', profit >= 0 ? '#1976d2' : '#c62828'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Milk Production Trend (Last 7 Days)
    const ctxMilk = document.getElementById('milkChart');
    if (ctxMilk && window.Chart) {
        if (milkChartInstance) milkChartInstance.destroy();
        
        // Aggregate milk yields by date
        const dailyYields = {};
        filteredMilkRecords.forEach(r => {
            dailyYields[r.date] = (dailyYields[r.date] || 0) + parseFloat(r.yield);
        });
        
        // Sort dates
        const sortedDates = Object.keys(dailyYields).sort((a, b) => new Date(a) - new Date(b));
        // Take last 7 days
        const last7Dates = sortedDates.slice(-7);
        const last7Yields = last7Dates.map(d => dailyYields[d]);

        milkChartInstance = new Chart(ctxMilk, {
            type: 'line',
            data: {
                labels: last7Dates,
                datasets: [{
                    label: 'Daily Milk Yield (Liters)',
                    data: last7Yields,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function renderMilkRecords() {
  const tbody = document.getElementById('milk-table-body');
  
  if (appState.milkRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No milk records added yet.</td></tr>`;
    return;
  }

  // Sort by date descending
  const sortedRecords = [...appState.milkRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sortedRecords.map(record => `
    <tr>
      <td>${record.date}</td>
      <td><strong>${record.cattleId}</strong></td>
      <td>${record.session}</td>
      <td>${record.yield} L</td>
      <td>${record.fat}%</td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted);">${record.loggedBy || 'System'}</span></td>
      <td>${record.location ? `<a href="https://maps.google.com/?q=${record.location.lat},${record.location.lng}" target="_blank" title="View on Map">📍</a>` : '-'}</td>
    </tr>
  `).join('');
}

function updateDashboardStats() {
  const totalCattle = appState.cattle.length;
  
  // Calculate today's milk yield
  const today = new Date().toISOString().split('T')[0];
  const todaysYield = appState.milkRecords
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + parseFloat(r.yield), 0);

  // Calculate lactating and pregnant
  const lactatingCount = appState.cattle.filter(c => c.stage === 'Lactating').length;
  const pregnantCount = appState.cattle.filter(c => c.stage === 'Pregnant').length;
  
  // Calculate total milk all time
  const totalMilkAllTime = appState.milkRecords.reduce((sum, r) => sum + parseFloat(r.yield), 0);

  // Update DOM (we will add these elements to the dashboard in HTML)
  const cattleCountEl = document.getElementById('stat-total-cattle');
  const milkYieldEl = document.getElementById('stat-today-milk');
  const lactatingEl = document.getElementById('stat-lactating');
  const pregnantEl = document.getElementById('stat-pregnant');
  const totalMilkEl = document.getElementById('stat-total-milk');
  
  if(cattleCountEl) cattleCountEl.textContent = totalCattle;
  if(milkYieldEl) milkYieldEl.textContent = `${todaysYield.toFixed(1)} L`;
  if(lactatingEl) lactatingEl.textContent = lactatingCount;
  if(pregnantEl) pregnantEl.textContent = pregnantCount;
  if(totalMilkEl) totalMilkEl.textContent = `${totalMilkAllTime.toFixed(1)} L`;
}

function populateCattleDropdowns() {
  const selects = document.querySelectorAll('.cattle-select');
  const options = appState.cattle.map(c => `<option value="${c.id}">${c.id} - ${c.name}</option>`).join('');
  
  selects.forEach(select => {
    if (select.id === 'event-cattle-id') {
      select.innerHTML = '<option value="">General (No specific cattle)</option>' + options;
    } else {
      select.innerHTML = '<option value="">Select Cattle...</option>' + options;
    }
  });
}

async function getCurrentLocation() {
    try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await response.json();
        return { lat: data.latitude, lng: data.longitude };
    } catch (error) {
        console.warn("Location error:", error);
        return null;
    }
}

function renderFarmersList() {
    const tbody = document.getElementById('farmers-table-body');
    if(!tbody) return;
    
    if (appState.farmers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No farmers registered yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = appState.farmers.map(f => {
        const cattleCount = appState.cattle.filter(c => c.farmerId === f.id).length;
        return `
        <tr>
            <td><strong>${f.id}</strong></td>
            <td>${f.name}</td>
            <td>${f.farmName}</td>
            <td>${f.contact}</td>
            <td>${f.location}</td>
            <td>
                <strong style="color: var(--primary-color); font-size: 1.1rem;">${cattleCount}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">/ ${f.declaredCattleCount || 0} declared</span>
            </td>
            <td><button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="filterCattleByFarmer('${f.id}')">View Cattle</button></td>
        </tr>
        `;
    }).join('');
}

window.filterCattleByFarmer = function(farmerId) {
    const filterSelect = document.getElementById('cattle-filter-farmer');
    if (filterSelect) filterSelect.value = farmerId;
    window.location.hash = '#cattle';
    renderCattleList();
}

function renderWorkersList() {
    const tbody = document.getElementById('workers-table-body');
    if(!tbody) return;
    
    const workers = appState.users.filter(u => u.role === 'worker');
    if (workers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No workers registered yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = workers.map(w => `
        <tr>
            <td><strong>${w.realName || '-'}</strong></td>
            <td>${w.username}</td>
            <td><span class="status-badge" style="background-color: #2b8b3b;">Worker</span></td>
            <td><button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; color: #c62828; border-color: #c62828;" onclick="removeWorker('${w.username}')">Remove</button></td>
        </tr>
    `).join('');
}

window.removeWorker = async function(username) {
    if (confirm(`Are you sure you want to remove worker '${username}'?`)) {
        appState.users = appState.users.filter(u => u.username !== username);
        localStorage.setItem('users', JSON.stringify(appState.users));
        await logSecurityEvent(`Removed Worker: ${username}`);
        showToast(`Worker ${username} removed successfully.`);
        renderWorkersList();
    }
}

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function populateFarmerDropdown() {
    const options = appState.farmers.map(f => `<option value="${f.id}">${f.name} - ${f.farmName}</option>`).join('');
    
    const cattleSelect = document.getElementById('cattle-farmer-id');
    if (cattleSelect) cattleSelect.innerHTML = '<option value="">Select Farmer...</option>' + options;

    const transSelect = document.getElementById('trans-farmer-id');
    if (transSelect) transSelect.innerHTML = '<option value="">None (General)</option>' + options;

    const cattleFilter = document.getElementById('cattle-filter-farmer');
    if (cattleFilter) {
        const currentVal = cattleFilter.value;
        cattleFilter.innerHTML = '<option value="all">All Farmers</option>' + options;
        if(currentVal) cattleFilter.value = currentVal;
    }

    const reportFilter = document.getElementById('report-filter-farmer');
    if (reportFilter) {
        const currentVal = reportFilter.value;
        reportFilter.innerHTML = '<option value="all">All Farmers</option>' + options;
        if(currentVal) reportFilter.value = currentVal;
    }
}

async function logSecurityEvent(actionDetails, preFetchedLoc = null) {
    const loc = preFetchedLoc || await getCurrentLocation();
    appState.auditLogs.push({
        timestamp: new Date().toISOString(),
        usernameAttempt: `${appState.realName} (${actionDetails})`,
        status: 'Activity',
        location: loc
    });
    saveState();
}

window.resizeImage = function(file, maxSize) {
    return new Promise((resolve, reject) => {
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to jpeg
            }
        };
        reader.onerror = error => reject(error);
    });
}

// Form Listeners
function setupFormListeners() {
  const workerUsernameInput = document.getElementById('worker-username');
  if (workerUsernameInput) {
      workerUsernameInput.addEventListener('input', (e) => {
          const val = e.target.value.toLowerCase().trim();
          const feedback = document.getElementById('worker-username-feedback');
          if (val === '') {
              if (feedback) feedback.textContent = '';
              workerUsernameInput.style.borderColor = '';
              return;
          }
          
          const isTaken = appState.users.some(u => u.username === val);
          if (isTaken) {
              if (feedback) {
                  feedback.textContent = 'Username already exists.';
                  feedback.style.color = '#c62828';
              }
              workerUsernameInput.style.borderColor = '#c62828';
          } else {
              if (feedback) {
                  feedback.textContent = 'Username is available!';
                  feedback.style.color = '#2b8b3b';
              }
              workerUsernameInput.style.borderColor = '#2b8b3b';
          }
      });
  }

  // Add Worker Form
  document.getElementById('form-add-worker')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const realName = window.escapeHTML(document.getElementById('worker-realname').value.trim());
      const usernameInput = document.getElementById('worker-username');
      const username = window.escapeHTML(usernameInput.value.toLowerCase().trim());
      const password = document.getElementById('worker-password').value;
      const feedback = document.getElementById('worker-username-feedback');

      if (appState.users.some(u => u.username === username)) {
          if (feedback) {
              feedback.textContent = 'Username already exists.';
              feedback.style.color = '#c62828';
          }
          usernameInput.style.borderColor = '#c62828';
          showToast("Cannot register: Username already taken.");
          return;
      }

      const hashedPassword = await hashPassword(password);

      appState.users.push({
          username: username,
          password: hashedPassword,
          role: 'worker',
          realName: realName
      });
      
      localStorage.setItem('users', JSON.stringify(appState.users));
      await logSecurityEvent(`Registered New Worker: ${username}`);
      
      if (feedback) feedback.textContent = '';
      usernameInput.style.borderColor = '';
      showToast("Worker Registered Successfully!");
      e.target.reset();
      renderWorkersList();
  });

  // Add Farmer Form
  document.getElementById('form-add-farmer')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newFarmer = {
          id: 'F' + Date.now().toString().slice(-6),
          name: window.escapeHTML(document.getElementById('farmer-name').value),
          farmName: window.escapeHTML(document.getElementById('farmer-farm-name').value),
          contact: window.escapeHTML(document.getElementById('farmer-contact').value),
          location: window.escapeHTML(document.getElementById('farmer-location').value),
          declaredCattleCount: parseInt(document.getElementById('farmer-cattle-count').value, 10) || 0,
          registeredAt: new Date().toISOString()
      };
      
      appState.farmers.push(newFarmer);
      await logSecurityEvent(`Added Farmer: ${newFarmer.name}`);
      saveState();
      showToast('Farmer added successfully!');
      e.target.reset();
      populateFarmerDropdown();
      window.location.hash = '#farmers';
  });

  // Add Cattle Form
  document.getElementById('form-add-cattle')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cattleImgFile = document.getElementById('cattle-image').files[0];
    const shelterImgFile = document.getElementById('cattle-shelter-image').files[0];
    
    let cattleImageStr = null;
    let shelterImageStr = null;
    
    if (cattleImgFile) cattleImageStr = await resizeImage(cattleImgFile, 400);
    if (shelterImgFile) shelterImageStr = await resizeImage(shelterImgFile, 400);

    const newCow = {
      id: Date.now().toString(),
      farmerId: window.escapeHTML(document.getElementById('cattle-farmer-id').value),
      tag: window.escapeHTML(document.getElementById('cattle-tag').value),
      name: window.escapeHTML(document.getElementById('cattle-name').value),
      breed: window.escapeHTML(document.getElementById('cattle-breed').value),
      age: window.escapeHTML(document.getElementById('cattle-age').value),
      weight: window.escapeHTML(document.getElementById('cattle-weight').value),
      stage: window.escapeHTML(document.getElementById('cattle-stage').value),
      health: window.escapeHTML(document.getElementById('cattle-health').value),
      favoriteFood: window.escapeHTML(document.getElementById('cattle-food').value),
      cattleImage: cattleImageStr,
      shelterImage: shelterImageStr
    };
    
    appState.cattle.push(newCow);
    await logSecurityEvent(`Added Cattle: ${newCow.tag}`);
    saveState();
    showToast('Cattle added successfully!');
    e.target.reset();
    populateCattleDropdowns();
    window.location.hash = '#cattle';
  });

  // Add Milk Record Form
  document.getElementById('form-add-milk')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Getting Location...';
    btn.disabled = true;

    const loc = await getCurrentLocation();

    const newRecord = {
      id: Date.now().toString(),
      cattleId: window.escapeHTML(document.getElementById('milk-cattle-id').value),
      date: window.escapeHTML(document.getElementById('milk-date').value),
      session: window.escapeHTML(document.getElementById('milk-session').value),
      yield: window.escapeHTML(document.getElementById('milk-yield').value),
      fat: window.escapeHTML(document.getElementById('milk-fat').value),
      protein: window.escapeHTML(document.getElementById('milk-protein').value),
      ph: window.escapeHTML(document.getElementById('milk-ph').value),
      loggedBy: window.escapeHTML(appState.realName),
      location: loc
    };
    
    appState.milkRecords.push(newRecord);
    await logSecurityEvent('Added Milk Record', loc);
    saveState();
    showToast('Milk record added successfully!');
    e.target.reset();
    btn.textContent = originalText;
    btn.disabled = false;
    window.location.hash = '#milk';
  });

  // Add Event Form
  document.getElementById('form-add-event')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Getting Location...';
      btn.disabled = true;

      const loc = await getCurrentLocation();

      const newEvent = {
          date: window.escapeHTML(document.getElementById('event-date').value),
          cattleId: window.escapeHTML(document.getElementById('event-cattle-id').value),
          type: window.escapeHTML(document.getElementById('event-type').value),
          notes: window.escapeHTML(document.getElementById('event-notes').value),
          loggedBy: window.escapeHTML(appState.realName),
          location: loc
      };
      
      appState.events.push(newEvent);
      await logSecurityEvent(`Added Event: ${newEvent.type}`, loc);
      saveState();
      e.target.reset();
      btn.textContent = originalText;
      btn.disabled = false;
      renderEvents();
      showToast('Event recorded successfully!');
  });

  // Add Transaction Form
  document.getElementById('form-add-transaction')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Getting Location...';
      btn.disabled = true;

      const loc = await getCurrentLocation();

      const newTrans = {
          date: window.escapeHTML(document.getElementById('trans-date').value),
          type: window.escapeHTML(document.getElementById('trans-type').value),
          farmerId: window.escapeHTML(document.getElementById('trans-farmer-id').value),
          amount: window.escapeHTML(document.getElementById('trans-amount').value),
          description: window.escapeHTML(document.getElementById('trans-desc').value),
          loggedBy: window.escapeHTML(appState.realName),
          location: loc
      };
      
      appState.transactions.push(newTrans);
      await logSecurityEvent(`Added Transaction: ${newTrans.type}`, loc);
      saveState();
      e.target.reset();
      btn.textContent = originalText;
      btn.disabled = false;
      renderTransactions();
      showToast('Transaction recorded successfully!');
  });

  // Feed Optimization Form
  document.getElementById('form-feed-opt')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Inputs
    const cattleId = document.getElementById('opt-cattle-id').value;
    const milkYield = parseFloat(document.getElementById('opt-milk-yield').value);
    const temp = parseFloat(document.getElementById('opt-temp').value);
    const humidity = parseFloat(document.getElementById('opt-humidity').value);
    
    if(!cattleId) {
       showToast("Please select a cattle.");
       return;
    }

    // Find cattle to get weight
    const cow = appState.cattle.find(c => c.tag === cattleId);
    const weight = cow ? parseFloat(cow.weight) : 400; // Default 400kg if not found

    // Feed Optimization Logic (EEX6183 Proposal + Environmental Factors)
    // 1. Maintenance Requirement: Dry Matter Intake (DMI) approx 2.5% of body weight
    let totalDMI = weight * 0.025; 
    
    // Heat stress adjustment (THI approximation): Reduce intake if too hot
    if (temp > 30 && humidity > 70) {
        totalDMI *= 0.9; // 10% reduction in appetite due to severe heat stress
        showToast("Warning: High heat/humidity. Feed intake may be reduced.");
    }
    
    // 2. Production Requirement: Additional feed based on milk yield
    // Assuming 1 kg concentrate mix per 2.5 L of milk above 5L base
    let concentrateRequirement = 0;
    if (milkYield > 5) {
      concentrateRequirement = (milkYield - 5) / 2.5;
    } else if (milkYield > 0) {
       concentrateRequirement = 0.5; // Minimum concentrate for lactating
    }

    // 3. Forage Requirement: Remainder of DMI
    const forageDMI = totalDMI - concentrateRequirement;
    
    // 4. Translate DMI to fresh feed (Assuming Guinea/CO-3 grass has ~25% Dry Matter)
    const freshGrass = Math.max(0, forageDMI / 0.25);

    // 5. Water requirement (increases with temperature)
    let waterReq = milkYield * 3 + 30; // base
    if (temp > 28) {
        waterReq += (temp - 28) * 1.5; // 1.5L extra per degree over 28C
    }

    // Display Results
    document.getElementById('res-grass').textContent = `${freshGrass.toFixed(1)} kg`;
    document.getElementById('res-concentrate').textContent = `${concentrateRequirement.toFixed(1)} kg`;
    document.getElementById('res-water').textContent = `${waterReq.toFixed(1)} L`;

    const resultCard = document.getElementById('feed-result-card');
    resultCard.classList.add('show');
    showToast('Feed recommendation generated!');
  });

  // Form Assign Job
  document.getElementById('form-assign-job')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const workerSelect = document.getElementById('job-worker');
      const workerUsername = window.escapeHTML(workerSelect.value);
      const workerName = window.escapeHTML(workerSelect.options[workerSelect.selectedIndex].text);
      const taskDesc = window.escapeHTML(document.getElementById('job-desc').value);

      const jobId = Date.now().toString();
      const newJob = {
          id: jobId,
          workerUsername: workerUsername,
          workerName: workerName,
          task: taskDesc,
          status: 'Pending',
          date: new Date().toISOString()
      };

      appState.jobs.push(newJob);

      appState.notifications.push({
          id: 'notif_' + jobId,
          targetUsername: workerUsername,
          jobId: jobId,
          message: `New Task Assigned: ${taskDesc}`,
          date: new Date().toISOString(),
          read: false
      });

      await logSecurityEvent(`Assigned Job to ${workerName}: ${taskDesc}`);
      saveState();
      
      e.target.reset();
      renderJobs();
      showToast('Task assigned successfully!');
  });

  // Chat Form
  document.getElementById('form-chat')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = window.escapeHTML(input.value.trim());
      const target = window.escapeHTML(document.getElementById('chat-target').value);
      if (!text) return;
      
      const newMessage = {
          senderUsername: appState.username,
          senderName: appState.realName,
          role: appState.role,
          target: target,
          text: text,
          timestamp: new Date().toISOString()
      };
      
      appState.chatMessages.push(newMessage);
      saveState();
      
      input.value = '';
      renderChat();
  });
}

window.exportDatabase = async function() {
    if (appState.role !== 'owner') return showToast('Unauthorized');
    await logSecurityEvent('Exported Database Backup');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cattle_care_database.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('Database exported successfully!');
}

window.importDatabase = function(event) {
    if (appState.role !== 'owner') return showToast('Unauthorized');
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (importedState.cattle && importedState.milkRecords) {
                appState.cattle = importedState.cattle;
                appState.milkRecords = importedState.milkRecords;
                if (importedState.farmers) {
                    appState.farmers = importedState.farmers;
                }
                appState.events = importedState.events || DEFAULT_EVENTS;
                appState.transactions = importedState.transactions || DEFAULT_TRANSACTIONS;
                if (importedState.users) {
                    appState.users = importedState.users;
                }
                if (importedState.auditLogs) {
                    appState.auditLogs = importedState.auditLogs;
                }
                if (importedState.chatMessages) {
                    appState.chatMessages = importedState.chatMessages;
                }
                if (importedState.jobs) {
                    appState.jobs = importedState.jobs;
                }
                if (importedState.notifications) {
                    appState.notifications = importedState.notifications;
                }
                saveState();
                showToast('Database restored successfully!');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast('Invalid database file!');
            }
        } catch (err) {
            showToast('Error parsing file!');
        }
    };
    reader.readAsText(file);
}

window.clearDatabase = function() {
    if (appState.role !== 'owner') return showToast('Unauthorized');
    if (confirm("⚠️ WARNING: This will permanently delete all farmers, cattle records, milk records, events, transactions, jobs, and chat logs from the system. This cannot be undone. Are you absolutely sure you want to wipe the system data?")) {
        const users = appState.users;
        const role = appState.role;
        const realName = appState.realName;
        const username = appState.username;
        const isLoggedIn = appState.isLoggedIn;
        
        localStorage.clear();
        
        // Keep user accounts and current login session intact
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('userRole', role);
        localStorage.setItem('currentUserRealName', realName);
        localStorage.setItem('currentUsername', username);
        localStorage.setItem('isLoggedIn', isLoggedIn);
        
        alert("Database has been wiped clean. Reloading system...");
        window.location.reload();
    }
}

window.downloadReportPDF = function() {
    const element = document.getElementById('printable-report');
    const title = document.getElementById('pdf-report-title');
    if (!element || !window.html2pdf) {
        showToast('PDF generator not ready. Please try again.');
        return;
    }
    
    const filterSelect = document.getElementById('report-filter-farmer');
    const filterVal = filterSelect ? filterSelect.value : 'all';
    
    let reportTitleStr = "Farm Sales & Analytics Report (All Farmers)";
    let filenameStr = `Global_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    if (filterVal !== 'all' && filterVal !== '') {
        const farmer = appState.farmers.find(f => f.id === filterVal);
        if (farmer) {
            reportTitleStr = `Analytics Report - ${farmer.name} (${farmer.farmName})`;
            filenameStr = `Farmer_Report_${farmer.id}_${new Date().toISOString().split('T')[0]}.pdf`;
        }
    }
    
    title.textContent = reportTitleStr;

    // Show the title for the PDF layout
    title.style.display = 'block';
    
    const opt = {
      margin:       0.5,
      filename:     filenameStr,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Hide the title again for the web view
        title.style.display = 'none';
        showToast('PDF downloaded successfully!');
    });
}

window.downloadSecurityReportTXT = function() {
    let textContent = "=================================================\n";
    textContent += "          CATTLE CARE - SECURITY AUDIT LOG       \n";
    textContent += "=================================================\n";
    textContent += "Generated on: " + new Date().toLocaleString() + "\n\n";

    const sortedLogs = [...appState.auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedLogs.forEach((log, index) => {
        const dateStr = new Date(log.timestamp).toLocaleString();
        const locStr = log.location ? `Lat: ${log.location.lat}, Lng: ${log.location.lng}` : "Unknown";
        textContent += `[${index + 1}] Date/Time: ${dateStr}\n`;
        textContent += `    Username: ${log.usernameAttempt}\n`;
        textContent += `    Status:   ${log.status}\n`;
        textContent += `    Location: ${locStr}\n`;
        textContent += "-------------------------------------------------\n";
    });

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Security_Audit_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Security Report Downloaded!');
}

window.logout = async function() {
    await logSecurityEvent('Logged Out');
    appState.isLoggedIn = false;
    saveState();
    window.location.href = 'login.html';
}

window.toggleChat = function() {
    const chatPopup = document.getElementById('chat-popup');
    if (chatPopup.classList.contains('active')) {
        chatPopup.classList.remove('active');
    } else {
        chatPopup.classList.add('active');
    }
}

window.toggleNotifications = function() {
    const notifPopup = document.getElementById('notifications-popup');
    if (notifPopup.classList.contains('active')) {
        notifPopup.classList.remove('active');
    } else {
        notifPopup.classList.add('active');
    }
}

window.exportDatabaseToExcel = function() {
    if (typeof XLSX === 'undefined') {
        showToast("Excel library not loaded yet.");
        return;
    }
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Farmers
    const farmersData = appState.farmers.map(f => ({
        ID: f.id,
        Name: f.name,
        'Farm Name': f.farmName,
        Contact: f.contact,
        Location: f.location,
        'Declared Cattle': f.declaredCattleCount || 0,
        'Registered At': f.registeredAt
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(farmersData), "Farmers");
    
    // Cattle (excluding images)
    const cattleData = appState.cattle.map(c => ({
        ID: c.id,
        'Farmer ID': c.farmerId,
        Tag: c.tag,
        Name: c.name,
        Breed: c.breed,
        Age: c.age,
        Weight: c.weight,
        Stage: c.stage,
        Health: c.health,
        'Favorite Food': c.favoriteFood
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cattleData), "Cattle");
    
    // Milk Records
    const milkData = appState.milkRecords.map(m => ({
        ID: m.id,
        'Cattle ID': m.cattleId,
        Date: m.date,
        Session: m.session,
        'Yield (L)': parseFloat(m.yield),
        'Fat (%)': parseFloat(m.fat) || 0,
        'Protein (%)': parseFloat(m.protein) || 0,
        pH: parseFloat(m.ph) || 0,
        'Logged By': m.loggedBy
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(milkData), "Milk Records");
    
    // Transactions
    const txData = appState.transactions.map(t => ({
        ID: t.id,
        Date: t.date,
        Type: t.type,
        Category: t.category,
        Amount: parseFloat(t.amount),
        Description: t.description,
        'Farmer ID': t.farmerId || 'N/A'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), "Transactions");
    
    // Events
    const eventsData = appState.events.map(e => ({
        ID: e.id,
        Date: e.date,
        Type: e.type,
        'Cattle ID': e.cattleId || 'General',
        Notes: e.notes
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventsData), "Events");
    
    // Users
    const usersData = appState.users.map(u => ({
        Username: u.username,
        'Real Name': u.realName,
        Role: u.role
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersData), "Users");
    
    // Download
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `CattleCare_Database_${dateStr}.xlsx`);
    
    logSecurityEvent("Exported Database to Excel");
    showToast("Excel Export Complete!");
}
