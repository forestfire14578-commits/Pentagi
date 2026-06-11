// Supabase Configuration
const SUPABASE_URL = 'https://liclveedljxfusiikyvi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpY2x2ZWVkbGp4ZnVzaWlreXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Mzk5NjIsImV4cCI6MjA5NjIxNTk2Mn0.aQAvI35PHrtjqTBsFYIX2O_SznXDsTpTTmOkuerNFZo';

// ============================================
// SUPABASE API HELPERS
// ============================================

// Generic fetch helper
async function supabaseQuery(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const error = await response.text();
        console.error('Supabase error:', error);
        throw new Error(error);
    }
    
    return response.json();
}

// ============================================
// ACCOUNTS
// ============================================
async function getAccounts() {
    return supabaseQuery('accounts?select=*');
}

async function getAccount(username) {
    const result = await supabaseQuery(`accounts?username=eq.${encodeURIComponent(username)}&select=*`);
    return result[0] || null;
}

async function createAccount(account) {
    return supabaseQuery('accounts', {
        method: 'POST',
        body: JSON.stringify(account)
    });
}

async function updateAccount(username, data) {
    return supabaseQuery(`accounts?username=eq.${encodeURIComponent(username)}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteAccount(username) {
    return supabaseQuery(`accounts?username=eq.${encodeURIComponent(username)}`, {
        method: 'DELETE'
    });
}

// ============================================
// SERVERS
// ============================================
async function getServersDB() {
    return supabaseQuery('servers?select=*');
}

async function getServer(id) {
    const result = await supabaseQuery(`servers?id=eq.${encodeURIComponent(id)}&select=*`);
    return result[0] || null;
}

async function createServer(server) {
    return supabaseQuery('servers', {
        method: 'POST',
        body: JSON.stringify(server)
    });
}

async function updateServer(id, data) {
    return supabaseQuery(`servers?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

async function deleteServerDB(id) {
    return supabaseQuery(`servers?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}

// ============================================
// VOTES
// ============================================
async function getVotesDB() {
    return supabaseQuery('votes?select=*');
}

async function castVote(serverId, username) {
    return supabaseQuery('votes', {
        method: 'POST',
        body: JSON.stringify({
            server_id: serverId,
            username: username
        })
    });
}

async function getServerVotes(serverId) {
    return supabaseQuery(`votes?server_id=eq.${encodeURIComponent(serverId)}&select=*`);
}

// ============================================
// REPORTS
// ============================================
async function getReportsDB() {
    return supabaseQuery('reports?select=*');
}

async function createReport(report) {
    return supabaseQuery('reports', {
        method: 'POST',
        body: JSON.stringify(report)
    });
}

async function dismissReport(id) {
    return supabaseQuery(`reports?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// ============================================
// CATEGORIES
// ============================================
async function getCategoriesDB() {
    return supabaseQuery('categories?select=*');
}

async function addCategory(name) {
    return supabaseQuery('categories', {
        method: 'POST',
        body: JSON.stringify({ name })
    });
}

async function deleteCategoryDB(name) {
    return supabaseQuery(`categories?name=eq.${encodeURIComponent(name)}`, {
        method: 'DELETE'
    });
}

// ============================================
// SETTINGS
// ============================================
async function getSettingsDB() {
    return supabaseQuery('settings?select=*');
}

async function updateSetting(key, value) {
    return supabaseQuery(`settings?key=eq.${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value })
    });
}