import { IBox, IPoint } from "./interfaces";

export class Point implements IPoint {
    private _x: number;
    private _y: number;
    public get x(): number { return this._x; }
    public get y(): number { return this._y; }

    constructor(x?: number, y?: number) {
        this._x = x | 0;
        this._y = y | 0;
    }

    public negate(): IPoint {
        return new Point(-this._x, -this._y);
    }

    public copy(point: IPoint): void {
        this._x = point.x;
        this._y = point.y;
    }

    public set(x: number, y: number): void {
        this._x = x;
        this._y = y;
    }

    public clone(): IPoint {
        return new Point(this._x, this._y);
    }

    public add(point: IPoint): void {
        this._x += point.x;
        this._y += point.y;
    }

    public equals(point: IPoint): boolean {
        if (this._x === point.x && this._y === point.y) {
            return true;
        }
        return false;
    }

    public translate(point: IPoint): IPoint {
        this._x += point.x;
        this._y += point.y;
        return this;
    }
}

export class Box implements IBox {
    private _min: IPoint;
    private _max: IPoint;

    public get min(): IPoint { return this._min }
    public get max(): IPoint { return this._max }

    public get Id(): string { return `${this._min.x}_${this._min.y}` }

    constructor(min?: IPoint, max?: IPoint) {
        this._min = new Point();
        this._max = new Point();
        this.empty();
        min && this._min.copy(min);
        max && this._max.copy(max);
        if (!this.isEmpty()) {
            this.validateBox();
        }
    }

    public expandByScalar(offset: number): IBox {
        this._min.set(this._min.x - offset, this._min.y - offset);
        this._max.set(this._max.x + offset, this._max.y + offset);
        return this;
    }

    public clone(): IBox {
        return new Box(this._min, this._max);
    }

    private validateBox() {
        if (this._min.x > this._max.x) {
            const temp = this._min.x;
            this._min.set(this.max.x, this.min.y);
            this._max.set(temp, this.max.y);
        }
        if (this._min.y > this._max.y) {
            const temp = this._min.y;
            this._min.set(this.min.x, this.max.y);
            this._max.set(this.max.x, temp);
        }
    }

    public isEmpty(): boolean {
        let isEmpty = true;
        if (this._min.x !== Number.MAX_SAFE_INTEGER || this._min.y !== Number.MAX_SAFE_INTEGER) {
            isEmpty = false;
        }
        if (this._max.x !== Number.MAX_SAFE_INTEGER || this._max.y !== Number.MAX_SAFE_INTEGER) {
            isEmpty = false;
        }

        if (!isEmpty) {
            if (this._max.x - this._min.x === 0 || this._max.y - this._min.y === 0) {
                isEmpty = true;
            }
        }
        return isEmpty;
    }

    private empty() {
        this._min.set(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        this._max.set(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    }

    public copy(box: IBox): IBox {
        this._max.copy(box.max);
        this._min.copy(box.min);
        return this;
    }

    public contains(box: IBox): boolean {
        if (this._min.x <= box.min.x && this._max.x >= box.max.x && this._min.y <= box.min.y && this._max.y >= box.max.y) {
            return true;
        }
        return false;
    }

    public intersects(box: IBox): boolean {
        if (this._min.x > box.max.x || this._max.x < box.min.x || this._min.y > box.max.y || this.max.y < box.min.y) {
            return false;
        }
        return true;
    }

    /**
     * this box - the provided box
     * @param box 
     * @returns list of smaller boxes 
     */
    public subtract(box: IBox): IBox[] {
        const result: IBox[] = [];
        if (!this.intersects(box)) {
            return result;
        }
        let minXOffset = box.min.x - this._min.x;
        if (minXOffset > 0) {
            result.push(new Box(new Point(this._min.x, this._min.y), new Point(this._min.x + minXOffset, this._max.y)));
        }
        let maxXOffset = this._max.x - box.max.x;
        if (maxXOffset > 0) {
            result.push(new Box(new Point(this._max.x - maxXOffset, this._min.y), new Point(this._max.x, this._max.y)));
        }
        const minYOffset = box.min.y - this._min.y;
        const maxYOffset = this._max.y - box.max.y;

        minXOffset = minXOffset > 0 ? minXOffset : 0;
        maxXOffset = maxXOffset > 0 ? maxXOffset : 0;

        if (minYOffset > 0) {
            result.push(new Box(new Point(this._min.x + minXOffset, this._min.y), new Point(this._max.x - maxXOffset, this._min.y + minYOffset)));
        }

        if (maxYOffset > 0) {
            result.push(new Box(new Point(this._min.x + minXOffset, this._max.y - maxYOffset), new Point(this._max.x - maxXOffset, this._max.y)));
        }

        return result;
    }

    public intersect(box: IBox): IBox | undefined {
        if (this.contains(box)) {
            return box;
        }
        if (box.contains(this)) {
            return this;
        }
        if (this.intersects(box)) {
            const minX = this._min.x > box.min.x ? this._min.x : box.min.x;
            const minY = this._min.y > box.min.y ? this._min.y : box.min.y;;
            const maxX = this._max.x < box.max.x ? this._max.x : box.max.x;
            const maxY = this._max.y < box.max.y ? this._max.y : box.max.y;
            return new Box(new Point(minX, minY), new Point(maxX, maxY));
        }
        return undefined;
    }

    public translate(point: IPoint): IBox {
        this._min.add(point);
        this._max.add(point);
        return this;
    }


    public containsPoint(point: IPoint): boolean {
        if (point.x <= this._max.x && point.x >= this._min.x && point.y <= this._max.y && point.y >= this._min.y) {
            return true;
        }
        return false;
    }


    public equals(box: IBox): boolean {
        if (this._min.equals(box.min) && this._max.equals(box.max)) {
            return true;
        }
        return false;
    }

    //offset will be along x or y depending upon the slope
    public generateBoxesAlongDiagonal(offset: number, _tolerance: number, diagonalType: "minmax" | "other"): IBox[] {
        const resultBoxes: IBox[] = []

        let slope = 1;
        let prevX = 0;
        let prevY = 0;
        if (diagonalType === "minmax") {
            slope = (this._max.y - this._min.y) / (this._max.x - this._min.x);
            prevX = this._min.x;
            prevY = this._min.y;
        }
        else if (diagonalType === "other") {
            slope = (this._max.y - this._min.y) / (this._min.x - this._max.x);
            prevX = this._max.x;
            prevY = this._min.y;
        }

        if (slope >= 0) {
            if (slope < 1) { //+x +y
                let nextX = prevX;
                while (nextX < this._max.x) {
                    nextX = prevX + offset;
                    const dy = (nextX - prevX) * slope;
                    if (nextX > this._max.x) {//last part                        
                        resultBoxes.push(new Box(new Point(prevX, Math.floor(prevY)), this._max));
                    }
                    else {
                        resultBoxes.push(new Box(new Point(prevX, Math.floor(prevY)), new Point(nextX, Math.ceil(prevY + dy))));
                    }
                    prevX = nextX;
                    prevY = prevY + dy;
                }
            }
            else { //+y+x
                let nextY = prevY;
                while (nextY < this._max.y) {
                    nextY = prevY + offset;
                    const dx = (nextY - prevY) / slope;
                    if (nextY > this._max.y) {//last part                        
                        resultBoxes.push(new Box(new Point(Math.floor(prevX), prevY), this._max));
                    }
                    else {
                        resultBoxes.push(new Box(new Point(Math.floor(prevX), prevY), new Point(Math.ceil(prevX + dx), nextY,)));
                    }
                    prevX = prevX + dx;
                    prevY = nextY;
                }
            }
        }
        else {
            if (slope > -1) { //towards -x
                let nextX = prevX;
                while (nextX > this._min.x) {
                    nextX = prevX - offset;
                    const dy = (nextX - prevX) * slope;
                    if (nextX < this._min.x) {//last part                        
                        resultBoxes.push(new Box(new Point(this.min.x, Math.floor(prevY)), new Point(prevX, this.max.y)));
                    }
                    else {
                        resultBoxes.push(new Box(new Point(nextX, Math.floor(prevY)), new Point(prevX, Math.ceil(prevY + dy))));
                    }
                    prevX = nextX;
                    prevY = prevY + dy;
                }
            }
            else { // towards +y -x
                let nextY = prevY;
                while (nextY < this._max.y) {
                    nextY = prevY + offset;
                    const dx = (nextY - prevY) / slope;
                    if (nextY > this._max.y) {//last part                        
                        resultBoxes.push(new Box(new Point(this.min.x, prevY), new Point(Math.ceil(prevX), this.max.y)));
                    }
                    else {
                        resultBoxes.push(new Box(new Point(Math.floor(prevX + dx), prevY), new Point(Math.ceil(prevX), nextY)));
                    }
                    prevX = prevX + dx;
                    prevY = nextY;
                }
            }
        }
        return resultBoxes;
    }
}

export function bresenhamLine(point1: IPoint, point2: IPoint, thickness: number): IPoint[] {
    const result: IPoint[] = [];
    //https://www.youtube.com/watch?v=IDFB5CDpLDE&list=WL&index=24&t=399s
    let x1 = point1.x;
    let y1 = point1.y;
    let x2 = point2.x;
    let y2 = point2.y;
    const rise = y2 - y1;
    const run = x2 - x1;
    let i = 0;
    if (run === 0) {
        if (y2 < y1) {
            //swap
            const temp = y2;
            y2 = y1;
            y1 = temp;
        }
        for (i = y1 - thickness; i <= y2 + thickness; ++i) {
            for (let j = x1 - thickness; j <= x1 + thickness; ++j) { //rastering for thickness in either side
                result.push(new Point(j, i));
            }
        }
    }
    else {
        const m = rise / run;
        const adjust = m >= 0 ? 1 : -1;
        let offset = 0;
        let threshold = 0.5;
        if (m <= 1 && m >= -1) {
            const delta = Math.abs(m);
            let y = y1;
            if (x2 < x1) {
                const temp = x2;
                x2 = x1;
                x1 = temp;
                y = y2;
            }
            for (i = x1 - thickness; i <= x2 + thickness; ++i) {
                //setPixel (x1,y,color)
                for (let j = y - thickness; j <= y + thickness; ++j) {
                    result.push(new Point(i, j));
                }

                offset += delta;
                if (offset >= threshold) {
                    y += adjust;
                    threshold += 1;
                }

            }

        }
        else {
            const delta = Math.abs(run / rise);
            let x = x1;
            if (y2 < y1) {
                //swap
                const temp = y2;
                y2 = y1;
                y1 = temp;
                x = x2;
            }
            for (i = y1 - thickness; i <= y2 + thickness; ++i) {
                //setPixel (x1,y,color)
                for (let j = x - thickness; j <= x + thickness; ++j) {
                    result.push(new Point(j, i));
                }
                offset += delta;
                if (offset >= threshold) {
                    x += adjust;
                    threshold += 1;
                }
            }
        }
    }
    return result;
}