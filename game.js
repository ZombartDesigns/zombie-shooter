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

        // ===== MUSIC SYSTEM =====
        this.musicTracks = ["music1","music2","music3"];
        this.currentTrack = 0;
        this.playMusic();

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
        this.player.postFX.addGlow(0xffff00,1.5,0,false,0.2,4);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.bullets = this.physics.add.group({ defaultKey:"bullet", maxSize:40 });
        this.zombies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        this.zombieTimer = this.time.addEvent({
            delay:1500,
            callback:this.spawnZombie,
            callbackScope:this,
            loop:true
        });

        // Powerup spawn every 60 seconds
        this.time.addEvent({
            delay:60000,
            callback:this.spawnPowerup,
            callbackScope:this,
            loop:true
        });

        this.physics.add.overlap(this.bullets,this.zombies,this.hitZombie,null,this);
        this.physics.add.overlap(this.player,this.zombies,this.hitPlayer,null,this);
        this.physics.add.overlap(this.player,this.powerups,this.collectPowerup,null,this);
    }

    // ===== MUSIC LOOP =====
    playMusic(){
        const track = this.sound.add(this.musicTracks[this.currentTrack],{volume:0.5});
        track.play();
        track.once("complete",()=>{
            this.currentTrack++;
            if(this.currentTrack>=this.musicTracks.length) this.currentTrack=0;
            this.playMusic();
        });
    }

    // ===== ZOMBIES =====
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

    spawnBoss(){
        const x=Phaser.Math.Between(60,740);
        const boss=this.zombies.create(x,-60,"boss");

        boss.setScale(0.18);
        boss.setVelocityY(this.zombieSpeed*0.5);
        boss.hp=3;
        boss.isBoss=true;

        boss.postFX.addGlow(0xff0000,2,0,false,0.25,4);
    }

    scheduleBossSpawns(){
        for(let i=0;i<3;i++){
            const delay=Phaser.Math.Between(3000,15000);
            this.time.delayedCall(delay,()=>{
                if(this.level%5===0 && !this.levelPaused){
                    this.spawnBoss();
                }
            });
        }
    }

    // ===== POWERUPS =====
    spawnPowerup(){
        const types=["speedItem","multiItem","bladeItem"];
        const type=Phaser.Utils.Array.GetRandom(types);

        const x=Phaser.Math.Between(80,720);
        const y=Phaser.Math.Between(80,520);

        const item=this.powerups.create(x,y,type);
        item.setScale(0.15);
        item.type=type;

        if(type==="speedItem") item.postFX.addGlow(0xffffff,1.5);
        if(type==="multiItem") item.postFX.addGlow(0xff8800,1.5);
        if(type==="bladeItem") item.postFX.addGlow(0x00ff00,1.5);
    }

    collectPowerup(player,item){
        item.destroy();
    }

    // ===== SHOOT =====
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

    hitZombie(bullet,zombie){

        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable=false;

        zombie.hp--;
        if(zombie.hp>0) return;

        if(zombie.isBoss){
            this.bossSplatSound.play({volume:0.6});
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

    hitPlayer(player,zombie){
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
        this.zombieTimer.paused=true;
        this.zombies.clear(true,true);

        const msg=this.add.text(400,300,`LEVEL ${this.level} COMPLETE`,
            {fontSize:"32px",fill:"#fff",stroke:"#000",strokeThickness:4})
            .setOrigin(0.5);

        this.time.delayedCall(2000,()=>{
            msg.destroy();
            this.bloodSplats.forEach(b=>b.destroy());
            this.bloodSplats=[];

            this.level++;
            this.levelText.setText("Level: "+this.level);
            this.zombiesSpawned=0;
            this.killsThisLevel=0;
            this.zombieSpeed+=5;

            const bgKey=this.backgrounds[(this.level-1)%this.backgrounds.length];
            this.bg.setTexture(bgKey);
            this.bg.setDisplaySize(800,600);

            this.levelPaused=false;
            this.zombieTimer.paused=false;

            if(this.level%5===0){
                this.scheduleBossSpawns();
            }
        });
    }

    gameOver(){
        this.physics.pause();
        this.add.text(400,300,"GAME OVER\nClick To Restart",
            {fontSize:"32px",fill:"#fff",align:"center"})
            .setOrigin(0.5);

        this.input.once("pointerdown",()=>{this.scene.restart();});
    }

    update(){

        if(this.levelPaused) return;

        this.player.setVelocity(0);

        if(this.cursors.left.isDown || this.keys.A.isDown) this.player.setVelocityX(-220);
        if(this.cursors.right.isDown || this.keys.D.isDown) this.player.setVelocityX(220);
        if(this.cursors.up.isDown || this.keys.W.isDown) this.player.setVelocityY(-220);
        if(this.cursors.down.isDown || this.keys.S.isDown) this.player.setVelocityY(220);

        if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.shoot();

        if(!this.levelPaused &&
           this.zombiesSpawned>=this.killsToAdvance &&
           this.zombies.countActive(true)===0){
            this.nextLevel();
        }

        this.bullets.children.each(b=>{
            if(b.active && b.y<-20){
                b.setActive(false);
                b.setVisible(false);
                b.body.enable=false;
            }
        });

        this.zombies.children.each(z=>{
            if(z.y>620){
                z.destroy();
                this.loseLife();
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
