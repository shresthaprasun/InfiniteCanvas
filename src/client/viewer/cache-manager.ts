import { IPixelInfo, IPixelsInGridInfo } from "../../interfaces";
import { IBox } from "./interfaces";
import { Point } from "./utilities";

export class CacheManager {
    private cacheData: Map<string, Map<string, string>>; //Map<gridId<Map<x_y,color>>

    constructor() {
        this.cacheData = new Map();
    }

    public save() {

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

    public deleteGridData(gridId: string): void {
        const map = this.cacheData.get(gridId);
        map && map.clear();
        this.cacheData.delete(gridId);
    }
}