class MainScene extends Phaser.Scene {

    constructor() {
        super("MainScene");
    }

    preload() {

        // Load images
        this.load.image("background", "assets/background.png");
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("bullet", "assets/bullet.png"); // optional
    }

    create() {

        // ================= BACKGROUND =================

        this.background = this.add.image(
            400,
            300,
            "background"
        );

        this.background.setDisplaySize(800, 600);


        // ================= GAME STATE =================

        this.score = 0;
        this.level = 1;

        this.zombieSpeed = 60;


        // ================= PLAYER =================

        this.player = this.physics.add.sprite(
            400,
            540,
            "player"
        );

        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);


        // ================= CONTROLS =================

        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");


        // ================= BULLETS =================

        this.bullets = this.physics.add.group();


        // ================= ZOMBIES =================

        this.zombies = this.physics.add.group();


        this.zombieTimer = this.time.addEvent({

            delay: 1500,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });


        // ================= COLLISIONS =================

        this.physics.add.overlap(
            this.bullets,
            this.zombies,
            this.hitZombie,
            null,
            this
        );


        this.physics.add.overlap(
            this.player,
            this.zombies,
            this.gameOver,
            null,
            this
        );
    }


    // ================= SPAWN ZOMBIE =================

    spawnZombie() {

        const x = Phaser.Math.Between(50, 750);

        const zombie = this.zombies.create(
            x,
            -50,
            "zombie"
        );

        zombie.setScale(0.15);

        zombie.setVelocityY(this.zombieSpeed);
    }


    // ================= SHOOT =================

    shoot() {

        const bullet = this.bullets.create(
            this.player.x,
            this.player.y - 20,
            null
        );

        bullet.setSize(6, 12);
        bullet.body.setAllowGravity(false);

        bullet.setVelocityY(-400);
    }


    // ================= HIT =================

    hitZombie(bullet, zombie) {

        bullet.destroy();
        zombie.destroy();

        this.score += 10;

        // Level up every 100 points
        if (this.score % 100 === 0) {

            this.level++;
            this.zombieSpeed += 20;
        }
    }


    // ================= GAME OVER =================

    gameOver() {

        this.physics.pause();

        this.player.setTint(0xff0000);

        this.add.text(
            400,
            300,
            "GAME OVER\nClick To Restart",
            {
                fontSize: "32px",
                fill: "#ffffff",
                align: "center"
            }
        ).setOrigin(0.5);


        this.input.once("pointerdown", () => {
            this.scene.restart();
        });
    }


    // ================= UPDATE =================

    update() {

        // Movement

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.player.setVelocityX(-200);
        }
        else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.player.setVelocityX(200);
        }
        else {
            this.player.setVelocityX(0);
        }


        if (this.cursors.up.isDown || this.keys.W.isDown) {
            this.player.setVelocityY(-200);
        }
        else if (this.cursors.down.isDown || this.keys.S.isDown) {
            this.player.setVelocityY(200);
        }
        else {
            this.player.setVelocityY(0);
        }


        // Shoot

        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.shoot();
        }


        // Cleanup

        this.bullets.children.each(b => {
            if (b.y < -20) b.destroy();
        });


        this.zombies.children.each(z => {
            if (z.y > 650) z.destroy();
        });
    }
}


// ================= GAME CONFIG =================

const config = {

    type: Phaser.AUTO,

    width: 800,
    height: 600,

    parent: "game-container",

    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },

    scene: MainScene
};


// ================= START GAME =================

new Phaser.Game(config);



