import Phaser from 'phaser';
import ScoreLabel from './Score';
import {Key} from '~/scenes/Key';
import BombMaker from '~/scenes/BombMaker';

export default class GameScene extends Phaser.Scene {
    private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
    private controlKeys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    private scoreLabel: Phaser.GameObjects.Text | undefined;
    private bombMaker: BombMaker | undefined;
    private stars: Phaser.Physics.Arcade.Group | undefined;
    private gameOver: boolean;
    private getStarSound: Phaser.Sound.BaseSound | undefined;
    private lvlUpSound: Phaser.Sound.BaseSound | undefined;
    private gameOverSound: Phaser.Sound.BaseSound | undefined;

    constructor() {
        super('game-scene');

        this.gameOver = false;
    }

    preload(): void {
        const loaderPlugin: Phaser.Loader.LoaderPlugin = this.load;

        loaderPlugin.audio('starSound', ['start.mp3']);
        loaderPlugin.audio('levelUpSound', ['lvlUp.mp3']);
        loaderPlugin.audio('gameOverSound', ['gameOver.wav']);

        loaderPlugin.image(Key.SKY, 'sky.png');
        loaderPlugin.image(Key.GROUND, 'platform.png');
        loaderPlugin.image(Key.STAR, 'star.png');
        loaderPlugin.image('bomb', 'bomb.png');
        loaderPlugin.image(Key.BOMB, 'bomb.png');
        loaderPlugin.spritesheet(Key.DUDE, 'dude.png', {frameWidth: 32, frameHeight: 48});


    }

    create() {
        this.add.image(400, 300, Key.SKY);

        this.getStarSound = this.sound.add('starSound', {loop: false});
        this.lvlUpSound = this.sound.add('levelUpSound', {loop: false});
        this.gameOverSound = this.sound.add('gameOverSound', {loop: false});

        const platforms = this.createPlatforms();
        this.player = this.createPlayer();
        this.stars = this.createStars();
        this.scoreLabel = this.createScoreLabel(16, 16, 0);
        this.bombMaker = new BombMaker(this, Key.BOMB);
        const bombsGroup = this.bombMaker.group;

        const arcadePhysics: Phaser.Physics.Arcade.ArcadePhysics = this.physics;
        arcadePhysics.add.collider(this.player, platforms);
        arcadePhysics.add.collider(this.stars, platforms);
        arcadePhysics.add.collider(bombsGroup, platforms);
        arcadePhysics.add.collider(
            this.player,
            bombsGroup,
            this.bombTouch,
            undefined,
            this,
        );
        arcadePhysics.add.overlap(
            this.player,
            this.stars,
            this.collectStar,
            undefined,
            this,
        );

        this.controlKeys = this.input.keyboard.createCursorKeys();

    }

    createPlayer() {
        const player = this.physics.add.sprite(100, 450, Key.DUDE);
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        const animation = this.anims;

        animation.create({
            key: 'left',
            frames: animation.generateFrameNumbers(Key.DUDE, {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1,
        });

        animation.create({
            key: 'turn',
            frames: [{key: Key.DUDE, frame: 4}],
            frameRate: 20,
        });

        animation.create({
            key: 'right',
            frames: animation.generateFrameNumbers(Key.DUDE, {start: 5, end: 8}),
            frameRate: 10,
            repeat: -1,
        });

        return player;
    }

    createPlatforms(): Phaser.Physics.Arcade.StaticGroup {
        const platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, Key.GROUND).setScale(2).refreshBody();
        platforms.create(600, 400, Key.GROUND);
        platforms.create(50, 250, Key.GROUND);
        platforms.create(750, 220, Key.GROUND);
        platforms.create(-170, 130, Key.GROUND);
        platforms.create(900, 100, Key.GROUND);

        return platforms;
    }

    createScoreLabel(x, y, score) {
        const style = {fontSize: '30px', fill: '#000'};
        const label = new ScoreLabel(this, x, y, score, style);

        this.add.existing(label);

        return label;
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        this?.scoreLabel && (this.scoreLabel as any).add(10);
        this?.getStarSound?.play();

        if (this?.stars?.countActive(true) === 0) {
            player.setTint(0xffff00);
            this?.lvlUpSound?.play();
            player.setScale(1.2);
            setTimeout(() => {
                player.clearTint();
                player.setScale(1);
            }, 400);
            this?.stars?.children.iterate(child => {
                (child as any).enableBody(true, (child as any).x, 0, true, true);
            });
        }

        const randomSpawnBomb = Math.round(Math.random())
        if(randomSpawnBomb) {
            this?.bombMaker?.spawn(player.x);
        }
    }

    createStars() {
        const stars = this.physics.add.group({
            key: Key.STAR,
            repeat: 9,
            setXY: {x: 12, y: 0, stepX: 85},
        });

        stars.children.iterate(child => {
            (child as any).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        return stars;
    }

    update() {
        if (this.gameOver) return;

        const dude = this?.player;
        const keys = this?.controlKeys;

        if (!dude || !keys) return;

        if (keys?.left.isDown) {
            dude?.setVelocityX(-160);
            dude?.anims.play('left', true);
        } else if (keys?.right.isDown) {
            dude?.setVelocityX(160);
            dude?.anims.play('right', true);
        } else {
            dude?.setVelocityX(0);
            dude?.anims.play('turn');
        }

        if ((keys?.up.isDown || keys?.space.isDown) && dude?.body?.touching?.down) {
            dude?.setVelocityY(-330);
        }
    }

    bombTouch(player, bomb) {
        this.physics.pause();
        this?.gameOverSound?.play()

        const text = this.add.text(160, 100, 'Game over', {fontSize: '80px'});
        const blinking = setInterval(() => {
            bomb.setTint(0xff0000);
            text.setTint(0xff0000);
            player.setTint(0xff0000);
            setTimeout(() => {
                player.clearTint();
                text.clearTint();
                bomb.clearTint();
            }, 200);
        }, 400);

        this.add.text(50, 300, 'Press any key to restart', {
            fontSize: '50px',
        });

        this.input.keyboard.on('keydown', event => {
            const isArrowKey =
                event.key === 'ArrowRight' ||
                event.key === 'ArrowUp' ||
                event.key === 'ArrowLeft' ||
                event.key === 'ArrowDown';
            if (!isArrowKey) {
                clearInterval(blinking);
                this.restartGame();
            }
        });

        this.gameOver = true;
    }

    restartGame(): void {
        // TODO  controls not working after restart scene. Get rid of this!
        // this.registry.destroy();
        // this.events.off('keydown');
        // this.scene.restart();
        // Пока просто ребутнем страницу
        window.location.reload();
    }
}
