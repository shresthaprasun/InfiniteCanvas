import * as express from "express";
import { createServer } from "http";
import { connect } from "mongoose";
import { Server, Socket } from "socket.io";
import redis from "redis";
import { IBoxInGridToFetch, IPixelsInGridInfo } from "../interfaces";
import { GridData, PixelInfo } from "./models/pixelinfo";


const PORT: number = parseInt(process.env.PORT, 10) || 3000;
const MONGO_PORT: number = parseInt(process.env.MONGO_PORT, 10) || 27017;
const REDIS_PORT: number = parseInt(process.env.REDIS_PORT, 10) || 6379;

const app: express.Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// const redisClient = redis.createClient(REDIS_PORT, process.env.REDIS_HOST, );

app.use(express.static("public"));
app.use('/:anchorPoint', express.static("public"));

// app.get('/:anchorPoint', function (req, res) {
//   res.send(`Hello World ${req.params}`); // This will serve your request to '/'.
// });

connect(`mongodb://mongo:${MONGO_PORT}/infinitecanvas`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((show) => {
    console.log('MongoDB conncted');
  })
  .catch(err => console.log(err));


io.on("connect", (socket: Socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('uploadPixelInfo', async (pixelsInGrid: IPixelsInGridInfo) => {
    socket.broadcast.emit('pixelEditted', pixelsInGrid)
    //caching in redis - store

    for (let i = 0; i < pixelsInGrid.pixelArray.length; ++i) {
      const { x, y, rgba } = pixelsInGrid.pixelArray[i];
      const xy = `${x}_${y}`;
      // const color = rgba.toString();
      // console.log("uploading to redis", gridId, xy, rgba);


      // redisClient.hset(gridId, xy, rgba, (err, data) => {
      //   if (err) throw err;
      //   if (data != null) {
      //     // console.log("from redis", data);
      //   }
      // });
      // }

      // producer.send({
      //   topic: "UpdatePixel",
      //   messages: [{
      //     "value": JSON.stringify({ "gridId": gridId, "coord": `${xy}`, "color": rgba }),
      //     "partition": 0
      //   }]
      // });
    }  

    // for (let i = 0; i < pixelsInGrid.size; ++i) {
    //   if (pixelsInGrid.colorBatch[i][3] != 0) {
    //     const pixelInfo = new PixelInfo({ x: pixelsInGrid.xBatch[i], y: pixelsInGrid.yBatch[i], rgba: pixelsInGrid.colorBatch[i] })
    //     pixelInfo.save()
    //   }
    // }
  });

  socket.on("fetchPixelsInGridBox", (boxInGrid: IBoxInGridToFetch) => {//temp
    // const panPixels = await PixelInfo.find({ x: { $gte: topLeftX, $lte: bottomRightX }, y: { $gte: topLeftY, $lte: bottomRightY } })
    // const xBatch = panPixels.map((pixel) => pixel["x"]);
    // const yBatch = panPixels.map((pixel) => pixel["y"]);
    // const colorBatch = panPixels.map((pixel) => pixel["rgba"]);

    console.log("fetching", boxInGrid.gridId)
    // redisClient.hgetall(boxInGrid.gridId, (err, data) => {
    //   if (err) throw err;
    //   if (data != null) {
    //     console.log("pixelsInGrid", data)
    //     const pixelInGrid: IPixelsInGridInfo = { gridId: boxInGrid.gridId, pixelArray: [] };
    //     for (const key in data) {
    //       const xy = key.split("_");
    //       // const color: Uint8ClampedArray = new Uint8ClampedArray(data[key] as unknown as Uint8Array);// as unknown as Uint8Array;
    //       pixelInGrid.pixelArray.push({ x: parseInt(xy[0], 10), y: parseInt(xy[1], 10), rgba: data[key] })
    //     }
    //     console.log("pixelsInGrid", pixelInGrid)

    //     socket.emit('pixelsForPan', pixelInGrid);//as IPixelsInGridInfo
    //   }
    // });
  });

  socket.on("fetchGridBox", (gridId: string) => {//temp
    // const panPixels = await PixelInfo.find({ x: { $gte: topLeftX, $lte: bottomRightX }, y: { $gte: topLeftY, $lte: bottomRightY } })
    // const xBatch = panPixels.map((pixel) => pixel["x"]);
    // const yBatch = panPixels.map((pixel) => pixel["y"]);
    // const colorBatch = panPixels.map((pixel) => pixel["rgba"]);

    
    // redisClient.hgetall(boxInGrid.gridId, (err, data) => {
    //   if (err) throw err;
    //   if (data != null) {
    //     console.log("pixelsInGrid", data)
    //     const pixelInGrid: IPixelsInGridInfo = { gridId: boxInGrid.gridId, pixelArray: [] };
    //     for (const key in data) {
    //       const xy = key.split("_");
    //       // const color: Uint8ClampedArray = new Uint8ClampedArray(data[key] as unknown as Uint8Array);// as unknown as Uint8Array;
    //       pixelInGrid.pixelArray.push({ x: parseInt(xy[0], 10), y: parseInt(xy[1], 10), rgba: data[key] })
    //     }
    //     console.log("pixelsInGrid", pixelInGrid)

    //     socket.emit('pixelsForPan', pixelInGrid);//as IPixelsInGridInfo
    //   }
    // });
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});