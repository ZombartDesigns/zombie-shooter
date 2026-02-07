class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.image("player", "https://via.placeholder.com/50/FFFFFF/000000?text=P");
        this.load.image("zombie", "https://via.placeholder.com/50/FF0000/FFFFFF?text=Z");
        this.load.image("bullet", "https://via.placeholder.com/5/FFFFFF/FFFFFF");
    }

    create() {
        this.player = this.physics.add.image(400, 550, "player");
        this.player.setCollideWorldBounds(true);

        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.level = 1;
        this.score = 0;

        this.zombieSpeed = 150;
        this.spawnDelay = 1200;

        this.levelTime = 120000; // 2 minutes
        this.levelStart = this.time.now;

        this.scoreText = this.add.text(10, 10, "Score: 0", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        this.levelText = this.add.text(10, 40, "Level: 1", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(
            this.bullets,
            this.zombies,
            this.hitZombie,
            null,
            this
        );
    }

    update() {
        // Movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        // Shooting
        if (Phaser.Input.Keyboard.JustDown(this.space)) {
            this.shoot();
        }

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
        let x = Phaser.Math.Between(25, 775);

        let zombie = this.zombies.create(x, 0, "zombie");

        zombie.setVelocityY(this.zombieSpeed);
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

            this.zombieSpeed += 40;
            this.spawnDelay = Math.max(300, this.spawnDelay - 100);

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
            gravity: { y: 0 },
            debug: false
        }
    },

    scene: GameScene
};

new Phaser.Game(config);
