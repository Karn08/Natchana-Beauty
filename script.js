import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- 1. ตรวจสอบสภาพแวดล้อม (Local vs Web) ---
let isLocal = false;
let app, auth, db, appId;

try {
    if (typeof __firebase_config !== 'undefined') {
        const firebaseConfig = JSON.parse(__firebase_config);
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    } else {
        // กรณีรันบน GitHub Pages หรือไม่มี Config
        isLocal = true;
    }
} catch (e) {
    console.warn("Offline/Local Mode active");
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
    // ถ้าเป็น Local Mode ให้แสดงแค่รีวิวเดิมแล้วจบเลย
    if (isLocal) {
        console.log("Displaying static reviews only.");
        renderReviews([]);
        return;
    }

    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }

        const reviewsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reviews');

        // ดึงข้อมูลรีวิวแบบ Real-time
        onSnapshot(reviewsRef, (snapshot) => {
            const dbReviews = [];
            snapshot.forEach(doc => {
                dbReviews.push({ id: doc.id, ...doc.data() });
            });
            renderReviews(dbReviews);
        }, (error) => {
            console.error("Error getting reviews:", error);
            renderReviews([]); // ถ้า error ให้โชว์ของเดิม
        });

    } catch (err) {
        console.error("Auth error:", err);
        renderReviews([]);
    }
}

// --- 5. เริ่มต้นทำงานเมื่อหน้าเว็บโหลดเสร็จ (แก้ไขปัญหาปุ่มกดไม่ติด) ---
document.addEventListener('DOMContentLoaded', function() {
    
    // แจ้งเตือนถ้ารันผิดวิธี (เปิดไฟล์ตรงๆ)
    if (window.location.protocol === 'file:') {
        alert('⚠️ คำแนะนำ: การเปิดไฟล์ index.html โดยตรงอาจทำให้ระบบรีวิวไม่ทำงาน\n\nกรุณาใช้ VS Code "Live Server" หรืออัปโหลดขึ้น GitHub Pages เพื่อให้ใช้งานได้สมบูรณ์ครับ');
        // บังคับโหมด Local เพื่อให้หน้าเว็บไม่พัง
        isLocal = true; 
    }

    // เริ่มโหลดรีวิว
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
        updateStars(5); // ค่าเริ่มต้น 5 ดาว
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

            // ถ้าเป็นโหมดทดลอง (Local/GitHub Pages)
            if (isLocal) {
                setTimeout(() => {
                    alert('บันทึกรีวิวสำเร็จ! (โหมดจำลอง: ข้อมูลจะแสดงผลชั่วคราว)');
                    form.reset();
                    updateStars(5);
                    if(reviewFormContainer) reviewFormContainer.classList.remove('active');
                    if(toggleBtn) toggleBtn.style.display = 'inline-block';
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                    
                    // เพิ่มรีวิวหลอกๆ ลงหน้าจอให้เห็นทันที
                    const mockReview = [{
                        name: name,
                        comment: comment,
                        rating: rating,
                        createdAt: Date.now()
                    }];
                    renderReviews(mockReview); // รีเรนเดอร์รวมกับของเดิม
                }, 800);
                return;
            }

            // ถ้าเป็นโหมดจริง (Firebase)
            if (!auth.currentUser) return;

            try {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reviews'), {
                    name: name,
                    comment: comment,
                    rating: rating,
                    createdAt: Date.now()
                });

                form.reset();
                updateStars(5);
                if(reviewFormContainer) reviewFormContainer.classList.remove('active');
                if(toggleBtn) toggleBtn.style.display = 'inline-block';

            } catch (error) {
                console.error("Error adding review:", error);
                alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }

    // --- UI Logic: Navbar & Lightbox (ส่วนทั่วไป) ---
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

    // Lightbox
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
