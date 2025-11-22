document.addEventListener('DOMContentLoaded', function() {
    
    const allLinks = document.querySelectorAll('a[href^="#"]');
    const navList = document.getElementById('nav-list');
    const mobileMenuBtn = document.getElementById('mobile-menu');

    allLinks.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
                if (navList.classList.contains('active')) {
                    navList.classList.remove('active');
                }
            }
        });
    });

    mobileMenuBtn.addEventListener('click', () => {
        navList.classList.toggle('active');
    });

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close');
    const galleryImages = document.querySelectorAll('.gallery-item img');

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
});