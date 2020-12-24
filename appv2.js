const fs = require('fs');
const path = require('path');

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.skip = false;
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
    let setOfPoints = [];

    let data = fs.readFileSync(p, 'utf-8');
    const lines = data.split(/\r\n|\r|\n/);
    const n = parseInt(lines[0]);
    let i = 1; // Current index of line

    const addPoint = (lineWithCoords) => {
        const coords = lineWithCoords.split(' ');
        const xCoord = parseInt(coords[0]);
        const yCoord = parseInt(coords[1]);
        setOfPoints.push(new Point(xCoord, yCoord));
    }

    for (i; i <= n; i++) {
        addPoint(lines[i]);
    }

    return setOfPoints;
}

const rightBottomPointIndex = (setOfPoints) => {
    let resPoint = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    let index = 0;
    for (let i = 0; i < setOfPoints.length; i++) {
        let point = setOfPoints[i];
        if ((point.y < resPoint.y) || (point.y == resPoint.y && point.x > resPoint.x)) {
            resPoint = Object.assign(new Point, point);
            index = i;
        }
    }
    return {
        startPoint: resPoint,
        index
    };
};

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

const bypassJarvis = (setOfPoints) => {
    const { startPoint, index } = rightBottomPointIndex(setOfPoints);
    let convexHull = [startPoint];
    let indexes = [index];

    while (true) {
        let pointToAdd = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        let indexToAdd;

        for (let i = 0; i < setOfPoints.length; i++) {
            const curPoint = setOfPoints[i];
            const convexLen = convexHull.length;

            if (curPoint.skip) {
                continue;
            }

            if (convexLen === 1 && curPoint.x === startPoint.x && curPoint.y === startPoint.y) {
                continue;
            }

            if (pointToAdd.x === Number.POSITIVE_INFINITY) {
                pointToAdd = curPoint;
                continue;
            }
            
            const detValue = calcDet(convexHull[convexLen - 1], pointToAdd, curPoint);

            if (detValue < 0) {
                pointToAdd = curPoint;
                indexToAdd = i;
            } else if (detValue === 0) {
                const mainPoint = convexHull[convexLen - 1];
                const m1 = getVectorModule(curPoint.x - mainPoint.x, curPoint.y - mainPoint.y);
                const m2 = getVectorModule(pointToAdd.x - mainPoint.x, pointToAdd.y - mainPoint.y);
                if (m1 <= m2) {
                    curPoint.skip = true;
                } else {
                    pointToAdd.skip = true;
                    pointToAdd = curPoint;
                    indexToAdd = i;
                }
            }
        }
        
        if (pointToAdd.x === startPoint.x && pointToAdd.y === startPoint.y) {
            break;
        }

        if (!pointToAdd.skip) {
            convexHull.push(pointToAdd);
            indexes.push(indexToAdd);
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
    const setOfPoints = getFileData(p1);
    const convexHull = bypassJarvis(setOfPoints);
    let result = [];
    for (point of convexHull) {
        result.push(`${point.x} ${point.y}\n`);
    }
    const strData = `The convex hull consists of ${convexHull.length} points:\n` + result.toString().replace(/,/g, '');
    writeToFile(p2, strData);
};

start();