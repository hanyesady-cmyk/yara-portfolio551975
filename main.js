* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

:root {
    --bg-color: #0b071e;
    --text-color: #ffffff;
    --text-muted: #a0a0a0;
    --bs-purple: #6f42c1;
    --bs-cyan: #0dcaf0;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    scroll-behavior: smooth;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 8%;
    background: rgba(11, 7, 30, 0.95);
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
    font-size: 24px;
    font-weight: bold;
}

.logo span {
    color: var(--bs-cyan);
}

nav ul {
    display: flex;
    list-style: none;
    gap: 30px;
}

nav ul li a {
    color: var(--text-muted);
    text-decoration: none;
    transition: 0.3s;
}

nav ul li a.active, nav ul li a:hover {
    color: var(--text-color);
}

.hire-btn {
    border: 1px solid var(--bs-purple);
    padding: 8px 20px;
    border-radius: 20px;
    color: var(--text-color);
    text-decoration: none;
    transition: 0.3s;
}

.hire-btn:hover {
    background: var(--bs-purple);
}

#menuBtn {
    display: none;
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
}

section {
    padding: 100px 8% 50px 8%;
    min-height: 100vh;
}

h2 {
    font-size: 32px;
    margin-bottom: 30px;
    color: var(--text-color);
}

.skills-container {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.skills-container span {
    background: rgba(255, 255, 255, 0.05);
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.project-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

#commentForm {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 600px;
    margin-bottom: 40px;
}

#commentForm input, #commentForm textarea {
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
}

#commentForm button {
    padding: 10px 20px;
    background: var(--bs-purple);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
}

.comment-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.avatar {
    width: 40px;
    height: 40px;
    background: var(--bs-purple);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.comment-date {
    font-size: 12px;
    color: var(--text-muted);
}

.comment-text {
    color: var(--text-muted);
    margin-bottom: 15px;
}

.comment-actions {
    display: flex;
    gap: 15px;
    align-items: center;
}

.comment-actions button {
    background: none;
    border: none;
    color: var(--bs-cyan);
    cursor: pointer;
    font-size: 13px;
}

.replies {
    margin-top: 15px;
    padding-left: 20px;
    border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.reply {
    margin-top: 10px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal.active {
    display: flex;
}

.modal-content {
    position: relative;
    width: 80%;
    max-width: 700px;
}

.modal-content video {
    width: 100%;
    border-radius: 10px;
}

.close-btn {
    position: absolute;
    top: -40px;
    right: 0;
    font-size: 30px;
    color: #fff;
    cursor: pointer;
}

@media (max-width: 768px) {
    nav ul {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 70px;
        left: 0;
        width: 100%;
        background: var(--bg-color);
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    nav ul.active {
        display: flex;
    }
    #menuBtn {
        display: block;
    }
}
