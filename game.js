class MainScene extends Phaser.Scene {

    constructor() {
        super("MainScene");
    }

    preload() {

        // Backgrounds
        this.load.image("bg1", "assets/background1.png");
        this.load.image("bg2", "assets/background2.png");
        this.load.image("bg3", "assets/background3.png");

        // Sprites
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("heart", "assets/heart.png");
    }

    create() {

        // ================= LEVEL DATA =================

        this.backgrounds = ["bg1", "bg2", "bg3"];
        this.level = 1;
        this.levelPaused = false;

        // ================= BACKGROUND =================

        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600);
        this.bg.setDepth(-100);

        // ================= GAME STATE =================

        this.score = 0;
        this.lives = 5;

        this.zombieSpeed = 60;

        this.killsThisLevel = 0;
        this.killsToAdvance = 20;

        // ================= HUD =================

        this.scoreText = this.add.text(10, 10, "Score: 0", {
            fontSize: "18px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        }).setDepth(1000);

        this.levelText = this.add.text(10, 35, "Level: 1", {
            fontSize: "18px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        }).setDepth(1000);

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const heart = this.add.image(650 + i * 30, 22, "heart");
            heart.setScale(0.5);
            heart.setDepth(1000);
            this.hearts.push(heart);
        }

        // ================= PLAYER =================

        this.player = this.physics.add.sprite(400, 520, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);

        // Subtle glow
        this.player.postFX.addGlow(0xffff00, 2, 0, false, 0.2, 4);

        // ================= CONTROLS =================

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
            delay: 1800,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        // ================= COLLISIONS =================

        this.physics.add.overlap(
            this.bullets,
            this.zombies,
            this.hitZombie,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.zombies,
            this.hitPlayer,
            null,
            this
        );
    }

    // ================= SPAWN ZOMBIE =================

    spawnZombie() {

        if (this.levelPaused) return;

        const x = Phaser.Math.Between(50, 750);

        const zombie = this.zombies.create(x, -50, "zombie");
        zombie.setScale(0.15);

        // Subtle red glow
        zombie.postFX.addGlow(0xff0000, 2, 0, false, 0.2, 4);

        // Straight downward movement
        zombie.setVelocityY(this.zombieSpeed);
    }

    // ================= SHOOT =================

    shoot() {

        if (this.levelPaused) return;

        const bullet = this.bullets.get(
            this.player.x,
            this.player.y - 25
        );

        if (!bullet) return;

        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.2);
        bullet.setVelocityY(-600);

        // NARROW HITBOX
        bullet.body.setSize(
            bullet.width * 0.3,
            bullet.height * 0.6,
            true
        );

        // Subtle glow
        bullet.postFX.clear();
        bullet.postFX.addGlow(0xffff00, 1, 0, false, 0.2, 3);
    }

    // ================= HIT ZOMBIE =================

    hitZombie(bullet, zombie) {

        bullet.destroy();
        zombie.destroy();

        this.score += 10;
        this.killsThisLevel++;

        this.scoreText.setText("Score: " + this.score);

        if (this.killsThisLevel >= this.killsToAdvance) {
            this.nextLevel();
        }
    }

    // ================= PLAYER HIT =================

    hitPlayer(player, zombie) {

        zombie.destroy();
        this.loseLife();
    }

    // ================= LIFE LOST =================

    loseLife() {

        this.lives--;

        if (this.hearts[this.lives]) {
            this.hearts[this.lives].setVisible(false);
        }

        this.cameras.main.shake(200, 0.02);

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    // ================= NEXT LEVEL =================

    nextLevel() {

        this.levelPaused = true;
        this.zombies.clear(true, true);
        this.zombieTimer.paused = true;

        const msg = this.add.text(
            400,
            300,
            `LEVEL ${this.level} COMPLETE!`,
            {
                fontSize: "32px",
                fill: "#fff",
                stroke: "#000",
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(2000);

        this.time.delayedCall(2000, () => {

            msg.destroy();

            this.level++;
            this.levelText.setText("Level: " + this.level);

            this.killsThisLevel = 0;

            this.zombieSpeed += 15;

            const bgKey =
                this.backgrounds[(this.level - 1) % this.backgrounds.length];

            this.bg.setTexture(bgKey);

            this.levelPaused = false;
            this.zombieTimer.paused = false;
        });
    }

    // ================= GAME OVER =================

    gameOver() {

        this.physics.pause();

        this.add.text(
            400,
            300,
            "GAME OVER\nClick To Restart",
            {
                fontSize: "32px",
                fill: "#fff",
                align: "center"
            }
        ).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.restart();
        });
    }

    // ================= UPDATE =================

    update() {

        if (this.levelPaused) {
            this.player.setVelocity(0, 0);
            return;
        }

        let vx = 0;
        let vy = 0;

        // Player movement
        if (this.cursors.left.isDown || this.keys.A.isDown) vx = -220;
        else if (this.cursors.right.isDown || this.keys.D.isDown) vx = 220;

        if (this.cursors.up.isDown || this.keys.W.isDown) vy = -220;
        else if (this.cursors.down.isDown || this.keys.S.isDown) vy = 220;

        this.player.setVelocity(vx, vy);

        // Shoot
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.shoot();
        }

        // Zombies reaching bottom = lose life
        this.zombies.children.each(z => {
            if (z.y > 650) {
                z.destroy();
                this.loseLife();
            }
        });

        // Bullet cleanup
        this.bullets.children.each(b => {
            if (b.active && b.y < -30) {
                b.destroy();
            }
        });
    }
}


// ================= GAME CONFIG =================

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: MainScene
};

new Phaser.Game(config);
