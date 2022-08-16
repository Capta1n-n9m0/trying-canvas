const gravConst = 0.0001
let max_a = 0;

function getTime(){
    return (new Date()).getTime();
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function fillCanvasWithNoise(canvas, size){
    const ctx = canvas.getContext("2d");
    const height = parseInt(canvas.getAttribute("height"));
    const width = parseInt(canvas.getAttribute("width"));
    for (let y = 0; y < height/size; y++){
        for(let x = 0; x < width/size; x++){
            let color = getRandomInt(255);
            ctx.fillStyle = `rgb(${color},${color},${color})`;
            ctx.fillRect(x*size, y*size, size, size);
        }
    }
}

function displayWhiteNoise(interval, size){
    const canvas = document.getElementById("canvas");
    setInterval(fillCanvasWithNoise, interval, canvas, size);
}

const canvas = document.getElementById("canvas");
const widthSlider = document.getElementById("canvasWidth");
const widthOutput = document.getElementById("widthOutput");
const heightSlider = document.getElementById("canvasHeight");
const heightOutput = document.getElementById("heightOutput");
widthSlider.oninput = ()=>{
    const width = widthSlider.value;
    widthOutput.innerText = `Width: ${width}`;
    canvas.setAttribute("width", width);
}
heightSlider.oninput = ()=>{
    const height = heightSlider.value;
    heightOutput.innerText = `Height: ${height}`;
    canvas.setAttribute("height", height);
}


class Block{
    constructor(x, y, width = 100, height = 100, color = "#000000ff", speed = {x: 0, y: 0}, mass = 1) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this._color = color;
        this._speed = speed;
        this.mass = mass;
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
        return `Pos:(${this.x},${this.y}) Dim:${this.w}x${this.h} Color:${this._color} Speed:(${this._speed.x},${this._speed.y}) Mass: ${this.mass}`;
    }
}


class Engine{
    constructor(canvasElement) {
        this.canvasElement = canvasElement;
        this.staticForces = {};
        document.addEventListener('keydown', key=>{
            switch (key.code){
                case 'KeyW':
                    if(!this.staticForces.keyUpForce) this.staticForces.keyUpForce = {x: 0, y: -120};
                    break;
                case 'KeyA':
                    if(!this.staticForces.keyLeftForce) this.staticForces.keyLeftForce = {x: -120, y: 0};
                    break;
                case 'KeyS':
                    if(!this.staticForces.keyDownForce) this.staticForces.keyDownForce = {x: 0, y: 120};
                    break;
                case 'KeyD':
                    if(!this.staticForces.keyRightForce) this.staticForces.keyRightForce = {x: 120, y: 0};
                    break;
            }
        })
        document.addEventListener('keyup', key=>{
            switch (key.code){
                case 'KeyW':
                    if(this.staticForces.keyUpForce) delete this.staticForces.keyUpForce;
                    break;
                case 'KeyA':
                    if(this.staticForces.keyLeftForce) delete this.staticForces.keyLeftForce;
                    break;
                case 'KeyS':
                    if(this.staticForces.keyDownForce) delete this.staticForces.keyDownForce;
                    break;
                case 'KeyD':
                    if(this.staticForces.keyRightForce) delete this.staticForces.keyRightForce;
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
        const mass = jsonBlock.mass || 1;
        this.addBlock(new Block(x, y, width, height, color, speed, mass));
    }
    run(){
        const ctx = this.canvasElement.getContext("2d");
        const width = parseInt(this.canvasElement.getAttribute("width"));
        const height = parseInt(this.canvasElement.getAttribute("height"));
        ctx.fillStyle = "#ffffffff";
        ctx.fillRect(0, 0, width, height);
        // apply static forces: keypress forces
        this.blocks.forEach(block=>{
            for(let prop in this.staticForces){
                if(this.staticForces.hasOwnProperty(prop)){
                    block.accelerate({
                        x: this.staticForces[prop].x * (getTime()-this.lastTick) / 1000,
                        y: this.staticForces[prop].y * (getTime()-this.lastTick) / 1000,
                    });
                }
            }
            block.moveTime(getTime() - this.lastTick);
        });
        // apply gravity of other blocks
        this.blocks.forEach(block1=>{
            this.blocks.forEach(block2=>{
                if(!Object.is(block1, block2)){
                    const DX = (block2._x + block2._width/2) - (block1._x - block1._width/2);
                    const DY = (block2._y + block2._height/2) - (block1._y + block1._height/2);
                    const D = Math.sqrt(DX*DX+DY*DY);
                    const a = (gravConst * block2.mass)/(D*D*D);
                    if(a > max_a){
                        max_a = a;
                        console.log(`max a: ${max_a}`);
                    }
                    if(a > 500) {
                        console.log(`big a: ${a}`);
                    }
                    block1.accelerate({
                        x: a*DX,
                        y: a*DY
                    })
                }
            })
        })
        // change position
        this.blocks.forEach(block=>{
            block.moveTime(getTime() - this.lastTick);
        });
        // wall collisions
        this.blocks.forEach(block=>{
            block.testWallCollision(width, height, 0.4);
        });
        // draw cycle - the last cycle
        this.blocks.forEach(block=>{
            block.draw(ctx);
        });
        this.lastTick = getTime();

    }
    start(interval = 10){
        // this.staticForces.constantGravity = {x: 0, y: 100};
        this.lastTick = getTime();
        setInterval(()=>this.run(), interval);
    }

}

function runEngine(){
    const canvas = document.getElementById("canvas");
    const engine = new Engine(canvas);
    const width = parseInt(canvas.getAttribute("width"));
    const height = parseInt(canvas.getAttribute("height"));
    for(let i = 0; i < 20; i++){
        const W = 50;
        //const W = getRandomInt(75) + 75;
        //const H = getRandomInt(150) + 50;
        const H = W;
        const X = getRandomInt(width - W);
        const Y = getRandomInt(height - H);
        let mass;
        let Color;
        if(getRandomInt(1000)<= 200){
            // massive object: 100_000 - 500_000
            mass = getRandomInt(400_000) + 100_000;
            // colored darker
            Color = `rgb(${25+getRandomInt(50)},${25+getRandomInt(50)},${25+getRandomInt(50)})`;
        }else {
            // light object: 100 - 300
            mass = getRandomInt(200) + 100;
            // colored lighter
            Color = `rgb(${120+getRandomInt(100)},${120+getRandomInt(100)},${120+getRandomInt(100)})`;
        }
        //const Color = `rgb(${getRandomInt(255)},${getRandomInt(255)},${getRandomInt(255)})`;
        let SX = getRandomInt(150);
        SX = getRandomInt(100) <= 50 ? SX * -1 : SX;
        let SY = getRandomInt(150);
        SY = getRandomInt(100) <= 50 ? SY * -1 : SY;
        engine.addBlockSimple({x: X, y:Y, width:W, height:H, color:Color, speed: {x: SX, y:SY}, mass: mass});
    }
    engine.blocks.forEach(block=>console.log(`%c ${block.toString()}`, `color: ${block._color}; background: white`));
    engine.start(1);
}

function runNoise(){
    displayWhiteNoise(1, 10);
}

//runNoise();

runEngine();
