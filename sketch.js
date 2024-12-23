let img, sorted_img;
let img_mask;

let threshold = 130;

let isVisibleMask = false;
let isVertical = false;


function preload() {
    img = loadImage('./assets/face.jpg');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    pixelDensity(1);
}

function draw() {
    background(0);

    image(img, 0, 0);

    sorted_img = createImage(img.width, img.height);
    sorted_img.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
    img_mask = createImage(img.width, img.height);
    img_mask.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

    // sorted_img = img_sort_pixels(sorted_img);
    sorted_img = img_sort_pixels_with_mask(sorted_img);

    if (isVisibleMask) {
        img_mask = img_create_mask(img_mask);
        image(img_mask, img.width, 0);
    } else {
        image(sorted_img, img.width, 0);
    }
}


function img_sort_pixels(img) {
    img.loadPixels();

    // 横方向にソートする場合を考える
    // 各行について for 文を回す
    for (let y = 0; y < img.height; y++) {

        // 行の中のピクセルを取得して配列に格納
        let rowPixels = [];
        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            rowPixels.push([
                img.pixels[index],
                img.pixels[index + 1],
                img.pixels[index + 2],
                img.pixels[index + 3],
            ]);
        }

        // 輝度基準でソート
        // Rec.709 : Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
        rowPixels.sort((a, b) => {
            let va = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
            let vb = 0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2];
            return vb - va;
        });

        // 輝度順で並び替えたピクセルで再度画像を構築
        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            img.pixels[index] = rowPixels[x][0];
            img.pixels[index + 1] = rowPixels[x][1];
            img.pixels[index + 2] = rowPixels[x][2];
            img.pixels[index + 3] = rowPixels[x][3];
        }
    }
    img.updatePixels();
    return img;
}

function img_sort_pixels_with_mask(img) {
    img.loadPixels();

    for (let y = 0; y < img.height; y++) {
        // まず行のマスクを作成
        let maskRow = [];
        let pixelGroups = [];
        let currentGroup = [];
        let currentMask = -1;

        // マスクを作成しながらグループを特定
        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            let brightness = get_brightness(
                img.pixels[index],
                img.pixels[index + 1],
                img.pixels[index + 2]
            );
            let maskValue = brightness > threshold ? 255 : 0;

            // 新しいグループの開始
            if (maskValue !== currentMask) {
                if (currentGroup.length > 0) {
                    pixelGroups.push({
                        mask: currentMask,
                        pixels: currentGroup,
                        startX: x - currentGroup.length
                    });
                }
                currentGroup = [];
                currentMask = maskValue;
            }

            currentGroup.push([
                img.pixels[index],
                img.pixels[index + 1],
                img.pixels[index + 2],
                img.pixels[index + 3],
            ]);
        }
        // 最後のグループを追加
        if (currentGroup.length > 0) {
            pixelGroups.push({
                mask: currentMask,
                pixels: currentGroup,
                startX: img.width - currentGroup.length
            });
        }

        // 明るいグループ（mask=255）のみをソート
        pixelGroups.forEach(group => {
            if (group.mask === 255) {
                group.pixels.sort((a, b) => {
                    let va = get_brightness(a[0], a[1], a[2]);
                    let vb = get_brightness(b[0], b[1], b[2]);
                    return vb - va;
                });
            }
        });

        // ソート済みのピクセルを元の画像に書き戻す
        pixelGroups.forEach(group => {
            group.pixels.forEach((pixel, i) => {
                let x = group.startX + i;
                let index = (y * img.width + x) * 4;
                img.pixels[index] = pixel[0];
                img.pixels[index + 1] = pixel[1];
                img.pixels[index + 2] = pixel[2];
                img.pixels[index + 3] = pixel[3];
            });
        });
    }
    img.updatePixels();
    return img;
}

function get_brightness(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function img_create_mask(img) {
    img.loadPixels();

    for (let y = 0; y < img.height; y++) {
        let rowPixels = [];
        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            rowPixels.push([
                img.pixels[index],
                img.pixels[index + 1],
                img.pixels[index + 2],
                img.pixels[index + 3],
            ]);
        }

        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            let va = 0.2126 * rowPixels[x][0] + 0.7152 * rowPixels[x][1] + 0.0722 * rowPixels[x][2];
            if (va <= threshold) {
                img.pixels[index] = 0;
                img.pixels[index + 1] = 0;
                img.pixels[index + 2] = 0;
                img.pixels[index + 3] = 255;
            } else {
                img.pixels[index] = 255;
                img.pixels[index + 1] = 255;
                img.pixels[index + 2] = 255;
                img.pixels[index + 3] = 255;
            }
        }
    }
    img.updatePixels();
    return img;
}

function toggleMask() {
    isVisibleMask = !isVisibleMask;
}

function keyPressed() {
    if (key == 'm' | key == 'M') {
        toggleMask();
    }
}
