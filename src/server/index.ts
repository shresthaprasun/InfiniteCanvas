import * as express from "express";
import { createServer } from "http";
import { connect } from "mongoose";
import { Server, Socket } from "socket.io";
import redis from "redis";
import { IBoxInGridToFetch, IPixelsInGridInfo } from "../interfaces";

const PORT: number = parseInt(process.env.PORT, 10) || 3000;
const MONGO_PORT: number = parseInt(process.env.MONGO_PORT, 10) || 27017;
const REDIS_PORT: number = parseInt(process.env.REDIS_PORT, 10) || 6379;

const app: express.Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const redisClient = redis.createClient(REDIS_PORT, process.env.REDIS_HOST);

app.use(express.static("public"));

// app.get('/', function (req, res) {
//   res.send('Hello World!'); // This will serve your request to '/'.
// });

connect(`mongodb://mongo:${MONGO_PORT}/infinitecanvas`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((obj) => console.log('MongoDB conncted', obj))
  .catch(err => console.log(err));


io.on("connect", (socket: Socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('uploadPixelInfo', (pixelsInGrid: IPixelsInGridInfo) => {
    socket.broadcast.emit('pixelEditted', pixelsInGrid)
    //caching in redis - store
    for (let i = 0; i < pixelsInGrid.pixelArray.length; ++i) {
      const { x, y, rgba } = pixelsInGrid.pixelArray[i];
      if (rgba[3] != 0) {
        redisClient.hset(pixelsInGrid.gridId, `${x}_${y}`, `${rgba}`,(obj)=>{console.log("upload",obj)});
      }
    }

    // for (let i = 0; i < pixelsInGrid.size; ++i) {
    //   if (pixelsInGrid.colorBatch[i][3] != 0) {
    //     const pixelInfo = new PixelInfo({ x: pixelsInGrid.xBatch[i], y: pixelsInGrid.yBatch[i], rgba: pixelsInGrid.colorBatch[i] })
    //     pixelInfo.save()
    //   }
    // }
  });

  socket.on("fetchPixelsInGridBox", async (boxInGrid: IBoxInGridToFetch) => {//temp
    // const panPixels = await PixelInfo.find({ x: { $gte: topLeftX, $lte: bottomRightX }, y: { $gte: topLeftY, $lte: bottomRightY } })
    // const xBatch = panPixels.map((pixel) => pixel["x"]);
    // const yBatch = panPixels.map((pixel) => pixel["y"]);
    // const colorBatch = panPixels.map((pixel) => pixel["rgba"]);

    const pixelsInGrid = redisClient.hgetall(boxInGrid.gridId, (obj)=>{
      console.log("obj",obj)
    });
    console.log("pixelsInGrid",pixelsInGrid);
    
    socket.emit('pixelsForPan', { 'x': [], 'y': [], 'color': [] });
  });
});

httpServer.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});