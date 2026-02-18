class LoadingScene extends Phaser.Scene {
    constructor() {
        super("LoadingScene");
    }

    preload() {
        this.load.image("bg1", "assets/background1.png");
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
    }

    create() {
        this.add.image(400, 300, "bg1")
            .setDisplaySize(800, 600)
            .setAlpha(0.4);

        this.add.image(250, 350, "player").setScale(0.25);
        this.add.image(550, 350, "zombie").setScale(0.25);

        this.add.text(400, 120, "ZOMBIE SHOOTER", {
            fontSize: "48px",
            fill: "#ffffff",
            stroke: "#000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 190, "TOP 5", {
            fontSize: "28px",
            fill: "#ffcc00"
        }).setOrigin(0.5);

        const scores = JSON.parse(localStorage.getItem("zombieLeaderboard")) || [];

        for (let i = 0; i < 5; i++) {
            const entry = scores[i];
            const text = entry ? `${i+1}. ${entry.name} - ${entry.score}` : `${i+1}. ---`;
            this.add.text(400, 230 + i * 30, text, {
                fontSize: "22px",
                fill: "#ffffff"
            }).setOrigin(0.5);
        }

        this.add.text(400, 520, "SPACE TO START", {
            fontSize: "26px",
            fill: "#00ff00"
        }).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("MainScene");
        });
    }
}

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
        this.load.image("shard", "assets/shard.png");

        this.load.image("speedItem", "assets/speed.png");
        this.load.image("multiItem", "assets/triple.png");
        this.load.image("bladeItem", "assets/blade.png");

        this.load.audio("splat", "assets/splat.wav");
        this.load.audio("bossSplat", "assets/boss_splat.wav");

        this.load.audio("music1", "assets/music1.mp3");
        this.load.audio("music2", "assets/music2.mp3");
        this.load.audio("music3", "assets/music3.mp3");
    }

    create() {

        this.level = 1;
        this.score = 0;
        this.lives = 5;
        this.zombieSpeed = 60;
        this.zombiesSpawned = 0;
        this.killsToAdvance = 20;
        this.levelPaused = false;

        this.bossActive = false;
        this.bossHitCount = 0;
        this.bossHitsRequired = 20;

        this.bg = this.add.image(400, 300, "bg1")
            .setDisplaySize(800, 600)
            .setAlpha(0.5);

        this.player = this.physics.add.sprite(400, 540, "player")
            .setScale(0.15)
            .setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.bullets = this.physics.add.group({ defaultKey: "bullet", maxSize: 40 });
        this.zombies = this.physics.add.group();
        this.spikes = this.physics.add.group();

        this.physics.add.overlap(this.bullets, this.zombies, this.hitZombie, null, this);
        this.physics.add.overlap(this.bullets, null);

        this.physics.add.overlap(this.player, this.zombies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.bullets, this.spikes, this.hitSpike, null, this);
        this.physics.add.overlap(this.player, this.spikes, this.hitSpikePlayer, null, this);

        this.zombieTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        this.input.keyboard.on("keydown-B", () => {
            if (!this.bossActive) this.spawnMegaBoss();
        });

        this.scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "16px", fill: "#fff" });
    }

    spawnZombie() {
        if (this.levelPaused || this.bossActive) return;
        if (this.zombiesSpawned >= this.killsToAdvance) return;

        const x = Phaser.Math.Between(50, 750);
        const z = this.zombies.create(x, -40, "zombie");
        z.setVelocityY(this.zombieSpeed);
        z.setScale(0.15);
        z.hp = 1;

        this.zombiesSpawned++;
    }

    spawnMegaBoss() {
        this.bossActive = true;
        this.zombieTimer.paused = true;

        this.megaBoss = this.physics.add.sprite(400, 120, "boss")
            .setScale(0.4)
            .setImmovable(true);

        this.megaBoss.body.setAllowGravity(false);

        this.physics.add.overlap(this.bullets, this.megaBoss, this.hitMegaBoss, null, this);

        this.startSpikeCycle();
    }

    hitMegaBoss(bullet) {
        bullet.disableBody(true, true);
        this.bossHitCount++;

        if (this.bossHitCount >= this.bossHitsRequired) {
            this.killMegaBoss();
        }
    }

    startSpikeCycle() {
        if (!this.bossActive) return;

        this.spikeEvent = this.time.addEvent({
            delay: 400,
            repeat: 4,
            callback: this.spawnSpike,
            callbackScope: this
        });

        this.time.delayedCall(5000, () => {
            if (this.bossActive) this.startSpikeCycle();
        });
    }

    spawnSpike() {
        if (!this.bossActive || !this.megaBoss) return;

        const shard = this.spikes.create(this.megaBoss.x, this.megaBoss.y + 20, "shard");
        shard.setScale(0.08);
        shard.setVelocityY(250);
    }

    killMegaBoss() {
        this.bossActive = false;

        if (this.spikeEvent) this.spikeEvent.remove();

        this.spikes.clear(true, true);

        if (this.megaBoss) this.megaBoss.destroy();

        this.zombieTimer.paused = false;
        this.levelPaused = false;
    }

    hitZombie(bullet, zombie) {
        bullet.disableBody(true, true);
        zombie.destroy();
        this.score += 10;
        this.scoreText.setText("Score: " + this.score);
    }

    hitPlayer(player, zombie) {
        zombie.destroy();
    }

    hitSpike(bullet, spike) {
        bullet.disableBody(true, true);
        spike.destroy();
    }

    hitSpikePlayer(player, spike) {
        spike.destroy();
    }

    shoot() {
        const bullet = this.bullets.get(this.player.x, this.player.y - 20);
        if (!bullet) return;
        bullet.setActive(true).setVisible(true);
        bullet.body.enable = true;
        bullet.setVelocityY(-500);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.shoot();
        }
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "game-container",
    physics: { default: "arcade" },
    scene: [LoadingScene, MainScene]
});
