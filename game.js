class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        this.load.image("bg1", "assets/background1.png");
        this.load.image("bg2", "assets/background2.png");
        this.load.image("bg3", "assets/background3.png");
        this.load.image("bg4", "assets/background4.png");
        this.load.image("bg5", "assets/background5.png");

        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("boss", "assets/boss.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("heart", "assets/heart.png");
        this.load.image("blood", "assets/blood.png");

        this.load.audio("splat", "assets/splat.wav");
        this.load.audio("bossSplat", "assets/boss_splat.wav");

        // POWERUP ICONS
        this.load.image("speedItem", "assets/speed.png");
        this.load.image("multiItem", "assets/triple.png");
        this.load.image("bladeItem", "assets/blade.png");
    }

    create() {

        // ================= STATE =================
        this.backgrounds = ["bg1","bg2","bg3","bg4","bg5"];
        this.level = 1;
        this.score = 0;
        this.lives = 5;
        this.levelPaused = false;

        this.zombieSpeed = 60;
        this.killsThisLevel = 0;
        this.killsToAdvance = 20;
        this.zombiesSpawned = 0;

        // ================= POWERUP STATE =================
        this.speedBoostActive = false;
        this.multiFireActive = false;
        this.bladeShieldActive = false;

        this.basePlayerSpeed = 220;
        this.playerSpeed = this.basePlayerSpeed;

        this.splatSound = this.sound.add("splat");
        this.bossSplatSound = this.sound.add("bossSplat");

        // ================= BACKGROUND =================
        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600);
        this.bg.setAlpha(0.5);
        this.bg.setDepth(0);

        // ================= BLOOD STORAGE =================
        this.bloodSplats = [];

        // ================= HUD =================
        this.scoreText = this.add.text(10, 8, "Score: 0", {
            fontSize: "16px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        }).setDepth(1000);

        this.levelText = this.add.text(10, 28, "Level: 1", {
            fontSize: "16px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        }).setDepth(1000);

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(650 + i * 20, 30, "heart");
            h.setScale(0.1);
            h.setDepth(1000);
            this.hearts.push(h);
        }

        // ================= PLAYER =================
        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.setPlayerGlow(0xffff00);

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        // ================= BULLETS =================
        this.bullets = this.physics.add.group({
            defaultKey: "bullet",
            maxSize: 40
        });

        // ================= ZOMBIES =================
        this.zombies = this.physics.add.group();

        this.zombieTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(this.bullets, this.zombies, this.hitZombie, null, this);
        this.physics.add.overlap(this.player, this.zombies, this.hitPlayer, null, this);

        // ================= POWERUP GROUP =================
        this.powerups = this.physics.add.group();
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

        // Spawn powerups every 60 seconds
        this.time.addEvent({
            delay: 60000,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });
    }

    // ================= PLAYER GLOW =================
    setPlayerGlow(color) {
        this.player.postFX.clear();
        this.player.postFX.addGlow(color, 1.5, 0, false, 0.2, 4);
    }

    // ================= POWERUP SPAWN =================
    spawnPowerup() {
        if (this.levelPaused) return;

        const types = ["speedItem", "multiItem", "bladeItem"];
        const type = Phaser.Utils.Array.GetRandom(types);

        const x = Phaser.Math.Between(80, 720);
        const y = Phaser.Math.Between(80, 520);

        const item = this.powerups.create(x, y, type);
        item.setScale(0.15);
        item.type = type;
    }

    collectPowerup(player, item) {
        item.destroy();

        if (item.type === "speedItem") this.activateSpeedBoost();
        if (item.type === "multiItem") this.activateMultiFire();
        if (item.type === "bladeItem") this.activateBladeShield();
    }

    activateSpeedBoost() {
        this.speedBoostActive = true;
        this.playerSpeed = this.basePlayerSpeed * 2;
        this.setPlayerGlow(0xffffff);

        this.time.delayedCall(20000, () => {
            this.speedBoostActive = false;
            this.playerSpeed = this.basePlayerSpeed;
            this.setPlayerGlow(0xffff00);
        });
    }

    activateMultiFire() {
        this.multiFireActive = true;
        this.setPlayerGlow(0xff0000);

        this.time.delayedCall(15000, () => {
            this.multiFireActive = false;
            this.setPlayerGlow(0xffff00);
        });
    }

    activateBladeShield() {
        this.bladeShieldActive = true;
        this.setPlayerGlow(0x00ff00);

        this.time.delayedCall(15000, () => {
            this.bladeShieldActive = false;
            this.setPlayerGlow(0xffff00);
        });
    }

    // ================= SHOOT =================
    shoot() {

        if (this.levelPaused) return;

        const fireBullet = (vx, vy) => {
            const b = this.bullets.get(this.player.x, this.player.y - 18);
            if (!b) return;

            b.setActive(true).setVisible(true);
            b.body.enable = true;
            b.setScale(0.18);
            b.body.setSize(6, 14, true);
            b.setVelocity(vx, vy);

            b.postFX.clear();
            b.postFX.addGlow(0xffff00, 0.9, 0, false, 0.12, 2);
        };

        if (this.multiFireActive) {
            fireBullet(0, -520);
            fireBullet(-200, -520);
            fireBullet(200, -520);
        } else {
            fireBullet(0, -520);
        }
    }

    hitPlayer(player, zombie) {
        if (this.bladeShieldActive) {
            zombie.destroy();
            return;
        }

        zombie.destroy();
        this.loseLife();
    }

    loseLife() {
        this.lives--;

        if (this.hearts[this.lives]) {
            this.hearts[this.lives].setVisible(false);
        }

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    update() {

        if (this.levelPaused) return;

        this.player.setVelocity(0);

        if (this.cursors.left.isDown || this.keys.A.isDown)
            this.player.setVelocityX(-this.playerSpeed);

        if (this.cursors.right.isDown || this.keys.D.isDown)
            this.player.setVelocityX(this.playerSpeed);

        if (this.cursors.up.isDown || this.keys.W.isDown)
            this.player.setVelocityY(-this.playerSpeed);

        if (this.cursors.down.isDown || this.keys.S.isDown)
            this.player.setVelocityY(this.playerSpeed);

        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE))
            this.shoot();

        this.bullets.children.each(b => {
            if (b.active && b.y < -20) {
                b.setActive(false);
                b.setVisible(false);
                b.body.enable = false;
            }
        });
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    physics: { default: "arcade", arcade: { debug: false } },
    scene: MainScene
});
