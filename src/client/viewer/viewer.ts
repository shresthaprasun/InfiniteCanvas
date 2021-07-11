import { io, Socket } from "socket.io-client";

interface IPoint {
    x: number;
    y: number;
}

interface IBox {
    topLeft: IPoint; //min
    bottomRight: IPoint; //max
}

export class Viewer {
    private socket: Socket;

    constructor() {
        this.socket = io();
    }

    init(parent: HTMLElement): void {
        const canvas = document.createElement("canvas");
        canvas.setAttribute("touch-action", "none");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.width = 1280;
        canvas.height = 800;
        // canvas.style.width = "100%";
        // canvas.style.height = "100%";
        canvas.style.border = "1px solid black";
        canvas.style.touchAction = "none";
        parent.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        if (!ctx) { return; }
        ctx.lineWidth = 10;

        let isprimaryPointerDown = false;
        let isSecondaryPointerDown = false;

        let panStart: IPoint = { x: 0, y: 0 };
        let moveTo: IPoint = { x: 0, y: 0 };
        let topleft: IPoint = { x: 0, y: 0 };
        let lod: number = 0;

        // const socket = SocketIO.io();
        // socket.on("connect", function (): void {
        //     socket.emit("connect", { data: "connected to the SocketServer..." });
        // });

        canvas.oncontextmenu = (event: MouseEvent): void => {
            event.preventDefault();
        };


        canvas.addEventListener("pointerdown", (event: PointerEvent): void => {
            if (event.button === 0 && event.buttons === 1) {
                ctx.beginPath();
                ctx.moveTo(event.pageX, event.pageY);
                moveTo.x = Math.abs(event.pageX);
                moveTo.y = Math.abs(event.pageY);
                isprimaryPointerDown = true;
            }
            else if (event.button === 2 && event.buttons === 2) {
                isSecondaryPointerDown = true;
                panStart.x = Math.floor(event.pageX);
                panStart.y = Math.floor(event.pageY);
            }
        });

        canvas.addEventListener("pointerenter", (event: PointerEvent): void => {
            //https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events#determining_the_primary_pointer
            
            if (event.button === 0) {
                ctx.beginPath();
                ctx.moveTo(event.pageX, event.pageY);
                isprimaryPointerDown = true;
            }
            else if (event.button === 2) {
                isSecondaryPointerDown = true;

            }
        });

        canvas.addEventListener("pointermove", (event: PointerEvent): void => {
            if (isprimaryPointerDown) {
                ctx.lineTo(event.pageX, event.pageY);
                ctx.stroke();
                const xBatch:number[] = [];
                const yBatch:number[] = [];
                const colorBatch:Uint8ClampedArray[]= [];
                let minx = moveTo.x;
                let maxx = Math.floor(event.pageX);
                if (minx > maxx) {
                    minx = maxx;
                    maxx = moveTo.x;
                }
                let miny = moveTo.y;
                let maxy = Math.floor(event.pageY);
                if (miny > maxy) {
                    miny = maxy;
                    maxy = moveTo.y;
                }

                for (let i = minx - 10; i < maxx + 10; ++i) {
                    for (let j = miny - 10; j < maxy + 10; ++j) {
                        const pixel = ctx.getImageData(i, j, 1, 1);
                        if (pixel.data["3"] as number !== 0) {
                            xBatch.push(i + topleft.x);
                            yBatch.push(j + topleft.y);
                            colorBatch.push(pixel.data);
                        }
                    }
                }
                moveTo.x = Math.floor(event.pageX);
                moveTo.y = Math.floor(event.pageY);
                xBatch.length>0 && this.socket.emit("uploadPixelInfo", xBatch, yBatch, colorBatch);
            }
            if (isSecondaryPointerDown) {

                const pageX = Math.floor(event.pageX);
                const pageY = Math.floor(event.pageY);
                const diff: IPoint = { x: pageX - panStart.x, y: pageY - panStart.y };
                topleft.x -= diff.x;
                topleft.y -= diff.y;
                let panData: ImageData | undefined = undefined;
                let boxToBefetchedAlongWidth: IBox = { topLeft: { x: 0, y: 0 }, bottomRight: { x: 0, y: 0 } };
                let boxToBeFetchedAlongHeight: IBox = { topLeft: { x: 0, y: 0 }, bottomRight: { x: 0, y: 0 } };
                if (diff.x >= 0 && diff.y >= 0) { //moving towards bottom-right
                    panData = ctx.getImageData(0, 0, canvas.width - diff.x, canvas.height - diff.y);
                    if (diff.y >= 1) {
                        // boxToBefetchedAlongWidth = ctx.getImageData(0, canvas.height - diff.y, canvas.width, diff.y);
                        boxToBefetchedAlongWidth = { topLeft: topleft, bottomRight: { x: topleft.x + canvas.width, y: topleft.y + diff.y } };
                    }
                    if (diff.x >= 1) {
                        // boxToBeFetchedAlongHeight = ctx.getImageData(canvas.width - diff.x, 0, diff.x, canvas.height - diff.y);
                        boxToBeFetchedAlongHeight = { topLeft: { x: topleft.x, y: topleft.y + diff.y }, bottomRight: { x: topleft.x + diff.x, y: topleft.y + canvas.height } };

                    }
                    //logic is reverse but follows same principle
                    // _________________
                    // |   ________|_\_|___ panning and shifted out of canvas
                    // |  |        | \ |  |dataToSaveAlongHeight
                    // |  |        | \ |  |
                    // |__|________|_\_|  |
                    // |/_|/_/_/_/_/_/_|  |dataToSaveAlongWidth
                    //    |_______________|
                }
                else if (diff.x >= 0 && diff.y <= 0) { //moving towards top-right
                    panData = ctx.getImageData(0, 0 - diff.y, canvas.width - diff.x, canvas.height + diff.y);
                    if (diff.y <= -1) {
                        // boxToBefetchedAlongWidth = ctx.getImageData(0, 0, canvas.width, 0 - diff.y);
                        boxToBefetchedAlongWidth = { topLeft: { x: topleft.x, y: topleft.y + canvas.height + diff.y }, bottomRight: { x: topleft.x + canvas.width, y: topleft.y + canvas.height } };

                    }
                    if (diff.x >= 1) {
                        // boxToBeFetchedAlongHeight = ctx.getImageData(canvas.width - diff.x, diff.y, diff.x, canvas.height + diff.y);
                        boxToBeFetchedAlongHeight = { topLeft: topleft, bottomRight: { x: topleft.x + diff.x, y: topleft.y + canvas.height + diff.y } };
                    }
                }
                else if (diff.x <= 0 && diff.y <= 0) { //moving towards top-left
                    panData = ctx.getImageData(0 - diff.x, 0 - diff.y, canvas.width + diff.x, canvas.height + diff.y);
                    if (diff.y <= -1) {
                        // boxToBefetchedAlongWidth = ctx.getImageData(0, 0, canvas.width, 0 - diff.y);
                        boxToBefetchedAlongWidth = { topLeft: { x: topleft.x, y: topleft.y + canvas.height + diff.y }, bottomRight: { x: topleft.x + canvas.width, y: topleft.y + canvas.height } };

                    }
                    if (diff.x <= -1) {
                        // boxToBeFetchedAlongHeight = ctx.getImageData(0, 0 - diff.y, 0 - diff.x, canvas.height + diff.y);
                        boxToBeFetchedAlongHeight = { topLeft: { x: topleft.x + canvas.width + diff.x, y: topleft.y }, bottomRight: { x: topleft.x + canvas.width, y: topleft.y + canvas.height + diff.y } };

                    }
                }
                else if (diff.x <= 0 && diff.y >= 0) { //moving towards bottom-left
                    panData = ctx.getImageData(0 - diff.x, 0, canvas.width + diff.x, canvas.height - diff.y);
                    if (diff.y >= 1) {
                        // boxToBefetchedAlongWidth = ctx.getImageData(0, canvas.height - diff.y, canvas.width, diff.y);
                        boxToBefetchedAlongWidth = { topLeft: topleft, bottomRight: { x: topleft.x + canvas.width, y: topleft.y + diff.y } };

                    }
                    if (diff.x <= -1) {
                        // boxToBeFetchedAlongHeight = ctx.getImageData(0, 0, 0 - diff.x, canvas.height - diff.y);
                        boxToBeFetchedAlongHeight = { topLeft: { x: topleft.x + canvas.width + diff.x, y: topleft.y + diff.y }, bottomRight: { x: topleft.x + canvas.width, y: topleft.y + canvas.height } };

                    }
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                panData && ctx.putImageData(panData, diff.x > 0 ? diff.x : 0, diff.y > 0 ? diff.y : 0);

                const isBoxEmpty = (box: IBox): boolean => {
                    if ((box.bottomRight.x - box.topLeft.x === 0) || (box.bottomRight.y - box.topLeft.y === 0)) {
                        return true;
                    }
                    return false;
                };
                if (!isBoxEmpty(boxToBefetchedAlongWidth)) {
                    this.socket.emit("fetchPixelsInsideBox", boxToBefetchedAlongWidth.topLeft.x, boxToBefetchedAlongWidth.topLeft.y, boxToBefetchedAlongWidth.bottomRight.x, boxToBefetchedAlongWidth.bottomRight.y);
                }

                if (!isBoxEmpty(boxToBeFetchedAlongHeight)) {
                    this.socket.emit("fetchPixelsInsideBox", boxToBeFetchedAlongHeight.topLeft.x, boxToBeFetchedAlongHeight.topLeft.y, boxToBeFetchedAlongHeight.bottomRight.x, boxToBeFetchedAlongHeight.bottomRight.y);
                }
                panStart.x = pageX;
                panStart.y = pageY;
            }
            event.preventDefault();
        });

        canvas.addEventListener("pointerup", (event: PointerEvent): void => {
            if (event.button === 0) {
                isprimaryPointerDown = false;

            }
            else if (event.button === 2) {
                isSecondaryPointerDown = false;
            }
            event.preventDefault();
            event.stopImmediatePropagation();

        });

        canvas.addEventListener("pointerleave", (_event: PointerEvent): void => {
            isprimaryPointerDown = false;
            isSecondaryPointerDown = false;
        });

        this.socket.on("connect", () => {
            console.log(`Connected with socket id ${this.socket.id}`);
        });

        this.socket.on('pixelEditted', function (msg, cb) {
            if (msg && msg["x"] && msg["y"] && msg["color"]) {
                for (let i = 0; i < msg["x"].length; ++i) {
                    const imagedata = new ImageData(new Uint8ClampedArray(msg["color"][i]),1, 1);                    
                    ctx.putImageData(imagedata, msg["x"][i] - topleft.x, msg["y"][i]- topleft.y);
                }
            }
            if (cb) cb();
        });

        this.socket.on('pixelsForPan', function (msg, cb) {
            if (msg && msg["x"] && msg["y"] && msg["color"]) {
                for (let i = 0; i < msg["x"].length; ++i) {
                    const imagedata = new ImageData(new Uint8ClampedArray(msg["color"][i]),1, 1);                    
                    ctx.putImageData(imagedata, msg["x"][i] - topleft.x, msg["y"][i]- topleft.y);
                }
            }
            if (cb) cb();
        });

    }
}