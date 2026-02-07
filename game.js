class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        // Player
        this.load.image(
            "player", "assets/player.png"
        );

        // Zombie sprite
        this.load.image(
            "zombie", "assets/zombie.png"
        );

        // Bullet
        this.load.image(
            "bullet",
            "https://via.placeholder.com/5/FFFFFF/FFFFFF"
        );
    }

    create() {
        // Player
        this.player = this.physics.add.image(400, 550, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5);

        // Groups
        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Game stats
        this.level = 1;
        this.score = 0;

        // Difficulty
        this.zombieSpeed = 60;     // START SLOW
        this.spawnDelay = 1500;    // Slow spawn

        this.levelTime = 120000;   // 2 min per level
        this.levelStart = this.time.now;

        // UI
        this.scoreText = this.add.text(10, 10, "Score: 0", {
            fontSize: "22px",
            fill: "#ffffff"
        });

        this.levelText = this.add.text(10, 40, "Level: 1", {
            fontSize: "22px",
            fill: "#ffffff"
        });

        // Spawn timer
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
        // Move player
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        // Shoot
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            this.shoot();
        }

        // Level system
        this.checkLevel();
    }

    shoot() {
        let bullet = this.bullets.create(
            this.player.x,
            this.player.y - 20,
            "bullet"
        );

        bullet.setVelocityY(-500);
    }

    spawnZombie() {
        let x = Phaser.Math.Between(40, 760);

        let zombie = this.zombies.create(x, -50, "zombie");

        zombie.setVelocityY(this.zombieSpeed);

        zombie.setScale(0.5); // resize sprite
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
            this.zombieSpeed += 30;          // Faster
            this.spawnDelay = Math.max(
                400,
                this.spawnDelay - 150
            ); // More frequent

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

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 }
        }
    },

    scene: MainScene
};

new Phaser.Game(config);










