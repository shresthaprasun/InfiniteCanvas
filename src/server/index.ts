import * as express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import redis from "redis";
import { IBoxInGridToFetch, IPixelsInGridInfo } from "../interfaces";
import { GridData } from "./models/griddata";
import { PixelInfo } from "./models/pixelinfo";


const PORT: number = parseInt(process.env.PORT, 10) || 3000;
const MONGO_PORT: number = parseInt(process.env.MONGO_PORT, 10) || 27017;
const REDIS_PORT: number = parseInt(process.env.REDIS_PORT, 10) || 6379;

const app: express.Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const redisClient = redis.createClient(REDIS_PORT, process.env.REDIS_HOST,);

app.use(express.static("public"));
app.use('/:anchorPoint', express.static("public"));

// app.get('/:anchorPoint', function (req, res) {
//   res.send(`Hello World ${req.params}`); // This will serve your request to '/'.
// });

mongoose.set('useFindAndModify', false);
mongoose.connect(`mongodb://mongo:${MONGO_PORT}/infinitecanvas`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((show) => {
    console.log('MongoDB connected');
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
    const pixelArrayForMongo: { xy: string, rgba: string }[] = [];
    for (let i = 0; i < pixelsInGrid.pixelArray.length; ++i) {
      const { x, y, rgba } = pixelsInGrid.pixelArray[i];
      const xy = `${x}_${y}`;
      pixelArrayForMongo.push({ xy, rgba });
      redisClient.hset(pixelsInGrid.gridId, xy, rgba, (err, data) => {
        if (err) throw err;
        if (data != null) {
          // console.log("from redis", data);
        }
      });
    }


    //mongodb
    try {
      let gridData = await GridData.findOne({ anchor: pixelsInGrid.gridId });//queue is needed
      if (gridData === null) {
        gridData = new GridData({ anchor: pixelsInGrid.gridId });
      }
      for (const pixel of pixelArrayForMongo) {
        const pixelInfo = await PixelInfo.findOneAndUpdate({ xy: pixel.xy}, { rgba: pixel.rgba }, { new: true, upsert: true});
        gridData['data'].push(pixelInfo._id);
      }
      gridData.save(function (err) {
        if (err) { console.error("Saving data in Mongo", err) }
      });
    }
    catch (err) {
      console.error("Mongo", err)
    }
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

  socket.on("fetchGridBox", async (gridId: string) => {
    console.log('fetchGridBox', gridId);
    redisClient.hgetall(gridId, async (err, data) => {
      if (err) {
        console.error(`error fetching from mongo ${err}`)
      }
      if (data != null) {
        const pixelInGrid: IPixelsInGridInfo = { gridId: gridId, pixelArray: [] };
        for (const key in data) {
          const xy = key.split("_");
          pixelInGrid.pixelArray.push({ x: parseInt(xy[0], 10), y: parseInt(xy[1], 10), rgba: data[key] })
        }
        socket.emit('pixelsForPan', pixelInGrid);//as IPixelsInGridInfo
      }
      else {
        const gridData = await GridData.findOne({ anchor: gridId });
        if (gridData != null) {
          const dataPromises = gridData.data.map(_id => { return PixelInfo.findOne({ _id }) });
          const pixelInfos = await Promise.all(dataPromises);
          const pixelInGrid: IPixelsInGridInfo = { gridId: gridId, pixelArray: [] };
          for (const pixel of pixelInfos) {
            const xy = pixel.xy.split("_");
            pixelInGrid.pixelArray.push({ x: parseInt(xy[0], 10), y: parseInt(xy[1], 10), rgba: pixel.rgba });
          }
          socket.emit('pixelsForPan', pixelInGrid);//as IPixelsInGridInfo
        }
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});