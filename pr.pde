final int COLUMN_GAP = 32;
final int ROW_GAP = 32; // 縦方向の余白を追加

PImage img, sortedImg, imgMask;
int threshold = 0;
boolean isVisibleMask = false;
boolean isVertical = false;
boolean isSortHighToLow = false;
PFont customFont;

void setup() {
  // WEBGLに相当するP3Dモードでキャンバス作成
  size(displayWidth, displayHeight, P3D);
  // 可能ならスムージングを有効に
  smooth();
  customFont = createFont("Arial", 20);
  textFont(customFont);
  
  // 画像の読み込み
  img = loadImage("assets/face02.jpg");
  
  // キャンバス内に収めるためのスケールファクター計算
  int availableWidth = width - COLUMN_GAP * 4;
  int availableHeight = height - ROW_GAP * 2;
  float scaleFactor = min( availableWidth / (img.width * 2.0), availableHeight / (float)img.height );
  img.resize( int(img.width * scaleFactor), int(img.height * scaleFactor) );
  
  frameRate(60);
}

void draw() {
  background(255);
  
  // 2D描画用に原点をキャンバス左上に補正
  translate(-width/2, -height/2);
  
  // 全体のレイアウトサイズおよびオフセット計算
  int totalWidth = img.width*2 + COLUMN_GAP;
  int totalHeight = img.height + ROW_GAP*2;
  int xOffset = (width - totalWidth) / 2;
  int yOffset = (height - totalHeight) / 2 + ROW_GAP;
  
  // 元画像の描画
  image(img, xOffset, yOffset);
  
  // sortedImg, imgMask の生成
  sortedImg = createImage(img.width, img.height, ARGB);
  sortedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
  imgMask = createImage(img.width, img.height, ARGB);
  imgMask.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
  
  sortedImg = sortImagePixels(sortedImg, isVertical);
  
  // 処理後の画像の描画（もしくはマスク画像）
  if (isVisibleMask) {
    image(createMask(imgMask), xOffset + img.width + COLUMN_GAP, yOffset);
  } else {
    image(sortedImg, xOffset + img.width + COLUMN_GAP, yOffset);
  }
  
  // threshold値の表示位置調整
  fill(30);
  text("Threshold: " + threshold, 10, 20);
  
  animateFrame();
}

/*
  * 画像インスタンスのピクセル値を更新するためには、loadPixels()とupdatePixels()が必要
  * 例: animateFrame();
  */
void animateFrame() {
  threshold = constrain(threshold + 1, 0, 255);
}

/*
  * 画像インスタンスの指定した座標のピクセル値を取得する
  * 例: getPixelAt(img, 0, 0);
  * 画像インスタンスの左上のピクセルの値を取得する
  */
int getPixelAt(PImage imageInstance, int x, int y) {
  return imageInstance.pixels[y * imageInstance.width + x];
}

/*
  * 画像インスタンスの指定した座標にピクセルをセットする
  * 例: setPixelAt(img, 0, 0, color(255, 0, 0, 255));
  * 画像インスタンスの左上のピクセルを赤色に変更する
  */
void setPixelAt(PImage imageInstance, int x, int y, int c) {
  imageInstance.pixels[y * imageInstance.width + x] = c;
}

/*
  * 白色の画素の輝度を取得する
  * 例: getBrightness(color(255, 255, 255, 255));
  */
float getBrightnessVal(int c) {
  return 0.2126 * red(c) + 0.7152 * green(c) + 0.0722 * blue(c);
}

/*
  * 画像インスタンスの指定した行のピクセル値を取得する
  * 例: getLine(img, 0, false);
  * 縦方向がtrueの場合は列、横方向の場合は行を取得する
  */
int[] getLine(PImage imageInstance, int lineIndex, boolean vertical) {
  int len = vertical ? imageInstance.height : imageInstance.width;
  int[] linePixels = new int[len];
  for (int i = 0; i < len; i++) {
    int x = vertical ? lineIndex : i;
    int y = vertical ? i : lineIndex;
    linePixels[i] = getPixelAt(imageInstance, x, y);
  }
  return linePixels;
}

/*
  * 画像インスタンスの指定した行にピクセルをセットする
  * 例: setLine(img, 0, linePixels, false);
  */
void setLine(PImage imageInstance, int lineIndex, int[] pixelsLine, boolean vertical) {
  int len = vertical ? imageInstance.height : imageInstance.width;
  for (int i = 0; i < len; i++) {
    int x = vertical ? lineIndex : i;
    int y = vertical ? i : lineIndex;
    setPixelAt(imageInstance, x, y, pixelsLine[i]);
  }
}

/*
  * 画素のグループを作成する
  * 例: createPixelGroups(linePixels);
  * 返り値: グループの配列。各グループは[mask, startIndex, pixelCount]とともに、グループ内のピクセルのリストを保持
  * ※ この例では ArrayList を用いてグループごとに処理します。
  */
class PixelGroup {
  int mask;     // 0 または 255
  int startIndex;
  ArrayList<Integer> pixels;
  
  PixelGroup(int mask, int startIndex) {
    this.mask = mask;
    this.startIndex = startIndex;
    pixels = new ArrayList<Integer>();
  }
}

ArrayList<PixelGroup> createPixelGroups(int[] pixelsArr) {
  ArrayList<PixelGroup> groups = new ArrayList<PixelGroup>();
  PixelGroup currentGroup = null;
  
  for (int i = 0; i < pixelsArr.length; i++) {
    int c = pixelsArr[i];
    int maskValue = (getBrightnessVal(c) > threshold) ? 255 : 0;
    if (currentGroup == null || maskValue != currentGroup.mask) {
      currentGroup = new PixelGroup(maskValue, i);
      groups.add(currentGroup);
    }
    currentGroup.pixels.add(c);
  }
  return groups;
}

/*
  * 画像の画素をソートする
  * 例: sortImagePixels(img, true);
  * 返り値: 縦方向に輝度の高い順にソート（または低い順）された画像インスタンス
  */
PImage sortImagePixels(PImage imageInstance, boolean vertical) {
  imageInstance.loadPixels();
  int len = vertical ? imageInstance.width : imageInstance.height;
  
  for (int i = 0; i < len; i++) {
    int[] linePixels = getLine(imageInstance, i, vertical);
    ArrayList<PixelGroup> groups = createPixelGroups(linePixels);
    
    // 各グループ毎に輝度判定が255ならソート（昇順・降順を選択）
    for (PixelGroup group : groups) {
      if (group.mask == 255) {
        // ArrayList<Integer> を配列に変換してソート
        Integer[] arr = group.pixels.toArray( new Integer[group.pixels.size()] );
        Arrays.sort(arr, new Comparator<Integer>() {
          public int compare(Integer a, Integer b) {
            float diff = getBrightnessVal(a) - getBrightnessVal(b);
            if (isSortHighToLow) {
              return (diff > 0) ? -1 : ((diff < 0) ? 1 : 0);
            } else {
              return (diff > 0) ? 1 : ((diff < 0) ? -1 : 0);
            }
          }
        });
        // ソート済みの配列を ArrayList に戻す
        group.pixels = new ArrayList<Integer>( Arrays.asList(arr) );
      }
    }
    
    // グループごとにソート後のピクセルを連結
    int pos = 0;
    for (PixelGroup group : groups) {
      for (int c : group.pixels) {
        linePixels[pos++] = c;
      }
    }
    
    // ソート後の行ピクセルを画像へセット
    setLine(imageInstance, i, linePixels, vertical);
  }
  
  imageInstance.updatePixels();
  return imageInstance;
}

/*
  * 画像のマスクを作成する
  * 例: createMask(img);
  * 返り値: 画像インスタンスのマスク
  * 画像インスタンスの輝度が threshold より高い場合は白、それ以外は黒
  */
PImage createMask(PImage imageInstance) {
  imageInstance.loadPixels();
  
  for (int y = 0; y < imageInstance.height; y++) {
    for (int x = 0; x < imageInstance.width; x++) {
      int index = y * imageInstance.width + x;
      int c = imageInstance.pixels[index];
      int maskValue = (getBrightnessVal(c) > threshold) ? 255 : 0;
      imageInstance.pixels[index] = color(maskValue, maskValue, maskValue, 255);
    }
  }
  
  imageInstance.updatePixels();
  return imageInstance;
}

void keyPressed() {
  // マスク表示の切り替え
  if (key == 'm' || key == 'M') {
    isVisibleMask = !isVisibleMask;
  }
  // ソート方向の切替（行/列）
  if (key == 'v' || key == 'V') {
    isVertical = !isVertical;
  }
  // ソート順の切替
  if (key == 's' || key == 'S') {
    isSortHighToLow = !isSortHighToLow;
  }
  // thresholdの調整
  if (keyCode == UP) {
    threshold = constrain(threshold + 5, 0, 255);
  }
  if (keyCode == DOWN) {
    threshold = constrain(threshold - 5, 0, 255);
  }
}