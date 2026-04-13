const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 854; canvas.height = 480;

// Sonidos e Imágenes
const tecladoSound = new Audio('assets/audio/teclado.m4a');
const bgMusic = new Audio('./assets/audio/ambiente.m4a'); // Nueva línea
tecladoSound.loop = true;
bgMusic.loop = true;       // Para que suene siempre en bucle
bgMusic.volume = 0.1;     // Volumen al 40% para no saturar

const bg = new Image(); bg.src = 'assets/img/fondo.png';
const m1 = new Image(); m1.src = 'assets/img/mutante1.png';
const m2 = new Image(); m2.src = 'assets/img/mutante2.png';
const mTx = new Image(); mTx.src = 'assets/img/toxico.png';
const imgExp = new Image(); imgExp.src = 'assets/img/explosion.png';

const myStory = "Año 2045. En un laboratorio de alta tecnología dedicado a la investigación genética, se realiza un experimento para acelerar la evolución de microorganismos con el objetivo de desarrollar nuevas curas médicas. Sin embargo, durante una fase crítica ocurre una falla de contención que provoca una reacción inesperada. Los microorganismos mutan de forma incontrolable, volviéndose móviles y agresivos. Pronto escapan y comienzan a propagarse por todo el laboratorio. Tu misión es eliminarlos antes de que se multipliquen y provoquen una catástrofe biológica.";
let charPos = 0, score = 0, level = 1, gameRunning = false;
let enemies = [], particles = [], bannerText = "", bannerTimer = 0;
let livesLost = 0;

// --- NARRATIVA ---
function iniciarNarrativa() {
    bgMusic.play().catch(() => console.log("Audio en espera de interacción"));

    document.getElementById("btn-pre-start").style.display = "none";
    document.getElementById("typewriter-text").style.display = "block";
    tecladoSound.play().catch(() => {});
    typeWriter();
}

function typeWriter() {
    if (charPos < myStory.length) {
        document.getElementById("typewriter-text").innerHTML += myStory.charAt(charPos);
        charPos++;
        setTimeout(typeWriter, 25);
    } else {
        tecladoSound.pause();
        document.getElementById("btn-start").classList.add("visible");
    }
}

// --- CLASES DEL JUEGO ---
class Mutant {
    constructor() {
        const roll = Math.random();
        if (roll < 0.6) { this.img = m1; this.pts = 5; this.speed = 1.5 + (level * 0.4); }
        else if (roll < 0.85) { this.img = m2; this.pts = 10; this.speed = 2.5 + (level * 0.5); }
        else { this.img = mTx; this.pts = -15; this.speed = 2; }
        this.size = 55;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
    }
    update() { this.y += this.speed; }
    draw() { ctx.drawImage(this.img, this.x, this.y, this.size, this.size); }
}

class Explosion {
    constructor(x, y) { this.x = x; this.y = y; this.alpha = 1.0; }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha;
        ctx.drawImage(imgExp, this.x, this.y, 60, 60);
        ctx.restore(); this.alpha -= 0.05;
    }
}

// --- LÓGICA PRINCIPAL ---
function processInput(e) {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const cy = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    const mx = (cx - rect.left) * (canvas.width / rect.width);
    const my = (cy - rect.top) * (canvas.height / rect.height);

    for (let i = enemies.length - 1; i >= 0; i--) {
        let en = enemies[i];
        if (mx > en.x && mx < en.x + en.size && my > en.y && my < en.y + en.size) {
            particles.push(new Explosion(en.x, en.y));
            score += en.pts;
            if (score < 0) score = 0;
            enemies.splice(i, 1);
            checkLevel();
            updateHUD();
            break;
        }
    }
}

function checkLevel() {
    // CAMBIA EL 50 POR 100 AQUÍ
    let newLevel = Math.floor(score / 100) + 1; 
    
    if (newLevel > level) {
        level = newLevel;
        bannerText = "¡ALERTA! NIVEL " + level.toString().padStart(2, '0') + ": ACTIVIDAD MUTANTE AUMENTADA";
        bannerTimer = 150; 
    }
}

function updateHUD() {
    document.getElementById('ui-score').innerText = score.toString().padStart(4, '0');
    document.getElementById('ui-level').innerText = "NIVEL " + level.toString().padStart(2, '0');
    document.getElementById('ui-lives').innerText = livesLost;
    let hs = localStorage.getItem('mutantHS') || 0;
    if (score > hs) localStorage.setItem('mutantHS', score);
    document.getElementById('ui-highscore').innerText = hs.toString().padStart(4, '0');
}

function resetGame() {
    score = 0; level = 1; livesLost = 0;
    enemies = []; particles = []; bannerTimer = 0;
    gameRunning = true;
    document.getElementById('end-screen').style.display = 'none';
    updateHUD();
    loop();
}

function startGame() {
    gameRunning = true;
    document.getElementById('start-screen').style.display = 'none';
    updateHUD();
    loop();
}

function loop() {
    if (!gameRunning) return;
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    
    if (Math.random() < 0.02 + (level * 0.005)) enemies.push(new Mutant());

    enemies.forEach((m, i) => {
        m.update();
        m.draw();
        if (m.y > canvas.height) {
            if (m.pts > 0) {
                livesLost++;
                updateHUD();
                if (livesLost >= 10) {
                    gameRunning = false;
                    document.getElementById('end-screen').style.display = 'flex';
                    document.getElementById('final-score').innerText = "PUNTOS: " + score;
                }
            }
            enemies.splice(i, 1);
        }
    });

    particles.forEach((p, i) => {
        p.draw();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    if (bannerTimer > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 190, canvas.width, 100);
        ctx.strokeStyle = "#39ff14";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 190, canvas.width, 100);
        
        ctx.fillStyle = "#39ff14";
        ctx.font = "bold 20px Consolas";
        ctx.textAlign = "center";
        ctx.fillText(bannerText, canvas.width / 2, 250);
        bannerTimer--;
    }
    requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown', processInput);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); processInput(e); }, {passive: false});
