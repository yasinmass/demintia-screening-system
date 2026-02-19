// js/auth.js

function getCurrentPage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return page;
}

const AUTH_CONFIG = {
    loginPage: 'login.html',
    protectedPages: ['index.html', 'audio.html', 'quiz.html', 'result.html']
};

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user && AUTH_CONFIG.protectedPages.includes(getCurrentPage())) {
        window.location.href = AUTH_CONFIG.loginPage;
    }
}

function signup(userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === userData.email)) throw new Error('Email exists');
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    return true;
}

function login(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = AUTH_CONFIG.loginPage;
}

document.addEventListener('DOMContentLoaded', () => {
    if (getCurrentPage() !== 'login.html' && getCurrentPage() !== 'signup.html') {
        checkAuth();
    }
});
