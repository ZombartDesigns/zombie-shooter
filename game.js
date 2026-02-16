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

        this.load.audio("music1", "assets/music1.mp3");
        this.load.audio("music2", "assets/music2.mp3");
        this.load.audio("music3", "assets/music3.mp3");
    }

    create() {

        // ================= STATE =================
        this.backgrounds = ["bg1","bg2","bg3","bg4","bg5"];
        this.level = 1;
        this.score = 0;
        this.lives = 5;
        this.levelPaused = false;

        this.zombieSpeed = 60;
        this.killsToAdvance = 20;
        this.zombiesSpawned = 0;

        this.splatSound = this.sound.add("splat");
        this.bossSplatSound = this.sound.add("bossSplat");

        // ================= MUSIC =================
        this.musicTracks = [
            this.sound.add("music1", { volume: 0.4, loop: false }),
            this.sound.add("music2", { volume: 0.4, loop: false }),
            this.sound.add("music3", { volume: 0.4, loop: false })
        ];

        this.currentTrackIndex = 0;
        this.playNextTrack();

        // ================= BACKGROUND =================
        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600); // FORCE FIT
        this.bg.setAlpha(0.5);
        this.bg.setDepth(0);

        // ================= BLOOD =================
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

    // ================= MUSIC LOOP =================
    playNextTrack() {

        if (this.currentMusic) {
            this.currentMusic.stop();
        }

        this.currentMusic = this.musicTracks[this.currentTrackIndex];
        this.currentMusic.play();

        this.currentMusic.once("complete", () => {

            this.currentTrackIndex++;
            if (this.currentTrackIndex >= this.musicTracks.length) {
                this.currentTrackIndex = 0;
            }

            this.playNextTrack();
        });
    }

    spawnZombie() {

        if (this.levelPaused) return;
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
        boss.setDepth(5);
        boss.postFX.addGlow(0xff0000, 1.8, 0, false, 0.2, 4);
    }

    scheduleBossSpawns() {

        for (let i = 0; i < 3; i++) {

            const delay = Phaser.Math.Between(3000, 12000);

            this.time.delayedCall(delay, () => {
                if (!this.levelPaused) {
                    this.spawnBoss();
                }
            });
        }
    }

    shoot() {

        if (this.levelPaused) return;

        const b = this.bullets.get(this.player.x, this.player.y - 18);
        if (!b) return;

        b.setActive(true).setVisible(true);
        b.setScale(0.18);
        b.body.enable = true;
        b.body.setSize(6, 14, true);
        b.setVelocityY(-520);

        b.postFX.clear();
        b.postFX.addGlow(0xffff00, 0.9, 0, false, 0.12, 2);
    }

    hitZombie(bullet, zombie) {

        bullet.setActive(false).setVisible(false);
        bullet.body.enable = false;

        zombie.hp--;
        if (zombie.hp > 0) return;

        if (zombie.isBoss) {
            this.bossSplatSound.play({ volume: 0.6 });
            this.cameras.main.shake(400, 0.012);
        } else {
            this.splatSound.play({ volume: 0.4 });
        }

        zombie.destroy();

        const splat = this.add.image(zombie.x, zombie.y, "blood");
        splat.setScale(zombie.isBoss ? 0.5 : 0.3);
        splat.setDepth(1);
        this.bloodSplats.push(splat);

        this.score += zombie.isBoss ? 50 : 10;
        this.scoreText.setText("Score: " + this.score);
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

            this.zombiesSpawned = 0;
            this.zombieSpeed += 5;

            const bgKey = this.backgrounds[(this.level - 1) % this.backgrounds.length];
            this.bg.setTexture(bgKey);
            this.bg.setDisplaySize(800, 600); // FORCE FIT EVERY LEVEL

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

        if (
            this.zombiesSpawned >= this.killsToAdvance &&
            this.zombies.countActive(true) === 0
        ) {
            this.nextLevel();
        }

        this.zombies.children.each(z => {
            if (z.y > 620) {
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
