import Phaser from 'phaser';

const formatScore = score => `Набрано очков: ${score}`;

export default class ScoreLabel extends Phaser.GameObjects.Text {
    private score: string;

    constructor(scene, x, y, score, style) {
        super(scene, x, y, formatScore(score), style);
        this.score = score;
    }

    add(points): void {
        this.setScore(this.score + points);
    }

    setScore(score): void {
        this.score = score;
        this.updateScoreText();
    }

    updateScoreText(): void {
        this.setText(formatScore(this.score));
    }
}
