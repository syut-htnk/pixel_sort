/*
 * Pixel Sorting
 * Author: Shuto HATANAKA
 */

final int COLUMN_GAP = 32;
final int ROW_GAP = 32;
final int FONT_SIZE = 16;

PImage img, sortedImg, imgMask;
float threshold = 0;
boolean isVisibleMask = false;
boolean isVertical = false;
boolean isSortHighToLow = false;
boolean isAnimating = false;
PFont customFont;
String sortingCriteria = "brightness";

String[] imgPaths = {
  "face.jpg",
  "sky.jpg",
  "abstract.jpg"
};

PImage[] images;
int currentImageIndex = 0;

void setup() {
  size(1200, 1200, OPENGL);
  pixelDensity(displayDensity());
  frameRate(60);

  images = new PImage[imgPaths.length];
  for (int i = 0; i < imgPaths.length; i++) {
    images[i] = loadImage(imgPaths[i]);
  }
  img = images[currentImageIndex];

  customFont = createFont("Arial.ttf", FONT_SIZE);

  resizeCurrentImage();
}

void draw() {
  background(255);
  
  pushMatrix();
  //translate(-width / 2, -height / 2);

  float totalWidth = img.width * 2 + COLUMN_GAP;
  float totalHeight = img.height + ROW_GAP * 2;
  float xOffset = (width - totalWidth) / 2.0;
  float yOffset = (height - totalHeight) / 2.0 + ROW_GAP + FONT_SIZE * 2.0;

  image(img, xOffset, yOffset);

  sortedImg = createImage(img.width, img.height, RGB);
  sortedImg.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

  imgMask = createImage(img.width, img.height, RGB);
  imgMask.copy(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

  sortedImg = sortImagePixels(sortedImg, isVertical);

  if (isVisibleMask) {
    image(createMask(imgMask), xOffset + img.width + COLUMN_GAP, yOffset);
  } else {
    image(sortedImg, xOffset + img.width + COLUMN_GAP, yOffset);
  }

  pushMatrix();
  textFont(customFont);
  textAlign(LEFT, BASELINE);
  textSize(FONT_SIZE);
  fill(0);
  text("Threshold: " + threshold, xOffset, yOffset - 8);
  text("Direction: " + (isVertical ? "Vertical" : "Horizontal"), xOffset + img.width + COLUMN_GAP, yOffset - 8);
  text("Sorting Order: " + (isSortHighToLow ? "High to Low" : "Low to High"), xOffset + img.width + COLUMN_GAP, yOffset - 24);
  text("Sorting Criteria: " + sortingCriteria, xOffset + img.width + COLUMN_GAP, yOffset - 40);
  text("Is Animation: " + (isAnimating ? "Yes" : "No"), xOffset + img.width + COLUMN_GAP, yOffset - 56);
  text("Current Image: " + (currentImageIndex + 1) + " / " + images.length, xOffset + img.width + COLUMN_GAP, yOffset - 72);
  text("Press \"m\" to toggle mask", xOffset, yOffset - 24);
  text("Press \"v\" to toggle direction", xOffset, yOffset - 40);
  text("Press \"↓\" to toggle sorting criteria", xOffset, yOffset - 72);
  text("Press \"↑\" to toggle sorting order", xOffset, yOffset - 56);
  popMatrix();

  popMatrix();
  animateFrame();
  resizeCurrentImage();
}

void animateFrame() {
  if (isAnimating) {
    threshold = constrain(threshold + 1, 0, 255);
  }
}

void resizeCurrentImage() {
  float availableWidth = width - COLUMN_GAP * 4;
  float availableHeight = height - ROW_GAP * 2 - FONT_SIZE * 4;
  float scaleFactor = min(availableWidth / (img.width * 2.0), availableHeight / img.height);
  img.resize(int(img.width * scaleFactor), int(img.height * scaleFactor));
}

void keyPressed() {
  if (key == 'm' || key == 'M') {
    isVisibleMask = !isVisibleMask;
  }
  if (key == 'v' || key == 'V') {
    isVertical = !isVertical;
  }
  if (key == 's' || key == 'S') {
    isSortHighToLow = !isSortHighToLow;
  }
  if (keyCode == UP) {
    threshold = constrain(threshold + 5, 0, 255);
  }
  if (keyCode == DOWN) {
    threshold = constrain(threshold - 5, 0, 255);
  }
  if (key == '1') {
    sortingCriteria = "brightness";
    println("Sorting by brightness");
  } else if (key == '2') {
    sortingCriteria = "hue";
    println("Sorting by hue");
  } else if (key == '3') {
    sortingCriteria = "saturation";
    println("Sorting by saturation");
  }
  if (key == 'a' || key == 'A') {
    isAnimating = !isAnimating;
  }
  if (key == 'r' || key == 'R') {
    threshold = 0;
    isVertical = false;
    isSortHighToLow = false;
    isVisibleMask = false;
    isAnimating = false;
  }
  if (keyCode == LEFT) {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    img = images[currentImageIndex];
    resizeCurrentImage();
  } else if (keyCode == RIGHT) {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    img = images[currentImageIndex];
    resizeCurrentImage();
  }
}

color[] getPixelAt(PImage imageInstance, int x, int y) {
  int idx = y * imageInstance.width + x;
  color c = imageInstance.pixels[idx];
  return new color[]{(c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF, (c >> 24) & 0xFF};
}

void setPixelAt(PImage imageInstance, int x, int y, color[] pixel) {
  int idx = y * imageInstance.width + x;
  imageInstance.pixels[idx] = color(pixel[0], pixel[1], pixel[2], pixel[3]);
}

float getBrightness(color[] pixel) {
  return 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2];
}

float getSaturation(color[] pixel) {
  float r = pixel[0];
  float g = pixel[1];
  float b = pixel[2];
  float maxVal = max(r, g, b);
  float minVal = min(r, g, b);
  float delta = maxVal - minVal;
  return (maxVal == 0) ? 0 : (delta / maxVal);
}

float getHue(color[] pixel) {
  float r = pixel[0];
  float g = pixel[1];
  float b = pixel[2];
  float maxVal = max(r, g, b);
  float minVal = min(r, g, b);
  float delta = maxVal - minVal;
  float hueVal = 0;
  if (delta != 0) {
    if (maxVal == r) {
      hueVal = (g - b) / delta;
    } else if (maxVal == g) {
      hueVal = 2 + (b - r) / delta;
    } else {
      hueVal = 4 + (r - g) / delta;
    }
  }
  hueVal *= 60;
  if (hueVal < 0) {
    hueVal += 360;
  }
  return hueVal;
}

float getSortValue(color[] pixel) {
  switch (sortingCriteria) {
  case "hue":
    return getHue(pixel);
  case "saturation":
    return getSaturation(pixel);
  default:
    return getBrightness(pixel);
  }
}

color[][] getLine(PImage imageInstance, int lineIndex, boolean vertical) {
  int length = vertical ? imageInstance.height : imageInstance.width;
  color[][] linePixels = new color[length][];
  for (int i = 0; i < length; i++) {
    int x = vertical ? lineIndex : i;
    int y = vertical ? i : lineIndex;
    linePixels[i] = getPixelAt(imageInstance, x, y);
  }
  return linePixels;
}

void setLine(PImage imageInstance, int lineIndex, color[][] pixels, boolean vertical) {
  int length = vertical ? imageInstance.height : imageInstance.width;
  for (int i = 0; i < length; i++) {
    int x = vertical ? lineIndex : i;
    int y = vertical ? i : lineIndex;
    setPixelAt(imageInstance, x, y, pixels[i]);
  }
}

class PixelGroup {
  int mask;
  color[][] pixels;
  int startIndex;
  PixelGroup(int m, color[][] p, int s) {
    mask = m;
    pixels = p;
    startIndex = s;
  }
}

ArrayList<PixelGroup> createPixelGroups(color[][] pixels) {
  ArrayList<PixelGroup> groups = new ArrayList<PixelGroup>();
  ArrayList<color[]> currentGroup = new ArrayList<color[]>();
  int currentMask = -1;
  int groupStartIndex = 0;

  for (int i = 0; i < pixels.length; i++) {
    float br = getBrightness(pixels[i]);
    int maskValue = (br > threshold) ? 255 : 0;
    if (maskValue != currentMask) {
      if (currentGroup.size() > 0) {
        color[][] arr = currentGroup.toArray(new color[currentGroup.size()][]);
        groups.add(new PixelGroup(currentMask, arr, i - currentGroup.size()));
      }
      currentGroup = new ArrayList<color[]>();
      currentMask = maskValue;
      groupStartIndex = i;
    }
    currentGroup.add(pixels[i]);
  }

  if (currentGroup.size() > 0) {
    color[][] arr = currentGroup.toArray(new color[currentGroup.size()][]);
    groups.add(new PixelGroup(currentMask, arr, pixels.length - currentGroup.size()));
  }
  return groups;
}

PImage sortImagePixels(PImage imageInstance, boolean vertical) {
  imageInstance.loadPixels();
  int length = vertical ? imageInstance.width : imageInstance.height;

  for (int i = 0; i < length; i++) {
    color[][] linePixels = getLine(imageInstance, i, vertical);
    ArrayList<PixelGroup> groups = createPixelGroups(linePixels);

    for (PixelGroup group : groups) {
      if (group.mask == 255) {
        if (isSortHighToLow) {
          java.util.Arrays.sort(group.pixels, (a, b) -> Float.compare(getSortValue(b), getSortValue(a)));
        } else {
          java.util.Arrays.sort(group.pixels, (a, b) -> Float.compare(getSortValue(a), getSortValue(b)));
        }
      }
    }

    color[][] sortedPixels = new color[linePixels.length][];
    int indexCount = 0;
    for (PixelGroup g : groups) {
      for (int j = 0; j < g.pixels.length; j++) {
        sortedPixels[indexCount++] = g.pixels[j];
      }
    }
    setLine(imageInstance, i, sortedPixels, vertical);
  }

  imageInstance.updatePixels();
  return imageInstance;
}

PImage createMask(PImage imageInstance) {
  imageInstance.loadPixels();
  for (int y = 0; y < imageInstance.height; y++) {
    for (int x = 0; x < imageInstance.width; x++) {
      color[] px = getPixelAt(imageInstance, x, y);
      float br = getBrightness(px);
      int maskValue = (br > threshold) ? 255 : 0;
      setPixelAt(imageInstance, x, y, new color[]{maskValue, maskValue, maskValue, 255});
    }
  }
  imageInstance.updatePixels();
  return imageInstance;
}
