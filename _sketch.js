function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    background(0);
}

function draw() {
    background(0);

    ambientLight(35);
    const vector = createVector(0, 1, -1);
    directionalLight(255, 255, 255, vector);

    ambientMaterial(255, 0, 0);
    sphere(50);
}

// let myFont;

// function preload() {
//     myFont = loadFont('assets/Arial.ttf');
// }

// function draw_axis() {
//     push();
//     strokeWeight(2);
//     stroke(255, 0, 0);
//     line(0, 0, 0, 200, 0, 0);
//     stroke(0, 255, 0);
//     line(0, 0, 0, 0, 200, 0);
//     stroke(0, 0, 255);
//     line(0, 0, 0, 0, 0, 200);
//     pop();

//     push();
//     textFont(myFont);
//     textSize(20);
//     fill(255, 0, 0);
//     text("X", 220, 0, 0);
//     fill(0, 255, 0);
//     text("Y", 0, 220, 0);
//     fill(0, 0, 255);
//     text("Z", 0, 0, 220);
//     pop();
// }