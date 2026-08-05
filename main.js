import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, increment, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: "https://yara-portfolio-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// تثبيت اسم المستخدم بحيث لا يمكن تغييره بعد الإدخال الأول
window.addEventListener('DOMContentLoaded', () => {
    const userNameInput = document.getElementById('userName');
    const savedUser = localStorage.getItem('portfolio_username');
    
    if (userNameInput && savedUser) {
        userNameInput.value = savedUser;
        userNameInput.disabled = true; // قفل حقل الاسم نهائياً
    }

    // تهيئة لايكات البروجيكتس
    ['1', '2', '3'].forEach(id => {
        let savedLikes = localStorage.getItem('project_' + id) || 20;
        const btn = document.getElementById('projectBtn_' + id);
        if (btn) {
            btn.innerText = `❤️ ${savedLikes} Likes`;
        }
    });
});

// التعامل مع نموذج التعليقات وحفظ اسم المستخدم
const commentForm = document.getElementById('commentForm');
if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userNameInput = document.getElementById('userName');
        let userName = localStorage.getItem('portfolio_username');

        if (!userName) {
            userName = userNameInput.value.trim();
            if (userName) {
                localStorage.setItem('portfolio_username', userName);
                userNameInput.disabled = true;
            }
        }

        const commentText = document.getElementById('commentText').value;
        
        const commentsRef = ref(db, 'comments');
        push(commentsRef, {
            name: userName,
            text: commentText,
            timestamp: new Date().toLocaleString(),
            likes: 0
        }).then(() => {
            document.getElementById('commentText').value = '';
        });
    });

    // جلب وعرض التعليقات
    const commentsRef = ref(db, 'comments');
    onValue(commentsRef, (snapshot) => {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        commentsList.innerHTML = '';
        
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach((key) => {
                const comment = data[key];
                const firstLetter = comment.name ? comment.name.charAt(0).toUpperCase() : 'A';
                
                const commentElement = document.createElement('div');
                commentElement.className = 'comment-card';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <div class="avatar">${firstLetter}</div>
                        <div>
                            <strong>${comment.name}</strong>
                            <div class="comment-date">${comment.timestamp}</div>
                        </div>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <button onclick="likeComment('${key}')" style="background:var(--bs-purple); border:none; color:#fff; padding:5px 10px; border-radius:5px; cursor:pointer;">❤️ ${comment.likes || 0} Likes</button>
                        <button onclick="deleteComment('${key}')" style="color: #ff4d4d; background: none; border: none; cursor: pointer; font-weight:bold;">🗑️ Delete</button>
                    </div>
                `;
                commentsList.appendChild(commentElement);
            });
        }
    });
}

// دالة لايك للتعليق (منع تكرار اللايك من نفس المتصفح)
window.likeComment = function(commentId) {
    const likedKey = 'liked_comment_' + commentId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا التعليق مسبقاً!");
        return;
    }

    const commentRef = ref(db, 'comments/' + commentId);
    update(commentRef, {
        likes: increment(1)
    }).then(() => {
        localStorage.setItem(likedKey, 'true');
    });
};

// دالة حذف التعليق
window.deleteComment = function(commentId) {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
        const commentRef = ref(db, 'comments/' + commentId);
        remove(commentRef);
    }
};

// لايكات البروجيكتس (منع تكرار اللايك)
window.likeProject = function(projectId) {
    const likedKey = 'liked_project_' + projectId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا المشروع مسبقاً!");
        return;
    }

    let likes = parseInt(localStorage.getItem('project_' + projectId) || 20) + 1;
    localStorage.setItem('project_' + projectId, likes);
    localStorage.setItem(likedKey, 'true');
    
    const btn = document.getElementById('projectBtn_' + projectId);
    if (btn) {
        btn.innerText = `❤️ ${likes} Likes`;
    }
};

// دوال تشغيل وإغلاق الفيديوهات (Modal)
window.openVideo = function(videoSrc) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    if (modal && video) {
        video.src = videoSrc;
        modal.classList.add('active');
        video.play();
    }
};

window.closeVideo = function() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    if (modal && video) {
        video.pause();
        video.src = '';
        modal.classList.remove('active');
    }
};
