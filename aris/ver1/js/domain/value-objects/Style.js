/**
 * Value Object: Style
 * Represents visual styling properties
 */

class Style {
    constructor(styleObject = {}) {
        this.fillColor = styleObject.fillColor || '#ffffff';
        this.strokeColor = styleObject.strokeColor || '#000000';
        this.strokeWidth = styleObject.strokeWidth || 1;
        this.shape = styleObject.shape || 'rectangle';
        this.fontSize = styleObject.fontSize || 12;
        this.fontFamily = styleObject.fontFamily || 'Arial';
        this.fontColor = styleObject.fontColor || '#000000';
        this.style = styleObject.style || '';
    }

    /**
     * Converts style to draw.io style string
     * @returns {string}
     */
    toDrawioStyle() {
        const parts = [];

        if (this.shape) parts.push(`shape=${this.shape}`);
        if (this.fillColor) parts.push(`fillColor=${this.fillColor}`);
        if (this.strokeColor) parts.push(`strokeColor=${this.strokeColor}`);
        if (this.strokeWidth) parts.push(`strokeWidth=${this.strokeWidth}`);
        if (this.fontSize) parts.push(`fontSize=${this.fontSize}`);
        if (this.fontFamily) parts.push(`fontFamily=${this.fontFamily}`);
        if (this.fontColor) parts.push(`fontColor=${this.fontColor}`);
        if (this.style) parts.push(this.style);

        return parts.join(';');
    }

    /**
     * Creates Style from draw.io style string
     * @param {string} styleString
     * @returns {Style}
     */
    static fromDrawioStyle(styleString) {
        const styleObject = {};
        if (!styleString) return new Style(styleObject);

        const parts = styleString.split(';');
        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                styleObject[key.trim()] = value.trim();
            }
        });

        return new Style(styleObject);
    }

    toJSON() {
        return {
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            shape: this.shape,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            fontColor: this.fontColor,
            style: this.style
        };
    }

    static fromJSON(json) {
        return new Style(json);
    }
}
