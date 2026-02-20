class LoadingScene extends Phaser.Scene {
    constructor(){
        super("LoadingScene");
    }

    preload(){
        this.load.image("bg1","assets/background1.png");
        this.load.image("player","assets/player.png");
        this.load.image("zombie","assets/zombie.png");
    }

    create(){

        this.add.image(400,300,"bg1")
            .setDisplaySize(800,600)
            .setAlpha(0.4);

        this.add.image(250,350,"player").setScale(0.25);
        this.add.image(550,350,"zombie").setScale(0.25);

        this.add.text(400,120,"ZOMBIE SHOOTER",{
            fontSize:"48px",
            fill:"#fff",
            stroke:"#000",
            strokeThickness:6
        }).setOrigin(0.5);

        this.add.text(400,190,"TOP 5",{
            fontSize:"28px",
            fill:"#ffcc00"
        }).setOrigin(0.5);

        const scores = JSON.parse(localStorage.getItem("zombieLeaderboard"))||[];

        for(let i=0;i<5;i++){
            const entry = scores[i];
            const text = entry ? 
                `${i+1}. ${entry.name} - ${entry.score}` :
                `${i+1}. ---`;

            this.add.text(400,230+(i*30),text,{
                fontSize:"22px",
                fill:"#fff"
            }).setOrigin(0.5);
        }

        this.add.text(400,520,"SPACE TO START",{
            fontSize:"26px",
            fill:"#00ff00"
        }).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE",()=>{
            this.scene.start("MainScene");
        });
    }
}

class MainScene extends Phaser.Scene {
    constructor(){
        super("MainScene");
    }

    preload(){

        for(let i=1;i<=5;i++){
            this.load.image("bg"+i,"assets/background"+i+".png");
        }

        this.load.image("player","assets/player.png");
        this.load.image("zombie","assets/zombie.png");
        this.load.image("boss","assets/boss.png");
        this.load.image("bullet","assets/bullet.png");
        this.load.image("blood","assets/blood.png");
        this.load.image("heart","assets/heart.png");

        this.load.image("speedItem","assets/speed.png");
        this.load.image("multiItem","assets/triple.png");
        this.load.image("bladeItem","assets/blade.png");

        this.load.audio("splat","assets/splat.wav");
        this.load.audio("bossSplat","assets/boss_splat.wav");
        this.load.audio("powerupSound","assets/powerup.wav");

        this.load.audio("music1","assets/music1.mp3");
        this.load.audio("music2","assets/music2.mp3");
        this.load.audio("music3","assets/music3.mp3");
    }

    create(){

        this.backgrounds=["bg1","bg2","bg3","bg4","bg5"];
        this.level=1;
        this.score=0;
        this.lives=5;

        this.baseSpeed=220;
        this.playerSpeed=this.baseSpeed;

        this.zombieSpeed=60;
        this.killsToAdvance=20;
        this.zombiesSpawned=0;

        this.isTriple=false;
        this.isBladeShield=false;

        this.bg=this.add.image(400,300,"bg1")
            .setDisplaySize(800,600)
            .setAlpha(0.5)
            .setDepth(0);

        this.scoreText=this.add.text(10,10,"Score: 0",{fontSize:"18px",fill:"#fff"}).setDepth(1000);
        this.levelText=this.add.text(10,30,"Level: 1",{fontSize:"18px",fill:"#fff"}).setDepth(1000);

        this.hearts=[];
        for(let i=0;i<5;i++){
            this.hearts.push(
                this.add.image(650+i*25,30,"heart")
                .setScale(0.1)
                .setDepth(1000)
            );
        }

        this.player=this.physics.add.sprite(400,540,"player")
            .setScale(0.15)
            .setCollideWorldBounds(true)
            .setDepth(10);

        this.updatePlayerGlow();

        this.bullets=this.physics.add.group();
        this.enemies=this.physics.add.group();
        this.powerups=this.physics.add.group();

        this.physics.add.overlap(this.bullets,this.enemies,this.hitEnemy,null,this);
        this.physics.add.overlap(this.player,this.enemies,this.hitPlayer,null,this);
        this.physics.add.overlap(this.player,this.powerups,this.collectPowerup,null,this);

        this.cursors=this.input.keyboard.createCursorKeys();
        this.keys=this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.time.addEvent({delay:1500,callback:this.spawnZombie,callbackScope:this,loop:true});
        this.time.addEvent({delay:30000,callback:this.spawnPowerup,callbackScope:this,loop:true});

        this.musicTracks=[
            this.sound.add("music1",{volume:0.5}),
            this.sound.add("music2",{volume:0.5}),
            this.sound.add("music3",{volume:0.5})
        ];

        this.currentTrackIndex=0;
        this.playNextTrack();
    }

    playNextTrack(){
        if(this.currentMusic) this.currentMusic.stop();
        this.currentMusic=this.musicTracks[this.currentTrackIndex];
        this.currentMusic.play();
        this.currentMusic.once("complete",()=>{
            this.currentTrackIndex=(this.currentTrackIndex+1)%this.musicTracks.length;
            this.playNextTrack();
        });
    }

    updatePlayerGlow(){

        let color=0xffff00;

        if(this.isBladeShield) color=0x00ff00;
        else if(this.isTriple) color=0xff0000;
        else if(this.playerSpeed>this.baseSpeed) color=0xffffff;

        if(this.player.postFX){
            this.player.postFX.clear();
            this.player.postFX.addGlow(color,1.5);
        }
    }

    spawnZombie(){
        if(this.zombiesSpawned>=this.killsToAdvance) return;

        const x=Phaser.Math.Between(50,750);
        const z=this.enemies.create(x,-40,"zombie")
            .setScale(0.15)
            .setVelocityY(this.zombieSpeed)
            .setDepth(5);

        z.hp=1;
        z.postFX.addGlow(0xff0000,1.2);

        this.zombiesSpawned++;
    }

    spawnPowerup(){

        const types=["speedItem","multiItem","bladeItem"];
        const type=Phaser.Utils.Array.GetRandom(types);

        const item=this.powerups.create(
            Phaser.Math.Between(80,720),
            Phaser.Math.Between(80,520),
            type
        ).setScale(0.07);

        item.postFX.addGlow(0xffffff,1.5);
    }

    collectPowerup(player,item){

        this.sound.play("powerupSound");

        const type=item.texture.key;
        item.destroy();

        if(type==="speedItem"){
            this.playerSpeed=400;
            this.time.delayedCall(15000,()=>{
                this.playerSpeed=this.baseSpeed;
                this.updatePlayerGlow();
            });
        }

        if(type==="multiItem"){
            this.isTriple=true;
            this.time.delayedCall(15000,()=>{
                this.isTriple=false;
                this.updatePlayerGlow();
            });
        }

        if(type==="bladeItem"){
            this.isBladeShield=true;
            this.time.delayedCall(15000,()=>{
                this.isBladeShield=false;
                this.updatePlayerGlow();
            });
        }

        this.updatePlayerGlow();
    }

    shoot(){

        const fire=(vx)=>{
            const b=this.bullets.create(this.player.x,this.player.y-18,"bullet")
                .setScale(0.15);

            b.body.setSize(6,14,true);
            b.setVelocity(vx,-520);

            b.postFX.addGlow(0xffff00,1.2);
        };

        fire(0);

        if(this.isTriple){
            fire(-200);
            fire(200);
        }
    }

    hitEnemy(bullet,enemy){

        bullet.destroy();

        enemy.hp--;
        if(enemy.hp>0) return;

        this.sound.play("splat");

        this.add.image(enemy.x,enemy.y,"blood")
            .setScale(0.3)
            .setDepth(1);

        enemy.destroy();

        this.score+=10;
        this.scoreText.setText("Score: "+this.score);
    }

    hitPlayer(player,enemy){

        if(this.isBladeShield){
            enemy.destroy();
            return;
        }

        enemy.destroy();
        this.lives--;

        if(this.hearts[this.lives])
            this.hearts[this.lives].setVisible(false);

        if(this.lives<=0)
            this.scene.start("LoadingScene");
    }

    update(){

        this.player.setVelocity(0);

        if(this.cursors.left.isDown||this.keys.A.isDown)
            this.player.setVelocityX(-this.playerSpeed);

        if(this.cursors.right.isDown||this.keys.D.isDown)
            this.player.setVelocityX(this.playerSpeed);

        if(this.cursors.up.isDown||this.keys.W.isDown)
            this.player.setVelocityY(-this.playerSpeed);

        if(this.cursors.down.isDown||this.keys.S.isDown)
            this.player.setVelocityY(this.playerSpeed);

        if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE))
            this.shoot();

        if(this.zombiesSpawned>=this.killsToAdvance &&
           this.enemies.countActive(true)===0){

            const msg=this.add.text(400,300,"LEVEL COMPLETE",
                {fontSize:"40px",fill:"#fff"})
                .setOrigin(0.5)
                .setDepth(2000);

            this.time.delayedCall(2000,()=>{
                msg.destroy();
                this.level++;
                this.levelText.setText("Level: "+this.level);
                this.zombiesSpawned=0;
                this.zombieSpeed+=5;
                this.bg.setTexture(this.backgrounds[(this.level-1)%5]);
            });
        }
    }
}

new Phaser.Game({
    type:Phaser.AUTO,
    width:800,
    height:600,
    parent:"game-container",
    physics:{default:"arcade"},
    scene:[LoadingScene,MainScene]
});
