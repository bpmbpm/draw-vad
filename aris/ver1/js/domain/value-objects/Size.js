/**
 * Value Object: Size
 * Represents dimensions (width and height)
 */

class Size {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    equals(other) {
        if (!(other instanceof Size)) return false;
        return this.width === other.width && this.height === other.height;
    }

    area() {
        return this.width * this.height;
    }

    toJSON() {
        return { width: this.width, height: this.height };
    }

    static fromJSON(json) {
        return new Size(json.width, json.height);
    }
}
