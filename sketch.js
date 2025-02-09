let img, sorted_img;
let img_mask;
// let threshold = 130;
let threshold = 0;
let isVisibleMask = false;
let isVertical = false;
let isSortHighToLow = false;
let customFont;

let column_gap = 32;
let row_gap = 32; // 縦方向の余白を追加

function preload() {
    img = loadImage('./assets/face02.jpg');
    // img.resize(img.width, img.height);
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    setAttributes('willReadFrequently', true);
    customFont = loadFont('assets/Arial.ttf');

    // 利用可能な高さから上下の余白を引く
    const availableHeight = height - row_gap * 2;
    // 画像の初期リサイズ（必要なら preload() のリサイズを削除してください）
    // ここでは、キャンバス内に収めるため、画像のスケールファクターを計算する
    const scaleFactor = Math.min(width / (img.width * 2 + column_gap * 4), availableHeight / img.height);
    img.resize(Math.floor(img.width * scaleFactor), Math.floor(img.height * scaleFactor));

    frameRate(60);
}


function draw() {
    background(255);

    // WEBGL座標系の原点を左上に移動
    translate(-width / 2, -height / 2);
    
    // レイアウト全体での横方向と縦方向のサイズ
    const totalWidth = img.width * 2 + column_gap;
    const totalHeight = img.height + row_gap * 2;
    // 画像を水平・垂直方向に中央揃えするためのオフセット
    const xOffset = (width - totalWidth) / 2;
    const yOffset = (height - totalHeight) / 2 + row_gap;
    
    // 元画像の描画
    image(img, xOffset, yOffset);

    sorted_img = createImage(img.width, img.height);
    sorted_img.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    img_mask = createImage(img.width, img.height);
    img_mask.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

    sorted_img = sortImagePixels(sorted_img, isVertical);

    // 処理後の画像の描画（もしくはマスク画像）
    if (isVisibleMask) {
        image(createMask(img_mask), xOffset + img.width + column_gap, yOffset);
    } else {
        image(sorted_img, xOffset + img.width + column_gap, yOffset);
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
    * @img {p5.Image} 画像インスタンス
    * @x {Number} 画像内のx座標
    * @y {Number} 画像内のy座標
    * @returns {Array} [R, G, B, A]
    * 
    * 画像インスタンスの指定した座標のピクセル値を取得する
    * 例: getPixelAt(img, 0, 0);
    * 画像インスタンスの左上のピクセルの値を取得する
    */

function getPixelAt(img, x, y) {
    const index = (y * img.width + x) * 4;
    return [
        img.pixels[index],
        img.pixels[index + 1],
        img.pixels[index + 2],
        img.pixels[index + 3]
    ];
}

/*
    * @img {p5.Image} 画像インスタンス
    * @x {Number} 画像内のx座標
    * @y {Number} 画像内のy座標
    * @pixel {Array} [R, G, B, A]
    * @returns {void}
    * 
    * 画像インスタンスの指定した座標にピクセルをセットする
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 例: setPixelAt(img, 0, 0, [255, 0, 0, 255]);
    * 画像インスタンスの左上のピクセルを赤色に変更する
    */

function setPixelAt(img, x, y, pixel) {
    const index = (y * img.width + x) * 4;
    img.pixels[index] = pixel[0];
    img.pixels[index + 1] = pixel[1];
    img.pixels[index + 2] = pixel[2];
    img.pixels[index + 3] = pixel[3];
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
    * @img {p5.Image} 画像インスタンス
    * @lineIndex {Number} 画像内の行番号
    * @vertical {Boolean} 縦方向の場合はtrue、横方向の場合はfalse
    * @returns {Array} [pixel1, pixel2, ...]
    * 
    * 画像インスタンスの指定した行のピクセル値を取得する
    * 例: getLine(img, 0, false);
    * 返り値: 画像インスタンスの上端の行のピクセル値の配列
    */

function getLine(img, lineIndex, vertical) {
    const linePixels = [];
    const length = vertical ? img.height : img.width;

    for (let i = 0; i < length; i++) {
        const [x, y] = vertical ? [lineIndex, i] : [i, lineIndex];
        linePixels.push(getPixelAt(img, x, y));
    }
    return linePixels;
}

/*
    * @img {p5.Image} 画像インスタンス
    * @lineIndex {Number} 画像内の行番号
    * @pixels {Array} [pixel1, pixel2, ...]
    * @vertical {Boolean} 縦方向の場合はtrue、横方向の場合はfalse
    * @returns {void}
    * 
    * 画像インスタンスの指定した行にピクセルをセットする
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 例: setLine(img, 0, [pixel1, pixel2, ...], false);
    */

function setLine(img, lineIndex, pixels, vertical) {
    pixels.forEach((pixel, i) => {
        const [x, y] = vertical ? [lineIndex, i] : [i, lineIndex];
        setPixelAt(img, x, y, pixel);
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
    * @img {p5.Image} 画像インスタンス
    * @vertical {Boolean} 縦方向の場合はtrue、横方向の場合はfalse
    * @returns {p5.Image} 画像インスタンス
    * 
    * 画像の画素をソートする
    * 例: sortImagePixels(img, true);
    * 返り値: 縦方向に輝度の高い順にソートされた画像インスタンス
    */

function sortImagePixels(img, vertical) {
    img.loadPixels();
    const length = vertical ? img.width : img.height;

    for (let i = 0; i < length; i++) {
        const linePixels = getLine(img, i, vertical);
        const groups = createPixelGroups(linePixels);

        groups.forEach(group => {
            if (group.mask === 255) {
                if (isSortHighToLow) {
                    group.pixels.sort((a, b) => getBrightness(b) - getBrightness(a));
                }
                else {
                    group.pixels.sort((a, b) => getBrightness(a) - getBrightness(b));
                }
            }
        });

        const sortedPixels = [];
        groups.forEach(group => {
            sortedPixels.push(...group.pixels);
        });

        setLine(img, i, sortedPixels, vertical);
    }

    img.updatePixels();
    return img;
}

/*
    * @img {p5.Image} 画像インスタンス
    * @returns {p5.Image} 画像インスタンス
    *
    * 画像のマスクを作成する
    * 例: createMask(img);
    * 返り値: 画像インスタンスのマスク
    * 画像インスタンスの輝度がthresholdより高い場合は白、それ以外は黒
    * 画像インスタンスのピクセル値を更新するため、updatePixels()が必要
    * 画像インスタンスのマスクを表示する場合はisVisibleMaskをtrueにする
    */

function createMask(img) {
    img.loadPixels();

    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            const pixel = getPixelAt(img, x, y);
            const brightness = getBrightness(pixel);
            const maskValue = brightness > threshold ? 255 : 0;
            setPixelAt(img, x, y, [maskValue, maskValue, maskValue, 255]);
        }
    }

    img.updatePixels();
    return img;
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