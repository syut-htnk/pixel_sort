const COLUMN_GAP = 32;
const ROW_GAP = 32; // 縦方向の余白を追加

let img, sortedImg;
let imgMask;
// let threshold = 130;
let threshold = 0;
let isVisibleMask = false;
let isVertical = false;
let isSortHighToLow = false;
let customFont;

function preload() {
    img = loadImage('./assets/face02.jpg');
    // img.resize(img.width, img.height);
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    setAttributes('willReadFrequently', true);
    customFont = loadFont('assets/Arial.ttf');
    
    const availableWidth = width - COLUMN_GAP * 4;
    const availableHeight = height - ROW_GAP * 2;
    const scaleFactor = Math.min(availableWidth / (img.width * 2), availableHeight / img.height);
    img.resize(Math.floor(img.width * scaleFactor), Math.floor(img.height * scaleFactor));

    frameRate(60);
}

function draw() {
    background(255);

    translate(-width / 2, -height / 2);
    
    const totalWidth = img.width * 2 + COLUMN_GAP;
    const totalHeight = img.height + ROW_GAP * 2;

    const xOffset = (width - totalWidth) / 2;
    const yOffset = (height - totalHeight) / 2 + ROW_GAP;
    
    // 元画像の描画
    image(img, xOffset, yOffset);

    sortedImg = createImage(img.width, img.height);
    sortedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    imgMask = createImage(img.width, img.height);
    imgMask.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

    sortedImg = sortImagePixels(sortedImg, isVertical);

    // 処理後の画像の描画（もしくはマスク画像）
    if (isVisibleMask) {
        image(createMask(imgMask), xOffset + img.width + COLUMN_GAP, yOffset);
    } else {
        image(sortedImg, xOffset + img.width + COLUMN_GAP, yOffset);
    }

    // threshold値の表示位置調整
    push();
    textFont(customFont);
    textSize(20);
    fill(30);
    text('Threshold: ' + threshold, 10, 20);
    pop();

    animateFrame();
}

/*
    * @img {p5.Image} 画像インスタンス
    * @returns {p5.Image} 画像インスタンス
    * 
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 例: updatePixels(img);
    */
function animateFrame() {
    threshold = constrain(threshold + 1, 0, 255);
}

/*
    * @imageInstance {p5.Image} 画像インスタンス
    * @x {Number} 画像内のx座標
    * @y {Number} 画像内のy座標
    * @returns {Array} [R, G, B, A]
    * 
    * 画像インスタンスの指定した座標のピクセル値を取得する
    * 例: getPixelAt(imageInstance, 0, 0);
    * 画像インスタンスの左上のピクセルの値を取得する
    */
function getPixelAt(imageInstance, x, y) {
    const index = (y * imageInstance.width + x) * 4;
    return [
        imageInstance.pixels[index],
        imageInstance.pixels[index + 1],
        imageInstance.pixels[index + 2],
        imageInstance.pixels[index + 3]
    ];
}

/*
    * @imageInstance {p5.Image} 画像インスタンス
    * @x {Number} 画像内のx座標
    * @y {Number} 画像内のy座標
    * @pixel {Array} [R, G, B, A]
    * @returns {void}
    * 
    * 画像インスタンスの指定した座標にピクセルをセットする
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 例: setPixelAt(imageInstance, 0, 0, [255, 0, 0, 255]);
    * 画像インスタンスの左上のピクセルを赤色に変更する
    */
function setPixelAt(imageInstance, x, y, pixel) {
    const index = (y * imageInstance.width + x) * 4;
    imageInstance.pixels[index] = pixel[0];
    imageInstance.pixels[index + 1] = pixel[1];
    imageInstance.pixels[index + 2] = pixel[2];
    imageInstance.pixels[index + 3] = pixel[3];
}

/*
    * @pixel {Array} [R, G, B, A]
    * @returns {Number} 0 ~ 255
    *  
    * 画素の輝度を取得する
    * 例: getBrightness([255, 255, 255, 255]);
    * 白色の画素の輝度を取得する
    */
function getBrightness(pixel) {
    return 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2];
}

/*
    * @imageInstance {p5.Image} 画像インスタンス
    * @lineIndex {Number} 画像内の行番号
    * @vertical {Boolean} 縦方向の場合はtrue、横方向の場合はfalse
    * @returns {Array} [pixel1, pixel2, ...]
    * 
    * 画像インスタンスの指定した行のピクセル値を取得する
    * 例: getLine(imageInstance, 0, false);
    * 返り値: 画像インスタンスの上端または左端の行のピクセル値の配列
    */
function getLine(imageInstance, lineIndex, vertical) {
    const linePixels = [];
    const length = vertical ? imageInstance.height : imageInstance.width;
    for (let i = 0; i < length; i++) {
        const [x, y] = vertical ? [lineIndex, i] : [i, lineIndex];
        linePixels.push(getPixelAt(imageInstance, x, y));
    }
    return linePixels;
}

/*
    * @imageInstance {p5.Image} 画像インスタンス
    * @lineIndex {Number} 画像内の行番号
    * @pixels {Array} [pixel1, pixel2, ...]
    * @vertical {Boolean} 縦方向の場合はtrue、横方向の場合はfalse
    * @returns {void}
    * 
    * 画像インスタンスの指定した行にピクセルをセットする
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 例: setLine(imageInstance, 0, [pixel1, pixel2, ...], false);
    */
function setLine(imageInstance, lineIndex, pixels, vertical) {
    pixels.forEach((pixel, i) => {
        const [x, y] = vertical ? [lineIndex, i] : [i, lineIndex];
        setPixelAt(imageInstance, x, y, pixel);
    });
}

/*
    * @pixels {Array} [pixel1, pixel2, ...]
    * @returns {Array} [{mask: 0 or 255, pixels: [pixel1, pixel2, ...], startIndex: 0}, ...]
    * 
    * 画素のグループを作成する
    * 例: createPixelGroups([pixel1, pixel2, ...]);
    * 返り値: [{mask: 0 or 255, pixels: [pixel1, pixel2, ...], startIndex: 0}, ...]
    * 画素のグループの配列
        * mask: 0 or 255
        * pixels: 画素の配列
        * startIndex: 画素の配列の先頭のインデックス
    */
function createPixelGroups(pixels) {
    const groups = [];
    let currentGroup = [];
    let currentMask = -1;

    pixels.forEach((pixel, index) => {
        const maskValue = getBrightness(pixel) > threshold ? 255 : 0;
        if (maskValue !== currentMask) {
            if (currentGroup.length > 0) {
                groups.push({
                    mask: currentMask,
                    pixels: currentGroup,
                    startIndex: index - currentGroup.length
                });
            }
            currentGroup = [];
            currentMask = maskValue;
        }
        currentGroup.push(pixel);
    });

    if (currentGroup.length > 0) {
        groups.push({
            mask: currentMask,
            pixels: currentGroup,
            startIndex: pixels.length - currentGroup.length
        });
    }

    return groups;
}

/*
    * @imageInstance {p5.Image} 画像インスタンス
    * @vertical {Boolean} 縦方向の場合はtrue、横方向の場合はfalse
    * @returns {p5.Image} 画像インスタンス
    * 
    * 画像の画素をソートする
    * 例: sortImagePixels(imageInstance, true);
    * 返り値: 縦方向に輝度の高い順にソートされた画像インスタンス
    */
function sortImagePixels(imageInstance, vertical) {
    imageInstance.loadPixels();
    const length = vertical ? imageInstance.width : imageInstance.height;

    for (let i = 0; i < length; i++) {
        const linePixels = getLine(imageInstance, i, vertical);
        const groups = createPixelGroups(linePixels);

        groups.forEach(group => {
            if (group.mask === 255) {
                if (isSortHighToLow) {
                    group.pixels.sort((a, b) => getBrightness(b) - getBrightness(a));
                } else {
                    group.pixels.sort((a, b) => getBrightness(a) - getBrightness(b));
                }
            }
        });

        const sortedPixels = [];
        groups.forEach(group => {
            sortedPixels.push(...group.pixels);
        });

        setLine(imageInstance, i, sortedPixels, vertical);
    }

    imageInstance.updatePixels();
    return imageInstance;
}

/*
    * @imageInstance {p5.Image} 画像インスタンス
    * @returns {p5.Image} 画像インスタンス
    *
    * 画像のマスクを作成する
    * 例: createMask(imageInstance);
    * 返り値: 画像インスタンスのマスク
    * 画像インスタンスの輝度がthresholdより高い場合は白、それ以外は黒
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 画像インスタンスのマスクを表示する場合はisVisibleMaskをtrueにする
    */
function createMask(imageInstance) {
    imageInstance.loadPixels();

    for (let y = 0; y < imageInstance.height; y++) {
        for (let x = 0; x < imageInstance.width; x++) {
            const pixel = getPixelAt(imageInstance, x, y);
            const maskValue = getBrightness(pixel) > threshold ? 255 : 0;
            setPixelAt(imageInstance, x, y, [maskValue, maskValue, maskValue, 255]);
        }
    }

    imageInstance.updatePixels();
    return imageInstance;
}

function keyPressed() {
    function toggleMask() {
        isVisibleMask = !isVisibleMask;
    }
    function toggleDirection() {
        isVertical = !isVertical;
    }
    function toggleSortOrder() {
        isSortHighToLow = !isSortHighToLow;
    }
    if (key === 'm' || key === 'M') {
        toggleMask();
    }
    if (key === 'v' || key === 'V') {
        toggleDirection();
    }
    if (key === 's' || key === 'S') {
        toggleSortOrder();
    }
    if (keyCode === UP_ARROW) {
        threshold = constrain(threshold + 5, 0, 255);
    }
    if (keyCode === DOWN_ARROW) {
        threshold = constrain(threshold - 5, 0, 255);
    }
}