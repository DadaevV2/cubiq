// ========================================
// БУРГЕР-МЕНЮ (мобильная навигация)
// ========================================
document.querySelector('.burger')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('active');
});

// ========================================
// МОДАЛЬНОЕ ОКНО ДЛЯ ДЕМО-ЗОНЫ (старое)
// ========================================
const demoModal = document.getElementById('demoModal');
const demoBtn = document.getElementById('demoBtn');
const closeDemoBtn = document.querySelector('#demoModal .close');

demoBtn?.addEventListener('click', () => {
    if (demoModal) demoModal.style.display = 'flex';
});
closeDemoBtn?.addEventListener('click', () => {
    if (demoModal) demoModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
    if (e.target === demoModal) demoModal.style.display = 'none';
});

// ========================================
// 3D КУБ (Three.js)
// ========================================
let scene, camera, renderer, cube;

function init3DCube() {
    const container = document.getElementById('cube3dContainer');
    if (!container) return;
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const colors = [0xff6666, 0x66ff66, 0x6666ff, 0xffdd66, 0xff66dd, 0x66ffff];
    const materials = colors.map(c => new THREE.MeshStandardMaterial({ color: c, emissive: 0x222222 }));
    cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));
    camera.position.z = 4;
    
    function animate() {
        requestAnimationFrame(animate);
        if (cube) cube.rotation.y += 0.005;
        if (cube) cube.rotation.x += 0.003;
        renderer.render(scene, camera);
    }
    animate();
    
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// ========================================
// DRAG & DROP ДЛЯ ДЕМО-ЗОНЫ
// ========================================
const levelRules = {
    AND: { required: ['red', 'blue'], description: 'Нужны оба: красный И синий', success: '✅ Правильно! Красный И Синий = Истина' },
    OR: { required: ['red', 'blue'], any: true, description: 'Нужен хотя бы один: красный ИЛИ синий', success: '✅ Верно! Красный ИЛИ Синий = Истина' },
    NOT: { required: ['blue'], forbidden: ['red'], description: 'Синий, но не красный', success: '✅ Отлично! Синий и нет красного' }
};

let currentSlots = { 1: null, 2: null, 3: null, 4: null, 5: null };

function updateDemoFeedback() {
    const levelSelect = document.getElementById('levelSelect');
    if (!levelSelect) return;
    
    const level = levelSelect.value;
    const rule = levelRules[level];
    const values = Object.values(currentSlots).filter(v => v);
    const hasRed = values.includes('red');
    const hasBlue = values.includes('blue');
    let feedback = '';
    let correct = false;
    
    if (level === 'AND') {
        if (hasRed && hasBlue) { correct = true; feedback = rule.success; }
        else feedback = `❌ ${rule.description}`;
    } else if (level === 'OR') {
        if (hasRed || hasBlue) { correct = true; feedback = rule.success; }
        else feedback = `❌ ${rule.description}`;
    } else if (level === 'NOT') {
        if (hasBlue && !hasRed) { correct = true; feedback = rule.success; }
        else if (!hasBlue) feedback = `❌ Нужен синий куб`;
        else if (hasRed) feedback = `❌ Красный не должен быть! ${rule.description}`;
    }
    
    const feedbackDiv = document.getElementById('demoFeedback');
    if (feedbackDiv) {
        feedbackDiv.innerHTML = `<div style="color: ${correct ? '#4caf50' : '#f97316'}">${feedback}</div>`;
    }
    playBeep(correct);
}

function playBeep(success) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = success ? 880 : 440;
        gain.gain.value = 0.2;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) { console.log('Audio not supported'); }
}

function setupDragAndDrop() {
    const cards = document.querySelectorAll('.card');
    const container = document.getElementById('cube3dContainer');
    if (!container) return;
    
    cards.forEach(card => {
        card.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', card.dataset.color);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    
    container.addEventListener('dragover', e => e.preventDefault());
    container.addEventListener('drop', e => {
        e.preventDefault();
        const color = e.dataTransfer.getData('text/plain');
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const face = Math.floor((x / rect.width) * 5) + 1;
        if (face >= 1 && face <= 5) {
            currentSlots[face] = color;
            highlightFace(face, color);
            updateDemoFeedback();
        }
    });
}

function highlightFace(face, color) {
    if (!cube) return;
    const faceColors = { red: 0xe34234, blue: 0x3a6ea5, yellow: 0xe5c100, green: 0x4caf50 };
    const mat = cube.materials[face-1];
    mat.emissive.setHex(faceColors[color] || 0x888888);
    mat.emissiveIntensity = 0.7;
    setTimeout(() => { mat.emissiveIntensity = 0; }, 500);
}

document.getElementById('resetDemo')?.addEventListener('click', () => {
    currentSlots = { 1: null, 2: null, 3: null, 4: null, 5: null };
    if (cube) cube.materials.forEach(m => m.emissiveIntensity = 0);
    const feedback = document.getElementById('demoFeedback');
    if (feedback) feedback.innerHTML = '';
});

document.getElementById('levelSelect')?.addEventListener('change', updateDemoFeedback);

// ========================================
// КАЛЬКУЛЯТОР КОНСТРУКТОРА (новая логика)
// ========================================
function updateConstructorPrice() {
    const basePrice = 12500;
    let extra = 0;
    let details = [];

    const colors = document.querySelectorAll('.color-opt:checked');
    details.push(`${colors.length} цветов`);

    const stories = document.querySelectorAll('.story-opt:checked');
    stories.forEach(s => {
        extra += parseInt(s.dataset.price) || 0;
    });
    if (stories.length) details.push(`${stories.length} сказок (+${extra} ₽)`);

    const cards = document.getElementById('extraCards');
    if (cards) {
        const cardCount = parseInt(cards.value) || 0;
        const cardPrice = (cardCount / 5) * 500;
        extra += cardPrice;
        if (cardCount > 0) details.push(`${cardCount} карточек (+${cardPrice} ₽)`);
    }

    const battery = document.getElementById('battery');
    if (battery && battery.checked) {
        extra += 1500;
        details.push('Аккумулятор (+1500 ₽)');
    }

    const total = basePrice + extra;
    const totalEl = document.getElementById('totalPrice');
    const detailsEl = document.getElementById('summaryDetails');
    if (totalEl) totalEl.innerHTML = total.toLocaleString() + ' ₽';
    if (detailsEl) detailsEl.innerHTML = details.join(' • ');
}

// Инициализация конструктора (если страница конструктора)
if (document.getElementById('constructorForm')) {
    document.querySelectorAll('.color-opt, .story-opt, #extraCards, #battery').forEach(el => {
        el.addEventListener('change', updateConstructorPrice);
        el.addEventListener('input', updateConstructorPrice);
    });
    updateConstructorPrice();
}

// ========================================
// ОТПРАВКА ЗАКАЗА (Telegram заглушка)
// ========================================
document.getElementById('submitOrder')?.addEventListener('click', () => {
    const total = document.getElementById('totalPrice')?.innerText;
    const details = document.getElementById('summaryDetails')?.innerText;
    const msg = `🛒 НОВЫЙ ЗАКАЗ\nСумма: ${total}\nСостав: ${details}`;
    alert('Заказ отправлен! (в демо-режиме)\n\n' + msg);
    console.log('Order:', msg);
});

// ========================================
// ОТКРЫТИЕ КОНСТРУКТОРА
// ========================================
document.getElementById('openConstructor')?.addEventListener('click', () => {
    window.location.href = '/constructor.html';
});

// ========================================
// ЗАКАЗ УСЛУГ (кнопки в карточках)
// ========================================
document.querySelectorAll('.order-service').forEach(btn => {
    btn.addEventListener('click', () => {
        const service = btn.dataset.service;
        alert(`Заявка на "${service}" отправлена!\nМы свяжемся с вами.`);
    });
});

document.querySelectorAll('.buy-now').forEach(btn => {
    btn.addEventListener('click', () => {
        const product = btn.dataset.product;
        alert(`Заказ "${product}" оформлен!\nСпасибо за покупку!`);
    });
});

// ========================================
// ГАЛЕРЕЯ: ФИЛЬТРЫ И МОДАЛКА (новая)
// ========================================
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        galleryItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Модалка для заказа дизайна (НОВОЕ ИМЯ ПЕРЕМЕННОЙ)
const designModal = document.getElementById('designModal');
document.querySelectorAll('.order-design').forEach(btn => {
    btn.addEventListener('click', () => {
        if (designModal) designModal.style.display = 'flex';
    });
});
document.querySelector('#designModal .close')?.addEventListener('click', () => {
    if (designModal) designModal.style.display = 'none';
});

// Обработка формы заказа дизайна
document.getElementById('designForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Заявка на дизайн отправлена! Мы свяжемся с вами.');
    if (designModal) designModal.style.display = 'none';
    e.target.reset();
});

// ========================================
// ЗАКАЗ СВОЕЙ ЛОГИКИ
// ========================================
document.getElementById('customLogicBtn')?.addEventListener('click', () => {
    alert('Заявка на разработку своей логики отправлена!\nМы свяжемся для уточнения деталей.');
});

// ========================================
// ЗАПУСК 3D КУБА (если есть контейнер)
// ========================================
if (document.getElementById('cube3dContainer')) {
    init3DCube();
    setupDragAndDrop();
}