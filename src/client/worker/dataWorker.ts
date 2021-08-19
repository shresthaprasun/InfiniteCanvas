// worker.js

import { IPixelInfo, IPixelsInGridInfo } from "../../interfaces";
import { CacheManager } from "../viewer/cache-manager";
import { IBox, WorkerMessageType } from "../viewer/interfaces";
import { Box, Point } from "../viewer/utilities";

// We alias self to ctx and give it our newly created type
const ctx: Worker = self as any;
//responsible for socketIO and cache manager
class DataHandler {

    private cacheManager: CacheManager;

    constructor() {
        this.cacheManager = new CacheManager();
    }

    public savePixelArray(gridId: string, pixelArray: IPixelInfo[]): void {
        this.cacheManager.savePixelArray(gridId, pixelArray);
    }

    public fetchSubBoxOfGrid(gridId: string, box: IBox): IPixelsInGridInfo {
        return this.cacheManager.fetchSubBoxOfGrid(gridId, box);
    }

    public fetchImageDataOfSubBoxInGrid(gridId: string, box: IBox): ImageData {
        return this.cacheManager.fetchImageDataOfSubBoxInGrid(gridId, box);
    }

    public deleteGridData(gridId: string) {
        this.cacheManager.deleteGridData(gridId);
    }
}

// Setup a new prime sieve once on instancation
const dataHandler = new DataHandler();

// We send a message back to the main thread
ctx.addEventListener("message", (event) => {

    // Get the limit from the event data
    const workerMessageType = event.data.type as WorkerMessageType;
    switch (workerMessageType) {
        case WorkerMessageType.SAVE_PIXEL_ARRAY:
            dataHandler.savePixelArray(event.data.gridId, event.data.pixelArray);
            break;
        case WorkerMessageType.FETCH_SUBBOX_OF_GRID:
            const data = dataHandler.fetchSubBoxOfGrid(event.data.gridId, new Box(new Point(event.data.box._min._x, event.data.box._min._y), new Point(event.data.box._max._x, event.data.box._max._y)));

            if (data.pixelArray.length > 0) {
                ctx.postMessage({ type: WorkerMessageType.SUB_BOX_DATA, data });
            }
            break;
        case WorkerMessageType.FETCH_IMAGE_DATA_OF_SUBBOX:
            const subBox = new Box(new Point(event.data.box._min._x, event.data.box._min._y), new Point(event.data.box._max._x, event.data.box._max._y));
            const imagedata = dataHandler.fetchImageDataOfSubBoxInGrid(event.data.gridId, subBox);
            if (imagedata) {
                console.log("putting image,", subBox);
            }
            ctx.postMessage({ type: WorkerMessageType.SUB_BOX_IMAGE, imagedata, dx: subBox.min.x, dy: subBox.min.y });
            break;
        case WorkerMessageType.DELETE_GRID_DATA:
            dataHandler.deleteGridData(event.data.gridId);
            break;
    }

});