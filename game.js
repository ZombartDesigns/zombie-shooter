class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        // Player
        this.load.image("player", "assets/player.png");

        // Zombie
        this.load.image("zombie", "assets/zombie.png");

        // Bullet
        this.load.image("bullet", "https://via.placeholder.com/5/FFFFFF/FFFFFF");

        // Banner
        this.load.image("banner", "assets/banner.png");
    }

    create() {
        // Add banner at top
        this.add.image(400, 50, "banner").setOrigin(0.5, 0.5).setScale(1);

        // Player
        this.player = this.physics.add.image(400, 550, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.2);

        // Groups
        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Game stats
        this.level = 1;
        this.score = 0;

        // Difficulty
        this.zombieSpeed = 60;
        this.spawnDelay = 1500;
        this.levelTime = 120000; // 2 minutes per level
        this.levelStart = this.time.now;

        // UI text — place inside banner area
        this.scoreText = this.add.text(600, 30, "Score: 0", {
            fontSize: "22px",
            fill: "#ffffff",
            fontFamily: "monospace"
        });

        this.levelText = this.add.text(600, 60, "Level: 1", {
            fontSize: "22px",
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
        this.physics.add.overlap(this.bullets, this.zombies, this.hitZombie, null, this);
    }

    update() {
        // Player movement
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

        // Animate zombies
        this.animateZombies();

        // Levels
        this.checkLevel();
    }

    shoot() {
        let bullet = this.bullets.create(this.player.x, this.player.y - 20, "bullet");
        bullet.setVelocityY(-500);
    }

    spawnZombie() {
        let x = Phaser.Math.Between(50, 750);
        let zombie = this.zombies.create(x, -60, "zombie");
        zombie.setVelocityY(this.zombieSpeed);
        zombie.setScale(0.2); // scaled to match original square
        zombie.startY = zombie.y;
        zombie.waveOffset = Math.random() * 10;
    }

    animateZombies() {
        this.zombies.children.iterate((zombie) => {
            if (!zombie) return;
            zombie.waveOffset += 0.1;
            zombie.y += Math.sin(zombie.waveOffset) * 0.5;
            zombie.rotation = Math.sin(zombie.waveOffset) * 0.05;
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
            this.zombieSpeed += 25;
            this.spawnDelay = Math.max(400, this.spawnDelay - 150);
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
        arcade: { gravity: { y: 0 } }
    },
    scene: MainScene
};

new Phaser.Game(config);








