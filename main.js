import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, increment, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: "https://yara-portfolio-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// تثبيت اسم المستخدم (Username) وعدم إمكانية تغييره
window.addEventListener('DOMContentLoaded', () => {
    const userNameInput = document.getElementById('userName');
    const savedUser = localStorage.getItem('portfolio_username');
    
    if (userNameInput && savedUser) {
        userNameInput.value = savedUser;
        userNameInput.disabled = true; // قفل الحقل نهائياً
    }

    // استرجاع وعرض لايكات المشاريع من LocalStorage
    ['1', '2', '3'].forEach(id => {
        let savedLikes = localStorage.getItem('project_' + id) || 4;
        const btn = document.getElementById('projectBtn_' + id);
        if (btn) {
            btn.innerText = `❤️ ${savedLikes} Likes`;
        }
    });
});

// التعامل مع إضافة التعليقات الرئيسية وحفظ الاسم
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

    // جلب وعرض التعليقات والردود وتحديثها فورياً
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
                
                // بناء هيكل الردود (Replies) إن وجدت
                let repliesHTML = '';
                if (comment.replies) {
                    Object.keys(comment.replies).forEach(replyKey => {
                        const reply = comment.replies[replyKey];
                        repliesHTML += `
                            <div class="reply-item">
                                <strong>${reply.name}:</strong> ${reply.text}
                            </div>
                        `;
                    });
                }

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
                        <button onclick="likeComment('${key}')">❤️ ${comment.likes || 0} Likes</button>
                        <button onclick="toggleReplyForm('${key}')">💬 Reply</button>
                        <button onclick="deleteComment('${key}')" style="color: #ff4d4d;">🗑️ Delete</button>
                    </div>
                    
                    <div id="repliesContainer_${key}" class="replies-container" style="${comment.replies ? '' : 'display:none;'}">
                        ${repliesHTML}
                    </div>

                    <div id="replyForm_${key}" class="reply-form" style="display:none;">
                        <input type="text" id="replyInput_${key}" placeholder="Write a reply...">
                        <button onclick="submitReply('${key}')">Send</button>
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

// إظهار وإخفاء نموذج الرد
window.toggleReplyForm = function(commentId) {
    const form = document.getElementById('replyForm_' + commentId);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    }
};

// إضافة ريبلاي على كومنت (مع التحقق من تثبيت اليوزر)
window.submitReply = function(commentId) {
    const replyInput = document.getElementById('replyInput_' + commentId);
    const replyText = replyInput.value.trim();
    let userName = localStorage.getItem('portfolio_username');

    if (!userName) {
        alert("الرجاء كتابة اسمك في قسم التعليقات أولاً!");
        return;
    }

    if (!replyText) return;

    const repliesRef = ref(db, `comments/${commentId}/replies`);
    push(repliesRef, {
        name: userName,
        text: replyText,
        timestamp: new Date().toLocaleString()
    }).then(() => {
        replyInput.value = '';
        document.getElementById('replyForm_' + commentId).style.display = 'none';
    });
};

// دالة حذف التعليق
window.deleteComment = function(commentId) {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
        const commentRef = ref(db, 'comments/' + commentId);
        remove(commentRef);
    }
};

// لايكات البروجيكتس (مع منع التكرار)
window.likeProject = function(projectId) {
    const likedKey = 'liked_project_' + projectId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا المشروع مسبقاً!");
        return;
    }

    let likes = parseInt(localStorage.getItem('project_' + projectId) || 4) + 1;
    localStorage.setItem('project_' + projectId, likes);
    localStorage.setItem(likedKey, 'true');
    
    const btn = document.getElementById('projectBtn_' + projectId);
    if (btn) {
        btn.innerText = `❤️ ${likes} Likes`;
    }
};

// دوال فتح وغلق نافذة الفيديو (Modal)
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
