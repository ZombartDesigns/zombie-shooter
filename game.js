// ================= SETUP =================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hudScore = document.getElementById("hud-score");
const hudLevel = document.getElementById("hud-level");


// ================= RESIZE =================

function resizeCanvas() {

    const hudHeight = 70;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - hudHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


// ================= IMAGES =================

const playerImg = new Image();
playerImg.src = "assets/player.png";

const zombieImg = new Image();
zombieImg.src = "assets/zombie.png";


// ================= GAME STATE =================

let score = 0;
let level = 1;

let zombies = [];
let bullets = [];

let zombieSpeed = 1.2;


// ================= PLAYER =================

const player = {

    x: 0,
    y: 0,

    width: 50,
    height: 60,

    speed: 6
};

function resetPlayer() {

    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 20;
}

resetPlayer();


// ================= INPUT =================

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key] = true;
});

window.addEventListener("keyup", e => {
    keys[e.key] = false;
});

window.addEventListener("click", shoot);


// ================= SHOOT =================

function shoot() {

    bullets.push({
        x: player.x + player.width / 2 - 3,
        y: player.y,
        speed: 8
    });
}


// ================= ZOMBIES =================

function spawnZombie() {

    const size = 45;

    zombies.push({

        x: Math.random() * (canvas.width - size),
        y: -size,

        width: size,
        height: size,

        speed: zombieSpeed
    });
}

setInterval(spawnZombie, 1200);


// ================= UPDATE =================

function update() {

    // Player movement

    if (keys["a"] || keys["ArrowLeft"]) {
        player.x -= player.speed;
    }

    if (keys["d"] || keys["ArrowRight"]) {
        player.x += player.speed;
    }

    if (keys["w"] || keys["ArrowUp"]) {
        player.y -= player.speed;
    }

    if (keys["s"] || keys["ArrowDown"]) {
        player.y += player.speed;
    }


    // Boundaries

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));


    // Bullets

    bullets.forEach((b, i) => {

        b.y -= b.speed;

        if (b.y < 0) {
            bullets.splice(i, 1);
        }
    });


    // Zombies

    zombies.forEach((z, zi) => {

        z.y += z.speed;

        // Game over if reach bottom

        if (z.y > canvas.height) {
            resetGame();
        }


        // Collision

        bullets.forEach((b, bi) => {

            if (
                b.x < z.x + z.width &&
                b.x + 6 > z.x &&
                b.y < z.y + z.height &&
                b.y + 10 > z.y
            ) {

                zombies.splice(zi, 1);
                bullets.splice(bi, 1);

                score += 10;


                // Level up

                if (score % 100 === 0) {

                    level++;
                    zombieSpeed += 0.4;
                }
            }
        });
    });


    updateHUD();
}


// ================= DRAW =================

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // Player

    ctx.drawImage(
        playerImg,
        player.x,
        player.y,
        player.width,
        player.height
    );


    // Bullets

    ctx.fillStyle = "yellow";

    bullets.forEach(b => {

        ctx.fillRect(b.x, b.y, 6, 10);
    });


    // Zombies

    zombies.forEach(z => {

        ctx.drawImage(
            zombieImg,
            z.x,
            z.y,
            z.width,
            z.height
        );
    });
}


// ================= HUD =================

function updateHUD() {

    hudScore.textContent = score;
    hudLevel.textContent = level;
}


// ================= RESET =================

function resetGame() {

    alert("Game Over!");

    score = 0;
    level = 1;

    zombieSpeed = 1.2;

    zombies = [];
    bullets = [];

    resetPlayer();
}


// ================= LOOP =================

function gameLoop() {

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();
