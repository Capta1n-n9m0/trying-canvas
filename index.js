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

function getTime(){
    return (new Date()).getTime();
}



function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

let canvas_element = document.getElementById("canvas");

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

class Block{
    constructor(x, y, width = 100, height = 100, color = "#000000ff", speed = {x: 0, y: 0}) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._color = color;
        this._speed = speed;
    }
    get x(){
        return Math.round(this._x);
    }
    set x(x){
        this._x = x;
    }
    get y(){
        return Math.round(this._y);
    }
    set y(y){
        this._y = y;
    }
    get w(){
        return Math.round(this._width);
    }
    set w(width){
        this._width = width;
    }
    get h(){
        return Math.round(this._height);
    }
    set h(height){
        this._height = height;
    }
    draw(ctx){
        ctx.fillStyle = this._color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    move(delta){
        this._x += delta.x;
        this._y += delta.y;
    }
    moveTime(time){
        this.move({
            x: (this._speed.x * time) / 1000,
            y: (this._speed.y * time) / 1000
        });
    }
    scale(delta){
        this._width *= delta.width;
        this._height *= delta.height;
    }
    accelerate(delta){
        this._speed.x += delta.x;
        this._speed.y += delta.y;
    }
    testWallCollision(w, h, damping = 0){
        const conserving = 1-damping;
        if(this._x <= 0 && this._speed.x < 0) {
            this.x = 0;
            this._speed.x *= -1 * conserving;
        }
        if(this._x+this._width >= w && this._speed.x > 0) {
            this.x = w - this._width;
            this._speed.x *= -1 * conserving;
        }
        if(this._y <= 0 && this._speed.y < 0) {
            this.y = 0;
            this._speed.y *= -1 * conserving;
        }
        if(this._y+this._height >= h && this._speed.y > 0) {
            this.y = h - this._height;
            this._speed.y *= -1 * conserving;
        }
    }
    toString(){
        return `Pos:(${this.x},${this.y}) Dim:${this.w}x${this.h} Color:${this._color} Speed:(${this._speed.x},${this._speed.y})`
    }
}


class Engine{
    constructor(canvasElement) {
        this.canvasElement = canvasElement;
        this.forces = {};
        document.addEventListener('keydown', key=>{
            switch (key.code){
                case 'KeyW':
                    if(!this.forces.keyUpForce) this.forces.keyUpForce = {x: 0, y: -120};
                    break;
                case 'KeyA':
                    if(!this.forces.keyLeftForce) this.forces.keyLeftForce = {x: -120, y: 0};
                    break;
                case 'KeyS':
                    if(!this.forces.keyDownForce) this.forces.keyDownForce = {x: 0, y: 120};
                    break;
                case 'KeyD':
                    if(!this.forces.keyRightForce) this.forces.keyRightForce = {x: 120, y: 0};
                    break;
            }
        })
        document.addEventListener('keyup', key=>{
            switch (key.code){
                case 'KeyW':
                    if(this.forces.keyUpForce) delete this.forces.keyUpForce;
                    break;
                case 'KeyA':
                    if(this.forces.keyLeftForce) delete this.forces.keyLeftForce;
                    break;
                case 'KeyS':
                    if(this.forces.keyDownForce) delete this.forces.keyDownForce;
                    break;
                case 'KeyD':
                    if(this.forces.keyRightForce) delete this.forces.keyRightForce;
                    break;
            }
        })
        this.blocks = [];
    }
    addBlock(block){
        this.blocks.push(block);
    }
    addBlockSimple(jsonBlock){
        const x = jsonBlock.x || 0;
        const y = jsonBlock.y || 0;
        const width = jsonBlock.width || 100;
        const height = jsonBlock.height || 100;
        const color = jsonBlock.color || "#000000ff";
        const speed = jsonBlock.speed || {x: 0, y: 0};
        this.addBlock(new Block(x, y, width, height, color, speed));
    }
    run(){
        const ctx = this.canvasElement.getContext("2d");
        const width = parseInt(this.canvasElement.getAttribute("width"));
        const height = parseInt(this.canvasElement.getAttribute("height"));
        ctx.fillStyle = "#ffffffff";
        ctx.fillRect(0, 0, width, height);
        // change speed
        this.blocks.forEach(block=>{
            for(let prop in this.forces){
                if(this.forces.hasOwnProperty(prop)){
                    block.accelerate({
                        x: this.forces[prop].x * (getTime()-this.lastTick) / 1000,
                        y: this.forces[prop].y * (getTime()-this.lastTick) / 1000,
                    });
                }
            }
            block.moveTime(getTime() - this.lastTick);
        });
        // change position
        this.blocks.forEach(block=>{
            block.moveTime(getTime() - this.lastTick);
        });
        // wall collisions
        this.blocks.forEach(block=>{
            block.testWallCollision(width, height, 0.2);
        });
        // draw cycle - the last cycle
        this.blocks.forEach(block=>{
            block.draw(ctx);
        });
        this.lastTick = getTime();

    }
    start(interval = 10){
        this.forces.constantGravity = {x: 0, y: 100};
        this.lastTick = getTime();
        setInterval(()=>this.run(), interval);
    }

}

const engine = new Engine(canvas_element);
const width = parseInt(canvas_element.getAttribute("width"));
const height = parseInt(canvas_element.getAttribute("height"));
for(let i = 0; i < 20; i++){
    const W = 50;
    //const W = getRandomInt(75) + 75;
    //const H = getRandomInt(150) + 50;
    const H = W;
    const X = getRandomInt(width - W);
    const Y = getRandomInt(height - H);
    const Color = `rgb(${getRandomInt(255)},${getRandomInt(255)},${getRandomInt(255)})`;
    let SX = getRandomInt(150) + 150;
    SX = getRandomInt(100) <= 50 ? SX * -1 : SX;
    let SY = getRandomInt(150) + 150;
    SY = getRandomInt(100) <= 50 ? SY * -1 : SY;
    engine.addBlockSimple({x: X, y:Y, width:W, height:H, color:Color, speed: {x: SX, y:SY}});
}
engine.blocks.forEach(block=>console.log(`%c ${block.toString()}`, `color: ${block._color}; background: white`));
engine.start(1);

// const block = new Rectangle(0, 0, 70, 70, "#3737ff")
// const speed = 200;
// let start = (new Date()).getTime();
// let dirX = 1;
// let dirY = 1;
// setInterval(()=>{
//     const d = new Date();
//     let time = d.getTime() - start;
//     start = d.getTime();
//     let distance = Math.round((time*speed)/1000);
//     canvas.drawBackground("#000000")
//     canvas.drawRect(block);
//     if(block.x <= 0) dirX = 1;
//     if(block.y <= 0) dirY = 1;
//     if(block.x+block.width >= canvas.width) dirX = -1;
//     if(block.y+block.height >= canvas.height) dirY = -1;
//     block.move({x: distance*dirX, y: distance*dirY});
// }, 10)



