class LoadingScene extends Phaser.Scene {
    constructor(){
        super("LoadingScene");
    }

    preload(){
        this.load.image("bg1", "assets/background1.png");
        this.load.image("player", "assets/player.png");
        this.load.image("zombie", "assets/zombie.png");
    }

    create(){

        // Background
        this.add.image(400, 300, "bg1")
            .setDisplaySize(800, 600)
            .setAlpha(0.4);

        this.add.image(250, 350, "player").setScale(0.25);
        this.add.image(550, 350, "zombie").setScale(0.25);

        this.add.text(400, 120, "ZOMBIE SHOOTER", {
            fontSize: "48px",
            fill: "#ffffff",
            stroke: "#000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 190, "TOP 5", {
            fontSize: "28px",
            fill: "#ffcc00"
        }).setOrigin(0.5);

        const scores = JSON.parse(localStorage.getItem("zombieLeaderboard")) || [];

        for(let i = 0; i < 5; i++){
            const entry = scores[i];
            const text = entry ? `${i+1}. ${entry.name} - ${entry.score}` : `${i+1}. ---`;

            this.add.text(400, 230 + (i * 30), text, {
                fontSize: "22px",
                fill: "#ffffff"
            }).setOrigin(0.5);
        }

        this.add.text(400, 520, "SPACE TO START", {
            fontSize: "26px",
            fill: "#00ff00"
        }).setOrigin(0.5);

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("MainScene");
        });

        // ✅ INFO BUTTON
        const infoButton = this.add.text(770, 20, "i", {
            fontSize: "28px",
            fill: "#ffffff",
            backgroundColor: "#000000"
        })
        .setOrigin(0.5)
        .setPadding(8)
        .setInteractive()
        .setDepth(1000);

        infoButton.on("pointerdown", () => {
            this.showAboutPage();
        });

        // ✅ ALSO allow keyboard "I"
        this.input.keyboard.on("keydown-I", () => {
            this.showAboutPage();
        });
    }

    // ✅ MUST BE INSIDE CLASS
    showAboutPage(){

        const overlay = this.add.rectangle(400,300,800,600,0x000000,0.9)
            .setDepth(2000)
            .setInteractive();

        const panel = this.add.text(400,300,
    `ZOMBIE SHOOTER

    Survive endless waves of zombies.
    Every 5 levels bosses appear.
    Every 10 levels the Mega Boss attacks!

    CONTROLS
    Move:  W A S D  or  Arrow Keys
    Shoot: SPACEBAR
    Pause: P
    Info: I

    POWERUPS
    Speed Boost – Move faster
    Triple Shot – Shoot 3 arrows
    Blade Shield – Temporary immunity

    Click or press ESC to close.`,
        {
            fontSize: "20px",
            fill: "#ffffff",
            align: "center",
            wordWrap: { width: 600 }
        })
        .setOrigin(0.5)
        .setDepth(2001);

        overlay.on("pointerdown", () => {
            overlay.destroy();
            panel.destroy();
        });

        this.input.keyboard.once("keydown-ESC", () => {
            overlay.destroy();
            panel.destroy();
         });
      }
}
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
        this.load.image("shard", "assets/shard.png");

        this.load.image("speedItem", "assets/speed.png");
        this.load.image("multiItem", "assets/triple.png");
        this.load.image("bladeItem", "assets/blade.png");

        this.load.audio("splat", "assets/splat.wav");
        this.load.audio("bossSplat", "assets/boss_splat.wav");
        this.load.audio("powerupSound", "assets/powerup.wav");

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

        this.isSpeedBoost = false;
        this.isTripleFire = false;
        this.isBladeShield = false;

        this.zombieSpeed = 60;
        this.killsToAdvance = 20;
        this.zombiesSpawned = 0;

        // ===== MEGA BOSS SYSTEM =====
        this.megaBoss = null;
        this.bossActive = false;
        this.bossHitsRequired = 20;
        this.bossHitCount = 0;

        this.spikes = this.physics.add.group();
        this.bossShieldActive = false;

        this.basePlayerSpeed = 220;
        this.playerSpeed = this.basePlayerSpeed;

        this.LAYERS = {
            BG: 0,
            BLOOD: 1,
            ZOMBIE: 5,
            PLAYER: 10,
            UI: 1000
        };

        // ===== MUSIC =====
        this.musicTracks = [
            this.sound.add("music1", { volume: 0.5 }),
            this.sound.add("music2", { volume: 0.5 }),
            this.sound.add("music3", { volume: 0.5 })
        ];

        this.currentTrackIndex = 0;
        this.playNextTrack();

        this.splatSound = this.sound.add("splat");
        this.bossSplatSound = this.sound.add("bossSplat");
        this.powerupSound = this.sound.add("powerupSound", { volume: 0.5 });

        // ===== BACKGROUND =====
        this.bg = this.add.image(400, 300, "bg1")
            .setDisplaySize(800, 600)
            .setAlpha(0.5)
            .setDepth(this.LAYERS.BG);

        this.bloodSplats = [];

        // ===== UI =====
        this.scoreText = this.add.text(10, 8, "Score: 0",
            { fontSize: "16px", fill: "#fff", stroke:"#000", strokeThickness:3 }
        ).setDepth(this.LAYERS.UI);

        this.levelText = this.add.text(10, 28, "Level: 1",
            { fontSize: "16px", fill: "#fff", stroke:"#000", strokeThickness:3 }
        ).setDepth(this.LAYERS.UI);

        this.hearts = [];
        for (let i = 0; i < 5; i++) {
            const h = this.add.image(650 + i * 20, 30, "heart")
                .setScale(0.1)
                .setDepth(this.LAYERS.UI);
            this.hearts.push(h);
        }
        // ===== PAUSE SYSTEM =====
    this.isGamePaused = false;

    this.pauseText = this.add.text(400, 300, "PAUSED", {
        fontSize: "48px",
        fill: "#ffffff",
        stroke: "#000",
        strokeThickness: 6
    })
    .setOrigin(0.5)
    .setDepth(this.LAYERS.UI)
    .setVisible(false);

    // Listen for P key
    this.input.keyboard.on("keydown-P", () => {
        this.togglePause();
});

        // 🔥 DEBUG: Press B to spawn MegaBoss
    this.input.keyboard.on("keydown-B", () => {

    // Prevent multiple bosses
    if(this.bossActive) return;

    console.log("DEBUG: Spawning MegaBoss");

    this.spawnMegaBoss();
});

        // ===== PLAYER =====
        this.player = this.physics.add.sprite(400, 540, "player")
            .setScale(0.15)
            .setCollideWorldBounds(true)
            .setDepth(this.LAYERS.PLAYER);

        this.updatePlayerGlow();

        // ===== INPUT =====
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE");

        this.bullets = this.physics.add.group({ defaultKey:"bullet", maxSize:40 });
        this.zombies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        this.spikes = this.physics.add.group();

        this.physics.add.overlap(this.bullets, this.spikes, this.hitSpike, null, this);
        this.physics.add.overlap(this.player, this.spikes, this.hitSpikePlayer, null, this);

        this.time.addEvent({
            delay:30000,
            callback:this.spawnPowerup,
            callbackScope:this,
            loop:true
        });

        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

        this.zombieTimer = this.time.addEvent({
            delay:1500,
            callback:this.spawnZombie,
            callbackScope:this,
            loop:true
        });

        this.physics.add.overlap(
        this.bullets,
        this.zombies,
        this.hitZombie,
        (bullet, zombie) => zombie !== this.megaBoss,
        this
    );
          
        this.physics.add.overlap(
        this.player,
        this.zombies,
        this.hitPlayer,
        (player, zombie) => zombie !== this.megaBoss,
        this
    );}

    playNextTrack(){
        if(this.currentMusic) this.currentMusic.stop();

        this.currentMusic = this.musicTracks[this.currentTrackIndex];
        this.currentMusic.play();

        this.currentMusic.once("complete", () => {
            this.currentTrackIndex++;
            if(this.currentTrackIndex >= this.musicTracks.length)
                this.currentTrackIndex = 0;
            this.playNextTrack();
        });
    }

    updatePlayerGlow(){

    let color = 0xffff00; // default yellow

    // Highest priority first
    if(this.isBladeShield){
        color = 0x00ff00; // green
    }
    else if(this.isSpeedBoost){
        color = 0xffffff; // white
    }
    else if(this.isTripleFire){
        color = 0xff0000; // red
    }

    if(this.player.postFX){
        this.player.postFX.clear();
        this.player.postFX.addGlow(color,1.5,0,false,0.25,4);
    }
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
        z.setDepth(this.LAYERS.ZOMBIE);

        z.postFX.addGlow(0xff0000,1.2,0,false,0.15,3);

        this.zombiesSpawned++;
    }

        spawnBoss(){
        if(this.levelPaused) return;

        const x = Phaser.Math.Between(60,740);
        const boss = this.zombies.create(x, -60, "boss");

        boss.setScale(0.18);
        boss.setVelocityY(this.zombieSpeed * 0.5);
        boss.hp = 3;
        boss.isBoss = true;
        boss.setDepth(this.LAYERS.ZOMBIE + 1);

        boss.postFX.addGlow(0xff0000, 2, 0, false, 0.25, 4);

    }

        spawnMegaBoss(){

    this.levelPaused = true;
    this.zombiesSpawned = 0;
    this.zombieTimer.paused = true;
    this.bossActive = true;

    this.megaBoss = this.physics.add.sprite(400, 120, "boss")
        .setScale(0.4)
        .setDepth(this.LAYERS.ZOMBIE + 5);

    this.megaBoss.isMegaBoss = true;

    this.megaBoss.body.setAllowGravity(false);
    this.megaBoss.setImmovable(true);
    this.megaBoss.setCollideWorldBounds(false);

    this.megaBoss.hp = 9999;
    this.megaBoss.setVelocity(0,0);

    this.bossHitsRequired = 20;
    this.bossHitCount = 0;

    this.megaBoss.postFX.addGlow(0xff6600, 3);

    const bossSpeed = 80 + (this.level * 3);

    // Player overlap
    this.physics.add.overlap(
        this.player,
        this.megaBoss,
        (player, boss) => {
            if(this.isBladeShield) return;
            this.loseLife();
        },
        null,
        this
    );

    // Bullet overlap
    this.physics.add.overlap(
        this.bullets,
        this.megaBoss,
        this.hitMegaBoss,
        null,
        this
    );

    // Movement timer
    this.megaBossMoveEvent = this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => {
            if(!this.bossActive || !this.megaBoss) return;
            const direction = Phaser.Math.Between(0,1) ? 1 : -1;
            this.megaBoss.setVelocityX(direction * bossSpeed);
        }
    });

    this.startSpikeCycle();
}

    hitMegaBoss(bullet, boss){

    if(!this.bossActive) return;

    // 🚨 HARD REMOVE bullet from physics world immediately
    bullet.disableBody(true, true);

    // 🚨 Do not count hits while shield active
    if(this.bossShieldActive) return;

    // 🚨 Prevent multiple increments in same frame
    if(boss.hitRegistered) return;
    boss.hitRegistered = true;

    this.time.delayedCall(50, () => {
        boss.hitRegistered = false;
    });

    this.bossHitCount++;

    console.log("Boss Hits:", this.bossHitCount);

    if(this.bossHitCount >= this.bossHitsRequired){
        this.killMegaBoss();
    }
}

    startSpikeCycle(){

    if(!this.bossActive) return;

    this.bossShieldActive = true;

    this.spikeEvent = this.time.addEvent({
        delay: 400,
        callback: this.spawnSpike,
        callbackScope: this,
        repeat: 4
    });

    this.time.delayedCall(5000, () => {

        this.bossShieldActive = false;

        this.time.delayedCall(2000, () => {
            if(this.bossActive){
                this.startSpikeCycle();
            }
        });

    });
}

    spawnSpike(){

    if(!this.bossActive) return;
    if(!this.megaBoss) return;

    const shardCount = 4;       // fewer shards
    const spreadAngle = 80;     // narrower spread

    for(let i = 0; i < shardCount; i++){

        const angle = Phaser.Math.DegToRad(
            90 - spreadAngle/2 + (spreadAngle/(shardCount-1)) * i
        );

        const speed = 220 + (this.level * 5);

        const shard = this.spikes.create(
            this.megaBoss.x,
            this.megaBoss.y + 20,
            "shard"
        )
        .setScale(0.08) // MAKE THEM SMALL
        .setDepth(this.LAYERS.ZOMBIE + 4);

        shard.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        shard.postFX.addGlow(0xff6600, 1.5);
    }
}
        hitSpike(bullet, spike){

        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;

        spike.destroy();
    }

        hitSpikePlayer(player, spike){

        // ✅ If blade shield is active → immune to shards
        if(this.isBladeShield){
            spike.destroy();  // destroy shard
            return;           // no damage
        }

        // ❌ No shield → take damage
        spike.destroy();
        this.loseLife();
    }
        collectPowerup(player, item){

        this.powerupSound.play();

        const type = item.texture.key;
        item.destroy();

        // SPEED BOOST
        if(type === "speedItem" && !this.isSpeedBoost){

            this.isSpeedBoost = true;
            this.playerSpeed = this.basePlayerSpeed * 2;

            this.updatePlayerGlow();

            this.time.delayedCall(20000, () => {
                this.playerSpeed = this.basePlayerSpeed;
                this.isSpeedBoost = false;
                this.updatePlayerGlow();
            });
        }

        // TRIPLE FIRE
        if(type === "multiItem" && !this.isTripleFire){

            this.isTripleFire = true;
            this.updatePlayerGlow();

            this.time.delayedCall(15000, () => {
                this.isTripleFire = false;
                this.updatePlayerGlow();
            });
        }

        // BLADE SHIELD (IMMUNITY)
        if(type === "bladeItem" && !this.isBladeShield){

            this.isBladeShield = true;
            this.updatePlayerGlow();

            this.time.delayedCall(15000, () => {
                this.isBladeShield = false;
                this.updatePlayerGlow();
            });
        }
    }
        spawnPowerup(){

        if(this.levelPaused) return;

        const types = ["speedItem","multiItem","bladeItem"];
        const type = Phaser.Utils.Array.GetRandom(types);

        const x = Phaser.Math.Between(80,720);
        const y = Phaser.Math.Between(80,520);

        const item = this.powerups.create(x,y,type);

        item.setScale(0.06);
        item.setDepth(this.LAYERS.ZOMBIE);

        // Glow
        if(type==="speedItem")
            item.postFX.addGlow(0xffffff,2);

        if(type==="multiItem")
            item.postFX.addGlow(0xff8800,2);

        if(type==="bladeItem")
            item.postFX.addGlow(0x00ff00,2);
        }

        togglePause(){

        if(this.isGamePaused){

        // RESUME
        this.physics.resume();
        this.isGamePaused = false;
        this.pauseText.setVisible(false);

        if(this.currentMusic){
            this.currentMusic.resume();
        }

    } else {

        // PAUSE
        this.physics.pause();
        this.isGamePaused = true;
        this.pauseText.setVisible(true);

        if(this.currentMusic){
            this.currentMusic.pause();
        }
    }
}
            
    gameOver(){

    this.physics.pause();
    this.levelPaused = true;

    if(this.currentMusic){
        this.currentMusic.stop();
    }

    const centerX = 400;
    const centerY = 300;

    // NAME INPUT ABOVE GAME OVER
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.maxLength = 3;
    nameInput.placeholder = "AAA";
    nameInput.style.position = "absolute";
    nameInput.style.left = "50%";
    nameInput.style.top = "40%";
    nameInput.style.transform = "translate(-50%, -50%)";
    nameInput.style.fontSize = "28px";
    nameInput.style.textTransform = "uppercase";
    nameInput.style.textAlign = "center";
    nameInput.style.width = "80px";
    document.body.appendChild(nameInput);
    nameInput.focus();

    // GAME OVER TEXT (below input)
    this.add.text(
        centerX,
        centerY,
        "GAME OVER\nPress ENTER",
        {
            fontSize:"32px",
            fill:"#fff",
            align:"center"
        }
    ).setOrigin(0.5).setDepth(this.LAYERS.UI);

        nameInput.addEventListener("keydown",(event)=>{
            if(event.key === "Enter"){

            const playerName = nameInput.value.toUpperCase() || "AAA";

            // Save leaderboard
            let leaderboard = JSON.parse(localStorage.getItem("zombieLeaderboard")) || [];

            leaderboard.push({ name: playerName, score: this.score });

            leaderboard.sort((a,b)=>b.score-a.score);

            leaderboard = leaderboard.slice(0,5);

            localStorage.setItem("zombieLeaderboard", JSON.stringify(leaderboard));

            document.body.removeChild(nameInput);

            // Go back to loading screen
            this.scene.start("LoadingScene");
        }
    });
    }
    askForName(){

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 3;

    input.style.position = "absolute";
    input.style.top = "50%";
    input.style.left = "50%";
    input.style.transform = "translate(-50%, -50%)";
    input.style.fontSize = "28px";
    input.style.textAlign = "center";
    input.style.textTransform = "uppercase";
    input.style.zIndex = "1000";

    document.body.appendChild(input);
    input.focus();

    input.addEventListener("keydown",(e)=>{
        if(e.key === "Enter"){

            const name = input.value.toUpperCase();
            document.body.removeChild(input);

            if(name.length === 3){
                this.saveScore(name,this.score);
            }

            this.scene.restart();
        }
    });
    }
    saveScore(name, score){

    let scores = JSON.parse(localStorage.getItem("zombieLeaderboard")) || [];

    scores.push({name:name, score:score});

    scores.sort((a,b)=> b.score - a.score);

    scores = scores.slice(0,5);

    localStorage.setItem("zombieLeaderboard", JSON.stringify(scores));
    }

    hitZombie(bullet, zombie){

    // 🚨 ABSOLUTE PROTECTION
    if(zombie.isMegaBoss) return;

    bullet.disableBody(true, true);

    zombie.hp--;

    if(zombie.hp > 0) return;

    if(zombie.isBoss){
        this.bossSplatSound.play({volume:0.4});
        this.cameras.main.shake(400,0.012);
    } else {
        this.splatSound.play({volume:0.4});
    }

    zombie.destroy();

    const splat = this.add.image(zombie.x, zombie.y, "blood")
        .setScale(zombie.isBoss ? 0.5 : 0.3)
        .setAlpha(0.85)
        .setDepth(this.LAYERS.BLOOD);

    this.bloodSplats.push(splat);

    this.score += zombie.isBoss ? 50 : 10;
    this.scoreText.setText("Score: " + this.score);
}

     killMegaBoss(){

    if(!this.bossActive) return;

    this.bossActive = false;

    if(this.spikeEvent){
        this.spikeEvent.remove(false);
        this.spikeEvent = null;
    }

    if(this.megaBossMoveEvent){
        this.megaBossMoveEvent.remove(false);
        this.megaBossMoveEvent = null;
    }

    this.bossShieldActive = false;

    this.spikes.clear(true, true);

    this.bossSplatSound.play({volume:1});
    this.cameras.main.shake(1000, 0.03);

    if(this.megaBoss){
        this.megaBoss.destroy();
        this.megaBoss = null;
    }

    // Resume level flow cleanly
    this.levelPaused = false;
    this.zombieTimer.paused = false;
    this.zombiesSpawned = this.killsToAdvance;
}
            
        hitPlayer(player, zombie){

    if(this.isBladeShield){

        zombie.destroy();

        const splat = this.add.image(zombie.x, zombie.y, "blood")
            .setScale(0.4)
            .setAlpha(0.85)
            .setDepth(this.LAYERS.BLOOD);

        this.bloodSplats.push(splat);

        return;
    }

    zombie.destroy();
    this.loseLife();
    }

    loseLife(){

        this.lives--;

        if(this.hearts[this.lives]){
            this.hearts[this.lives].setVisible(false);
        }
    
        if(this.lives <= 0){
            this.gameOver();
        }
    }
    nextLevel(){

        this.levelPaused = true;
        this.zombieTimer.paused = true;

        const msg = this.add.text(
            400, 300,
            `LEVEL ${this.level} COMPLETE`,
            {
                fontSize: "32px",
                fill: "#fff",
                stroke: "#000",
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(this.LAYERS.UI);

        this.time.delayedCall(2000, () => {

            msg.destroy();

            this.bloodSplats.forEach(b => b.destroy());
            this.bloodSplats = [];

            this.level++;
            this.levelText.setText("Level: " + this.level);

            this.zombiesSpawned = 0;
            this.zombieSpeed += 5;

            const bgKey = this.backgrounds[(this.level - 1) % this.backgrounds.length];
            this.bg.setTexture(bgKey);
            this.bg.setDisplaySize(800, 600);

            if(this.level % 10 === 0){
            this.spawnMegaBoss();
            return; // stop normal spawning
        }

            this.levelPaused = false;
            this.zombieTimer.paused = false;

            if(this.level % 5 === 0){

            for(let i = 0; i < 5; i++){

                const randomDelay = Phaser.Math.Between(2000, 15000);

                this.time.delayedCall(randomDelay, () => {
                    if(!this.levelPaused){
                        this.spawnBoss();
                      }
                  });
              }
          }
     
        });
 
    }
    
    shoot(){

    if(this.levelPaused || this.isGamePaused) return;

    const createBullet = (x, y, velocityX, velocityY) => {
        const b = this.bullets.get(x, y);
        if(!b) return;

        b.setActive(true).setVisible(true);
        b.setScale(0.18);
        b.body.enable = true;
        b.body.setSize(6,14,true);
        b.setVelocity(velocityX, velocityY);

        if(b.postFX){
            b.postFX.clear();
            b.postFX.addGlow(0xffff00,1);
        }
    };

    // Normal shot
    createBullet(this.player.x, this.player.y - 18, 0, -520);

    // Triple fire
    if(this.isTripleFire){

        createBullet(this.player.x, this.player.y - 18, -200, -520);
        createBullet(this.player.x, this.player.y - 18, 200, -520);
    }
}

    update(){

       if(this.megaBoss && !this.megaBoss.active){
        console.log("MegaBoss became inactive unexpectedly");
    }
        
        if(this.isGamePaused) return;
        
        if (
        !this.levelPaused &&
        !this.bossActive &&
        this.zombiesSpawned >= this.killsToAdvance &&
        this.zombies.countActive(true) === 0
    ) {
        this.nextLevel();
    }

        this.player.setVelocity(0);

        if(this.cursors.left.isDown || this.keys.A.isDown)
            this.player.setVelocityX(-this.playerSpeed);
    
        if(this.cursors.right.isDown || this.keys.D.isDown)
            this.player.setVelocityX(this.playerSpeed);

        if(this.cursors.up.isDown || this.keys.W.isDown)
            this.player.setVelocityY(-this.playerSpeed);

        if(this.cursors.down.isDown || this.keys.S.isDown)
            this.player.setVelocityY(this.playerSpeed);

        if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE))
            this.shoot();

        this.spikes.children.each(shard => {
        if(shard.y > 650 || shard.x < -50 || shard.x > 850){
        shard.destroy();
        }
    });

        this.zombies.children.each(z => {
            if(z.isMegaBoss) return;

            if(z.y > 620){
                z.destroy();
                this.loseLife();
        }
    });

        // Bullet cleanup (POOL FIX)
        this.bullets.children.each(b => {
            if (b.active && b.y < -20) {
                b.setActive(false);
                b.setVisible(false);
                b.body.enable = false;
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
    scene: [LoadingScene, MainScene]
});
