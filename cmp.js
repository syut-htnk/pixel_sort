let img;
let threshold_min = 60;
let threshold_max = 190;
let showMask = false;
let isVertical = false;
let sortProgress = 0;  // ソートの進行状況
let sortSpeed = 0.01;  // ソートの速度
let isAnimating = true; // アニメーション状態

function preload() {
    //   img = loadImage('./assets/image.jpg');
    img = loadImage('./assets/face.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(1);
}

function draw() {
    background(0);

    // 元の画像を左側に表示
    image(img, 0, 0);

    // ソート済みの画像を右側に表示
    let sortedImg = createImage(img.width, img.height);
    sortedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

    if (showMask) {
        let maskImg = createMaskImage(sortedImg);
        image(maskImg, img.width, 0);
    } else {
        sortPixelsWithMask(sortedImg);
        image(sortedImg, img.width, 0);
    }

    // アニメーション更新
    if (isAnimating) {
        sortProgress = (sortProgress + sortSpeed) % 1;
    }
}

function sortPixelsWithMask(img) {
    img.loadPixels();

    if (isVertical) {
        for (let x = 0; x < img.width; x++) {
            let segments = findVerticalSegments(img, x);
            processSegments(img, segments, x, true);
        }
    } else {
        for (let y = 0; y < img.height; y++) {
            let segments = findHorizontalSegments(img, y);
            processSegments(img, segments, y, false);
        }
    }

    img.updatePixels();
}

function processSegments(img, segments, pos, isVertical) {
    for (let segment of segments) {
        let pixels = [];

        // セグメント内のピクセルを取得
        for (let i = segment.start; i <= segment.end; i++) {
            let index = isVertical ?
                (i * img.width + pos) * 4 :
                (pos * img.width + i) * 4;

            let brightness = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
            pixels.push({
                brightness: brightness,
                r: img.pixels[index],
                g: img.pixels[index + 1],
                b: img.pixels[index + 2],
                a: img.pixels[index + 3],
                originalIndex: i
            });
        }

        // ソート前と後の状態を準備
        let sortedPixels = [...pixels].sort((a, b) => a.brightness - b.brightness);

        // アニメーション進行度に基づいて中間状態を計算
        for (let i = 0; i < pixels.length; i++) {
            let currentPos = pixels[i].originalIndex;
            let targetPos = segment.start + i;

            // 現在の位置から目標位置への補間
            let lerpPos = lerp(currentPos, targetPos, sortProgress);
            let index = isVertical ?
                (Math.floor(lerpPos) * img.width + pos) * 4 :
                (pos * img.width + Math.floor(lerpPos)) * 4;

            // カラー値の補間
            let currentPixel = pixels[i];
            let targetPixel = sortedPixels[i];

            img.pixels[index] = lerp(currentPixel.r, targetPixel.r, sortProgress);
            img.pixels[index + 1] = lerp(currentPixel.g, targetPixel.g, sortProgress);
            img.pixels[index + 2] = lerp(currentPixel.b, targetPixel.b, sortProgress);
            img.pixels[index + 3] = 255;
        }
    }
}

function lerp(start, end, amt) {
    return start * (1 - amt) + end * amt;
}

// その他の関数（createMaskImage, findHorizontalSegments, findVerticalSegments）は
// 前のバージョンと同じ

function keyPressed() {
    if (keyCode === UP_ARROW) {
        threshold_max = min(threshold_max + 5, 255);
    } else if (keyCode === DOWN_ARROW) {
        threshold_max = max(threshold_max - 5, threshold_min);
    } else if (keyCode === RIGHT_ARROW) {
        threshold_min = min(threshold_min + 5, threshold_max);
    } else if (keyCode === LEFT_ARROW) {
        threshold_min = max(threshold_min - 5, 0);
    } else if (key === 'm' || key === 'M') {
        showMask = !showMask;
    } else if (key === 'v' || key === 'V') {
        isVertical = !isVertical;
    } else if (key === ' ') {  // スペースキーでアニメーション一時停止
        isAnimating = !isAnimating;
    } else if (key === '[') {  // [キーで速度減少
        sortSpeed = max(sortSpeed - 0.005, 0.001);
    } else if (key === ']') {  // ]キーで速度増加
        sortSpeed = min(sortSpeed + 0.005, 0.05);
    }
}

// マスク作成とセグメント検出の関数は前のバージョンと同じ
function createMaskImage(img) {
    let maskImg = createImage(img.width, img.height);
    maskImg.loadPixels();
    img.loadPixels();

    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            let brightness = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;

            let maskValue = (brightness >= threshold_min && brightness <= threshold_max) ? 255 : 0;

            maskImg.pixels[index] = maskValue;
            maskImg.pixels[index + 1] = maskValue;
            maskImg.pixels[index + 2] = maskValue;
            maskImg.pixels[index + 3] = 255;
        }
    }

    maskImg.updatePixels();
    return maskImg;
}

function findHorizontalSegments(img, y) {
    let segments = [];
    let start = null;

    for (let x = 0; x < img.width; x++) {
        let index = (y * img.width + x) * 4;
        let brightness = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
        let isInRange = brightness >= threshold_min && brightness <= threshold_max;

        if (isInRange) {
            if (start === null) start = x;
        } else {
            if (start !== null) {
                if (x - start > 5) {
                    segments.push({ start: start, end: x - 1 });
                }
                start = null;
            }
        }
    }

    if (start !== null && img.width - start > 5) {
        segments.push({ start: start, end: img.width - 1 });
    }

    return segments;
}

function findVerticalSegments(img, x) {
    let segments = [];
    let start = null;

    for (let y = 0; y < img.height; y++) {
        let index = (y * img.width + x) * 4;
        let brightness = (img.pixels[index] + img.pixels[index + 1] + img.pixels[index + 2]) / 3;
        let isInRange = brightness >= threshold_min && brightness <= threshold_max;

        if (isInRange) {
            if (start === null) start = y;
        } else {
            if (start !== null) {
                if (y - start > 5) {
                    segments.push({ start: start, end: y - 1 });
                }
                start = null;
            }
        }
    }

    if (start !== null && img.height - start > 5) {
        segments.push({ start: start, end: img.height - 1 });
    }

    return segments;
}