class LoadingScene extends Phaser.Scene{
    constructor(){ super("LoadingScene"); }

    preload(){
        this.load.image("bg","assets/background1.png");
        this.load.image("player","assets/player.png");
        this.load.image("zombie","assets/zombie.png");
    }

    create(){

        this.add.image(400,300,"bg").setDisplaySize(800,600).setAlpha(0.5);

        this.add.text(400,120,"ZOMBIE SHOOTER",{
            fontSize:"48px",
            fill:"#ffffff",
            stroke:"#000",
            strokeThickness:6
        }).setOrigin(0.5);

        this.add.image(250,350,"player").setScale(0.25);
        this.add.image(550,350,"zombie").setScale(0.25);

        this.add.text(400,190,"TOP 5",{fontSize:"28px",fill:"#ffcc00"}).setOrigin(0.5);

        const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];

        for(let i=0;i<5;i++){
            const entry = scores[i];
            const text = entry ? `${i+1}. ${entry.name} - ${entry.score}` : `${i+1}. ---`;
            this.add.text(400,230+i*30,text,{fontSize:"22px",fill:"#fff"}).setOrigin(0.5);
        }

        this.add.text(400,520,"SPACE TO START",{fontSize:"24px",fill:"#00ff00"}).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE",()=>{
            this.scene.start("MainScene");
        });
    }
}

class MainScene extends Phaser.Scene{

    constructor(){ super("MainScene"); }

    preload(){

        this.load.image("bg","assets/background1.png");
        this.load.image("player","assets/player.png");
        this.load.image("zombie","assets/zombie.png");
        this.load.image("boss","assets/boss.png");
        this.load.image("bullet","assets/bullet.png");
        this.load.image("heart","assets/heart.png");
        this.load.image("blood","assets/blood.png");
        this.load.image("shard","assets/shard.png");

        this.load.image("speedItem","assets/speed.png");
        this.load.image("multiItem","assets/triple.png");
        this.load.image("bladeItem","assets/blade.png");

        this.load.audio("music1","assets/music1.mp3");
        this.load.audio("music2","assets/music2.mp3");
        this.load.audio("music3","assets/music3.mp3");
        this.load.audio("splat","assets/splat.wav");
        this.load.audio("bossSplat","assets/boss_splat.wav");
        this.load.audio("powerup","assets/powerup.wav");
    }

    create(){

        // ===== STATE =====
        this.level=1;
        this.score=0;
        this.lives=5;
        this.kills=0;
        this.killsToAdvance=20;
        this.gameState="PLAYING";

        // ===== MUSIC =====
        this.musicTracks=[
            this.sound.add("music1",{volume:0.5}),
            this.sound.add("music2",{volume:0.5}),
            this.sound.add("music3",{volume:0.5})
        ];
        this.trackIndex=0;
        this.playMusic();

        // ===== BACKGROUND =====
        this.add.image(400,300,"bg").setDisplaySize(800,600).setAlpha(0.5);

        // ===== GROUPS =====
        this.enemies=this.physics.add.group();
        this.bullets=this.physics.add.group({maxSize:50});
        this.projectiles=this.physics.add.group();
        this.powerups=this.physics.add.group();

        // ===== PLAYER =====
        this.player=this.physics.add.sprite(400,540,"player")
            .setScale(0.15)
            .setCollideWorldBounds(true);

        this.playerSpeed=220;

        // ===== UI =====
        this.scoreText=this.add.text(10,10,"Score: 0",{fontSize:"16px",fill:"#fff"});
        this.levelText=this.add.text(10,30,"Level: 1",{fontSize:"16px",fill:"#fff"});

        this.hearts=[];
        for(let i=0;i<5;i++){
            this.hearts.push(
                this.add.image(650+i*25,30,"heart").setScale(0.1)
            );
        }

        // ===== INPUT =====
        this.cursors=this.input.keyboard.createCursorKeys();
        this.keys=this.input.keyboard.addKeys("W,A,S,D,SPACE,P");

        // ===== COLLISIONS =====
        this.physics.add.overlap(this.bullets,this.enemies,this.hitEnemy,null,this);
        this.physics.add.overlap(this.player,this.enemies,this.hitPlayer,null,this);
        this.physics.add.overlap(this.player,this.projectiles,this.hitProjectile,null,this);
        this.physics.add.overlap(this.player,this.powerups,this.collectPowerup,null,this);

        // ===== TIMERS =====
        this.time.addEvent({
            delay:1500,
            loop:true,
            callback:()=>{ if(this.gameState==="PLAYING") this.spawnZombie(); }
        });

        this.time.addEvent({
            delay:20000,
            loop:true,
            callback:()=>{ if(this.gameState==="PLAYING") this.spawnPowerup(); }
        });

        this.splatSound=this.sound.add("splat");
        this.bossSplatSound=this.sound.add("bossSplat");
        this.powerupSound=this.sound.add("powerup");
    }

    // ===== MUSIC =====
    playMusic(){
        if(this.currentTrack) this.currentTrack.stop();
        this.currentTrack=this.musicTracks[this.trackIndex];
        this.currentTrack.play();
        this.currentTrack.once("complete",()=>{
            this.trackIndex=(this.trackIndex+1)%this.musicTracks.length;
            this.playMusic();
        });
    }

    // ===== SPAWN =====
    spawnZombie(){
        const z=this.enemies.create(Phaser.Math.Between(50,750),-40,"zombie");
        z.hp=1;
        z.type="normal";
        z.setVelocityY(60+this.level*5).setScale(0.15);
    }

    spawnBoss(){
        const b=this.enemies.create(400,-60,"boss");
        b.hp=5;
        b.type="boss";
        b.setVelocityY(40).setScale(0.25);
    }

    spawnMegaBoss(){
        this.gameState="MEGA";
        this.mega=this.enemies.create(400,120,"boss");
        this.mega.hp=20;
        this.mega.type="mega";
        this.mega.setScale(0.4).setImmovable(true).setVelocity(0,0);
        this.startShardCycle();
    }

    // ===== DAMAGE =====
    hitEnemy(bullet,enemy){
        bullet.disableBody(true,true);
        enemy.hp--;

        if(enemy.hp<=0){
            if(enemy.type==="mega"){
                this.endMega();
            }
            enemy.destroy();
            this.score+=10;
            this.kills++;
            this.scoreText.setText("Score: "+this.score);
        }
    }

    endMega(){
        this.gameState="PLAYING";
        this.projectiles.clear(true,true);
        this.bossSplatSound.play();
    }

    // ===== SHARDS =====
    startShardCycle(){
        this.shardTimer=this.time.addEvent({
            delay:400,
            repeat:12,
            callback:()=>{
                if(!this.mega || !this.mega.active) return;
                this.spawnShards();
            }
        });

        this.time.delayedCall(7000,()=>{
            if(this.gameState==="MEGA") this.startShardCycle();
        });
    }

    spawnShards(){
        const count=5;
        const spread=100;
        for(let i=0;i<count;i++){
            const angle=Phaser.Math.DegToRad(
                90-spread/2+(spread/(count-1))*i
            );
            const shard=this.projectiles.create(this.mega.x,this.mega.y,"shard")
                .setScale(0.08);
            shard.setVelocity(Math.cos(angle)*260,Math.sin(angle)*260);
        }
    }

    // ===== PLAYER =====
    shoot(){
        const b=this.bullets.get(this.player.x,this.player.y-20,"bullet");
        if(!b) return;
        b.setActive(true).setVisible(true);
        b.body.enable=true;
        b.setVelocityY(-520);
    }

    hitPlayer(){
        if(this.isBladeShield) return;
        this.lives--;
        this.hearts[this.lives].setVisible(false);
        if(this.lives<=0) this.gameOver();
    }

    hitProjectile(player,proj){
        if(this.isBladeShield){
            proj.destroy();
            return;
        }
        proj.destroy();
        this.hitPlayer();
    }

    // ===== POWERUPS =====
    spawnPowerup(){
        const types=["speedItem","multiItem","bladeItem"];
        const type=Phaser.Utils.Array.GetRandom(types);
        const p=this.powerups.create(
            Phaser.Math.Between(80,720),
            Phaser.Math.Between(80,520),
            type
        ).setScale(0.08);
    }

    collectPowerup(player,item){
        this.powerupSound.play();
        if(item.texture.key==="bladeItem"){
            this.isBladeShield=true;
            this.player.setTint(0x00ff00);
            this.time.delayedCall(15000,()=>{
                this.isBladeShield=false;
                this.player.clearTint();
            });
        }
        item.destroy();
    }

    // ===== LEVEL =====
    nextLevel(){
        this.kills=0;
        this.level++;
        this.levelText.setText("Level: "+this.level);
        if(this.level%10===0) this.spawnMegaBoss();
        else if(this.level%5===0) this.spawnBoss();
    }

    // ===== GAME OVER =====
    gameOver(){
        this.gameState="GAMEOVER";
        this.physics.pause();
        if(this.currentTrack) this.currentTrack.stop();

        const input=document.createElement("input");
        input.maxLength=3;
        input.placeholder="AAA";
        input.style.position="absolute";
        input.style.left="50%";
        input.style.top="50%";
        input.style.transform="translate(-50%,-50%)";
        input.style.fontSize="28px";
        document.body.appendChild(input);
        input.focus();

        input.addEventListener("keydown",(e)=>{
            if(e.key==="Enter"){
                const name=input.value.toUpperCase()||"AAA";
                let scores=JSON.parse(localStorage.getItem("leaderboard"))||[];
                scores.push({name:name,score:this.score});
                scores.sort((a,b)=>b.score-a.score);
                scores=scores.slice(0,5);
                localStorage.setItem("leaderboard",JSON.stringify(scores));
                document.body.removeChild(input);
                this.scene.start("LoadingScene");
            }
        });
    }

    update(){

        if(this.gameState==="GAMEOVER") return;

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

        if(this.gameState==="PLAYING" && this.kills>=this.killsToAdvance)
            this.nextLevel();
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
