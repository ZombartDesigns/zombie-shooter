class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("bullet", "https://via.placeholder.com/6/FFFFFF/FFFFFF");
    }

    create() {
        // Screen size
        this.width = this.scale.width;
        this.height = this.scale.height;

        // Player
        this.player = this.physics.add.image(
            this.width / 2,
            this.height - 60,
            "player"
        );

        this.player.setScale(0.2);
        this.player.setCollideWorldBounds(true);

        // Groups
        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Stats
        this.score = 0;
        this.level = 1;

        // Difficulty
        this.zombieSpeed = 80;
        this.spawnDelay = 1500;

        this.levelTime = 120000; // 2 min
        this.levelStart = this.time.now;

        // UI (top left inside game)
        this.scoreText = this.add.text(20, 20, "Score: 0", {
            fontSize: "22px",
            fill: "#ffffff",
            fontFamily: "monospace"
        });

        this.levelText = this.add.text(20, 50, "Level: 1", {
            fontSize: "22px",
            fill: "#ffffff",
            fontFamily: "monospace"
        });

        // Spawner
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        // Collisions
        this.physics.add.overlap(
            this.bullets,
            this.zombies,
            this.hitZombie,
            null,
            this
        );

        // Resize handling
        this.scale.on("resize", this.resize, this);
    }

    resize(gameSize) {
        this.width = gameSize.width;
        this.height = gameSize.height;

        this.player.y = this.height - 60;
    }

    update() {
        // Movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-350);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(350);
        } else {
            this.player.setVelocityX(0);
        }

        // Shoot
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            this.shoot();
        }

        this.animateZombies();
        this.checkLevel();
    }

    shoot() {
        let bullet = this.bullets.create(
            this.player.x,
            this.player.y - 25,
            "bullet"
        );

        bullet.setVelocityY(-600);
    }

    spawnZombie() {
        let x = Phaser.Math.Between(40, this.width - 40);

        let zombie = this.zombies.create(x, 80, "zombie");

        zombie.setScale(0.2);
        zombie.setVelocityY(this.zombieSpeed);

        zombie.wave = Math.random() * 10;
    }

    animateZombies() {
        this.zombies.children.iterate((zombie) => {
            if (!zombie) return;

            zombie.wave += 0.08;

            zombie.y += Math.sin(zombie.wave) * 0.4;
            zombie.rotation = Math.sin(zombie.wave) * 0.04;
        });
    }

    hitZombie(bullet, zombie) {
        bullet.destroy();
        zombie.destroy();

        this.score += 10;

        this.scoreText.setText("Score: " + this.score);
    }

    checkLevel() {
        if (this.time.now - this.levelStart > this.levelTime) {

            this.level++;
            this.levelStart = this.time.now;

            // Increase difficulty
            this.zombieSpeed += 30;
            this.spawnDelay = Math.max(400, this.spawnDelay - 150);

            // Restart spawner
            this.spawnTimer.remove();

            this.spawnTimer = this.time.addEvent({
                delay: this.spawnDelay,
                callback: this.spawnZombie,
                callbackScope: this,
                loop: true
            });

            this.levelText.setText("Level: " + this.level);
        }
    }
}

// Phaser Config
const config = {
    type: Phaser.AUTO,

    parent: "game-container",

    width: window.innerWidth,
    height: window.innerHeight - 150,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    scene: MainScene
};

// Start game
new Phaser.Game(config);
