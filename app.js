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

const getPolarAngle1 = (point, c) => {
    // This function only for the logic of finding the second point.
    const x = c.x - point.x;
    const y = c.y - point.y;
    const polarAngle = Math.atan2(y, x);

    return polarAngle;
}

const getVectorModule = (x, y) => {
    return Math.sqrt(x * x + y * y);
}

const getPolarAngle2 = (point1, point2, c) => {
    // a * b = |a| * |b| * cos(phi) = a.x * b.x + a.y * b.y, where a and b are vectors.
    const x1 = point1.x - point2.x;
    const x2 = c.x - point2.x;
    const y1 = point1.y - point2.y;
    const y2 = c.y - point2.y;
    const m1 = getVectorModule(x1, y1);
    const m2 = getVectorModule(x2, y2);
    const angleBetweenVectors = Math.acos((x1 * x2 + y1 * y2) / (m1 * m2));

    return Math.PI - angleBetweenVectors;
}

const bypassJarvis = (setOfPoints) => {
    const { startPoint, index } = rightBottomPointIndex(setOfPoints);
    let convexHull = [startPoint];
    let indexes = [index];

    while (true) {
        let minPolarAngle = Math.PI * 3;
        let pointToAdd = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        let indexToAdd;
        
        for (let i = 0; i < setOfPoints.length; i++) {
            let curPolarAngle;
            const curPoint = setOfPoints[i];

            if (indexes.length == 1) {
                const isTheSame = curPoint.x == startPoint.x && curPoint.y == startPoint.y
                curPolarAngle = (isTheSame) ? Math.PI * 4 : getPolarAngle1(startPoint, curPoint);
            } else {
                const convexLen = convexHull.length;
                curPolarAngle = getPolarAngle2(convexHull[convexLen - 2], convexHull[convexLen - 1], curPoint);
            }
            if (minPolarAngle > curPolarAngle) {
                minPolarAngle = curPolarAngle;
                pointToAdd = curPoint;
                indexToAdd = i;
            }
            if (minPolarAngle == curPolarAngle) {
                const m1 = getVectorModule(curPoint.x - startPoint.x, curPoint.y - startPoint.y);
                const m2 = getVectorModule(pointToAdd.x - startPoint.x, pointToAdd.y - startPoint.y);
                if (m1 <= m2) {
                    pointToAdd = curPoint;
                    indexToAdd = i;
                }
            }
        }
        if (pointToAdd.x == startPoint.x && pointToAdd.y == startPoint.y) {
            break;
        }
        convexHull.push(pointToAdd);
        indexes.push(indexToAdd);
    }

    return convexHull;
}

const writeToFile = (p, data) => {
    fs.writeFile(p, data, err => {
        if (err) {
            console.log("Some error in writting to output file");
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
    const strData = `Выпуклую оболочку образуют ${convexHull.length} точек:\n` + result.toString().replace(/,/g, '');
    writeToFile(p2, strData);
};

start();