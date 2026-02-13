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
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("heart", "assets/heart.png");
        this.load.image("blood", "assets/blood.png");
    }

    create() {
        // ================= LEVEL DATA =================
        this.backgrounds = ["bg1", "bg2", "bg3", "bg4", "bg5"];
        this.level = 1;
        this.score = 0;
        this.lives = 5;

        this.levelPaused = false;

        this.zombieSpeed = 60;
        this.killsThisLevel = 0;
        this.killsToAdvance = 20;

        // ================= BACKGROUND =================
        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600);

        // ================= BLOOD TRACKING =================
        this.bloodSplats = [];

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
            const h = this.add.image(620 + i * 30, 22, "heart")
                .setScale(0.35)
                .setDepth(1000);
            this.hearts.push(h);
        }

        // ================= PLAYER =================
        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);

        // ================= CONTROLS =================
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        // ================= BULLETS =================
        this.bullets = this.physics.add.group({
            defaultKey: "bullet",
            maxSize: 30
        });

        // ================= ZOMBIES =================
        this.zombies = this.physics.add.group();

        this.zombieTimer = this.time.addEvent({
            delay: 1500,
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

    spawnZombie() {
        if (this.levelPaused) return;

        const x = Phaser.Math.Between(50, 750);
        const z = this.zombies.create(x, -40, "zombie");

        z.setScale(0.15);
        z.setVelocityY(this.zombieSpeed);
    }

    shoot() {
        if (this.levelPaused) return;

        const b = this.bullets.get(this.player.x, this.player.y - 20);
        if (!b) return;

        b.setActive(true).setVisible(true);
        b.setScale(0.18);
        b.body.setSize(6, 14, true); // NARROW HITBOX
        b.setVelocityY(-500);
    }

    hitZombie(bullet, zombie) {
        bullet.destroy();
        zombie.destroy();

        const blood = this.add.image(zombie.x, zombie.y, "blood")
            .setScale(0.4)
            .setAlpha(0.9);

        this.bloodSplats.push(blood);

        this.score += 10;
        this.killsThisLevel++;

        this.scoreText.setText("Score: " + this.score);

        if (this.killsThisLevel >= this.killsToAdvance) {
            this.nextLevel();
        }
    }

    hitPlayer(player, zombie) {
        zombie.destroy();
        this.lives--;

        if (this.hearts[this.lives]) {
            this.hearts[this.lives].setVisible(false);
        }

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    nextLevel() {
        this.levelPaused = true;
        this.zombieTimer.paused = true;
        this.zombies.clear(true, true);

        const msg = this.add.text(
            400,
            300,
            "LEVEL " + this.level + " COMPLETE",
            { fontSize: "32px", fill: "#fff", stroke: "#000", strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(2000);

        this.time.delayedCall(2000, () => {
            msg.destroy();

            // Clear blood
            this.bloodSplats.forEach(b => b.destroy());
            this.bloodSplats = [];

            this.level++;
            this.levelText.setText("Level: " + this.level);

            this.killsThisLevel = 0;
            this.zombieSpeed += 15;

            const bgKey = this.backgrounds[(this.level - 1) % this.backgrounds.length];
            this.bg.setTexture(bgKey);
            this.bg.setDisplaySize(800, 600);

            this.levelPaused = false;
            this.zombieTimer.paused = false;
        });
    }

    gameOver() {
        this.physics.pause();

        const t = this.add.text(
            400,
            300,
            "GAME OVER\nClick To Restart",
            { fontSize: "32px", fill: "#fff", align: "center" }
        ).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.restart();
        });
    }

    update() {
        if (this.levelPaused) return;

        this.player.setVelocity(0);

        if (this.cursors.left.isDown || this.keys.A.isDown) this.player.setVelocityX(-220);
        if (this.cursors.right.isDown || this.keys.D.isDown) this.player.setVelocityX(220);
        if (this.cursors.up.isDown || this.keys.W.isDown) this.player.setVelocityY(-220);
        if (this.cursors.down.isDown || this.keys.S.isDown) this.player.setVelocityY(220);

        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.shoot();

        this.zombies.children.each(z => {
            if (z.y > 650) {
                z.destroy();
                this.hitPlayer();
            }
        });

        this.bullets.children.each(b => {
            if (b.active && b.y < -20) b.destroy();
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    physics: { default: "arcade", arcade: { debug: false } },
    scene: MainScene
};

new Phaser.Game(config);
