/**
 * Value Object: Point
 * Represents a 2D coordinate
 */

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(other) {
        if (!(other instanceof Point)) return false;
        return this.x === other.x && this.y === other.y;
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    toJSON() {
        return { x: this.x, y: this.y };
    }

    static fromJSON(json) {
        return new Point(json.x, json.y);
    }
}
