class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        // Load assets
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("bullet", "https://via.placeholder.com/6/FFFFFF/FFFFFF");
    }

    create() {
        // Game size
        this.width = 800;
        this.height = 600;

        // Player
        this.player = this.physics.add.image(
            this.width / 2,
            this.height - 50,
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

        this.levelTime = 120000; // 2 minutes
        this.levelStart = this.time.now;

        // UI
        this.scoreText = this.add.text(15, 15, "Score: 0", {
            fontSize: "20px",
            fill: "#ffffff",
            fontFamily: "monospace"
        });

        this.levelText = this.add.text(15, 40, "Level: 1", {
            fontSize: "20px",
            fill: "#ffffff",
            fontFamily: "monospace"
        });

        // Zombie spawner
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
    }

    update() {
        // Player movement
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

        // Animate zombies
        this.animateZombies();

        // Level system
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

        let zombie = this.zombies.create(x, 40, "zombie");

        zombie.setScale(0.2);
        zombie.setVelocityY(this.zombieSpeed);

        // Animation offset
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

// Phaser Configuration
const config = {
    type: Phaser.AUTO,

    parent: "game-container",

    width: 800,
    height: 600,

    scale: {
        mode: Phaser.Scale.NONE
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

// Start Game
new Phaser.Game(config);
