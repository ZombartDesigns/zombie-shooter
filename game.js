class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {

        // BACKGROUNDS
        this.load.image("bg1", "assets/background1.png");
        this.load.image("bg2", "assets/background2.png");
        this.load.image("bg3", "assets/background3.png");
        this.load.image("bg4", "assets/background4.png");
        this.load.image("bg5", "assets/background5.png");

        // SPRITES
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
        this.load.image("boss", "assets/boss.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("heart", "assets/heart.png");
        this.load.image("blood", "assets/blood.png");

        // POWERUPS
        this.load.image("speedItem", "assets/speed.png");
        this.load.image("multiItem", "assets/triple.png");
        this.load.image("bladeItem", "assets/blade.png");

        // AUDIO
        this.load.audio("splat", "assets/splat.wav");
        this.load.audio("bossSplat", "assets/boss_splat.wav");

        this.load.audio("music1", "assets/music1.mp3");
        this.load.audio("music2", "assets/music2.mp3");
        this.load.audio("music3", "assets/music3.mp3");
    }

    create() {

        // ================= STATE =================
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

        // ================= MUSIC =================
        this.musicTracks = [
            this.sound.add("music1", { volume: 0.4 }),
            this.sound.add("music2", { volume: 0.4 }),
            this.sound.add("music3", { volume: 0.4 })
        ];

        this.currentTrack = 0;
        this.playMusic();

        // ================= BACKGROUND =================
        this.bg = this.add.image(400, 300, "bg1");
        this.bg.setDisplaySize(800, 600);
        this.bg.setAlpha(0.5);

        // ================= HUD =================
        this.scoreText = this.add.text(10, 8, "Score: 0", { fontSize: "16px", fill: "#fff", stroke:"#000", strokeThickness:3 });
        this.levelText = this.add.text(10, 28, "Level: 1", { fontSize: "16px", fill: "#fff", stroke:"#000", strokeThickness:3 });

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(650 + i * 20, 30, "heart");
            h.setScale(0.1);
            this.hearts.push(h);
        }

        // ================= PLAYER =================
        this.player = this.physics.add.sprite(400, 540, "player");
        this.player.setScale(0.15);
        this.player.setCollideWorldBounds(true);
        this.setPlayerGlow(0xffff00);

        // ================= INPUT =================
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        // ================= GROUPS =================
        this.bullets = this.physics.add.group({ maxSize: 40 });
        this.zombies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        // ================= TIMERS =================
        this.zombieTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 60000,
            callback: this.spawnPowerup,
            callbackScope: this,
            loop: true
        });

        // ================= COLLISIONS =================
        this.physics.add.overlap(this.bullets, this.zombies, this.hitZombie, null, this);
        this.physics.add.overlap(this.player, this.zombies, this.hitPlayer, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    }

    // ================= MUSIC LOOP =================
    playMusic() {
        const track = this.musicTracks[this.currentTrack];
        track.play();

        track.once("complete", () => {
            this.currentTrack++;
            if (this.currentTrack >= this.musicTracks.length) {
                this.currentTrack = 0;
            }
            this.playMusic();
        });
    }

    // ================= ZOMBIE SPAWN =================
    spawnZombie() {
        if (this.levelPaused) return;
        if (this.zombiesSpawned >= this.killsToAdvance) return;

        const x = Phaser.Math.Between(50, 750);
        const z = this.zombies.create(x, -40, "zombie");

        z.setScale(0.15);
        z.setVelocityY(this.zombieSpeed);
        z.hp = 1;
        z.isBoss = false;

        z.postFX.addGlow(0xff0000, 1.1, 0, false, 0.15, 3);

        this.zombiesSpawned++;
    }

    spawnBoss() {
        const x = Phaser.Math.Between(60, 740);
        const boss = this.zombies.create(x, -60, "boss");

        boss.setScale(0.18);
        boss.setVelocityY(this.zombieSpeed * 0.5);
        boss.hp = 3;
        boss.isBoss = true;

        boss.postFX.addGlow(0xff0000, 1.8, 0, false, 0.2, 4);
    }

    // ================= POWERUPS =================
    spawnPowerup() {
        const types = ["speedItem","multiItem","bladeItem"];
        const type = Phaser.Utils.Array.GetRandom(types);

        const item = this.powerups.create(
            Phaser.Math.Between(80,720),
            Phaser.Math.Between(80,520),
            type
        );

        item.setScale(0.15);
        item.type = type;

        if (type === "speedItem") item.postFX.addGlow(0xffffff,1.2);
        if (type === "multiItem") item.postFX.addGlow(0xff8800,1.2);
        if (type === "bladeItem") item.postFX.addGlow(0x00ff00,1.2);
    }

    collectPowerup(player,item){
        item.destroy();
        if(item.type==="speedItem") this.activateSpeed();
        if(item.type==="multiItem") this.activateMulti();
        if(item.type==="bladeItem") this.activateBlade();
    }

    activateSpeed(){
        this.playerSpeed=this.basePlayerSpeed*2;
        this.setPlayerGlow(0xffffff);
        this.time.delayedCall(20000,()=>{
            this.playerSpeed=this.basePlayerSpeed;
            this.setPlayerGlow(0xffff00);
        });
    }

    activateMulti(){
        this.multiFireActive=true;
        this.setPlayerGlow(0xff0000);
        this.time.delayedCall(15000,()=>{
            this.multiFireActive=false;
            this.setPlayerGlow(0xffff00);
        });
    }

    activateBlade(){
        this.bladeShieldActive=true;
        this.setPlayerGlow(0x00ff00);
        this.time.delayedCall(15000,()=>{
            this.bladeShieldActive=false;
            this.setPlayerGlow(0xffff00);
        });
    }

    setPlayerGlow(color){
        this.player.postFX.clear();
        this.player.postFX.addGlow(color,1.5);
    }

    shoot(){
        const fire=(vx,vy)=>{
            const b=this.bullets.get(this.player.x,this.player.y-18,"bullet");
            if(!b) return;
            b.setActive(true).setVisible(true);
            b.setVelocity(vx,vy);
        };

        if(this.multiFireActive){
            fire(0,-520);
            fire(-200,-520);
            fire(200,-520);
        } else {
            fire(0,-520);
        }
    }

    hitZombie(bullet,zombie){
        bullet.setActive(false).setVisible(false);
        zombie.hp--;
        if(zombie.hp>0) return;

        zombie.destroy();
        this.score+= zombie.isBoss?50:10;
        this.killsThisLevel++;
        this.scoreText.setText("Score: "+this.score);
    }

    hitPlayer(player,zombie){
        if(this.bladeShieldActive){
            zombie.destroy();
            return;
        }
        zombie.destroy();
        this.loseLife();
    }

    loseLife(){
        this.lives--;
        if(this.hearts[this.lives]) this.hearts[this.lives].setVisible(false);
        if(this.lives<=0) this.gameOver();
    }

    nextLevel(){
        this.levelPaused=true;
        this.zombies.clear(true,true);

        this.level++;
        this.levelText.setText("Level: "+this.level);
        this.zombiesSpawned=0;
        this.killsThisLevel=0;
        this.zombieSpeed+=5;

        const bgKey=this.backgrounds[(this.level-1)%5];
        this.bg.setTexture(bgKey);
        this.bg.setDisplaySize(800,600);

        if(this.level%5===0){
            for(let i=0;i<3;i++){
                this.time.delayedCall(
                    Phaser.Math.Between(3000,15000),
                    ()=>this.spawnBoss()
                );
            }
        }

        this.levelPaused=false;
    }

    gameOver(){
        this.physics.pause();
        this.add.text(400,300,"GAME OVER",{fontSize:"32px",fill:"#fff"}).setOrigin(0.5);
    }

    update(){

        if(this.levelPaused) return;

        this.player.setVelocity(0);

        if(this.cursors.left.isDown||this.keys.A.isDown) this.player.setVelocityX(-this.playerSpeed);
        if(this.cursors.right.isDown||this.keys.D.isDown) this.player.setVelocityX(this.playerSpeed);
        if(this.cursors.up.isDown||this.keys.W.isDown) this.player.setVelocityY(-this.playerSpeed);
        if(this.cursors.down.isDown||this.keys.S.isDown) this.player.setVelocityY(this.playerSpeed);

        if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.shoot();

        this.zombies.children.each(z=>{
            if(z.y>620){
                z.destroy();
                this.loseLife();
            }
        });

        if(!this.levelPaused && this.zombiesSpawned>=this.killsToAdvance && this.zombies.countActive(true)===0){
            this.nextLevel();
        }
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
