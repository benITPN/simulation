export const BIOME_COLORS = {
  ocean:  "#3662ffff",
  desert: "#e4d27aff",
  plains: "#6ec447ff",
  forest: "#2f7b32",
  snow: "#ffffffff",

  beach: "#e4d27ac2",
  tundra: "#c8d9c8ff",
  ice: "#98ecffff",
  noBiome: "#ff00ee",
};

const BASE = {
  ocean:  1,
  desert: 1,
  plains: 1,
  forest: 1,
  snow:   1,
};


const EVEN_X_DIRS = [
  [+1,  1], // right_up
  [ 0,  1], // up
  [-1,  1], // left_up
  [-1,  0], // left_down
  [ 0, -1], // down
  [+1,  0], // right_down
];


const ODD_X_DIRS = [
  [+1,  0], // right_up
  [ 0,  1], // up
  [-1,  0], // left_up
  [-1, -1], // left_down
  [ 0, -1], // down
  [+1, -1], // right_down
];


const tilesWithBiome = [];

function tweakColor(base, factor = 0.06) {
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);

  const delta = (Math.random() * 2 - 1) * factor; // -factor..factor

  const scale = (v) =>
    Math.max(0, Math.min(255, Math.floor(v * (1 + delta))));

  return `rgb(${scale(r)}, ${scale(g)}, ${scale(b)})`;
}

export class TileSelect {

  static convertPixelCoordsToHexagonIndexes(pixelX, pixelY, tileSize, row, column) {

    const hexWidth = 1.5 * tileSize;  // flat-to-flat
    const hexHeight = 2 * Math.sqrt((tileSize*tileSize - (tileSize/2)*(tileSize/2)));      // point-to-point

    // odd rows shift right by half hexWidth, so add that extra half-width
    const worldWidthPx  = hexWidth * (row) + hexWidth / 2;
    const worldHeightPx = hexHeight * column;
  
    // const hexX = (worldWidthPx / pixelX) * row;
    // const hexY = (worldHeightPx / pixelY) * column;
    
    let hexX = Math.floor(pixelX / hexWidth);
    let hexY = Math.floor(pixelY / hexHeight);

    hexX = Math.max(0, Math.min(hexX, row    - 1));
    hexY = Math.max(0, Math.min(hexY, column - 1));

    return { hexX, hexY }
  }

  static isEven(v) {
    return v % 2 === 0;
  }

  static inBounds(x, y, cols, rows) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
  }

  static getAroundTiles(world, row, column, x, y) {
    const dirs = TileSelect.isEven(x) ? EVEN_X_DIRS : ODD_X_DIRS;
    let list_of_around_tiles = [];

    for (const [dx, dy] of dirs) {
      const offset_x = x + dx;
      const offset_y = y + dy;

      if (TileSelect.inBounds(offset_x, offset_y, row, column)) {
        list_of_around_tiles.push(world[offset_x][offset_y]);
      }
    }

    return list_of_around_tiles;
  }

  static remakeBiome(biome, world) {
    const list = [];
    for (const row of world) {
      for (const tile of row) {
        if (tile.biome === biome) list.push(tile);
      }
    }
    return list;
  }

  static getConnectedBiomeRegions(world, row, column, biome) {
    const visited = new Set();
    const regions = [];

    for (let x = 0; x < row; x++) {
      for (let y = 0; y < column; y++) {
        const start = world[x][y];
        if (start.biome !== biome) continue;

        const startKey = `${start.worldIndex_x},${start.worldIndex_y}`;
        if (visited.has(startKey)) continue;

        const region = [];
        const queue = [start];
        visited.add(startKey);

        while (queue.length > 0) {
          const tile = queue.shift();
          region.push(tile);

          const neighbors = TileSelect.getAroundTiles(
            world, row, column,
            tile.worldIndex_x,
            tile.worldIndex_y
          );

          for (const n of neighbors) {
            if (n.biome !== biome) continue;

            const k = `${n.worldIndex_x},${n.worldIndex_y}`;
            if (visited.has(k)) continue;

            visited.add(k);
            queue.push(n);
          }
        }
        regions.push(region);
      }
    }
    return regions;
  }

  static hasBiomeNearby(world, row, column, x, y, depth, targetBiome, noise1 = 0, noise2 = 0) {
    if (depth <= 0) return false;

    const visited = new Set();
    const queue = [[x, y, depth]];
    visited.add(x + "," + y);

    while (queue.length) {
      const [cx, cy, d] = queue.shift();

      if (d === 2 && noise2 > 0 && Math.random() < noise2) continue;
      if (d === 1 && noise1 > 0 && Math.random() < noise1) continue;

      const around = TileSelect.getAroundTiles(world, row, column, cx, cy);

      for (const t of around) {
        if (t.biome === targetBiome) return true;

        if (d > 1) {
          const nx = t.worldIndex_x;
          const ny = t.worldIndex_y;
          const key = nx + "," + ny;

          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nx, ny, d - 1]);
          }
        }
      }
    }
    return false;
  }

  static getTilesInRadius(radius, world, row, column, worldXIndex, worldYIndex, ctx) {
    let aroundTiles = TileSelect.getAroundTiles(world, row, column, worldXIndex, worldYIndex);
    let candidates = [...aroundTiles]

    for(let i = 1; i < radius; i++) {
        candidates.forEach(candidate => {
            let aroundTiles = TileSelect.getAroundTiles(world, row, column, candidate.worldIndex_x, candidate.worldIndex_y);

            aroundTiles.forEach(aroundTile => {
                if(candidates.includes(aroundTile)) {return}
                else{candidates.push(aroundTile)}
            })
        })
    }

    return candidates
    // console.log(candidates)
  }
}


function valueToGray(v) {
  v = Math.max(0, Math.min(1, v));
  const c = Math.round((1 - v) * 255); // 0 white, 1 black
  const hex = c.toString(16).padStart(2, "0");
  return `#${hex}${hex}${hex}`;
}


function assignColors(world,row,column, tweakColorFactor) {
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < column; j++) {
            world[i][j].color = BIOME_COLORS[world[i][j].biome];
            world[i][j].color = tweakColor(world[i][j].color, tweakColorFactor);
        }
    }
}

function removeBiome(possibleBiomes, biomeToRemove) {
  return possibleBiomes.filter(biome => biome.name !== biomeToRemove);
}

function whiteListOfBiomes(list,chances,possibleBiomes) {
  let whiteList = possibleBiomes.filter(biome => list.includes(biome.name));
  chances.forEach((chance,i) => {
    let indexOfChanceInList = whiteList.findIndex(biome => biome.name === list[i]);
    if(indexOfChanceInList == -1) {return};
    whiteList[indexOfChanceInList].chance += chance;
  })
  return whiteList
}

function chooseBiomeByChance(possibleBiomes) {
  const total = possibleBiomes.reduce((sum, biome) => sum + biome.chance, 0);
  let r = Math.random() * total;

  for (const biome of possibleBiomes) {
    r -= biome.chance;
    if (r <= 0) return biome.name;
  }
}

function resetToBase(tile) {
  tile.possibleBiomes.forEach(b => b.chance = BASE[b.name]);
}


function convertBiomeIfNearBiome(world, row, column, fromBiome, toBiome, nearBiome, depth, noise1, noise2) {
  const list = TileSelect.remakeBiome(fromBiome, world);

  for (const tile of list) {
    if (TileSelect.hasBiomeNearby(world, row, column, tile.worldIndex_x, tile.worldIndex_y, depth, nearBiome, noise1, noise2)) {
      tile.biome = toBiome;
    }
  }
}

function applySingleBiomeRule(tiles, world, row, column, minCount) {
  tiles.forEach(tile => {
    const aroundTiles = TileSelect.getAroundTiles(
      world, row, column,
      tile.worldIndex_x,
      tile.worldIndex_y
    );

    let count = 0;
    let changeTo = "noBiome";
    for (const t of aroundTiles) {
      if(t.biome == tile.biome) {count++}
    }

    aroundTiles.forEach(aroundTile => {
      if(tile.biome != aroundTile.biome) {
        changeTo = aroundTile.biome;
      }
    })


    if (count <= minCount) {
      if(changeTo == tile.biome) {
        tile.biome = "noBiome";
      } else {
        tile.biome = changeTo;
      }
      
    }
  });
}

function spreadBiomeToNeighbors(sourceTiles,world,row,column) {
  sourceTiles.forEach(tile => {
    const aroundTiles = TileSelect.getAroundTiles(world,row,column,tile.worldIndex_x,tile.worldIndex_y);

    aroundTiles.forEach(aroundTile => {
      aroundTile.biome = tile.biome;
    });
  });
}



function removeAllSmallBiomes (world,row,column) {
  for (let i = 0; i < 3; i++) {
  let plains = TileSelect.remakeBiome("plains",world);
  let sand = TileSelect.remakeBiome("desert",world);
  let water = TileSelect.remakeBiome("ocean",world);
  let forests = TileSelect.remakeBiome("forest",world);

  applySingleBiomeRule(sand,world,row,column,2)
  applySingleBiomeRule(water,world,row,column,2)
  applySingleBiomeRule(forests,world,row,column,2)
  applySingleBiomeRule(plains,world,row,column,2)
  }
}

function assignBorders(biomeTiles,world,row,column) {
  biomeTiles.forEach(tile => {
    let neighbors = TileSelect.getAroundTiles(world, row, column, tile.worldIndex_x, tile.worldIndex_y);

    if(tile.biome == "forest") {
      neighbors.forEach((aroundTile,i) => {
        if(aroundTile.biome == "plains") {
          tile.borders[i] = "#114f13ff";
        }
      })
    }

  })
}

function getSmoothBorderCornerPathsFromRegions(
  regions,
  world,
  row,
  column,
  biomeA = "forest",
  biomeB = "plains",
  quant = 0.25
) {
  // --- helpers ---
  const dirsForX = (x) => (x % 2 === 0 ? EVEN_X_DIRS : ODD_X_DIRS);

  const inBoundsLocal = (x, y) => x >= 0 && x < row && y >= 0 && y < column;

  const hexCorners = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  };

  const keyPt = (p) => {
    const x = Math.round(p[0] / quant) * quant;
    const y = Math.round(p[1] / quant) * quant;
    return `${x},${y}`;
  };

  const parseKey = (k) => {
    const [x, y] = k.split(",").map(Number);
    return { x, y };
  };

  // Chains unordered segments (endpoint pairs) into ordered polylines
  function chainSegmentsToPaths(segments) {
    const used = new Set();

    // endpoint -> list of segment indices
    const adj = new Map();
    segments.forEach((s, idx) => {
      if (!adj.has(s.a)) adj.set(s.a, []);
      if (!adj.has(s.b)) adj.set(s.b, []);
      adj.get(s.a).push(idx);
      adj.get(s.b).push(idx);
    });

    const nextUnusedFrom = (endpointKey) => {
      const list = adj.get(endpointKey) || [];
      for (const idx of list) {
        const s = segments[idx];
        if (!used.has(s.key)) return idx;
      }
      return null;
    };

    const paths = [];

    for (let i = 0; i < segments.length; i++) {
      const s0 = segments[i];
      if (used.has(s0.key)) continue;

      used.add(s0.key);
      let chain = [s0.a, s0.b];

      // extend forward
      while (true) {
        const end = chain[chain.length - 1];
        const nxtIdx = nextUnusedFrom(end);
        if (nxtIdx == null) break;

        const s = segments[nxtIdx];
        used.add(s.key);

        const other = s.a === end ? s.b : s.a;
        chain.push(other);
      }

      // extend backward
      while (true) {
        const start = chain[0];
        const nxtIdx = nextUnusedFrom(start);
        if (nxtIdx == null) break;

        const s = segments[nxtIdx];
        used.add(s.key);

        const other = s.a === start ? s.b : s.a;
        chain.unshift(other);
      }

      paths.push(chain.map(parseKey));
    }

    return paths;
  }

  // --- main ---
  const pathsPerRegion = [];

  for (const region of regions) {
    // fast membership: which tiles belong to THIS region
    const inRegion = new Set(region.map(t => `${t.worldIndex_x},${t.worldIndex_y}`));

    const segments = [];

    for (const tile of region) {
      if (tile.biome !== biomeA) continue;

      const gx = tile.worldIndex_x;
      const gy = tile.worldIndex_y;
      const dirs = dirsForX(gx);

      // use tile.size as corner radius (matches your drawHexagon geometry)
      const corners = hexCorners(tile.x, tile.y, tile.size);

      for (let side = 0; side < 6; side++) {
        const [dx, dy] = dirs[side];
        const nx = gx + dx;
        const ny = gy + dy;

        let isBoundary = false;

        if (!inBoundsLocal(nx, ny)) {
          isBoundary = true;
        } else {
          const nTile = world[nx][ny];

          // boundary if neighbor is not in this region (or not biomeA)
          if (!inRegion.has(`${nx},${ny}`) || nTile.biome !== biomeA) {
            // if biomeB is provided: only outline against that biome
            if (biomeB == null) {
              isBoundary = true;
            } else {
              isBoundary = (nTile.biome === biomeB);
            }
          }
        }

        if (!isBoundary) continue;

        const p0 = corners[side];
        const p1 = corners[(side + 1) % 6];

        const a = keyPt(p0);
        const b = keyPt(p1);
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;

        segments.push({ a, b, key });
      }
    }

    // chain into ordered corner polylines
    const regionPaths = chainSegmentsToPaths(segments);
    pathsPerRegion.push(regionPaths);
  }

  return pathsPerRegion;
}


export function drawConnectedBorderPaths(ctx, pathsPerRegion, color, lineWidth, closeLoops = true) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const CLOSE_EPS = 0.5; // distance threshold to treat as closed loop

  for (const regionPaths of pathsPerRegion) {
    for (const path of regionPaths) {
      if (!path || path.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }

      if (closeLoops) {
        const dx = path[0].x - path[path.length - 1].x;
        const dy = path[0].y - path[path.length - 1].y;
        if (Math.hypot(dx, dy) <= CLOSE_EPS) {
          ctx.closePath(); // makes a perfect loop join
        }
      }

      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawAllBorderPaths(ctx, allBorderPaths, defaultLineWidth = 20, closeLoops = true) {
  if (!Array.isArray(allBorderPaths)) return;

  for (const b of allBorderPaths) {
    if (!b || !b.paths) continue;

    drawConnectedBorderPaths(
      ctx,
      b.paths,
      b.color || "#000",
      b.lineWidth ?? defaultLineWidth,
      closeLoops
    );
  }
}



function removeImpossibleBiomesAround(world,row,column,baseTile_x,baseTile_y) {
  let baseBiome = world[baseTile_x][baseTile_y].biome;

  TileSelect.getAroundTiles(world,row,column,baseTile_x,baseTile_y).forEach(tile => {
    if(tile.biome !== "noBiome") {
      return;
    }

    if(baseBiome == "plains") {
      tile.possibleBiomes = whiteListOfBiomes(["plains","forest","ocean","desert","snow"],[5,0.05,0.05,0.03,0],tile.possibleBiomes)
    } 
    else if(baseBiome == "ocean") {
      tile.possibleBiomes = whiteListOfBiomes(["ocean","plains"],[3,1],tile.possibleBiomes)
    } 
    else if(baseBiome == "forest") {
      let forestTiles = TileSelect.remakeBiome("forest",world);
      if(forestTiles.length < row*column*0.2) {
        tile.possibleBiomes = whiteListOfBiomes(["forest","plains","snow"],[5,1,0],tile.possibleBiomes)
      } else {
        tile.possibleBiomes = whiteListOfBiomes(["forest","plains","snow"],[3,2,0],tile.possibleBiomes)
      }
      
    } 
    else if(baseBiome == "desert") {
      let desertTiles = TileSelect.remakeBiome("desert",world);
      if(desertTiles.length < row*column*0.2) {
        tile.possibleBiomes = whiteListOfBiomes(["desert","plains"],[6,2],tile.possibleBiomes)
      } else {
        tile.possibleBiomes = whiteListOfBiomes(["desert","plains"],[3,2],tile.possibleBiomes)
      }
    } 
    else if(baseBiome == "snow") {
      tile.possibleBiomes = whiteListOfBiomes(["snow","plains","forest"],[6,0,1],tile.possibleBiomes)
    } 

  })
}




export function makeHexagonGrid(row,column,x,y,radius,world, tweakColorFactor, ctx) {
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < column; j++) {
            let x_offset = radius*0.75*i*2;

            let y_radius = Math.sqrt((radius*radius)-((radius/2)*(radius/2)));
            let y_offset = y_radius*j*2;;
            if(i % 2 == 0) {y_offset+= y_radius};
            

            world[i][j] = new Tile(ctx,x+x_offset,y+y_offset,radius,"noBiome",false,i,j);
        }
    }
    pickBiome(world,row,column, tweakColorFactor);
}


function pickBiome(world, row, column, tweakColorFactor) {
  const random_x = Math.floor(Math.random() * row);
  const random_y = Math.floor(Math.random() * column);
  tilesWithBiome.length = 0;

  world[random_x][random_y].biome = "plains"
  tilesWithBiome.push(world[random_x][random_y]);

  const numberOfTilesInWorld = world.flat().length;
  while(tilesWithBiome.length < numberOfTilesInWorld) {

  const last = tilesWithBiome[tilesWithBiome.length - 1];
  removeImpossibleBiomesAround(
    world,
    row,
    column,
    last.worldIndex_x,
    last.worldIndex_y
  );


    let candidates = world.flat().filter(tile => tile.biome === "noBiome" && tile.possibleBiomes.length > 0);
    if (candidates.length === 0) {
      break;
    }

    const minObj = candidates.reduce((m, o) => o.possibleBiomes.length < m.possibleBiomes.length ? o : m);

    minObj.biome = chooseBiomeByChance(minObj.possibleBiomes);
    tilesWithBiome.push(minObj);

  }


  // remove singular tiles
  world.flat().forEach(tile => {
    let aroundTiles = TileSelect.getAroundTiles(world,row,column,tile.worldIndex_x,tile.worldIndex_y);
    if(aroundTiles.every(neighborTile => neighborTile.biome !== tile.biome)) {
      tile.biome = aroundTiles[0].biome;
    }
  })

  // create forests
  let forestTiles = TileSelect.remakeBiome("forest",world);

  // remove only 2 forests
  applySingleBiomeRule(
    forestTiles,
    world,row,column,
    2, // min count
  )

  // remake forests
  forestTiles = TileSelect.remakeBiome("forest",world);

  // expand forest
  spreadBiomeToNeighbors(forestTiles, world, row, column)

  // create water
  let water = TileSelect.remakeBiome("ocean",world);

  // expand water
  spreadBiomeToNeighbors(water, world, row, column)

  // create sand
  let sandTiles = TileSelect.remakeBiome("desert",world);


  // remove sand near water
  convertBiomeIfNearBiome(world, row, column, "desert", "plains", "ocean", 7, 0.6, 0.4);
  sandTiles = TileSelect.remakeBiome("desert",world);

  // remove forest near sand
  forestTiles = TileSelect.remakeBiome("forest",world);
  convertBiomeIfNearBiome(world, row, column, "forest", "plains", "desert", 5, 0.3, 0);


  // remove single sands
  applySingleBiomeRule(
    sandTiles,
    world,row,column,
    1, // min count
  )

  // remake sand
  sandTiles = TileSelect.remakeBiome("desert",world);

  // spread sand 
  spreadBiomeToNeighbors(sandTiles, world, row, column)

  removeAllSmallBiomes(world,row,column)


  forestTiles = TileSelect.remakeBiome("forest", world);
  let temporaryForestTiles = [];
  let forests = TileSelect.getConnectedBiomeRegions(world,row,column,"forest");
  forests.forEach(forest => {
    if(forest.length < 12) {
      temporaryForestTiles.push(forest);
      forest.forEach(forestTile => {
        forestTile.biome = "plains"
      })
    }
  })

  let plains = TileSelect.remakeBiome("plains", world);
  plains.forEach(plainTile => {
    let isNearDesert = !TileSelect.hasBiomeNearby(world,row,column,plainTile.worldIndex_x,plainTile.worldIndex_y,14,"desert",0.2,0.1)
    let isNearForest = !TileSelect.hasBiomeNearby(world,row,column,plainTile.worldIndex_x,plainTile.worldIndex_y,9,"forest",0.5,0.5)
    if(isNearDesert && isNearForest) {
      plainTile.biome = "snow"
    }
    
  })
  let snowTiles = TileSelect.remakeBiome("snow",world);

  spreadBiomeToNeighbors(snowTiles,world,row,column)

  temporaryForestTiles.forEach(forest => {
    if(forest.every(forestTile => !TileSelect.hasBiomeNearby(world,row,column,forestTile.worldIndex_x,forestTile.worldIndex_y,9,"snow",0,0))) {
      forest.forEach(forestTile => {
        world[forestTile.worldIndex_x][forestTile.worldIndex_y].biome = "forest"
      })
    }
  })

  water = TileSelect.remakeBiome("ocean",world);

  convertBiomeIfNearBiome(world,row,column,"ocean","ice","snow",1);

  water = TileSelect.remakeBiome("ocean", world);
  snowTiles = TileSelect.remakeBiome("snow", world);
  forestTiles = TileSelect.remakeBiome("forest", world);
  sandTiles =  TileSelect.remakeBiome("desert", world);

  forests = TileSelect.getConnectedBiomeRegions(world,row,column,"forest");
  let deserts = TileSelect.getConnectedBiomeRegions(world,row,column,"desert");
  let oceans = TileSelect.getConnectedBiomeRegions(world,row,column,"ocean");
  let tundras = TileSelect.getConnectedBiomeRegions(world,row,column,"snow");
  let ice = TileSelect.getConnectedBiomeRegions(world,row,column,"ice");

  const allBorderPaths = [];

  const forestBorderPaths = getSmoothBorderCornerPathsFromRegions(forests, world, row, column, "forest", "plains");
  const desertBorderPaths = getSmoothBorderCornerPathsFromRegions(deserts, world, row, column, "desert", "plains");
  const waterBorderPaths = getSmoothBorderCornerPathsFromRegions(oceans, world, row, column, "ocean", "plains");
  const tundraBorderPaths = getSmoothBorderCornerPathsFromRegions(tundras, world, row, column, "snow", "plains");
  const iceToPlainsBorderPaths = getSmoothBorderCornerPathsFromRegions(ice, world, row, column, "ice", "plains");


  allBorderPaths.push({
    paths: forestBorderPaths,
    color: "#0e550fff",
  });

  allBorderPaths.push({
    paths: desertBorderPaths,
    color: "rgb(144, 207, 101)",
  });

  allBorderPaths.push({
    paths: waterBorderPaths,
    color: "#3662ffff",
  });

  allBorderPaths.push({
    paths: tundraBorderPaths,
    color: "#dfe9ffff",
  });
  allBorderPaths.push({
    paths: iceToPlainsBorderPaths,
    color: "#a8ebfaff",
  });  




  Tile.allBorderPathsSaved = allBorderPaths;


  assignColors(world,row,column,tweakColorFactor);

}

function makeHexPath(points) {
  const p = new Path2D();
  p.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < 6; i++) p.lineTo(points[i].x, points[i].y);
  p.closePath();
  return p;
}

function drawHexagon(ctx, x, y, radius, fillColor = null, sideColors = [], lineWidth = 20, path) {


  // Fill 

  if (fillColor) {
    if (ctx.fillStyle !== fillColor) ctx.fillStyle = fillColor;
    ctx.fill(path);
  }
}






export class Tile {
  constructor(ctx ,x, y, size, biome, color, worldIndex_x, worldIndex_y) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.finalColorSave = color;
    this.biome = biome;
    this.possibleBiomes = [
      { name: "ocean",  chance: 0 },
      { name: "desert", chance: 0 },
      { name: "plains", chance: 0 },
      { name: "forest", chance: 0 },
      { name: "snow",   chance: 0 },
    ];
    this.worldIndex_x = worldIndex_x;
    this.worldIndex_y = worldIndex_y;
    this.plant = [];
    this.points = [];

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      this.points.push({
        x: this.x + Math.cos(angle) * (this.size+1),
        y: this.y + Math.sin(angle) * (this.size+1)
      });
    }

    this.hex_path = makeHexPath(this.points);
  }

  static allBorderPathsSaved = null;


  
  draw() {
    drawHexagon(this.ctx,this.x,this.y,this.size,this.color,this.borders, undefined, this.hex_path);
  }

  update() {
    this.draw();
  }


}