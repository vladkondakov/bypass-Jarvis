const fs = require('fs');
const path = require('path');

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const getPathsToFiles = () => {
    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    const p1 = path.join(
        path.dirname(require.main.filename),
        inputFile
    );

    const p2 = path.join(
        path.dirname(require.main.filename),
        outputFile
    );

    return { p1, p2 };
};

const getFileData = (p) => {
    let data = fs.readFileSync(p, 'utf-8');
    const lines = data.split(/\r\n|\r|\n/);
    const n = parseInt(lines[0]);

    let setOfPoints = [];
    let resPoint = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    let startIndex = 0;

    for (let i = 1; i <= n; i++) {
        const coords = lines[i].split(' ');
        const xCoord = parseInt(coords[0]);
        const yCoord = parseInt(coords[1]);
        const point = new Point(xCoord, yCoord);
        setOfPoints.push(point);

        if ((point.y < resPoint.y) || (point.y == resPoint.y && point.x > resPoint.x)) {
            resPoint = Object.assign(new Point, point);
            startIndex = i - 1;
        }
    }

    return {
        setOfPoints,
        startPoint: resPoint,
        startIndex
    };
}

const calcDet = (p1, p2, p3) => {
    const x2 = p2.x - p1.x;
    const y2 = p2.y - p1.y;
    const x3 = p3.x - p1.x;
    const y3 = p3.y - p1.y;

    return (x2 * y3 - x3 * y2);
}

const getVectorModule = (x, y) => {
    return Math.sqrt(x * x + y * y);
}

const bypassJarvis = (fileData) => {
    const { setOfPoints, startPoint, startIndex } = fileData;
    let convexHull = [startPoint];
    let count = -1;
    let indexes = Array(setOfPoints.length).fill(1).map(el => {
        count++;
        return el * count;
    });
    
    indexes.push(startIndex);
    indexes[startIndex] = 0;
    indexes.shift();
    
    while (true) {
        let nextIndex = 0;
        const convexLen = convexHull.length;

        for (let i = 1; i < indexes.length; i++) {
            const mainPoint = convexHull[convexLen - 1];
            const curPoint = setOfPoints[indexes[i]];
            const nextPoint = setOfPoints[indexes[nextIndex]];
            const detValue = calcDet(mainPoint, nextPoint, curPoint);

            if (detValue < 0) {
                nextIndex = i;
            } else if (detValue === 0) {
                const m1 = getVectorModule(curPoint.x - mainPoint.x, curPoint.y - mainPoint.y);
                const m2 = getVectorModule(nextPoint.x - mainPoint.x, nextPoint.y - mainPoint.y);
                if (m1 >= m2) {
                    nextIndex = i;
                }
            }
        }

        if (indexes[nextIndex] === startIndex) {
            break;
        } else {
            convexHull.push(setOfPoints[indexes[nextIndex]]);
            indexes.splice(nextIndex, 1);
        } 
    }

    return convexHull;
}

const writeToFile = (p, data) => {
    fs.writeFile(p, data, err => {
        if (err) {
            console.log("Some error in writing to output file");
        }
    });
}

const start = () => {
    const { p1, p2 } = getPathsToFiles();
    const fileData = getFileData(p1);
    const convexHull = bypassJarvis(fileData);
    let result = [];
    for (point of convexHull) {
        result.push(`${point.x} ${point.y}\n`);
    }
    const strData = `The convex hull consists of ${convexHull.length} points:\n` + result.toString().replace(/,/g, '');
    writeToFile(p2, strData);
};

start();