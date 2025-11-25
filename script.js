import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ==========================================
// ✅ 
// ==========================================
const userFirebaseConfig = {
    apiKey: "AIzaSyCqb81HxYfDrdJo9Kqovqsh_S_Lm1fcBHs",
    authDomain: "natchana-beauty.firebaseapp.com",
    projectId: "natchana-beauty",
    storageBucket: "natchana-beauty.firebasestorage.app",
    messagingSenderId: "962508104900",
    appId: "1:962508104900:web:b46e5c2c2ef9e02d4f1591",
    measurementId: "G-QKRNJBTE56"
};
// ==========================================

// --- 1. ตรวจสอบสภาพแวดล้อม ---
let isLocal = false;
let app, auth, db, appId;

try {
    // ใช้ Config ของคุณ (userFirebaseConfig) เป็นหลักเสมอ
    console.log("Connecting to Natchana Beauty Database...");
    app = initializeApp(userFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = 'reviews_collection'; // ใช้ชื่อนี้เพื่อความง่ายในโปรเจกต์ส่วนตัว

} catch (e) {
    console.warn("Connection failed, switching to offline mode: ", e.message);
    isLocal = true;
}

// --- 2. ข้อมูลรีวิวเดิม (Static Data) ---
const staticReviews = [
    {
        name: "คุณพลอย",
        comment: "ประทับใจมากค่ะ ช่างแต่งหน้าสวยเป็นธรรมชาติมาก ทรงผมก็อยู่ทรงทั้งวัน แนะนำเลยค่ะ",
        rating: 5,
        createdAt: 0 
    },
    {
        name: "คุณนุ่น",
        comment: "ทำสีผมที่นี่ผมไม่เสียเลย สีสวยตรงปก บริการดีมากค่ะ เป็นกันเองสุดๆ",
        rating: 5,
        createdAt: 0
    },
    {
        name: "คุณเมย์",
        comment: "ร้านสะอาด บรรยากาศดี สระผมสบายมากจนเกือบหลับ จะกลับมาใช้บริการอีกแน่นอนค่ะ",
        rating: 4.5,
        createdAt: 0
    }
];

// --- 3. ฟังก์ชันแสดงรีวิว ---
function renderReviews(reviewsData) {
    const reviewsContainer = document.getElementById('dynamic-reviews');
    if (!reviewsContainer) return;
    
    const allReviews = [...reviewsData, ...staticReviews];
    // เรียงลำดับ: ใหม่ -> เก่า
    allReviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    reviewsContainer.innerHTML = allReviews.map(review => {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (review.rating >= i) {
                starsHtml += '<i class="fa-solid fa-star"></i> ';
            } else if (review.rating >= i - 0.5) {
                starsHtml += '<i class="fa-solid fa-star-half-stroke"></i> ';
            } else {
                starsHtml += '<i class="fa-regular fa-star" style="color: #ddd;"></i> ';
            }
        }

        let dateStr = "";
        if (review.createdAt > 0) {
            const dateObj = new Date(review.createdAt);
            dateStr = dateObj.toLocaleDateString('th-TH');
        }

        return `
            <div class="review-card">
                <div class="review-stars">${starsHtml}</div>
                <p class="review-text">"${review.comment}"</p>
                <div class="review-author">- ${review.name}</div>
                ${dateStr ? `<span class="review-date">${dateStr}</span>` : ''}
            </div>
        `;
    }).join('');
}

// --- 4. ฟังก์ชันเชื่อมต่อฐานข้อมูล ---
async function initApp() {
    if (isLocal) {
        renderReviews([]);
        return;
    }

    try {
        // ล็อกอินแบบ Anonymous เพื่อให้เข้าถึงฐานข้อมูลได้
        await signInAnonymously(auth); 

        // เชื่อมต่อกับ Collection ชื่อ 'reviews' ในโปรเจกต์ของคุณ
        const reviewsRef = collection(db, 'reviews'); 

        onSnapshot(reviewsRef, (snapshot) => {
            const dbReviews = [];
            snapshot.forEach(doc => {
                dbReviews.push({ id: doc.id, ...doc.data() });
            });
            renderReviews(dbReviews);
        }, (error) => {
            console.error("Error getting reviews:", error);
            // ถ้า Error เรื่อง Permission (เพราะยังไม่ได้แก้ Rules) จะยังโชว์รีวิวเดิมได้
            renderReviews([]);
        });

    } catch (err) {
        console.error("Connection error:", err);
        renderReviews([]);
    }
}

// --- 5. เริ่มต้นทำงาน ---
document.addEventListener('DOMContentLoaded', function() {
    
    // ตรวจสอบการเปิดไฟล์ (แจ้งเตือนถ้าเปิด file:// โดยตรงอาจมีปัญหาบางอย่าง แต่ส่วนใหญ่จะรอดเพราะ config ถูกต้องแล้ว)
    if (window.location.protocol === 'file:') {
        console.warn("Running from file:// protocol. Some features might be restricted by browser security.");
    }

    initApp();

    // --- UI Logic: ปุ่มสลับฟอร์ม ---
    const toggleBtn = document.getElementById('toggle-review-btn');
    const reviewFormContainer = document.getElementById('review-form');
    const cancelBtn = document.getElementById('cancel-review');

    if(toggleBtn && reviewFormContainer) {
        toggleBtn.addEventListener('click', () => {
            reviewFormContainer.classList.add('active');
            toggleBtn.style.display = 'none';
        });
    }

    if(cancelBtn && reviewFormContainer) {
        cancelBtn.addEventListener('click', () => {
            reviewFormContainer.classList.remove('active');
            if(toggleBtn) toggleBtn.style.display = 'inline-block';
        });
    }

    // --- UI Logic: ให้คะแนนดาว ---
    const stars = document.querySelectorAll('#rating-input i');
    const ratingValueInput = document.getElementById('rating-value');

    function updateStars(value) {
        stars.forEach(star => {
            if (star.getAttribute('data-value') <= value) {
                star.classList.remove('fa-regular');
                star.classList.add('fa-solid');
                star.style.color = '#FFD700';
            } else {
                star.classList.remove('fa-solid');
                star.classList.add('fa-regular');
                star.style.color = '#ddd';
            }
        });
    }

    if(stars.length > 0 && ratingValueInput) {
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                ratingValueInput.value = value;
                updateStars(value);
            });
        });
        updateStars(5);
    }

    // --- UI Logic: ส่งแบบฟอร์ม ---
    const form = document.getElementById('add-review-form');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('review-name').value;
            const comment = document.getElementById('review-comment').value;
            const rating = parseInt(document.getElementById('rating-value').value);
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;

            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังส่ง...';

            // กรณี Offline
            if (isLocal) {
                setTimeout(() => {
                    alert('โหมดออฟไลน์: ไม่สามารถบันทึกข้อมูลได้ในขณะนี้');
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }, 500);
                return;
            }

            if (!auth.currentUser) {
                // พยายามล็อกอินอีกครั้งถ้าหลุด
                try { await signInAnonymously(auth); } catch(e) {}
            }

            try {
                // บันทึกลง Collection 'reviews'
                await addDoc(collection(db, 'reviews'), {
                    name: name,
                    comment: comment,
                    rating: rating,
                    createdAt: Date.now()
                });

                alert('ขอบคุณสำหรับรีวิวครับ!');
                form.reset();
                updateStars(5);
                if(reviewFormContainer) reviewFormContainer.classList.remove('active');
                if(toggleBtn) toggleBtn.style.display = 'inline-block';

            } catch (error) {
                console.error("Error adding review:", error);
                alert('บันทึกไม่สำเร็จ: กรุณาตรวจสอบว่าได้ตั้งค่า Firestore Rules เป็น "allow read, write: if true;" หรือยังครับ');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }

    // --- General UI Scripts ---
    const navList = document.getElementById('nav-list');
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const allLinks = document.querySelectorAll('a[href^="#"]');

    if(mobileMenuBtn && navList) {
        mobileMenuBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }

    allLinks.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                if (navList) navList.classList.remove('active');
            }
        });
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close');
    const galleryImages = document.querySelectorAll('.gallery-item img');

    if(lightbox && lightboxImg && closeBtn) {
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                lightbox.style.display = "flex";
                lightbox.style.justifyContent = "center";
                lightbox.style.alignItems = "center";
                lightboxImg.src = img.src;
            });
        });

        closeBtn.addEventListener('click', () => {
            lightbox.style.display = "none";
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = "none";
            }
        });
    }
});
