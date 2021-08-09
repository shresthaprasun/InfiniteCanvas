export interface IPixelInfo {
    x: number;
    y: number;
    rgba: Int8Array;
}

export interface IPixelsInGridInfo {
    gridId: string;
    pixelArray: IPixelInfo[];
}

export interface IBoxInGridToFetch {
    gridId: string;
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}