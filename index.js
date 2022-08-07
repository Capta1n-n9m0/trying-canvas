class Canvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }
    drawRect(rectangle){
        this.ctx.fillStyle = rectangle.color;
        this.ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    }
    drawBackground(color){
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    get width(){
        return this.canvas.getAttribute("width");
    }
    get height(){
        return this.canvas.getAttribute("height");
    }
}

class Rectangle{
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.color = color;
    }
    move(delta){
        this.x += delta.x;
        this.y += delta.y;
    }
}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

let canvas_element = document.getElementById("canvas");
let canvas = new Canvas(canvas_element);

const fillCanvasWithNoise = (size)=>{
    let canvas_element = document.getElementById("canvas");
    let canvas = new Canvas(canvas_element);
    for (let y = 0; y < canvas.height/size; y++){
        for(let x = 0; x < canvas.width/size; x++){
            let rec = {x: x*size, y: y*size, width: size, height: size};
            let color = getRandomInt(255);
            rec.color = `rgb(${color},${color},${color})`
            canvas.drawRect(rec);
        }
    }
}

const block = new Rectangle(0, 0, 70, 70, "#3737ff")
const speed = 200;
let start = (new Date()).getTime();
let dirX = 1;
let dirY = 1;
setInterval(()=>{
    const d = new Date();
    let time = d.getTime() - start;
    start = d.getTime();
    let distance = Math.round((time*speed)/1000);
    canvas.drawBackground("#000000")
    canvas.drawRect(block);
    if(block.x <= 0) dirX = 1;
    if(block.y <= 0) dirY = 1;
    if(block.x+block.width >= canvas.width) dirX = -1;
    if(block.y+block.height >= canvas.height) dirY = -1;
    block.move({x: distance*dirX, y: distance*dirY});
}, 10)



