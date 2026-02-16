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

        // ===== MUSIC START =====
        if (!this.sound.get("music1")) {
            this.musicTracks = [
                this.sound.add("music1", { volume: 0.5 }),
                this.sound.add("music2", { volume: 0.5 }),
                this.sound.add("music3", { volume: 0.5 })
            ];
            this.currentTrackIndex = 0;
            this.musicTracks[this.currentTrackIndex].play();
        }

        this.splatSound = this.sound.add("splat");
        this.bossSplatSound = this.sound.add("bossSplat");

        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600);
        this.bg.setAlpha(0.5);

        this.bloodSplats = [];

        this.scoreText = this.add.text(10, 8, "Score: 0", { fontSize: "16px", fill: "#fff", stroke:"#000", strokeThickness:3 });
        this.levelText = this.add.text(10, 28, "Level: 1", { fontSize: "16px", fill: "#fff", stroke:"#000", strokeThickness:3 });

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(650 + i * 20, 30, "heart").setScale(0.1);
            this.hearts.push(h);
        }

        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);
        this.setPlayerGlow(0xffff00);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.bullets = this.physics.add.group({ defaultKey:"bullet", maxSize:40 });
        this.zombies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

        this.zombieTimer = this.time.addEvent({
            delay:1500,
            callback:this.spawnZombie,
            callbackScope:this,
            loop:true
        });

        this.physics.add.overlap(this.bullets,this.zombies,this.hitZombie,null,this);
        this.physics.add.overlap(this.player,this.zombies,this.hitPlayer,null,this);
    }

    // ===== PLAYER GLOW =====
    setPlayerGlow(color){
        if(this.player.postFX) this.player.postFX.clear();
        this.player.postFX.addGlow(color,1.5,0,false,0.25,4);
    }

    // ===== ZOMBIE HIT (RESTORED) =====
    hitZombie(bullet,zombie){

        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable=false;

        zombie.hp--;

        if(zombie.hp>0) return;

        if(zombie.isBoss){
            this.bossSplatSound.play({volume:0.4});
            this.cameras.main.shake(400,0.012);
        } else{
            this.splatSound.play({volume:0.4});
        }

        zombie.destroy();

        const splat=this.add.image(zombie.x,zombie.y,"blood")
            .setScale(zombie.isBoss?0.5:0.3)
            .setAlpha(0.85);

        this.bloodSplats.push(splat);

        this.score+=zombie.isBoss?50:10;
        this.killsThisLevel++;
        this.scoreText.setText("Score: "+this.score);
    }

    // ===== PLAYER HIT (RESTORED) =====
    hitPlayer(player,zombie){
        zombie.destroy();
        this.loseLife();
    }

    loseLife(){
        this.lives--;
        if(this.hearts[this.lives]) this.hearts[this.lives].setVisible(false);
        if(this.lives<=0) this.gameOver();
    }

    gameOver(){
        this.physics.pause();
        this.add.text(400,300,"GAME OVER\nClick To Restart",
            {fontSize:"32px",fill:"#fff",align:"center"}).setOrigin(0.5);

        this.input.once("pointerdown",()=>{
            this.scene.restart();
        });
    }

    spawnZombie(){
        if(this.levelPaused) return;
        if(this.zombiesSpawned>=this.killsToAdvance) return;

        const x=Phaser.Math.Between(50,750);
        const z=this.zombies.create(x,-40,"zombie");

        z.setScale(0.15);
        z.setVelocityY(this.zombieSpeed);
        z.hp=1;
        z.isBoss=false;

        z.postFX.addGlow(0xff0000,1.2,0,false,0.15,3);

        this.zombiesSpawned++;
    }

    shoot(){
        if(this.levelPaused) return;

        const b=this.bullets.get(this.player.x,this.player.y-18);
        if(!b) return;

        b.setActive(true).setVisible(true);
        b.setScale(0.18);
        b.body.enable=true;
        b.body.setSize(6,14,true);
        b.setVelocityY(-520);

        b.postFX.clear();
        b.postFX.addGlow(0xffff00,1);
    }

    update(){

        if(this.levelPaused) return;

        this.player.setVelocity(0);

        if(this.cursors.left.isDown || this.keys.A.isDown) this.player.setVelocityX(-this.playerSpeed);
        if(this.cursors.right.isDown || this.keys.D.isDown) this.player.setVelocityX(this.playerSpeed);
        if(this.cursors.up.isDown || this.keys.W.isDown) this.player.setVelocityY(-this.playerSpeed);
        if(this.cursors.down.isDown || this.keys.S.isDown) this.player.setVelocityY(this.playerSpeed);

        if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.shoot();

        // Bottom screen check
        this.zombies.children.each(z=>{
            if(z.y>620){
                z.destroy();
                this.loseLife();
            }
        });

        this.bullets.children.each(b=>{
            if(b.active && b.y<-20){
                b.setActive(false);
                b.setVisible(false);
                b.body.enable=false;
            }
        });
    }
}

new Phaser.Game({
    type: Phaser.AUTO,
    width:800,
    height:600,
    parent:"game-container",
    physics:{ default:"arcade", arcade:{debug:false}},
    scene:MainScene
});
