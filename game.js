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

        // ✅ NEW: track how many zombies spawned this level
        this.zombiesSpawned = 0;

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
        this.player.postFX.addGlow(0xffff00, 1.2, 0, false, 0.15, 3);

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
    }

    spawnZombie() {

        if (this.levelPaused) return;

        // ✅ STOP spawning when limit reached
        if (this.zombiesSpawned >= this.killsToAdvance) return;

        const x = Phaser.Math.Between(50, 750);
        const z = this.zombies.create(x, -40, "zombie");

        z.setScale(0.15);
        z.setVelocityY(this.zombieSpeed);
        z.hp = 1;
        z.isBoss = false;

        z.body.setSize(z.width * 0.5, z.height * 0.7, true);
        z.setDepth(5);
        z.postFX.addGlow(0xff0000, 1.1, 0, false, 0.15, 3);

        // ✅ count it
        this.zombiesSpawned++;
    }

    spawnBoss() {
        const x = Phaser.Math.Between(60, 740);
        const boss = this.zombies.create(x, -60, "boss");

        boss.setScale(0.18);
        boss.setVelocityY(this.zombieSpeed * 0.5);

        boss.hp = 3;
        boss.isBoss = true;

        boss.body.setSize(boss.width * 0.6, boss.height * 0.8, true);
        boss.setDepth(5); // ABOVE blood
        boss.postFX.addGlow(0xff0000, 1.8, 0, false, 0.2, 4);
    }

    scheduleBossSpawns() {
        for (let i = 0; i < 3; i++) {
            const delay = Phaser.Math.Between(3000, 15000);

            this.time.delayedCall(delay, () => {
                if (this.level % 5 === 0 && !this.levelPaused) {
                    this.spawnBoss();
                }
            });
        }
    }

     shoot() {

          if (this.levelPaused) return;

          const b = this.bullets.get(
            this.player.x,
            this.player.y - 18
        );

        if (!b) return;

        b.setActive(true);
        b.setVisible(true);

        b.setScale(0.18);
        b.body.enable = true;
        b.body.setSize(6, 14, true);

        b.setVelocityY(-520);

        b.postFX.clear();
        b.postFX.addGlow(0xffff00, 0.9, 0, false, 0.12, 2);
    }
    
    hitZombie(bullet, zombie) {

        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;

    zombie.hp--;

        if (zombie.hp > 0) return;

        // 🔊 Play correct splat sound
        if (zombie.isBoss) {

        this.bossSplatSound.play({ volume: 0.6 });
        this.cameras.main.shake(400, 0.012);

    } else {

        this.splatSound.play({ volume: 0.4 });
    }

       // 🔥 BOSS EXPLOSION SHAKE
       if (zombie.isBoss) {
           this.cameras.main.shake(400, 0.01);
    }

    zombie.destroy();

        const splat = this.add.image(
            zombie.x + Phaser.Math.Between(-10,10),
            zombie.y + Phaser.Math.Between(-10,10),
            "blood"
        );

        splat.setScale(zombie.isBoss ? 0.5 : 0.3);
        splat.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
        splat.setAlpha(0.85);
        splat.setDepth(1); // ALWAYS BELOW zombies

        this.bloodSplats.push(splat);

        this.score += zombie.isBoss ? 50 : 10;
        this.killsThisLevel++;
        this.scoreText.setText("Score: " + this.score);

        if (this.killsThisLevel >= this.killsToAdvance) {
            this.nextLevel();
        }
    }

    hitPlayer(player, zombie) {
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

    nextLevel() {

        this.levelPaused = true;
        this.zombieTimer.paused = true;
        this.zombies.clear(true, true);

        const msg = this.add.text(
            400, 300,
            `LEVEL ${this.level} COMPLETE`,
            { fontSize: "32px", fill: "#fff", stroke: "#000", strokeThickness: 4 }
        ).setOrigin(0.5).setDepth(2000);

        this.time.delayedCall(2000, () => {

            msg.destroy();

            this.bloodSplats.forEach(b => b.destroy());
            this.bloodSplats = [];

            this.level++;
            this.levelText.setText("Level: " + this.level);
            this.killsThisLevel = 0;
            this.zombiesSpawned = 0;   // ✅ RESET spawn counter

            this.zombieSpeed += 5;

            const bgKey = this.backgrounds[(this.level - 1) % this.backgrounds.length];
            this.bg.setTexture(bgKey);
            this.bg.setDisplaySize(800, 600);

            this.levelPaused = false;
            this.zombieTimer.paused = false;

            if (this.level % 5 === 0) {
                this.scheduleBossSpawns();
            }
        });
    }

    gameOver() {
        this.physics.pause();

        this.add.text(
            400, 300,
            "GAME OVER\nClick To Restart",
            { fontSize: "32px", fill: "#fff", align: "center" }
        ).setOrigin(0.5).setDepth(3000);

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

        // BULLET CLEANUP
        this.bullets.children.each(b => {

            if (b.active && b.y < -20) {

                b.setActive(false);
                b.setVisible(false);
                b.body.enable = false;
            }
        });

        // ZOMBIE / BOSS BOTTOM CHECK
        this.zombies.children.each(z => {

            if (z.y > this.scale.height + 20) {

                z.destroy();
                this.loseLife();
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





