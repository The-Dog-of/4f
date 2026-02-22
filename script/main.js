const apiURL = "/api/send"; 

(function() {
    const gameProxies = [
        'https://games.roproxy.com/v1/games?universeIds=',
        'https://api.allorigins.win/get?url=' + encodeURIComponent('https://games.roblox.com/v1/games?universeIds=')
    ];
    const thumbProxies = [
        'https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=',
        'https://corsproxy.io/?' + encodeURIComponent('https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=')
    ];

    async function tryFetch(proxyList, ids, isThumb = false) {
        for (let baseUrl of proxyList) {
            try {
                let url = isThumb ? baseUrl + ids + '&size=768x432&format=Png&isCircular=false' : baseUrl + ids;
                const isAllOrigins = baseUrl.includes('allorigins');
                const response = await fetch(url);
                if (!response.ok) continue;

                let data = await response.json();
                if (isAllOrigins && data.contents) data = JSON.parse(data.contents);
                if (data && data.data) return data;
            } catch (e) { continue; }
        }
        return null;
    }

    async function fetchRobloxData() {
        const cards = document.querySelectorAll('.game-card');
        const uids = Array.from(cards).map(c => c.dataset.universeId).filter(id => id);
        if (uids.length === 0) return;

        const idString = uids.join(',');
        try {
            const [gameData, thumbData] = await Promise.all([
                tryFetch(gameProxies, idString),
                tryFetch(thumbProxies, idString, true)
            ]);

            if (!gameData || !gameData.data) return;

            cards.forEach(card => {
                const uid = parseInt(card.dataset.universeId);
                const game = gameData.data.find(g => g.id === uid);
                const thumb = thumbData && thumbData.data ? thumbData.data.find(t => t.universeId === uid) : null;

                if (game) {
                    const nameEl = card.querySelector('.game-name');
                    if (nameEl) nameEl.innerText = game.name;
                    const activeEl = card.querySelector('.active-count');
                    if (activeEl) activeEl.innerText = game.playing.toLocaleString();
                    const peakEl = card.querySelector('.peak-count');
                    if (peakEl) peakEl.innerText = Math.floor(game.playing * 1.3 + 50).toLocaleString() + '+';
                    const visitEl = card.querySelector('.visit-count');
                    if (visitEl) {
                        let v = game.visits;
                        visitEl.innerText = v >= 1e6 ? (v / 1e6).toFixed(1) + 'M+' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K+' : v.toLocaleString();
                    }
                }
                if (thumb && thumb.thumbnails && thumb.thumbnails[0]) {
                    const img = card.querySelector('.game-thumb');
                    if (img) img.src = thumb.thumbnails[0].imageUrl;
                }
            });
        } catch (e) {}
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchRobloxData);
    else fetchRobloxData();
})();

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener('mousemove', (e) => {
        document.documentElement.style.setProperty('--x', e.clientX + 'px');
        document.documentElement.style.setProperty('--y', e.clientY + 'px');
    });

    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    const revealElements = document.querySelectorAll('.reveal');
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.15 });
    revealElements.forEach((el) => scrollObserver.observe(el));

    const statsSection = document.querySelector('.stats-section');
    const counters = document.querySelectorAll('.counter');
    let counted = false;
    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !counted) {
            counted = true;
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                let frame = 0;
                const totalFrames = 100;
                const updateCounter = () => {
                    frame++;
                    const progress = (frame / totalFrames) * (2 - (frame / totalFrames));
                    const currentCount = Math.round(target * progress);
                    if (frame < totalFrames) {
                        counter.innerText = currentCount;
                        requestAnimationFrame(updateCounter);
                    } else counter.innerText = target;
                };
                updateCounter();
            });
        }
    });
    if(statsSection) statsObserver.observe(statsSection);

    const teamScrollWrapper = document.querySelector('.team-scroll-wrapper');
    if(teamScrollWrapper) {
        teamScrollWrapper.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) teamScrollWrapper.scrollLeft += e.deltaY;
        }, { passive: true });
    }
});

const contactForm = document.getElementById('contactForm');
const formResult = document.getElementById('formResult');
const formButton = document.getElementById('formButton');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const company = formData.get('company') || "Não informado";
        const message = formData.get('message');

        const originalBtnText = formButton.innerHTML;
        formButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        formButton.disabled = true;
        formResult.style.display = 'none';

        const payload = {
            username: "4For Site Contact",
            avatar_url: "https://i.pinimg.com/736x/f3/34/31/f33431cdc786d238676cb617fc066ba9.jpghttps://i.pinimg.com/736x/f3/34/31/f33431cdc786d238676cb617fc066ba9.jpg",
            embeds: [{
                title: "📨 Nova Mensagem de Contato",
                color: 5793266,
                fields: [
                    { name: "👤 Nome", value: name, inline: true },
                    { name: "🏢 Empresa", value: company, inline: true },
                    { name: "📧 Email", value: email, inline: false },
                    { name: "📝 Mensagem", value: message.length > 1024 ? message.substring(0, 1021) + "..." : message }
                ],
                footer: { text: "$4For Studio Web System" },
                timestamp: new Date().toISOString()
            }]
        };

        fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async response => {
            if (response.ok) {
                formResult.innerHTML = "Message sent successfully!";
                formResult.classList.remove('error');
                formResult.classList.add('success');
                formResult.style.display = 'block';
                contactForm.reset();
            } else {
                throw new Error('Server Error');
            }
        })
        .catch(error => {
            formResult.innerHTML = "Error sending message.";
            formResult.classList.remove('success');
            formResult.classList.add('error');
            formResult.style.display = 'block';
        })
        .finally(() => {
            formButton.innerHTML = originalBtnText;
            formButton.disabled = false;
            setTimeout(() => { formResult.style.display = 'none'; }, 6000);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll('.slideshow-container .slide');
    let currentSlide = 0;
    const slideInterval = 8000; 

    if (slides.length > 0) {

        slides[0].classList.add('active');

        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, slideInterval);
    }
});