import { Box, Point } from "../viewer/utilities";


test('box subtract box from min to max', () => {
    const boxA = new Box(new Point(-10, -10), new Point(90, 90));
    const boxB = new Box(new Point(10, 10), new Point(110, 110));

    const subBoxes = boxA.subtract(boxB);
    const resultBox1 = new Box(new Point(-10, -10), new Point(10, 90));
    const resultBox2 = new Box(new Point(10, -10), new Point(90, 10));
    expect(subBoxes.length).toBe(2);
    expect(subBoxes[0].equals(resultBox1)).toBe(true);
    expect(subBoxes[1].equals(resultBox2)).toBe(true);

    const subBoxes1 = boxB.subtract(boxA);
    const resultBox11 = new Box(new Point(90, 10), new Point(110, 110));
    const resultBox21 = new Box(new Point(10, 90), new Point(90, 110));
    expect(subBoxes1.length).toBe(2);
    expect(subBoxes1[0].equals(resultBox11)).toBe(true);
    expect(subBoxes1[1].equals(resultBox21)).toBe(true);
});

test('box subtract box other way', () => {
    const boxA = new Box(new Point(-10, 10), new Point(90, 110));
    const boxB = new Box(new Point(10, -10), new Point(110, 90));

    const subBoxes = boxA.subtract(boxB);
    const resultBox1 = new Box(new Point(-10, 10), new Point(10, 110));
    const resultBox2 = new Box(new Point(10, 90), new Point(90, 110));
    expect(subBoxes.length).toBe(2);
    expect(subBoxes[0].equals(resultBox1)).toBe(true);
    expect(subBoxes[1].equals(resultBox2)).toBe(true);

    const subBoxes1 = boxB.subtract(boxA);
    const resultBox11 = new Box(new Point(90, -10), new Point(110, 90));
    const resultBox21 = new Box(new Point(10, -10), new Point(90, 10));
    expect(subBoxes1.length).toBe(2);
    expect(subBoxes1[0].equals(resultBox11)).toBe(true);
    expect(subBoxes1[1].equals(resultBox21)).toBe(true);
});

test('bigger box subtract smaller box ', () => {
    const boxA = new Box(new Point(-10, 10), new Point(110, 110));
    const boxB = new Box(new Point(10, -10), new Point(90, 90));

    const subBoxes = boxA.subtract(boxB);
    const resultBox1 = new Box(new Point(-10, 10), new Point(10, 110));
    const resultBox2 = new Box(new Point(90, 10), new Point(110, 110));
    const resultBox3 = new Box(new Point(10, 90), new Point(90, 110));
    expect(subBoxes.length).toBe(3);
    expect(subBoxes[0].equals(resultBox1)).toBe(true);
    expect(subBoxes[1].equals(resultBox2)).toBe(true);
    expect(subBoxes[2].equals(resultBox3)).toBe(true);

    const subBoxes1 = boxB.subtract(boxA);
    const resultBox11 = new Box(new Point(10, -10), new Point(90, 10));
    expect(subBoxes1.length).toBe(1);
    expect(subBoxes1[0].equals(resultBox11)).toBe(true);
});

test('generate box along diagonal minmax slope less than 1 ', () => {
    const minx = -10;
    const maxX = 115;
    const step = 20
    const boxA = new Box(new Point(minx, 10), new Point(maxX, 80));
    const subBoxes = boxA.generateBoxesAlongDiagonal(step, 0, "minmax")
    expect(subBoxes.length).toBe(Math.ceil((maxX - minx) / step));
    expect(subBoxes[0].equals(new Box(new Point(-10, 10), new Point(10, 22)))).toBe(true);
    expect(subBoxes[3].equals(new Box(new Point(50, 43), new Point(70, 55)))).toBe(true);
    expect(subBoxes[6].equals(new Box(new Point(110, 77), new Point(115, 80)))).toBe(true);
});

test('generate box along diagonal minmax slope greater than 1', () => {
    const minY = -10;
    const maxY = 115;
    const step = 20
    const boxA = new Box(new Point(10, minY), new Point(80, maxY));
    const subBoxes = boxA.generateBoxesAlongDiagonal(step, 0, "minmax")
    expect(subBoxes.length).toBe(Math.ceil((maxY - minY) / step));
    expect(subBoxes[0].equals(new Box(new Point(10, -10), new Point(22, 10)))).toBe(true);
    expect(subBoxes[3].equals(new Box(new Point(43, 50), new Point(55, 70)))).toBe(true);
    expect(subBoxes[6].equals(new Box(new Point(77, 110), new Point(80, 115)))).toBe(true);
});

test('generate box along diagonal other slope > -1 ', () => {
    const minx = -10;
    const maxX = 115;
    const step = 20
    const boxA = new Box(new Point(minx, 10), new Point(maxX, 80));
    const subBoxes = boxA.generateBoxesAlongDiagonal(step, 0, "other")
    expect(subBoxes.length).toBe(Math.ceil((maxX-minx)/step));
    expect(subBoxes[0].equals(new Box(new Point(95, 10), new Point(115, 22)))).toBe(true);
    expect(subBoxes[3].equals(new Box(new Point(35, 43), new Point(55, 55)))).toBe(true);
    expect(subBoxes[6].equals(new Box(new Point(-10, 77), new Point(-5, 80)))).toBe(true);
});

test('generate box along diagonal minmax slope slope < -1', () => {
    const minY = -10;
    const maxY = 115;
    const step = 20
    const boxA = new Box(new Point(10, minY), new Point(80, maxY));
    const subBoxes = boxA.generateBoxesAlongDiagonal(step, 0, "other")
    expect(subBoxes.length).toBe(Math.ceil((maxY - minY) / step));
    expect(subBoxes[0].equals(new Box(new Point(68, -10), new Point(80, 10)))).toBe(true);
    expect(subBoxes[3].equals(new Box(new Point(35, 50), new Point(47, 70)))).toBe(true);
    expect(subBoxes[6].equals(new Box(new Point(10, 110), new Point(13, 115)))).toBe(true);
});
//Boundary cases
test('generate box boundary test', () => { 
    console.log ("Slope 1")   
    const boxA = new Box(new Point(10, 10), new Point(120, 120));
    const subBoxes = boxA.generateBoxesAlongDiagonal(20, 0, "minmax")
    expect(subBoxes.length).toBe(6);
    expect(subBoxes[0].equals(new Box(new Point(10,10), new Point(30,30)))).toBe(true);
    expect(subBoxes[3].equals(new Box(new Point(70,70), new Point(90,90)))).toBe(true);
    expect(subBoxes[5].equals(new Box(new Point(110,110), new Point(120,120)))).toBe(true);

    const subBoxes1 = boxA.generateBoxesAlongDiagonal(20, 0, "other")
    expect(subBoxes1.length).toBe(6);
    expect(subBoxes1[0].equals(new Box(new Point(100,10), new Point(120,30)))).toBe(true);
    expect(subBoxes1[3].equals(new Box(new Point(40,70), new Point(60,90)))).toBe(true);
    expect(subBoxes1[5].equals(new Box(new Point(10,110), new Point(20,120)))).toBe(true);
});


test('generate box boundary test', () => { 
    const boxA = new Box(new Point(10, 10), new Point(120, 10));
    const subBoxes = boxA.generateBoxesAlongDiagonal(20, 0, "minmax")
    expect(subBoxes.length).toBe(6);
    const boxB = new Box(new Point(10, 10), new Point(10, 120)); 
    const subBoxes1 = boxB.generateBoxesAlongDiagonal(20, 0, "minmax")
    expect(subBoxes1.length).toBe(6);
});
