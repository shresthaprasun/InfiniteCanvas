import { IPixelInfo, IPixelsInGridInfo } from "../../interfaces";
import { IBox } from "./interfaces";
import { Point } from "./utilities";

export class CacheManager {
    private cacheData: Map<string, Map<string, string>>;

    constructor() {
        this.cacheData = new Map();
    }

    public savePixelArray(gridId: string, pixelArray: IPixelInfo[]): void {
        let pixelMap = this.cacheData.get(gridId);
        if (!pixelMap) {
            pixelMap = new Map<string, string>();
            this.cacheData.set(gridId, pixelMap);
        }
        for (const pixel of pixelArray) {
            pixelMap.set(`${pixel.x}_${pixel.y}`, pixel.rgba);
        }
    }

    public fetchSubBoxOfGrid(gridId: string, box: IBox): IPixelsInGridInfo {
        //two methods to get data
        //loop through all possible values in box and check if it is in map
        //get all values of grid and check if they lies in box in the box
        const pixelArray: IPixelInfo[] = []
        const pixelMap = this.cacheData.get(gridId);
        if (pixelMap && pixelMap.size > 0) {
            pixelMap.forEach((color, x_y) => {
                const xy = x_y.split("_").map(s => parseInt(s, 10));
                if (box.containsPoint(new Point(xy[0], xy[1]))) {
                    pixelArray.push({ x: xy[0], y: xy[1], rgba: color })
                }
            })
        }
        return { gridId, pixelArray };
    }

    public fetchImageDataOfSubBoxInGrid(gridId: string, box: IBox): ImageData | undefined {
        //two methods to get data
        //loop through all possible values in box and check if it is in map
        //get all values of grid and check if they lies in box in the box

        const buffer: number[] = [];
        const gridData = this.cacheData.get(gridId);
        let dataAdded = false;
        if (gridData) {
            for (let indexY = box.min.y; indexY < box.max.y; ++indexY) {
                for (let indexX = box.min.x; indexX < box.max.x; ++indexX) {
                    const rgba = gridData.get(`${indexX}_${indexY}`);
                    if (rgba) {
                        const rgba_int = rgba.split(",").map((i) => parseInt(i, 10))
                        buffer.push(rgba_int[0], rgba_int[1], rgba_int[2], rgba_int[3])
                        dataAdded = true;
                    }
                    else {
                        buffer.push(0, 0, 0, 0);
                    }
                }
            }
        }

        if (dataAdded && buffer.length > 0) {
            const clampedArray = new Uint8ClampedArray(buffer);
            const imagedata = new ImageData(clampedArray, box.max.x - box.min.x, box.max.y - box.min.y);
            return imagedata;
        }
        return undefined;
    }

    public deleteGridData(gridId: string): void {
        const map = this.cacheData.get(gridId);
        map && map.clear();
        this.cacheData.delete(gridId);
    }
}