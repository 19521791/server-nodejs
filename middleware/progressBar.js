const cliProgress = require("cli-progress");
const colors = require("ansi-colors");

const predictions = (totalFrames) => {
    const progressPredictions = new cliProgress.SingleBar({
        format:
            "Processing detect nine dash |" +
            colors.cyan("{bar}") +
            "| {percentage}% || {value}/{total} Frames",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
    });

    progressPredictions.setTotal(totalFrames);
    return progressPredictions;
};

const render = (totalFrames) => {
    const progressRender = new cliProgress.SingleBar({
        format:
            "Processing mapping predictions |" +
            colors.cyan("{bar}") +
            "| {percentage}% || {value}/{total} Frames",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
    });

    progressRender.setTotal(totalFrames);
    return progressRender;
};

const frames = (totalFrames) => {
    const progressFrames = new cliProgress.SingleBar({
        format:
            "Rendering detected image |" +
            colors.cyan("{bar}") +
            "| {percentage}% || {value}/{total} Frames",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
    });

    progressFrames.setTotal(totalFrames);
    return progressFrames;
};

module.exports = {
    predictions,
    render,
    frames,
};
