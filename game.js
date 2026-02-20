class LoadingScene extends Phaser.Scene {
    constructor(){ super("LoadingScene"); }

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
            fontSize:"48px",fill:"#fff",stroke:"#000",strokeThickness:6
        }).setOrigin(0.5);

        this.add.text(400,190,"TOP 5",{fontSize:"28px",fill:"#ffcc00"}).setOrigin(0.5);

        const scores=JSON.parse(localStorage.getItem("zombieLeaderboard"))||[];

        for(let i=0;i<5;i++){
            const entry=scores[i];
            const text=entry?`${i+1}. ${entry.name} - ${entry.score}`:`${i+1}. ---`;
            this.add.text(400,230+(i*30),text,{fontSize:"22px",fill:"#fff"}).setOrigin(0.5);
        }

        this.add.text(400,520,"SPACE TO START",{fontSize:"26px",fill:"#00ff00"}).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE",()=>{
            this.scene.start("MainScene");
        });
    }
}

class MainScene extends Phaser.Scene {

constructor(){ super("MainScene"); }

preload(){

    this.load.image("bg1","assets/background1.png");
    this.load.image("bg2","assets/background2.png");
    this.load.image("bg3","assets/background3.png");
    this.load.image("bg4","assets/background4.png");
    this.load.image("bg5","assets/background5.png");

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
    this.killsToAdvance=20;
    this.zombiesSpawned=0;
    this.zombieSpeed=60;

    this.playerSpeed=220;
    this.baseSpeed=220;

    this.isTriple=false;
    this.isBladeShield=false;

    this.bossActive=false;
    this.bossHits=0;

    this.bg=this.add.image(400,300,"bg1").setDisplaySize(800,600).setAlpha(0.5);

    this.scoreText=this.add.text(10,8,"Score: 0",{fontSize:"16px",fill:"#fff"});
    this.levelText=this.add.text(10,28,"Level: 1",{fontSize:"16px",fill:"#fff"});

    this.hearts=[];
    for(let i=0;i<5;i++){
        const h=this.add.image(650+i*20,30,"heart").setScale(0.1);
        this.hearts.push(h);
    }

    this.musicTracks=[
        this.sound.add("music1",{volume:0.5}),
        this.sound.add("music2",{volume:0.5}),
        this.sound.add("music3",{volume:0.5})
    ];
    this.currentTrack=0;
    this.playNextTrack();

    this.splatSound=this.sound.add("splat",{volume:0.4});
    this.bossSplatSound=this.sound.add("bossSplat",{volume:0.8});
    this.powerupSound=this.sound.add("powerupSound",{volume:0.5});

    this.player=this.physics.add.sprite(400,540,"player")
        .setScale(0.15)
        .setCollideWorldBounds(true);

    this.player.postFX.addGlow(0xffff00,1.5);

    this.cursors=this.input.keyboard.createCursorKeys();
    this.keys=this.input.keyboard.addKeys("W,A,S,D,SPACE");

    this.bullets=this.physics.add.group();
    this.enemies=this.physics.add.group();
    this.projectiles=this.physics.add.group();
    this.powerups=this.physics.add.group();

    this.physics.add.overlap(this.bullets,this.enemies,this.hitEnemy,null,this);
    this.physics.add.overlap(this.player,this.enemies,this.hitPlayer,null,this);
    this.physics.add.overlap(this.bullets,this.projectiles,(b,p)=>{b.destroy();p.destroy();});
    this.physics.add.overlap(this.player,this.projectiles,this.hitPlayer,null,this);
    this.physics.add.overlap(this.player,this.powerups,this.collectPowerup,null,this);

    this.zombieTimer=this.time.addEvent({
        delay:1500,
        callback:this.spawnZombie,
        callbackScope:this,
        loop:true
    });

    this.time.addEvent({
        delay:30000,
        callback:this.spawnPowerup,
        callbackScope:this,
        loop:true
    });
}

playNextTrack(){
    if(this.currentMusic) this.currentMusic.stop();
    this.currentMusic=this.musicTracks[this.currentTrack];
    this.currentMusic.play();
    this.currentMusic.once("complete",()=>{
        this.currentTrack=(this.currentTrack+1)%this.musicTracks.length;
        this.playNextTrack();
    });
}

spawnZombie(){
    if(this.zombiesSpawned>=this.killsToAdvance || this.bossActive) return;

    const x=Phaser.Math.Between(50,750);
    const z=this.enemies.create(x,-40,"zombie");

    z.setScale(0.15);
    z.setVelocityY(this.zombieSpeed);
    z.hp=1;
    z.type="zombie";
    z.postFX.addGlow(0xff0000,1.2);

    this.zombiesSpawned++;
}

spawnBoss(){
    const x=Phaser.Math.Between(100,700);
    const b=this.enemies.create(x,-60,"boss");
    b.setScale(0.2);
    b.setVelocityY(this.zombieSpeed*0.6);
    b.hp=3;
    b.type="boss";
    b.postFX.addGlow(0xff0000,2);
}

spawnMegaBoss(){

    this.bossActive=true;
    this.zombieTimer.paused=true;

    this.mega=this.physics.add.sprite(400,120,"boss")
        .setScale(0.4)
        .setImmovable(true);

    this.mega.hp=20;
    this.mega.type="mega";
    this.mega.postFX.addGlow(0xff6600,3);

    this.physics.add.overlap(this.bullets,this.mega,this.hitMegaBoss,null,this);

    this.time.addEvent({
        delay:400,
        callback:this.spawnShard,
        callbackScope:this,
        loop:true
    });
}

spawnShard(){
    if(!this.bossActive) return;

    for(let i=0;i<4;i++){
        const angle=Phaser.Math.DegToRad(70+i*15);
        const s=this.projectiles.create(this.mega.x,this.mega.y,"shard")
            .setScale(0.08);
        s.setVelocity(Math.cos(angle)*250,Math.sin(angle)*250);
    }
}

hitMegaBoss(bullet,boss){
    bullet.destroy();
    boss.hp--;
    if(boss.hp<=0){
        this.killMegaBoss();
    }
}

killMegaBoss(){
    this.bossSplatSound.play();
    this.mega.destroy();
    this.projectiles.clear(true,true);
    this.bossActive=false;
    this.zombieTimer.paused=false;
}

hitEnemy(bullet,enemy){

    if(enemy.type==="mega") return;

    bullet.destroy();
    enemy.hp--;

    if(enemy.hp<=0){
        this.splatSound.play();
        this.add.image(enemy.x,enemy.y,"blood").setScale(0.3);
        enemy.destroy();
        this.score+=10;
        this.scoreText.setText("Score: "+this.score);
    }
}

hitPlayer(player,obj){

    if(this.isBladeShield){
        obj.destroy();
        return;
    }

    obj.destroy();
    this.lives--;
    this.hearts[this.lives].setVisible(false);

    if(this.lives<=0){
        this.gameOver();
    }
}

spawnPowerup(){

    const types=["speedItem","multiItem","bladeItem"];
    const type=Phaser.Utils.Array.GetRandom(types);

    const item=this.powerups.create(
        Phaser.Math.Between(80,720),
        Phaser.Math.Between(80,520),
        type
    ).setScale(0.07);

    item.postFX.addGlow(0xffffff,2);
}

collectPowerup(player,item){

    this.powerupSound.play();
    const type=item.texture.key;
    item.destroy();

    if(type==="speedItem"){
        this.playerSpeed=400;
        this.time.delayedCall(15000,()=>{this.playerSpeed=this.baseSpeed;});
    }

    if(type==="multiItem"){
        this.isTriple=true;
        this.time.delayedCall(15000,()=>{this.isTriple=false;});
    }

    if(type==="bladeItem"){
        this.isBladeShield=true;
        this.player.setTint(0x00ff00);
        this.time.delayedCall(15000,()=>{
            this.isBladeShield=false;
            this.player.clearTint();
        });
    }
}

shoot(){

    const fire=(vx)=>{
        const b=this.bullets.create(this.player.x,this.player.y-18,"bullet")
            .setScale(0.12);
        b.body.setSize(6,14,true);
        b.setVelocity(vx,-520);
    };

    fire(0);
    if(this.isTriple){
        fire(-200);
        fire(200);
    }
}

gameOver(){
    this.physics.pause();
    if(this.currentMusic) this.currentMusic.stop();

    const input=document.createElement("input");
    input.maxLength=3;
    input.style.position="absolute";
    input.style.left="50%";
    input.style.top="50%";
    input.style.transform="translate(-50%,-50%)";
    document.body.appendChild(input);
    input.focus();

    input.addEventListener("keydown",(e)=>{
        if(e.key==="Enter"){
            const name=input.value.toUpperCase()||"AAA";
            let scores=JSON.parse(localStorage.getItem("zombieLeaderboard"))||[];
            scores.push({name:name,score:this.score});
            scores.sort((a,b)=>b.score-a.score);
            scores=scores.slice(0,5);
            localStorage.setItem("zombieLeaderboard",JSON.stringify(scores));
            document.body.removeChild(input);
            this.scene.start("LoadingScene");
        }
    });
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

    this.projectiles.children.each(p=>{
        if(p.y>650||p.x<-50||p.x>850) p.destroy();
    });

    if(!this.bossActive &&
        this.zombiesSpawned>=this.killsToAdvance &&
        this.enemies.countActive(true)===0){

        this.level++;
        this.levelText.setText("Level: "+this.level);
        this.zombiesSpawned=0;
        this.zombieSpeed+=5;

        if(this.level%10===0){
            this.spawnMegaBoss();
        }
        else if(this.level%5===0){
            this.spawnBoss();
        }
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
