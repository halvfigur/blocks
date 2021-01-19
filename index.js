class Coord {
    constructor(col, row) {
        this.col = col;
        this.row = row;
    }
}

class Block1 {
    // A T shape
    constructor() {
        this.coords = [new Coord(0, -1), new Coord(-1, 0), new Coord(0, 0), new Coord(1, 0)];
        this.color = 'rgba(255, 0, 0, 0)';
    }

    clone()  {
        return new Block1()
    }
}

class BlockModel {
    constructor(block) {
        this.block = block;
        this.coords = block.coords.map((c) => new Coord(c.col, c.row));
    }

    clone() {
        return new BlockModel(this.block, this.col, this.row);
    }

    rotate(q) {
        let theta = q * Math.PI / 2;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        return this.block.coords.map((c) => new Coord(
            Math.round(c.col * cosTheta - c.row * sinTheta),
            Math.round(c.col * sinTheta + c.row * cosTheta)
        ));
    }

    // Get the block's current coordinates
    getCoordsRelative(col, row, rot) {
        //return this.rotate(rot).map((c) => new Coord(c.col + col, c.row + row));

        let rotated = this.rotate(rot);
        let rel = rotated.map((c) => new Coord(c.col + col, c.row + row));
        return rel;
    }

    hasCoord(col, row, rot) {
        //return this.coords.some((c) => c.col == col && c.row == row);
        return this.getCoordsRelative(col, row, rot).some((c) => c.col == col && c.row == row);
    }
};

class TetrisModel {
    constructor(columns, rows, blockShapes) {
        // The width of the game surface
        this.columns = columns;

        // The height of the game surface
        this.rows = rows;

        // The game surface cells. The top left corner is at index 0, 0.
        //this.cells = new Array(columns).fill(new Array(rows).fill(0));
        this.cells = new Array(columns * rows).fill(0);

        // The current column index of the block
        this.col = Math.floor(columns / 2);

        // The current row index of the block
        this.row = 0;

        // The current rotation of the block
        this.rotation = 0;

        // An array of block shapes
        this.blockShapes = blockShapes;

        // A model of the current block
        this.block = this.nextBlock();

        // The delay between each drop in milliseconds
        this.dropDelay = 1000;
    }

    // Get a cell on the game surface disregarding the current block
    _getCell(col, row) {
        return this.cells[col * this.columns + row];
    }

    // Get the status of a cell on the surface
    getCell(col, row) {
        // If the cells is "locked" we can return immediately
        if (this._getCell(col, row) == 1) {
            return 1;
        }

        // Return whether the current block is occupying the cell or not
        return this.block.getCoordsRelative(this.col, this.row, this.rotation).
            some((c) => c.col == col && c.row == row);
    }

    // Set a cell on the surface
    _setCell(col, row, v) {
        this.cells[col * this.columns + row] = v;
    }

    // Populate the block model with a new block chosen at random and reset the
    // current block row and column position
    nextBlock() {
        this.col = this.columns / 2;
        this.row = 0;
        let i = Math.floor(Math.random() * this.blockShapes.length);

        return new BlockModel(this.blockShapes[i], this.col, this.row);
    }

    // Test if postion col/row is valid for the current block
    isValidPosition(col, row, rot) {
        let coords = this.block.getCoordsRelative(col, row, rot);

        for (let c of coords) {
            let isVacant = this._getCell(c.col, c.row) != 0;
            let isWithinLeftRightMargin = c.col < 0 || c.col >= this.columns;
            let isBelowBottomLine = c.row >= this.rows;
            if (isVacant || isWithinLeftRightMargin || isBelowBottomLine) {
                return false;
            }
        }

        return true;
    }

    // Move the block to the right if possible. If the move is possible the
    // column coordinate is updated. Return whether the move was possible.
    moveRight() {
        if (!this.isValidPosition(this.col + 1, this.row, this.rotation)) {
            return false;
        }

        // Position was valid update the column
        this.col += 1;
        return true;
    }

    // Move the block to the left if possible. If the move is possible the
    // column coordinate is updated. Return whether the move was possible.
    moveLeft() {
        if (!this.isValidPosition(this.col - 1, this.row, this.rotation)) {
            return false;
        }

        // Position was valid update the column
        this.col -= 1;
        return true;
    }

    // Move the block downwards if possible. If the move is possible the
    // row coordinate is updated. Return whether the move was possible.
    moveDown() {
        if (!this.isValidPosition(this.col, this.row + 1, this.rotation)) {
            return false;
        }

        // Position was valid update the row
        this.row += 1;
        return true;
    }

    // Rotate the block if possible. If the rotation is possible the rotation is
    // updated. Return whether the rotation was possible.
    rotate() {
        // Check if the rotated block is in a valid position
        if (!this.isValidPosition(this.col, this.row, this.rotation + 1)) {
            return false;
        }

        this.rotation += 1;
        return true;
    }

    // Drop the block straight down to a lockable position
    dropDown() {
        while (this.isValidPosition(this.col, this.row + 1)) {
            this.row += 1;
        }
    }

    // Return whether the block is in a lockable position
    isLockable() {
        let lockable = !this.isValidPosition(this.col, this.row + 1);
        console.log(`Lockable: ${lockable}`);
        return lockable;
        //return !this.isValidPosition(this.col, this.row + 1)
    }

    // Lock the position of the block. Assumes that the block is in a lockable
    // position.
    lockPosition() {
        let coords = this.block.getCoordsRelative(this.col, this.row, this.rotation);
        for (let c of coords) {
            this._setCell(c.col, c.row, 1);
        }
    }

    collapse() {
        // Holds the cells that remain after the collapsable rows have been
        // removed
        let remaining = [];

        // To holds the indices of the rows that where collapsed
        let removed = [];
        for (let r = 0; r < this.rows; r++) {
            let row = this.cells.slice(r * this.columns, (r + 1) * this.columns);
            if (row.reduce((acc, v) => {
                return acc + v;
            }, 0) != this.columns) {
                // This row cannot be collapsed
                remaining = remaining.concat(row);
            } else {
                // This one can
                removed.push(Math.floor(r / this.columns));
            }
        }

        this.cells = remaining;
        return removed;
    }

    update(ts) {
        if (this.ts === undefined) {
            // This is the first iteration
            this.ts = ts;
            return 0;
        }

        let dt = ts - this.ts;
        if (dt < this.dropDelay) {
            // It's not time to update yet
            return 0;
        }

        console.log(`dt: ${dt}`);
        this.ts = ts;
        return Math.floor(dt / this.dropDelay);
    }

    advance(ts) {
        let n = this.update(ts);
        if (n == 0) {
            return;
        }

        console.log(`N: ${n}\tRow/Col: ${this.row}/${this.col}`)

        if (!this.moveDown()) {
            this.lockPosition();
            this.collapse();
            this.block = this.nextBlock();
            return;
        }
    }
};

// Rendering

class TetrisView {
    constructor(canvas, model) {
        this.ctx = canvas.getContext('2d');

        // TODO compensate if the width and height can't fit the model properly
        this.width = canvas.width;
        this.height = canvas.height;
        this.borderThickness = 1;

        let maxBlockWidth = (this.width - 2 * this.borderThickness) / model.columns;
        let maxBlockHeight = (this.height - 2 * this.borderThickness) / model.rows;

        this.blockSize = Math.floor(Math.min(maxBlockWidth, maxBlockHeight));
        this.blocksWidth = this.blockSize * model.columns;
        this.blocksHeight = this.blockSize * model.rows;

        this.borderWidth = 2 * this.borderThickness + this.blocksWidth;
        this.borderHeight = 2 * this.borderThickness + this.blocksHeight;

        this.xCanvasOffset = Math.floor((this.width - this.borderWidth) / 2);
        this.yCanvasOffset = Math.floor((this.height - this.borderHeight) / 2);

        this.xBlockOffset = Math.floor((canvas.width - (this.borderThickness + this.blocksWidth)) / 2);
        this.yBlockOffset = Math.floor((canvas.height - (this.borderThickness + this.blocksHeight)) / 2);

        this.model = model;
    }

    clear() {
        let xOrigin = this.xCanvasOffset;
        let yOrigin = this.yCanvasOffset;
        let s = this.borderThickness;

        // ctx.fillStyle = 'rbga(255, 255, 255, 0.3)';
        this.ctx.fillStyle = 'rbga(255, 255, 255, 1.0)';
        this.ctx.fillRect(xOrigin, yOrigin, this.borderWidth, this.borderHeight);

        this.ctx.strokeStyle = 'red';
        this.ctx.strokeRect(0, 0, this.width, this.height);
        this.ctx.strokeStyle = 'black';
        this.ctx.strokeRect(xOrigin, yOrigin, this.borderWidth, this.borderHeight);
    };

    drawBlock(x, y, color) {
        let xOrigin = this.xBlockOffset + x * this.blockSize;
        let yOrigin = this.yBlockOffset + y * this.blockSize;
        let s = this.blockSize;

        this.ctx.beginPath()
        this.ctx.moveTo(xOrigin, yOrigin);
        this.ctx.lineTo(xOrigin + s, yOrigin); // top
        this.ctx.lineTo(xOrigin + s, yOrigin + s); // right
        this.ctx.lineTo(xOrigin, yOrigin + s); // bottom
        //ctx.lineTo(originX, originY); // left
        this.ctx.closePath();

        this.ctx.fillStyle = color;
        this.ctx.fill();

        this.ctx.strokeStyle = 'black';
        this.ctx.strokeRect(xOrigin, yOrigin, s, s);
    }

    draw() {
        this.clear();

        for (let c = 0; c < this.model.columns; c++) {
            for (let r = 0; r < this.model.rows; r++) {
                let color = this.model.getCell(c, r) > 0 ? 'rgba(255, 0, 0, 1.0)' : 'rgba(255, 255, 255, 1.0)';
                this.drawBlock(c, r, color);
            }
        }
    };
}

let model;
let view;
let clock = 0;

function gameLoop() {
    //let ts = performance.now();
    let ts = clock;
    model.advance(ts);

    view.draw();
    //window.requestAnimationFrame(gameLoop);
    clock += 1000;
}

function init() {
    let canvas = document.getElementById("blocks-canvas");
    let ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 800;
    let columns = 10;
    let rows = 20;
    model = new TetrisModel(columns, rows, [new Block1()])
    view = new TetrisView(canvas, model);

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                model.moveLeft();
                break;
            case 'ArrowRight':
                model.moveRight();
                break;
            case 'Space':
                model.dropDown();
                break
        }
    });

    //gameLoop();
    //window.setInterval(gameLoop, 1000);
    document.getElementById("button").onclick = gameLoop;
}