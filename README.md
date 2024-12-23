# Pixel Sorting 

## Pixel Sorting とは

画像のピクセルに対して、行（もしくは列）の中で、何らかの基準（Value of Brightness など）に基づいてピクセルを並び替えることで、視覚効果を得ようとする試み。私は音楽のミュージックビデオで初めて認識した。

![当該スクリーンショット](./imgae/snap001.png)

## 前提の共有

### p5jsでのピクセルの考え方

まず、1ピクセルは{R, G, B, A}の4チャネルから構成されている。
これらは2次元的に並んでいるわけではなく、1次元的に並んでいる。

|index|0|1|2|3|4|5|6|7|8|9|10|...|
|---|---|---|---|---|---|---|---|---|---|---|---|---|
|_|画像の座標(0, 0) R|(0, 0) G|(0, 0) B|(0, 0) A|(1, 0) R|(1, 0) G|(1, 0) B|(1, 0) A|

厳密に正しいかは置いておいて、このような感じなのだろう。

## 実装

### 実行結果を表示するための空のHTMLを作成

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/p5@1.4.0/lib/p5.js"></script>
    <script src="sketch.js"></script>
    <title>Pixel Sort</title>
</head>
<body style="margin: 0; padding: 0;">
    <main></main>
</body>
</html>
```

CDNで p5.js を読み込んでおき、実際にp5jsのコードが記述されているjsファイルも指定する。

### 初期セットアップ

```js
let img, sorted_img;
let isVisibleMask = false;
let isVertical = false;

function preload() {
    img = loadImage('./assets/image.jpg');
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

    image(sorted_img, img.width, 0);
}
```

まずはスモールスタートで。
```preload()```で画像を先読みしておき、`image()`で画像を2枚表示する。
左側(```img```)は元の画像で、右側(`sorted_img`)はPixel Sortする予定の画像。
(```sorted_img```)に関しては、`.copy`を使って```img```からコピーしている。

### とりあえず、列方向にソートしてみる

便利のため、引数に画像を受け取って、ピクセルをソートした後の画像を返す関数を定義する。

```js
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
```
輝度で並び替えたかったため、RGBから変換する必要がある。
ここで用いたのが [ITU-R BT.709](https://ja.wikipedia.org/wiki/Rec._709) （ChatGPTに教えていただいた）。
あまり本質的ではないので、ここに時間をかけるのはもったいない。
式も与えていただいた。
$$
Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
$$

これに従う。

`rowPixels`に行方向にソートした後のピクセルを保存しておき、
それを`img.pixels[index]`を使って実際の画像に代入するという手順を踏んでいるだけである。
至ってシンプル。

`draw()`の中に、`sorted_img = img_sort_pixels(sorted_img);`を追加して実行すると下記のようになる。

```js
function draw() {
    background(0);

    image(img, 0, 0);

    sorted_img = createImage(img.width, img.height);
    sorted_img.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

    sorted_img = img_sort_pixels(sorted_img);

    image(sorted_img, img.width, 0);
}
```
![実行画像](./imgae/snap002.png)

これはPixel Sortの定義自体には則っているが、
もはや何の画像かも分からなくなってしまっている。
これでは表現的価値が無いので（価値を見出す人がいるかもしれないが）工夫を考える。

### 閾値を用いて画像を2値化

新たな表現のために、画像を2値化しておく。（厳密には、2値化した画像を別途用意して即座に参照できるようにしておく。）
ここで、`threashold`以下の輝度を持つピクセルに対してはソートを行わない。

`img_sort_pixels`下記の`img_sort_pixels_with_mask`に書き換える。
この中に、`get_brightness()`という関数があるが、RGBを輝度に変換しているだけなので深く考えない。

```originalIndices```に関しては、`threashold`以下の輝度を持つピクセルに対してはソート対象から除外しているため、不連続である。

したがって、`rowPixels`のインデックスと実際の画像におけるインデックスが異なるため、別に実際の画像におけるインデックス（本来そのピクセルがあるべき位置を示す）を保存しておこうという動機のもと作成された。

```js
function img_sort_pixels_with_mask(img) {
    img.loadPixels();

    for (let y = 0; y < img.height; y++) {
        let rowPixels = [];
        let originalIndices = [];

        // 閾値より大きい輝度のピクセルのみを抽出
        for (let x = 0; x < img.width; x++) {
            let index = (y * img.width + x) * 4;
            let va = get_brightness(img.pixels[index], img.pixels[index + 1], img.pixels[index + 2]);
            
            if (va > threshold) {
                rowPixels.push([
                    img.pixels[index],
                    img.pixels[index + 1],
                    img.pixels[index + 2],
                    img.pixels[index + 3],
                ]);
                originalIndices.push(x);
            }
        }
        
        // 抽出したピクセルのみをソート
        rowPixels.sort((a, b) => {
            let va = get_brightness(a[0], a[1], a[2]);
            let vb = get_brightness(b[0], b[1], b[2]);
            return vb - va;
        });

        // ソートしたピクセルを元の位置に配置
        for (let i = 0; i < rowPixels.length; i++) {
            let x = originalIndices[i];
            let index = (y * img.width + x) * 4;
            img.pixels[index] = rowPixels[i][0];
            img.pixels[index + 1] = rowPixels[i][1];
            img.pixels[index + 2] = rowPixels[i][2];
            img.pixels[index + 3] = rowPixels[i][3];
        }
    }
    img.updatePixels();
    return img;
}
```

```js
function get_brightness(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
```

```js
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
```


### セグメント化 / Segmentation

勝手にセグメント化という名前をつけた。正式名称であるとか一般的な呼称というわけではない。
セグメント化とは、前項で2値化したことで**黒黒黒黒白白白黒黒黒黒黒黒白白黒**のようにピクセルが並ぶことになる。
そこで、連続した色（今回の場合は**白**）に着目する。そしてそれを1つのグループと解釈して、1つのグループ内でソートをすることで新たな表現を模索しようというものである。




