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
    const resultBox11 = new Box(new Point(90,10), new Point(110, 110));
    const resultBox21 = new Box(new Point(10,90), new Point(90,110));
    expect(subBoxes1.length).toBe(2);
    expect(subBoxes1[0].equals(resultBox11)).toBe(true);
    expect(subBoxes1[1].equals(resultBox21)).toBe(true);
});

test('box subtract box other way', () => {
    const boxA = new Box(new Point(-10, 10), new Point(90, 110));
    const boxB = new Box(new Point(10, -10), new Point(110, 90));
    
    debugger;
    const subBoxes = boxA.subtract(boxB);
    const resultBox1 = new Box(new Point(-10, 10), new Point(10, 110));
    const resultBox2 = new Box(new Point(10, 90), new Point(90, 110));
    expect(subBoxes.length).toBe(2);
    expect(subBoxes[0].equals(resultBox1)).toBe(true);
    expect(subBoxes[1].equals(resultBox2)).toBe(true);

    const subBoxes1 = boxB.subtract(boxA);
    const resultBox11 = new Box(new Point(90,-10), new Point(110, 90));
    const resultBox21 = new Box(new Point(10,-10), new Point(90,10));
    expect(subBoxes1.length).toBe(2);
    expect(subBoxes1[0].equals(resultBox11)).toBe(true);
    expect(subBoxes1[1].equals(resultBox21)).toBe(true);
});

test('bigger box subtract smaller box ', () => {
    const boxA = new Box(new Point(-10, 10), new Point(110, 110));
    const boxB = new Box(new Point(10, -10), new Point(90, 90));
    
    debugger;
    const subBoxes = boxA.subtract(boxB);
    const resultBox1 = new Box(new Point(-10, 10), new Point(10, 110));
    const resultBox2 = new Box(new Point(90, 10), new Point(110, 110));
    const resultBox3 = new Box(new Point(10, 90), new Point(90, 110));
    expect(subBoxes.length).toBe(3);
    expect(subBoxes[0].equals(resultBox1)).toBe(true);
    expect(subBoxes[1].equals(resultBox2)).toBe(true);
    expect(subBoxes[2].equals(resultBox3)).toBe(true);

    const subBoxes1 = boxB.subtract(boxA);
    const resultBox11 = new Box(new Point(10,-10), new Point(90, 10));
    expect(subBoxes1.length).toBe(1);
    expect(subBoxes1[0].equals(resultBox11)).toBe(true);
});