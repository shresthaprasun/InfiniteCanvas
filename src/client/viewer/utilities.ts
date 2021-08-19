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

    public clone(): IBox {
        return new Box(this._min, this._max);
    }

    private validateBox() {
        if (this._min.x > this._max.x) {
            this._min.set(this.max.x, this.min.y);
            this._max.set(this.min.x, this.max.y);
        }
        if (this._min.y > this._max.y) {
            this._min.set(this.min.x, this.max.y);
            this._max.set(this.max.x, this.min.y);
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

    public copy(box: IBox): void {
        this._max.copy(box.max);
        this._min.copy(box.min);
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

    public translate(point: IPoint): void {
        this._min.add(point);
        this._max.add(point);
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

}