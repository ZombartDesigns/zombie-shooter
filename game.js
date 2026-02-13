class MainScene extends Phaser.Scene {

    constructor() {
        super("MainScene");
    }

    preload() {

        // Backgrounds
        for (let i = 1; i <= 5; i++) {
            this.load.image("bg" + i, "assets/background" + i + ".png");
        }

        // Sprites
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("boss", "assets/boss.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("heart", "assets/heart.png");
    }

    create() {

        // ================= STATE =================

        this.level = 1;
        this.score = 0;
        this.lives = 5;

        this.zombieSpeed = 60;
        this.killsThisLevel = 0;
        this.killsToAdvance = 20;

        // ================= BACKGROUND =================

        this.bg = this.add.image(400, 300, "bg1").setDisplaySize(800, 600);

        // ================= HUD =================

        this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "18px", fill: "#fff" });
        this.levelText = this.add.text(10, 35, "Level: 1", { fontSize: "18px", fill: "#fff" });

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(650 + i * 28, 22, "heart").setScale(0.5);
            this.hearts.push(h);
        }

        // ================= PLAYER =================

        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);

        // ================= INPUT =================

        this.cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ================= GROUPS =================

        this.bullets = this.physics.add.group();
        this.zombies = this.physics.add.group();

        // ================= SPAWN TIMERS =================

        this.zombieTimer = this.time.addEvent({
            delay: 1800,
            callback: () => this.spawnZombie(),
            loop: true
        });

        // ================= COLLISIONS =================

        this.physics.add.overlap(this.bullets, this.zombies, this.hitZombie, null, this);
        this.physics.add.overlap(this.player, this.zombies, this.hitPlayer, null, this);
    }

    // ================= ZOMBIES =================

    spawnZombie(isBoss = false) {

        const x = Phaser.Math.Between(40, 760);
        const key = isBoss ? "boss" : "zombie";

        const z = this.zombies.create(x, -40, key);
        z.setScale(isBoss ? 0.22 : 0.15);

        z.isBoss = isBoss;
        z.hp = isBoss ? 3 : 1;

        const speed = isBoss ? this.zombieSpeed * 0.5 : this.zombieSpeed;
        z.setVelocityY(speed);
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

        const b = this.bullets.create(this.player.x, this.player.y - 20, "bullet");
        b.setVelocityY(-500);
        b.setScale(0.18);

        // Narrow hitbox
        b.body.setSize(6, 14);
        b.body.setOffset(6, 2);
    }

    // ================= HIT =================

    hitZombie(bullet, zombie) {

        bullet.destroy();
        zombie.hp--;

        if (zombie.hp > 0) return;

        // Blood splatter
        this.add.circle(zombie.x, zombie.y, zombie.isBoss ? 40 : 18, 0x8b0000)
            .setAlpha(0.5);

        // Boss explosion
        if (zombie.isBoss) {

            this.zombies.children.each(z => {
                if (!z.isBoss && Phaser.Math.Distance.Between(z.x, z.y, zombie.x, zombie.y) < 80) {
                    z.destroy();
                }
            });
        }

        zombie.destroy();

        this.score += zombie.isBoss ? 50 : 10;
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

    loseLife() {

        this.lives--;
        if (this.hearts[this.lives]) this.hearts[this.lives].setVisible(false);

        if (this.lives <= 0) {
            this.scene.restart();
        }
    }

    // ================= LEVEL =================

    nextLevel() {

        this.level++;
        this.killsThisLevel = 0;
        this.zombieSpeed += 10;

        this.levelText.setText("Level: " + this.level);

        const bgIndex = ((this.level - 1) % 5) + 1;
        this.bg.setTexture("bg" + bgIndex);

        if (this.level % 5 === 0) {
            this.spawnBossWave();
        }
    }

    // ================= UPDATE =================

    update() {

        // Movement
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) this.player.setVelocityX(-220);
        if (this.cursors.right.isDown) this.player.setVelocityX(220);
        if (this.cursors.up.isDown) this.player.setVelocityY(-220);
        if (this.cursors.down.isDown) this.player.setVelocityY(220);

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
