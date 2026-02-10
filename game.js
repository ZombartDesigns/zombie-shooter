class MainScene extends Phaser.Scene {

    constructor() {
        super("MainScene");
    }

    preload() {

        this.load.image("background", "assets/background.png");
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("bullet", "assets/bullet.png");
    }


    // ================= OUTLINE SYSTEM =================

    addOutline(sprite, size = 2, color = 0x000000) {

        const offsets = [
            { x: -size, y: 0 },
            { x: size, y: 0 },
            { x: 0, y: -size },
            { x: 0, y: size }
        ];

        sprite.outlines = [];

        offsets.forEach(o => {

            const outline = this.add.image(
                sprite.x + o.x,
                sprite.y + o.y,
                sprite.texture.key
            );

            outline.setTint(color);
            outline.setDepth(sprite.depth - 1);
            outline.setScale(sprite.scale);

            sprite.outlines.push(outline);
        });
    }


    updateOutline(sprite) {

        if (!sprite.outlines) return;

        const size = 2;

        const offsets = [
            { x: -size, y: 0 },
            { x: size, y: 0 },
            { x: 0, y: -size },
            { x: 0, y: size }
        ];

        sprite.outlines.forEach((o, i) => {

            o.x = sprite.x + offsets[i].x;
            o.y = sprite.y + offsets[i].y;

            o.rotation = sprite.rotation;
            o.scale = sprite.scale;
        });
    }


    create() {

        // ================= BACKGROUND =================

        this.background = this.add.image(400, 300, "background");
        this.background.setDisplaySize(800, 600);


        // ================= GAME STATE =================

        this.score = 0;
        this.level = 1;

        this.combo = 0;
        this.lastHitTime = 0;

        this.zombieSpeed = 50;


        // ================= CAMERA FX =================

        this.cameras.main.setBounds(0, 0, 800, 600);


        // ================= PLAYER =================

        this.player = this.physics.add.sprite(400, 540, "player");

        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);

        this.addOutline(this.player, 2);


        // ================= CONTROLS =================

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");


        // ================= BULLETS =================

        this.bullets = this.physics.add.group({
            defaultKey: "bullet",
            maxSize: 50
        });


        // ================= ZOMBIES =================

        this.zombies = this.physics.add.group();


        this.zombieTimer = this.time.addEvent({

            delay: 1800,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });


        // ================= PARTICLES (BLOOD) =================

        this.blood = this.add.particles(0, 0, "bullet", {

            speed: { min: 50, max: 200 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 6,
            tint: 0xff0000,
            on: false
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

        const zombie = this.zombies.create(x, -50, "zombie");

        zombie.setScale(0.15);

        zombie.setVelocityY(this.zombieSpeed);

        this.addOutline(zombie, 2);
    }


    // ================= SHOOT =================

    shoot() {

        const bullet = this.bullets.get(
            this.player.x,
            this.player.y - 25
        );

        if (!bullet) return;

        bullet.setActive(true);
        bullet.setVisible(true);

        bullet.setScale(0.2);
        bullet.setAngle(-90);

        bullet.body.enable = true;

        bullet.setVelocityY(-600);

        this.addOutline(bullet, 1);
    }


    // ================= HIT =================

    hitZombie(bullet, zombie) {

        // Blood effect
        this.blood.emitParticleAt(zombie.x, zombie.y);

        // Screen shake
        this.cameras.main.shake(80, 0.01);

        // Flash zombie
        zombie.setTint(0xffffff);

        this.time.delayedCall(80, () => {
            if (zombie) zombie.clearTint();
        });


        // Combo system
        const now = this.time.now;

        if (now - this.lastHitTime < 600) {
            this.combo++;
        } else {
            this.combo = 1;
        }

        this.lastHitTime = now;


        bullet.destroy();
        zombie.destroy();


        // Remove outlines
        if (bullet.outlines) bullet.outlines.forEach(o => o.destroy());
        if (zombie.outlines) zombie.outlines.forEach(o => o.destroy());


        // Score
        this.score += 10 * this.combo;


        // Level up
        if (this.score % 150 === 0) {

            this.level++;

            this.zombieSpeed += 15;

            this.zombieTimer.delay = Math.max(
                500,
                this.zombieTimer.delay - 150
            );
        }
    }


    // ================= GAME OVER =================

    gameOver() {

        this.physics.pause();

        this.player.setTint(0xff0000);

        this.cameras.main.fade(500, 0, 0, 0);


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

        // ================= MOVEMENT =================

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.player.setVelocityX(-220);
        }
        else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.player.setVelocityX(220);
        }
        else {
            this.player.setVelocityX(0);
        }


        if (this.cursors.up.isDown || this.keys.W.isDown) {
            this.player.setVelocityY(-220);
        }
        else if (this.cursors.down.isDown || this.keys.S.isDown) {
            this.player.setVelocityY(220);
        }
        else {
            this.player.setVelocityY(0);
        }


        // ================= SHOOT =================

        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            this.shoot();
        }


        // ================= CLEANUP =================

        this.bullets.children.each(b => {

            if (b.active && b.y < -30) {

                b.setActive(false);
                b.setVisible(false);

                if (b.outlines) b.outlines.forEach(o => o.destroy());
            }
        });


        this.zombies.children.each(z => {

            if (z.y > 650) {

                if (z.outlines) z.outlines.forEach(o => o.destroy());

                z.destroy();
            }
        });


        // ================= OUTLINE UPDATES =================

        this.updateOutline(this.player);

        this.zombies.children.each(z => {
            this.updateOutline(z);
        });

        this.bullets.children.each(b => {
            this.updateOutline(b);
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
