class Coord {
    constructor(col, row) {
        this.col = col;
        this.row = row;
    }
}

class Block {
    constructor(coords) {
        this.coords = coords;
    }

    getCoords() {
        return this.coords;
    }

    rotate(q) {
        let theta = q * Math.PI / 2;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        return this.coords.map((c) => new Coord(
            Math.round(c.col * cosTheta - c.row * sinTheta),
            Math.round(c.col * sinTheta + c.row * cosTheta)
        ));
    }
}

class Block1 extends Block {
    // A T shape
    constructor() {
        super([new Coord(0, -1), new Coord(-1, 0), new Coord(0, 0), new Coord(1, 0)]);
    }
}

class BlockL1 extends Block {
    // An L shape
    constructor() {
        super([new Coord(0, -2), new Coord(0, -1), new Coord(0, 0), new Coord(1, 0)]);
    }
}

class BlockL2 extends Block {
    // An inverted L shape
    constructor() {
        super([new Coord(0, -2), new Coord(0, -1), new Coord(-1, 0), new Coord(0, 0)]);
    }
}

class BlockA1 extends Block {
    // An angle shape
    constructor() {
        super([new Coord(0, -1), new Coord(0, 0), new Coord(1, 0)]);
    }
}

class BlockA2 extends Block {
    // An inverted angle shape
    constructor() {
        super([new Coord(0, -1), new Coord(-1, 0), new Coord(0, 0)]);
    }
}

class BlockI extends Block {
    // An I shape
    constructor() {
        super([new Coord(0, -2), new Coord(0, -1), new Coord(0, 0), new Coord(0, 1)]);
    }
}

class BlockS extends Block {
    // A square shape
    constructor() {
        super([new Coord(0, -1), new Coord(1, -1), new Coord(0, 0), new Coord(1, 0)]);
    }

    rotate() {
        return this.coords.map((c) => new Coord(c.col, c.row));
    }
}

class BlockModel {
    constructor(block) {
        this.block = block;
        this.coords = block.coords.map((c) => new Coord(c.col, c.row));
    }

    rotate(q) {
        return this.block.rotate(q);
    }

    // Get the block's current coordinates
    getCoordsRelative(col, row, rot) {
        //return this.rotate(rot).map((c) => new Coord(c.col + col, c.row + row));

        let rotated = this.block.rotate(rot);
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

        // An array of block shapes
        this.blockShapes = blockShapes;

        this.reset();
    }

    reset() {
        // The game surface cells indexed by row and then column
        this.cells = this._createCells(this.columns, this.rows);

        // The current column index of the block
        this.col = Math.floor(this.columns / 2);

        // The current row index of the block
        this.row = 0;

        // The current rotation of the block
        this.rotation = 0;

        // The current block type index
        this.blockTypeIndex = 0;

        // A model of the current block
        this.block = this.nextBlock();

        // The delay between each drop in milliseconds
        this.dropDelay = 1000;

        // Indicates whether to skip the delay, applicable when blocks are
        // dropped
        this.skipDelay = false;

        // Indicates whether the game has reached it end state
        this.gameOver = false;
    }

    getNbrShapes() {
        return this.blockShapes.length;
    }

    _createCells(cols, rows) {
        let cells = new Array(rows);
        for (let r = 0; r < rows; r++) {
            cells[r] = new Array(cols).fill(0);
        }

        return cells;
    }

    // Get a cell on the game surface disregarding the current block
    _getCell(col, row) {
        //return this.cells[col * this.columns + row];
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return 0;
        }

        return this.cells[row][col];
    }

    // Get the cell color
    getCellColor(col, row) {
        // Return whether the current block is occupying the cell or not
        if (this.block.getCoordsRelative(this.col, this.row, this.rotation).some((c) => c.col == col && c.row == row)) {
            let color = this.blockTypeIndex + 1;
            return color;
        }

        return this._getCell(col, row);
    }

    // Set a cell on the surface
    _setCell(col, row, v) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return false;
        }

        this.cells[row][col] = v;
        return true;
    }

    // Populate the block model with a new block chosen at random and reset the
    // current block row and column position
    nextBlock() {
        this.col = this.columns / 2;
        this.row = 0;
        this.blockTypeIndex = Math.floor(Math.random() * this.blockShapes.length);

        return new BlockModel(this.blockShapes[this.blockTypeIndex], this.col, this.row);
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
        while (this.isValidPosition(this.col, this.row + 1, this.rotation)) {
            this.row += 1;
        }

        this.setSkipDelay(true);
    }

    // Return whether the block is in a lockable position
    isLockable() {
        let lockable = !this.isValidPosition(this.col, this.row + 1);
        return lockable;
        //return !this.isValidPosition(this.col, this.row + 1)
    }

    // Lock the position of the block. Assumes that the block is in a lockable
    // position.
    lockPosition() {
        let coords = this.block.getCoordsRelative(this.col, this.row, this.rotation);
        for (let c of coords) {
            if (!this._setCell(c.col, c.row, this.blockTypeIndex + 1)) {
                this.setGameOver();
            }
        }
    }

    collapse() {
        let kept = []
        let removed = [];
        for (let r = 0; r < this.rows; r++) {
            if (this.cells[r].reduce((acc, v) => acc + (v > 0 ? 1 : 0), 0) == this.columns) {
                removed.push(r);
            } else {
                kept.push(this.cells[r]);
            }
        }

        for (let i = 0; i < removed.length; i++) {
            kept.unshift(new Array(this.columns).fill(0));
        }

        this.cells = kept;

        return removed
    }

    update(ts) {
        if (this.ts === undefined) {
            // This is the first iteration
            this.ts = ts;
            return 0;
        }

        if (this.isSkipDelay()) {
            this.setSkipDelay(false);
            this.ts = ts;
            return 1;
        }

        let dt = ts - this.ts;
        if (dt < this.dropDelay) {
            // It's not time to update yet
            return 0;
        }

        this.ts = ts;
        return Math.floor(dt / this.dropDelay);
    }

    setSkipDelay(skip) {
        this.skipDelay = skip;
    }

    isSkipDelay() {
        return this.skipDelay;
    }

    setGameOver() {
        this.gameOver = true;
    }

    isGameOver() {
        return this.gameOver;
    }

    advance(ts) {
        let collapsed = [];

        if (this.isGameOver()) {
            console.log("Game over!");
            return collapsed;
        }

        let n = this.update(ts);
        if (n == 0) {
            return collapsed;
        }

        if (!this.moveDown()) {
            this.lockPosition();
            collapsed = this.collapse();
            this.block = this.nextBlock();
        }

        return collapsed;
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

        this.palette = this.generatePalette('rgba(255, 255, 255, 1.0)', model.getNbrShapes());
    }

    generatePalette(emptyColor, nColors) {
        let colors = [emptyColor];

        for (let n = 0; n < nColors; n++) {
            //let h = Math.random();
            let h = n / nColors;
            let s = 0.5;
            let v = 0.95;

            let h_i = Math.floor((h * 6));
            let f = h * 6 - h_i;
            let p = v * (1 - s);
            let q = v * (1 - f * s);
            let t = v * (1 - (1 - f) * s);

            v = Math.floor(256 * v);
            t = Math.floor(256 * t);
            p = Math.floor(256 * p);
            q = Math.floor(256 * q);

            switch (h_i) {
                case 0:
                    colors.push(`rgba(${v}, ${t}, ${p}, 1.0)`);
                    break;
                case 1:
                    colors.push(`rgba(${q}, ${v}, ${p}, 1.0)`);
                    break;
                case 2:
                    colors.push(`rgba(${p}, ${v}, ${t}, 1.0)`);
                    break;
                case 3:
                    colors.push(`rgba(${p}, ${q}, ${v}, 1.0)`);
                    break;
                case 4:
                    colors.push(`rgba(${t}, ${p}, ${v}, 1.0)`);
                    break;
                case 5:
                    colors.push(`rgba(${v}, ${p}, ${q}, 1.0)`);
                    break;
            }
        }

        return colors;
    }

    clear() {
        let xOrigin = this.xCanvasOffset;
        let yOrigin = this.yCanvasOffset;
        let s = this.borderThickness;

        //this.ctx.fillStyle = 'rbga(255, 255, 255, 0.3)';
        //this.ctx.fillStyle = 'rbga(255, 255, 255, 1.0)';
        //this.ctx.fillRect(xOrigin, yOrigin, this.borderWidth, this.borderHeight);

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
                let colorIndex = this.model.getCellColor(c, r);
                let color = this.palette[colorIndex];
                this.drawBlock(c, r, color);
            }
        }
    };
}

let model;
let view;
let clock = 0;

function gameLoop() {
    let ts = performance.now();
    //let ts = clock;
    model.advance(ts);

    view.draw();
    window.requestAnimationFrame(gameLoop);
    //clock += 1000;
}

function init() {
    let canvas = document.getElementById("blocks-canvas");
    let ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 800;
    let columns = 10;
    let rows = 20;
    model = new TetrisModel(columns, rows, [new Block1(), new BlockL1(), new BlockL2(), new BlockA1(), new BlockA2(), new BlockI(), new BlockS()])
    view = new TetrisView(canvas, model);

    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                model.moveLeft();
                break;
            case 'ArrowRight':
                model.moveRight();
                break;
            case 'ArrowUp':
                model.rotate();
                break;
            case ' ':
                model.dropDown();
                break
        }
    });

    gameLoop();
    //window.setInterval(gameLoop, 1000);
    //document.getElementById("button").onclick = gameLoop;
}