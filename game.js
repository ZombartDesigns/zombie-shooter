class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {

        // Backgrounds
        for (let i = 1; i <= 5; i++) {
            this.load.image(`bg${i}`, `assets/background${i}.png`);
        }

        // Sprites
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("boss", "assets/boss.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("heart", "assets/heart.png");
        this.load.image("blood", "assets/blood.png");
    }

    create() {

        // ================= GAME STATE =================

        this.level = 1;
        this.score = 0;
        this.lives = 5;

        this.zombieSpeed = 60;
        this.killsThisLevel = 0;
        this.killsToAdvance = 20;

        // ================= BACKGROUND =================

        this.bg = this.add.image(400, 300, "bg1")
            .setDisplaySize(800, 600)
            .setDepth(-100);

        // ================= HUD =================

        this.scoreText = this.add.text(10, 10, "Score: 0", {
            fontSize: "18px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        }).setDepth(1000);

        this.levelText = this.add.text(10, 34, "Level: 1", {
            fontSize: "18px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        }).setDepth(1000);

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const heart = this.add.image(520 + i * 24, 22, "heart")
                .setScale(0.25)
                .setDepth(1000);
            this.hearts.push(heart);
        }

        // ================= PLAYER =================

        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);

        this.player.postFX.addGlow(0xffff00, 1.5, 0, false, 0.15, 3);

        // ================= INPUT =================

        this.cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // ================= GROUPS =================

        this.bullets = this.physics.add.group();
        this.zombies = this.physics.add.group();

        // ================= SPAWN TIMERS =================

        this.time.addEvent({
            delay: 1800,
            loop: true,
            callback: () => this.spawnZombie(false)
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

    spawnZombie(isBoss) {

        const x = Phaser.Math.Between(40, 760);
        const key = isBoss ? "boss" : "zombie";

        const z = this.zombies.create(x, -50, key);
        z.setScale(isBoss ? 0.22 : 0.15);

        z.isBoss = isBoss;
        z.hp = isBoss ? 3 : 1;

        const speed = isBoss ? this.zombieSpeed * 0.5 : this.zombieSpeed;
        z.setVelocityY(speed);

        // Tight hitbox
        z.body.setSize(
            z.width * 0.5,
            z.height * 0.7,
            true
        );

        // Subtle glow
        z.postFX.addGlow(0xff0000, 1.5, 0, false, 0.15, 3);
    }

    spawnBossWave() {
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(
                Phaser.Math.Between(500, 6000),
                () => this.spawnZombie(true)
            );
        }
    }

    // ================= SHOOT =================

    shoot() {

        const b = this.bullets.create(
            this.player.x,
            this.player.y - 20,
            "bullet"
        );

        b.setScale(0.18);
        b.setVelocityY(-600);

        // Narrow bullet hitbox
        b.body.setSize(6, 14, true);

        // Glow (apply once)
        if (!b.glowApplied) {
            b.postFX.addGlow(0xffff00, 1, 0, false, 0.15, 2);
            b.glowApplied = true;
        }
    }

    // ================= HIT ZOMBIE =================

    hitZombie(bullet, zombie) {

        bullet.destroy();
        zombie.hp--;

        if (zombie.hp > 0) return;

        // Blood splatter
        this.spawnBlood(zombie.x, zombie.y, zombie.isBoss);

        // Boss explosion
        if (zombie.isBoss) {
            this.zombies.children.each(z => {
                if (!z.isBoss &&
                    Phaser.Math.Distance.Between(z.x, z.y, zombie.x, zombie.y) < 80) {
                    this.spawnBlood(z.x, z.y, false);
                    z.destroy();
                }
            });
        }

        zombie.destroy();

        this.score += zombie.isBoss ? 50 : 10;
        this.killsThisLevel++;

        this.scoreText.setText(`Score: ${this.score}`);

        if (this.killsThisLevel >= this.killsToAdvance) {
            this.nextLevel();
        }
    }

    spawnBlood(x, y, big) {
        const count = big ? 6 : 2;

        for (let i = 0; i < count; i++) {
            const blood = this.add.image(
                x + Phaser.Math.Between(-20, 20),
                y + Phaser.Math.Between(-20, 20),
                "blood"
            );

            blood.setScale(big ? 1 : 0.6);
            blood.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
            blood.setAlpha(0.7);
        }
    }

    // ================= PLAYER HIT =================

    hitPlayer(player, zombie) {
        zombie.destroy();
        this.loseLife();
    }

    loseLife() {
        this.lives--;

        if (this.hearts[this.lives]) {
            this.hearts[this.lives].setVisible(false);
        }

        this.cameras.main.shake(200, 0.02);

        if (this.lives <= 0) {
            this.scene.restart();
        }
    }

    // ================= LEVEL =================

    nextLevel() {

        this.level++;
        this.killsThisLevel = 0;
        this.zombieSpeed += 12;

        this.levelText.setText(`Level: ${this.level}`);

        const bgIndex = ((this.level - 1) % 5) + 1;
        this.bg.setTexture(`bg${bgIndex}`);

        if (this.level % 5 === 0) {
            this.spawnBossWave();
        }
    }

    // ================= UPDATE =================

    update() {

        // Player movement
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown) vx = -220;
        if (this.cursors.right.isDown) vx = 220;
        if (this.cursors.up.isDown) vy = -220;
        if (this.cursors.down.isDown) vy = 220;

        this.player.setVelocity(vx, vy);

        // Shoot
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            this.shoot();
        }

        // Zombie escape
        this.zombies.children.each(z => {
            if (z.y > 650) {
                z.destroy();
                this.loseLife();
            }
        });

        // Bullet cleanup
        this.bullets.children.each(b => {
            if (b.y < -30) b.destroy();
        });
    }
}

// ================= GAME CONFIG =================

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scene: MainScene
});
