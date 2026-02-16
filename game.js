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

        this.load.image("speedItem", "assets/speed.png");
        this.load.image("multiItem", "assets/triple.png");
        this.load.image("bladeItem", "assets/blade.png");
    }

    create() {

        this.backgrounds = ["bg1","bg2","bg3","bg4","bg5"];
        this.level = 1;
        this.score = 0;
        this.lives = 5;
        this.levelPaused = false;

        this.zombieSpeed = 60;
        this.killsThisLevel = 0;
        this.killsToAdvance = 20;
        this.zombiesSpawned = 0;

        this.basePlayerSpeed = 220;
        this.playerSpeed = this.basePlayerSpeed;

        this.speedBoostActive = false;
        this.multiFireActive = false;
        this.bladeShieldActive = false;

        this.splatSound = this.sound.add("splat");
        this.bossSplatSound = this.sound.add("bossSplat");

        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600);
        this.bg.setAlpha(0.5);

        // BLOOD STORAGE (RESTORED)
        this.bloodSplats = [];

        this.scoreText = this.add.text(10, 8, "Score: 0", {
            fontSize: "16px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        });

        this.levelText = this.add.text(10, 28, "Level: 1", {
            fontSize: "16px",
            fill: "#fff",
            stroke: "#000",
            strokeThickness: 3
        });

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(650 + i * 20, 30, "heart");
            h.setScale(0.1);
            this.hearts.push(h);
        }

        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);
        this.setPlayerGlow(0xffff00);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.bullets = this.physics.add.group({ maxSize: 40 });
        this.zombies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        this.zombieTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(this.bullets, this.zombies, this.hitZombie, null, this);
        this.physics.add.overlap(this.player, this.zombies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    }

    // ================= FIXED BULLETS =================
    shoot() {

        if (this.levelPaused) return;

        const fire = (vx, vy) => {

            const b = this.bullets.get(this.player.x, this.player.y - 18, "bullet");
            if (!b) return;

            b.setActive(true);
            b.setVisible(true);

            b.setScale(0.18);              // FIX SCALE
            b.body.enable = true;
            b.body.setSize(6, 14, true);   // FIX HITBOX

            b.setVelocity(vx, vy);
        };

        if (this.multiFireActive) {
            fire(0, -520);
            fire(-200, -520);
            fire(200, -520);
        } else {
            fire(0, -520);
        }
    }

    // ================= RESTORED BLOOD + SOUND =================
    hitZombie(bullet, zombie) {

        bullet.setActive(false);
        bullet.setVisible(false);
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

        const splat = this.add.image(
            zombie.x + Phaser.Math.Between(-10,10),
            zombie.y + Phaser.Math.Between(-10,10),
            "blood"
        );

        splat.setScale(zombie.isBoss ? 0.5 : 0.3);
        splat.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
        splat.setAlpha(0.85);

        this.bloodSplats.push(splat);

        this.score += zombie.isBoss ? 50 : 10;
        this.killsThisLevel++;

        this.scoreText.setText("Score: " + this.score);
    }

    // ================= RESTORED LEVEL COMPLETE =================
    nextLevel() {

        this.levelPaused = true;
        this.zombieTimer.paused = true;
        this.zombies.clear(true, true);

        const msg = this.add.text(
            400, 300,
            `LEVEL ${this.level} COMPLETE`,
            {
                fontSize: "32px",
                fill: "#fff",
                stroke: "#000",
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.time.delayedCall(2000, () => {

            msg.destroy();

            this.bloodSplats.forEach(b => b.destroy());
            this.bloodSplats = [];

            this.level++;
            this.levelText.setText("Level: " + this.level);

            this.zombiesSpawned = 0;
            this.killsThisLevel = 0;

            this.zombieSpeed += 5;

            const bgKey = this.backgrounds[(this.level - 1) % this.backgrounds.length];
            this.bg.setTexture(bgKey);
            this.bg.setDisplaySize(800, 600);

            this.levelPaused = false;
            this.zombieTimer.paused = false;
        });
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

        // LEVEL PROGRESSION CHECK (RESTORED)
        if (
            !this.levelPaused &&
            this.zombiesSpawned >= this.killsToAdvance &&
            this.zombies.countActive(true) === 0
        ) {
            this.nextLevel();
        }

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
