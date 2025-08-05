export function getGradientColor(value) {
    // Ensure value is between 0 and 1
    value = Math.max(0, Math.min(1, value));

    // Red to yellow to green gradient
    if (value < 0.5) {
        // Red to yellow (0 to 0.5)
        const r = 255;
        const g = Math.round(255 * (value * 2));
        return `rgb(${r}, ${g}, 0)`;
    } else {
        // Yellow to green (0.5 to 1.0)
        const r = Math.round(255 * (1 - (value - 0.5) * 2));
        const g = 255;
        return `rgb(${r}, ${g}, 0)`;
    }
}