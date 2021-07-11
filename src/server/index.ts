import * as express from "express";
import { createServer } from "http";
import { connect, model, Schema } from "mongoose";
import { Server, Socket } from "socket.io";

const app: express.Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static("public"));

connect('mongodb://mongo:27017/infinitecanvas', { useNewUrlParser: true })
.then(() => console.log('MongoDB conncted'))
.catch(err => console.log(err));

import { PixelInfo } from "./models/pixelinfo";

//   const PixelInfoSchema = new Schema({
//     x: {
//         type: Number,
//         required: true
//     },
//     y: {
//         type: Number,
//         required: true
//     },
//     rgba: {
//         type: Buffer,
//         required: true
//     }
// })
// const PixelInfo = model('pixelInfo', PixelInfoSchema);

io.on("connect", (socket: Socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('uploadPixelInfo', (xBatch: number[], yBatch: number[], colorBatch: Int8Array[]) => {
    socket.broadcast.emit('pixelEditted', { 'x': xBatch, 'y': yBatch, 'color': colorBatch })
    for (let i = 0; i < xBatch.length; ++i) {
      if (colorBatch[i][3] != 0) {
        const pixelInfo = new PixelInfo({ x: xBatch[i], y: yBatch[i], rgba: colorBatch[i] })
        pixelInfo.save()
      }
    }
  });
  socket.on("fetchPixelsInsideBox", async (topLeftX: number, topLeftY: number, bottomRightX: number, bottomRightY: number) => {
    const panPixels = await PixelInfo.find({ x: { $gte: topLeftX, $lte: bottomRightX }, y: { $gte: topLeftY, $lte: bottomRightY } })
    const xBatch = panPixels.map((pixel) => pixel["x"]);
    const yBatch = panPixels.map((pixel) => pixel["y"]);
    const colorBatch = panPixels.map((pixel) => pixel["rgba"]);
    socket.emit('pixelsForPan', { 'x': xBatch, 'y': yBatch, 'color': colorBatch });
  });
});

httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});