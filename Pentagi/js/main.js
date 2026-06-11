/* ============================================
   PENTAGI SERVER LIST - Main JavaScript (Supabase)
   ============================================ */

// ============================================
// 1. SUPABASE API HELPERS
// ============================================
const SUPABASE_URL = 'https://liclveedljxfusiikyvi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpY2x2ZWVkbGp4ZnVzaWlreXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Mzk5NjIsImV4cCI6MjA5NjIxNTk2Mn0.aQAvI35PHrtjqTBsFYIX2O_SznXDsTpTTmOkuerNFZo';

async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    if (options.headers) Object.assign(headers, options.headers);
    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    } catch (error) {
        console.error('Supabase error:', error);
        return null;
    }
}

// ============================================
// 2. DATA FUNCTIONS (Supabase)
// ============================================

// Servers
async function getServers() {
    return await supabaseQuery('servers?select=*') || [];
}

async function saveServers(servers) {} // No longer needed - each function handles its own

// Users
async function getUsers() {
    return await supabaseQuery('accounts?select=*') || [];
}

async function saveUsers(users) {} // No longer needed

// Votes
async function getVotes() {
    const votes = await supabaseQuery('votes?select=*') || [];
    const voteMap = {};
    votes.forEach(v => {
        if (!voteMap[v.server_id]) voteMap[v.server_id] = {};
        voteMap[v.server_id][v.username] = v.voted_at;
    });
    return voteMap;
}

async function castVote(serverId, username) {
    return await supabaseQuery('votes', {
        method: 'POST',
        body: JSON.stringify({ server_id: serverId, username: username })
    });
}

// Categories
async function getCategories() {
    const cats = await supabaseQuery('categories?select=*') || [];
    return cats.map(c => c.name);
}

// Reports
async function getReports() {
    return await supabaseQuery('reports?select=*') || [];
}

async function createReport(report) {
    return await supabaseQuery('reports', {
        method: 'POST',
        body: JSON.stringify(report)
    });
}

// ============================================
// 3. LOGGED IN USER (still uses localStorage)
// ============================================
function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('pentagiLoggedIn'));
}

function generateId() {
    return 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// 4. SERVER QUERY (Live Data from mcsrvstat.us)
// ============================================
async function queryServer(ip) {
    try {
        const response = await fetch(`https://api.mcsrvstat.us/2/${ip}`);
        const data = await response.json();
        return {
            online: data.online || false,
            players: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            playerList: data.players?.list || [],
            motd: data.motd?.clean?.[0] || '',
            version: data.version || 'Unknown',
            icon: data.icon || ''
        };
    } catch (error) {
        return { online: false, players: 0, maxPlayers: 0, playerList: [] };
    }
}

// ============================================
// 5. NAVBAR AUTH RENDERER
// ============================================
function renderNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;
    
    const user = getLoggedInUser();
    
    const allowedPages = ['lockdown.html', 'login.html', 'signup.html', 'index.html', 'contact.html', 'tos.html'];
    const isAllowed = allowedPages.some(page => window.location.href.includes(page));
    
    if (user && user.status === 'under_review' && !isAllowed) {
        window.location.href = 'lockdown.html';
        return;
    }
    
    if (user) {
        navAuth.innerHTML = `
            <div class="nav-user-menu" onclick="this.classList.toggle('active')">
                <div class="nav-avatar" style="overflow:hidden;">${user.pfp ? `<img src="${user.pfp}" style="width:100%;height:100%;object-fit:cover;">` : user.username.charAt(0).toUpperCase()}</div>
                <span class="nav-username">${user.username}</span>
                <i class="fas fa-chevron-down"></i>
                <div class="nav-dropdown">
                    <span style="padding:8px 12px;font-size:12px;color:var(--text-muted);display:block;">Signed in as <strong style="color:var(--text-primary);">${user.username}</strong></span>
                    <hr style="border-color:var(--border);margin:4px 0;">
                    ${user.role === 'owner' ? '<a href="owner-dashboard.html"><i class="fas fa-server"></i> My Servers</a>' : ''}
                    ${user.role === 'admin' ? '<a href="admin.html"><i class="fas fa-shield-halved"></i> Admin Panel</a>' : ''}
                    <a href="account-settings.html"><i class="fas fa-cog"></i> Account Settings</a>
                    <a href="#" onclick="logoutNav()"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                </div>
            </div>`;
    } else {
        navAuth.innerHTML = '<a href="login.html" class="btn-login">Log In</a>';
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-user-menu')) {
            document.querySelectorAll('.nav-user-menu').forEach(m => m.classList.remove('active'));
        }
    });
}

function logoutNav() {
    localStorage.removeItem('pentagiLoggedIn');
    window.location.href = 'index.html';
}

// ============================================
// 6. SERVER CARD HTML GENERATOR (WITH BANNER)
// ============================================
async function createServerCardHTML(server) {
    const votes = await getVotes();
    const voteCount = votes[server.id] ? Object.keys(votes[server.id]).length : 0;
    
    if (server.status === 'Banned' || server.status === 'Under Review') {
        const statusClass = server.status === 'Banned' ? 'red' : 'orange';
        return `
            <div class="server-card">
                <div class="server-card-banner">
                    <div class="banner-placeholder"><i class="fas fa-cube"></i></div>
                </div>
                <div class="server-card-body">
                    <div class="server-card-header">
                        <div class="server-logo has-banner"><i class="fas fa-cube"></i></div>
                        <div class="server-card-info">
                            <div class="server-card-name">${server.name}</div>
                            <div class="server-card-category">${server.category}</div>
                        </div>
                        <div class="server-status">
                            <span class="status-dot ${statusClass}"></span>
                            <span class="status-text ${statusClass}-text">${server.status}</span>
                        </div>
                    </div>
                    <p class="hidden-info" style="text-align:center;">This server is ${server.status.toLowerCase()}. Information is hidden.</p>
                </div>
            </div>`;
    }
    
    const statusClass = server.status === 'Online' ? 'green' : server.status === 'Starting' ? 'yellow' : 'red';
    
    return `
        <div class="server-card">
            <div class="server-card-banner">
                ${server.banner ? `<img src="${server.banner}" alt="${server.name}">` : '<div class="banner-placeholder"><i class="fas fa-cube"></i></div>'}
            </div>
            <div class="server-card-body">
                <div class="server-card-header">
                    <div class="server-logo has-banner">
                        ${server.logo ? `<img src="${server.logo}" alt="${server.name}">` : '<i class="fas fa-cube"></i>'}
                    </div>
                    <div class="server-card-info">
                        <div class="server-card-name">${server.name}</div>
                        <div class="server-card-category">${server.category}</div>
                    </div>
                    <div class="server-status">
                        <span class="status-dot ${statusClass}"></span>
                        <span class="status-text ${statusClass}-text">${server.status}</span>
                    </div>
                </div>
                <div class="server-card-desc">${server.description || 'No description provided.'}</div>
                ${server.tags ? `<div class="server-card-tags">${server.tags.split(',').map(tag => `<span class="tag-badge">${tag.trim()}</span>`).join('')}</div>` : ''}
                <div class="server-card-stats">
                    <div class="server-stat">
                        <i class="fas fa-globe"></i> 
                        <span class="server-ip-text">${server.ip}</span>
                        <button class="btn-copy-ip" onclick="event.preventDefault(); event.stopPropagation(); copyIP('${server.ip}')" title="Copy IP">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="server-stat"><i class="fas fa-users"></i> <span id="players-${server.id}">--</span></div>
                    <div class="server-stat"><i class="fas fa-clock"></i> ${server.uptime || 'N/A'}</div>
                </div>
                <div class="server-card-bottom">
                    <span class="vote-count"><i class="fas fa-thumbs-up"></i> ${voteCount} votes</span>
                    <div style="display:flex;align-items:center;gap:12px;">
                        <button class="btn-report" onclick="event.preventDefault(); event.stopPropagation(); reportServer('${server.id}', '${server.name.replace(/'/g, "\\'")}')" title="Report this server">
                            <i class="fas fa-flag"></i>
                        </button>
                        <a href="server.html?id=${server.id}" class="btn-view-server">View Server <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        </div>`;
}

// ============================================
// 7. COPY IP
// ============================================
function copyIP(ip) {
    navigator.clipboard.writeText(ip).catch(() => {
        alert('IP: ' + ip);
    });
}

// ============================================
// 8. VOTING SYSTEM
// ============================================
async function voteForServer(serverId, usernameInput, buttonElement) {
    const username = usernameInput.value.trim();
    
    if (!username || username.length < 3) {
        alert('Please enter a valid Minecraft username (at least 3 characters).');
        return;
    }
    
    const votes = await getVotes();
    
    if (votes[serverId] && votes[serverId][username]) {
        const lastVote = new Date(votes[serverId][username]);
        const now = new Date();
        const hoursSinceVote = (now - lastVote) / (1000 * 60 * 60);
        
        if (hoursSinceVote < 24) {
            const hoursLeft = Math.ceil(24 - hoursSinceVote);
            alert(`You already voted! Come back in ${hoursLeft} hour(s).`);
            return;
        }
    }
    
    await castVote(serverId, username);
    
    if (buttonElement) {
        buttonElement.textContent = 'Vote Recorded!';
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.6';
    }
    
    alert('Vote recorded! Thank you for supporting this server.');
}

// ============================================
// 9. REPORT SYSTEM
// ============================================
function reportServer(serverId, serverName) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'reportModalOverlay';
    overlay.innerHTML = `
        <div class="modal" style="max-width: 440px;">
            <div class="modal-header">
                <h3>Report Server</h3>
                <button class="modal-close" onclick="closeReportModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">
                    Reporting: <strong style="color: var(--text-primary);">${serverName}</strong>
                </p>
                <div class="input-group">
                    <label>Reason for Report</label>
                    <div class="input-wrapper">
                        <i class="fas fa-flag"></i>
                        <select id="reportReason">
                            <option value="">Select a reason...</option>
                            <option value="Offline server">Server is offline</option>
                            <option value="Inappropriate content">Inappropriate content</option>
                            <option value="Fake information">Fake or misleading info</option>
                            <option value="Spam">Spam or advertising</option>
                            <option value="Scam">Scam or malicious</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Additional Details</label>
                    <div class="input-wrapper">
                        <i class="fas fa-comment"></i>
                        <textarea id="reportDetails" placeholder="Tell us more about the issue..." rows="3"></textarea>
                    </div>
                </div>
                <button class="btn-primary btn-full" onclick="submitReport('${serverId}', '${serverName.replace(/'/g, "\\'")}')">
                    <i class="fas fa-paper-plane"></i> Submit Report
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeReportModal();
    });
}

function closeReportModal() {
    const overlay = document.getElementById('reportModalOverlay');
    if (overlay) overlay.remove();
}

async function submitReport(serverId, serverName) {
    const reason = document.getElementById('reportReason').value;
    const details = document.getElementById('reportDetails').value.trim();
    if (!reason) {
        alert('Please select a reason for your report.');
        return;
    }
    await createReport({
        server_id: serverId,
        server_name: serverName,
        reason: reason,
        details: details,
        reviewed: false
    });
    closeReportModal();
    alert('Report submitted. Thank you for helping keep Pentagi honest!');
}

// ============================================
// 10. NAVBAR SCROLL EFFECT
// ============================================
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 50) {
        navbar.style.background = 'rgba(6, 6, 11, 0.95)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else if (navbar) {
        navbar.style.background = 'rgba(6, 6, 11, 0.8)';
        navbar.style.boxShadow = 'none';
    }
});

// ============================================
// 11. CONSOLE LOG
// ============================================
console.log('%c🐉 Pentagi %cServer List',
    'font-size: 20px; font-weight: bold; color: #6C63FF;',
    'font-size: 14px; color: #A0A0B8;');
console.log('%cThe most honest Minecraft server list.',
    'color: #10B981; font-style: italic;');