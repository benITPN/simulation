import { Tile, TileSelect } from "./world.js";

export const CREATURE_SETTINGS = {
  herbivore: {
    count: 50,
    food: 100,
    water: 100,
    hp: 100,
    sight: 5,
    speed: 1,
    size: 0.5,
    breedTime: 8000,
    color: "red",
    img: "images/red_gooblet.png",
    waterDecayRate: 3,
    foodDecayRate: 1,
  },
  carnivore: {
    count: 50,
    food: 100, 
    water: 100,
    hp: 100,
    sight: 5,
    speed: 1,
    size: 0.5,
    breedTime: 15000,
    color: "blue",
    img: "images/blue_gooblet.png",
    waterDecayRate: 3,
    foodDecayRate: 1,
  }
};

export function updateCreatureSettingsFromHTML() {
  CREATURE_SETTINGS.herbivore.count = Number(document.getElementById("herbivore-count").value);
  CREATURE_SETTINGS.herbivore.food = Number(document.getElementById("herbivore-food").value);
  CREATURE_SETTINGS.herbivore.water = Number(document.getElementById("herbivore-water").value);
  CREATURE_SETTINGS.herbivore.sight = Number(document.getElementById("herbivore-sight").value);
  CREATURE_SETTINGS.herbivore.speed = Number(document.getElementById("herbivore-speed").value);
  CREATURE_SETTINGS.herbivore.size = Number(document.getElementById("herbivore-size").value);
  CREATURE_SETTINGS.herbivore.breedTime = Number(document.getElementById("herbivore-breed-time").value);
  CREATURE_SETTINGS.herbivore.waterDecayRate = Number(document.getElementById("herbivore-water-Decay-Rate").value);
  CREATURE_SETTINGS.herbivore.foodDecayRate = Number(document.getElementById("herbivore-food-Decay-Rate").value);

  CREATURE_SETTINGS.carnivore.count = Number(document.getElementById("carnivore-count").value);
  CREATURE_SETTINGS.carnivore.food = Number(document.getElementById("carnivore-food").value);
  CREATURE_SETTINGS.carnivore.water = Number(document.getElementById("carnivore-water").value);
  CREATURE_SETTINGS.carnivore.sight = Number(document.getElementById("carnivore-sight").value);
  CREATURE_SETTINGS.carnivore.speed = Number(document.getElementById("carnivore-speed").value);
  CREATURE_SETTINGS.carnivore.size = Number(document.getElementById("carnivore-size").value);
  CREATURE_SETTINGS.carnivore.breedTime = Number(document.getElementById("carnivore-breed-time").value);
  CREATURE_SETTINGS.carnivore.waterDecayRate = Number(document.getElementById("carnivore-water-Decay-Rate").value);
  CREATURE_SETTINGS.carnivore.foodDecayRate = Number(document.getElementById("carnivore-food-Decay-Rate").value);
}



const BIOME_COLORS = {
  ocean: "#3662ffff",
  desert: "#e4d27aff",
  plains: "#6ec447ff",
  forest: "#2f7b32",
  snow: "#ffffffff",
  beach: "#e4d27ac2",
  tundra: "#c8d9c8ff",
  ice: "#98ecffff",
  noBiome: "#ff00eeff",
};

const deltaDivider = 10;
const swingSize = 0.6
const swingSpeed = 0.01;
const timeToResetAngle = 0.05;

export function makeListOfCreatures(world, ctx, tileSize, row, column) {
  let herbivoreList = [];
  let carnivoreList = [];
  let flatWorld = world.flat();
  flatWorld = flatWorld.filter(tile => tile.biome !== "ocean");

  const herbivoreStats = CREATURE_SETTINGS.herbivore;
  const carnivoreStats = CREATURE_SETTINGS.carnivore;

  for (let i = 0; i < herbivoreStats.count; i++) {
    const randomTile = flatWorld[Math.floor(Math.random() * flatWorld.length)];

    herbivoreList.push(
      new CreatureHerbivore(
        herbivoreStats,
        ctx,
        tileSize,
        randomTile.x,
        randomTile.y,
        row,
        column,
        world
      )
    );
  }

  for (let i = 0; i < carnivoreStats.count; i++) {
    const randomTile = flatWorld[Math.floor(Math.random() * flatWorld.length)];

    carnivoreList.push(
      new CreatureCarnivore(
        carnivoreStats,
        ctx,
        tileSize,
        randomTile.x,
        randomTile.y,
        row,
        column,
        world
      )
    );
  }

  return [herbivoreList, carnivoreList];
}



class CreatureHerbivore {
  constructor(stats, ctx, tileSize, x, y, row, column, world) {
    this.waitTime = 0;
    this.timeTillCanBreed = stats.breedTime;
    this.isWaitingForBreeding = false;
    this.canBreed = false;
    this.stats = {...stats}

    this.MaxFood = stats.food;
    this.MaxWater = stats.water;
    this.food = stats.food;
    this.water = stats.water;
    this.hp = stats.hp;
    this.sight = stats.sight;
    this.ctx = ctx;
    this.tileSize = tileSize;
    this.row = row;
    this.column = column;
    this.world = world;
    this.speed = stats.speed;
    this.baseSpeed = stats.speed;
    this.color = stats.color;
    this.path = stats.img;
    this.img = new Image();
    this.img.src = stats.img;
    this.anchor = { x: 0, y: 20 };
    this.size = stats.size;

    this.isWaiting = false;
    this.lastTileIWasOn = world[0][0];
    this.filteredTilesICanGoTo_random = [];
    this.tilesInRadius = [];
    this.blacklistedTiles = null;
    this.lastTilesInRadius = [];
    this.tileUnderMe = null;
    this.nextTile = null;
    this.vxToGetToCurrentTarget = 0;
    this.vyToGetToCurrentTarget = 0;
    this.tilesISee = [];
    this.lastTime = performance.now();
    this.dt = 0;
    this.angle = 0;

    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.worldX = TileSelect.convertPixelCoordsToHexagonIndexes(this.x, this.y, this.tileSize, this.row, this.column).hexX;
    this.worldY = TileSelect.convertPixelCoordsToHexagonIndexes(this.x, this.y, this.tileSize, this.row, this.column).hexY;

    let tilesInRadius = TileSelect.getTilesInRadius(5, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);
    let blacklistedTiles = TileSelect.getTilesInRadius(2, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);
    const filteredTiles = tilesInRadius.filter(tile => !blacklistedTiles.includes(tile));
    this.targetedTile = filteredTiles[Math.floor(Math.random() * filteredTiles.length)];

    this.setWorldIndexOfCreature();
  }

  exploration(creatureList) {

    if (this.distFromSelectedObject(this.tileUnderMe) > this.tileSize) {
      this.setWorldIndexOfCreature();
    }

    if (this.lastTileIWasOn !== this.tileUnderMe) {
      this.setNextTile();
    }

    // color debug next tile
    // if(this.nextTile) {
    //   this.nextTile.color = "lightBlue"
    // }


    // colors tile Im on and turn back the last one
    this.lastTileIWasOn.color = this.lastTileIWasOn.finalColorSave;

    // color debug tile under me red
    this.tileUnderMe.color = "#fc0303";


    // deciding when to go to next target 
    if (this.targetedTile == this.tileUnderMe || this.targetedTile === null || this.targetedTile === undefined) {
      // choose tiles I can go to
      this.tilesInRadius = TileSelect.getTilesInRadius(this.sight, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);
      this.blacklistedTiles = TileSelect.getTilesInRadius(3, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);

      this.speed = this.baseSpeed;

      if (Math.random() < 0.25) {
        this.waitTime = 1000;
        this.speed = this.baseSpeed * 1.5;
        this.filteredTilesICanGoTo_random = this.tilesInRadius;
      } else {
        this.filteredTilesICanGoTo_random = this.tilesInRadius.filter(
          tile => !this.blacklistedTiles.includes(tile)
        );
        this.filteredTilesICanGoTo_random = this.filteredTilesICanGoTo_random.filter(
          tile => !this.lastTilesInRadius.includes(tile)
        );
      }

      if (this.filteredTilesICanGoTo_random.length === 0) {
        this.filteredTilesICanGoTo_random = this.tilesInRadius;
      }
      this.filteredTilesICanGoTo_random = this.filteredTilesICanGoTo_random.filter(
        tile => tile.biome !== "ocean"
      );

      // color debug Tiles choosing from
      // this.filteredTilesICanGoTo_random.forEach(f => f.color = "#00ff44");
      // this.lastTilesInRadius.forEach(t => t.color = t.finalColorSave);


      // choose exact tile
      this.targetedTile = this.filteredTilesICanGoTo_random[Math.floor(Math.random() * this.filteredTilesICanGoTo_random.length)];



      this.lastTilesInRadius = this.tilesInRadius;
    }

    if (this.canBreed) {
      creatureList.forEach(creature => {
        if (this == creature || !creature.canBreed) {
          return;
        }

        if (this.tilesInRadius.includes(creature.tileUnderMe)) {
          this.targetedTile = creature.tileUnderMe;
        }

        if (this.tileUnderMe === creature.tileUnderMe) {
          this.canBreed = false;
          creature.canBreed = false
          this.isWaitingForBreeding = false;
          this.waitTime = 3000;
          setTimeout(() => {
            let newCreature = new CreatureHerbivore(
              this.stats,
              this.ctx,
              this.tileSize,
              this.x,
              this.y,
              this.row,
              this.column,
              this.world
            );
            newCreature.waitingTime = 2000
            creatureList.push(newCreature);
            // console.log("breed")
          }, 3000)

        }
      })
    }

    if (this.tileUnderMe !== this.lastTileIWasOn) {
      // check for food in range
      if (this.food < this.MaxFood / 2) {
        this.tilesInRadius.forEach(possibleFoodTile => {
          if (possibleFoodTile.plant.length > 0) {
            possibleFoodTile.plant.forEach(plant => {
              if (plant.fruits.length > 0) {
                this.targetedTile = possibleFoodTile;
              }
            })
          }
        })

        const tilesAroundMe = TileSelect.getAroundTiles(this.world, this.row, this.column, this.worldX, this.worldY);
        tilesAroundMe.forEach(tileAroundMe => {
          if (tileAroundMe.plant.length > 0) {
            tileAroundMe.plant.forEach(plant => {
              if (plant.fruits.length > 0) {
                // console.log(plant.fruits)
                this.food += plant.fruits[0];
                if (this.food > this.MaxFood) {
                  this.food = this.MaxFood;
                }
                plant.fruits.splice(0, 1);
                if (plant.name === "mushroom") {
                  this.tileUnderMe.plant.splice(0, 1);
                  this.plantsArr.splice(this.plantsArr.indexOf(plant), 1)
                }
                this.waitTime = 1000;
              }
            })
          }
        })
      }

      // check for water in range
      if (this.water < this.MaxWater / 2) {
        this.tilesInRadius.forEach(possibleWaterTile => {
          if (possibleWaterTile.biome === "ocean") {
            this.targetedTile = possibleWaterTile;
          }
        })

        const tilesAroundMe = TileSelect.getAroundTiles(this.world, this.row, this.column, this.worldX, this.worldY);
        tilesAroundMe.forEach(tileAroundMe => {
          if (tileAroundMe.biome === "ocean") {
            this.water += 25;
            if (this.water > this.MaxWater) {
              this.water = this.MaxWater;
            }
            this.waitTime = 1000;
          }
        })
      }
    }


    // color debug target Tile
    // if(this.targetedTile) {
    //   this.targetedTile.color = "blue"
    // }

    if (!this.isWaiting && this.waitTime === 0) {
      this.goToTargetTile()
    } else {
      if(!this.isWaiting) {
        setTimeout(() => {
          this.waitTime = 0;
          this.isWaiting = false
        }, this.waitTime)        
      }
      this.isWaiting = true;

      if(Math.abs(this.angle) < timeToResetAngle*2) {
        this.angle = 0;
      } else if(this.angle > 0) {
        this.angle -= timeToResetAngle * this.dt;
      } else if(this.angle < 0) {
        this.angle += timeToResetAngle * this.dt;
      }
    }

    // set last tile
    if (this.lastTileIWasOn !== this.tileUnderMe) {
      this.lastTileIWasOn = this.tileUnderMe;
    }
  }

  goToTargetTile() {
    if (!this.targetedTile) return;
    this.angle = Math.sin(performance.now()*swingSpeed)*swingSize

    const targetX = this.targetedTile.x;
    const targetY = this.targetedTile.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;

    const angle = Math.atan2(dy, dx);

    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;

    if (this.tileUnderMe && this.tileUnderMe.biome === "ocean") {
      this.targetedTile.color = this.targetedTile.finalColorSave;
      this.tilesInRadius = TileSelect.getTilesInRadius(this.sight, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);
      if(!this.escapingWater || this.targetedTile == this.tileUnderMe) {
        this.targetedTile = this.findClosestNonWaterTile(this.tilesInRadius);
      }
      

      const targetX = this.targetedTile.x;
      const targetY = this.targetedTile.y;
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;

      this.x += this.vx * this.dt;
      this.y += this.vy * this.dt;

      this.setNextTile();
      this.escapingWater = true;
      return;
    }

    this.escapingWater = false
    if (this.nextTile && this.nextTile.biome === "ocean") {
      this.targetedTile.color = this.targetedTile.finalColorSave;
      this.tilesInRadius = TileSelect.getTilesInRadius(this.sight, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);
      this.tilesInRadius = this.tilesInRadius.filter(tile => {return tile.biome !== "ocean"});
      this.targetedTile = this.tilesInRadius[Math.floor(Math.random()*this.tilesInRadius.length)];

      const targetX = this.targetedTile.x;
      const targetY = this.targetedTile.y;
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const angle = Math.atan2(dy, dx);
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;

      this.setNextTile();
      return;
    }

    this.x += this.vx * this.dt;
    this.y += this.vy * this.dt;


    // prevent overshooting
    const dist = Math.hypot(dx, dy);
    if (dist <= this.speed) {
      this.x = targetX;
      this.y = targetY;
    }
  }

findClosestNonWaterTile(tiles) {
  if (!tiles || tiles.length === 0) return null;

  let closestTile = null;
  let closestDist = Infinity;

  for (const tile of tiles) {
    if (!tile || tile.biome === "ocean" || tile == this.tileUnderMe) continue;

    const dx = tile.x - this.x;
    const dy = tile.y - this.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < closestDist) {
      closestDist = distSq;
      closestTile = tile;
    }
  }

  return closestTile;
}


  distFromSelectedObject(obj) {
    if (!obj) this.setWorldIndexOfCreature();

    const dx = this.x - obj.x;
    const dy = this.y - obj.y;
    return Math.hypot(dx, dy);
  }

  setNextTile() {
    if (this.nextTile) {
      this.nextTile.color = this.nextTile.finalColorSave;
    }

    const len = Math.hypot(this.vx, this.vy);
    if (len === 0) {
      this.nextTile = null;
    }
    const normalized_vx = this.vx / len;
    const normalized_vy = this.vy / len;

    let nextIndexes = TileSelect.convertPixelCoordsToHexagonIndexes(
      this.x + normalized_vx * this.tileSize,
      this.y + normalized_vy * this.tileSize,
      this.tileSize,
      this.row,
      this.column
    );
    this.nextTile = this.world[nextIndexes.hexX]?.[nextIndexes.hexY]

    if (this.nextTile == this.tileUnderMe) {
      nextIndexes = TileSelect.convertPixelCoordsToHexagonIndexes(
        this.x + normalized_vx * this.tileSize * 2,
        this.y + normalized_vy * this.tileSize * 2,
        this.tileSize,
        this.row,
        this.column
      );
      this.nextTile = this.world[nextIndexes.hexX]?.[nextIndexes.hexY]
    }
  }

  setWorldIndexOfCreature() {
    const WorldIndexes = TileSelect.convertPixelCoordsToHexagonIndexes(this.x, this.y, this.tileSize, this.row, this.column);
    this.worldX = WorldIndexes.hexX;
    this.worldY = WorldIndexes.hexY;
    this.tileUnderMe = this.world[this.worldX][this.worldY];
  }

  die(creatureList) {
    creatureList.splice(creatureList.indexOf(this), 1);
  }

  drawStats() {

  const allBarsYOffset = -25;

  const waterYOffset = -30 + allBarsYOffset;
  const waterInnerRectYOffset = -28 + allBarsYOffset;

  const foodYOffset = -45 + allBarsYOffset;
  const foodInnerRectYOffset = -43 + allBarsYOffset;

  const barBorderWidth = 2;
  const barHeight = 10;
  const barInnerHeight = 6;


  const breedMarkerSize = 10;
  const breedMarkerYOffset = 15;

    // water bar
    this.ctx.fillStyle = "black";
    this.ctx.strokeStyle = "black";
    this.ctx.beginPath();
    this.ctx.lineWidth = barBorderWidth;
    this.ctx.rect(this.x - this.MaxWater / 4, this.y + waterYOffset, this.MaxWater / 2, barHeight);
    this.ctx.stroke();
    this.ctx.closePath()
    this.ctx.beginPath();
    this.ctx.fillStyle = "blue";
    this.ctx.strokeStyle = "blue";
    this.ctx.rect(this.x - this.MaxWater / 4.1, this.y + waterInnerRectYOffset, this.water / 2, barInnerHeight);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath()

    // food bar
    this.ctx.beginPath();
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = barBorderWidth;
    this.ctx.rect(this.x - this.MaxFood / 4, this.y + foodYOffset, this.MaxFood / 2, barHeight);
    this.ctx.stroke();
    this.ctx.closePath()
    this.ctx.beginPath();
    this.ctx.fillStyle = "orange";
    this.ctx.strokeStyle = "orange";
    this.ctx.rect(this.x - this.MaxFood / 4 + 2, this.y + foodInnerRectYOffset, this.food / 2.2, barInnerHeight);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath()

    // can breed
    if (this.canBreed) {
      this.ctx.beginPath();
      this.ctx.fillStyle = "lightGreen";
      this.ctx.strokeStyle = "lightGreen";

      // centered 10x10 square under the dot
      this.ctx.rect(this.x - (breedMarkerSize/2), this.y + breedMarkerYOffset, breedMarkerSize, breedMarkerSize);

      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.closePath();
    }    
  }

  draw() {
    this.ctx.imageSmoothingEnabled = false;

    const size = this.size;
    const scale = 1;

    const width = this.img.naturalWidth * scale * size;
    const height = this.img.naturalHeight * scale * size;

    const x = Math.round(this.x - width / 2) - this.anchor.x;
    const y = Math.round(this.y - height / 2) - this.anchor.y;

    this.ctx.save();

    // move origin to center of sprite
    this.ctx.translate(x + width / 2, y + height / 2);

    // rotate
    this.ctx.rotate(this.angle);

    // draw centered
    this.ctx.drawImage(
      this.img,
      -width / 2,
      -height / 2,
      width,
      height
    );

    this.ctx.restore();
  }

  update(plantsArr, world, creatureList) {
    const now = performance.now();
    const dtMs = now - this.lastTime;     // delta time in milliseconds
    this.dt = dtMs / deltaDivider;          // delta time in seconds (usually what you want)
    this.lastTime = now;

    this.world = world;
    this.plantsArr = plantsArr;
    this.water -= this.stats.waterDecayRate/100 * this.dt;
    this.food -= this.stats.foodDecayRate/100 * this.dt;

    if (this.water <= 0 || this.food <= 0) {
      this.die(creatureList);
      return;
    }

    if (this.food > this.MaxFood / 2 && this.water > this.MaxWater / 2 && !this.isWaitingForBreeding && !this.canBreed) {
      this.isWaitingForBreeding = true;
      setTimeout(() => {
        this.canBreed = true;
      }, this.timeTillCanBreed)
    }

    if(this.angle > Math.PI*2 || this.angle < (Math.PI*2)*-1) {
      this.angle = 0;
    }

    this.exploration(creatureList)


    this.draw()
  }
}


class CreatureCarnivore extends CreatureHerbivore {
  constructor(stats, ctx, tileSize, x, y, row, column, world) {
    super(stats, ctx, tileSize, x, y, row, column, world);
    this.timeTillCanBreed = stats.breedTime;
    this.anchor = { x: 0, y: 20 };
    this.angle = 2;
  }
  

  exploration(creatureList, herbivoreCreatureList) {

    if (this.distFromSelectedObject(this.tileUnderMe) > this.tileSize) {
      this.setWorldIndexOfCreature();
    }

    if (this.lastTileIWasOn !== this.tileUnderMe) {
      this.setNextTile();
    }

    // color debug next tile
    // if(this.nextTile) {
    //   this.nextTile.color = "lightBlue"
    // }


    // colors tile Im on and turn back the last one
    this.lastTileIWasOn.color = this.lastTileIWasOn.finalColorSave;

    // color debug tile under me red
    // this.tileUnderMe.color = "#fc0303";


    // deciding when to go to next target 
    if (this.targetedTile == this.tileUnderMe || this.targetedTile === null || this.targetedTile === undefined) {
      // choose tiles I can go to
      this.tilesInRadius = TileSelect.getTilesInRadius(this.sight, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);
      this.blacklistedTiles = TileSelect.getTilesInRadius(3, this.world, this.row, this.column, this.worldX, this.worldY, this.ctx);

      this.speed = this.baseSpeed;

      if (Math.random() < 0.25) {
        this.waitTime = 1000;
        this.speed = this.baseSpeed * 1.5;
        this.filteredTilesICanGoTo_random = this.tilesInRadius;
      } else {
        this.filteredTilesICanGoTo_random = this.tilesInRadius.filter(
          tile => !this.blacklistedTiles.includes(tile)
        );
        this.filteredTilesICanGoTo_random = this.filteredTilesICanGoTo_random.filter(
          tile => !this.lastTilesInRadius.includes(tile)
        );
      }

      if (this.filteredTilesICanGoTo_random.length === 0) {
        this.filteredTilesICanGoTo_random = this.tilesInRadius;
      }
      this.filteredTilesICanGoTo_random = this.filteredTilesICanGoTo_random.filter(
        tile => tile.biome !== "ocean"
      );

      // color debug Tiles choosing from
      // this.filteredTilesICanGoTo_random.forEach(f => f.color = "#00ff44");
      // this.lastTilesInRadius.forEach(t => t.color = t.finalColorSave);


      // choose exact tile
      this.targetedTile = this.filteredTilesICanGoTo_random[Math.floor(Math.random() * this.filteredTilesICanGoTo_random.length)];



      this.lastTilesInRadius = this.tilesInRadius;
    }

    if (this.canBreed) {
      creatureList.forEach(creature => {
        if (this == creature || !creature.canBreed) {
          return;
        }

        if (this.tilesInRadius.includes(creature.tileUnderMe)) {
          this.targetedTile = creature.tileUnderMe;
        }

        if (this.tileUnderMe === creature.tileUnderMe) {
          this.canBreed = false;
          creature.canBreed = false
          this.isWaitingForBreeding = false;
          this.waitTime = 3000;
          setTimeout(() => {
            let newCreature = new CreatureCarnivore(
              this.stats,
              this.ctx,
              this.tileSize,
              this.x,
              this.y,
              this.row,
              this.column,
              this.world
            );
            newCreature.waitingTime = 2000
            creatureList.push(newCreature);
            // console.log("breed")
          }, 3000)

        }
      })
    }

    if (this.tileUnderMe !== this.lastTileIWasOn) {
      // check for food in range
      if (this.food < this.MaxFood / 2) {
        herbivoreCreatureList.forEach(creature => {
          if (this.tilesInRadius.includes(creature.tileUnderMe)) {
            this.targetedTile = creature.tileUnderMe;

            let preysOffsetX = creature.x - this.x;
            let preysOffsetY = creature.y - this.y;

            let preysTargetTileIndexes = TileSelect.convertPixelCoordsToHexagonIndexes(creature.x + preysOffsetX, creature.y + preysOffsetY, this.tileSize, this.row, this.column);
            creature.targetedTile = this.world[preysTargetTileIndexes.hexX][preysTargetTileIndexes.hexY];
          }

          if (this.tileUnderMe == creature.tileUnderMe) {
            this.food += 100;
            creature.die(herbivoreCreatureList);
            if (this.food > this.MaxFood) {
              this.food = this.MaxFood;
            }
          }
        })
      }

      // check for water in range
      if (this.water < this.MaxWater / 2) {
        this.tilesInRadius.forEach(possibleWaterTile => {
          if (possibleWaterTile.biome === "ocean") {
            this.targetedTile = possibleWaterTile;
          }
        })

        const tilesAroundMe = TileSelect.getAroundTiles(this.world, this.row, this.column, this.worldX, this.worldY);
        tilesAroundMe.forEach(tileAroundMe => {
          if (tileAroundMe.biome === "ocean") {
            this.water += 25;
            if (this.water > this.MaxWater) {
              this.water = this.MaxWater;
            }
            this.waitTime = 1000;
          }
        })
      }
    }


    // color debug target Tile
    // if(this.targetedTile) {
    //   this.targetedTile.color = "blue"
    // }

    if (!this.isWaiting && this.waitTime === 0) {
      this.goToTargetTile()
    } else {
      if(!this.isWaiting) {
        setTimeout(() => {
          this.waitTime = 0;
          this.isWaiting = false;
        }, this.waitTime)        
      }
      this.isWaiting = true;

      if(Math.abs(this.angle) < timeToResetAngle*2) {
        this.angle = 0;
      } else if(this.angle > 0) {
        this.angle -= timeToResetAngle * this.dt;
      } else if(this.angle < 0) {
        this.angle += timeToResetAngle * this.dt;
      }
    }

    // set last tile
    if (this.lastTileIWasOn !== this.tileUnderMe) {
      this.lastTileIWasOn = this.tileUnderMe;
    }
  }

  update(plantsArr, world, creatureList, herbivoreCreatureList) {
    const now = performance.now();
    const dtMs = now - this.lastTime;     // delta time in milliseconds
    this.dt = dtMs / deltaDivider;          // delta time in seconds (usually what you want)
    this.lastTime = now;

    this.world = world;
    this.plantsArr = plantsArr;

    this.water -= this.stats.waterDecayRate/100 * this.dt;
    this.food -= this.stats.foodDecayRate/100 * this.dt;

    if (this.water <= 0 || this.food <= 0) {
      this.die(creatureList);
      return;
    }

    if (this.food > this.MaxFood / 2 && this.water > this.MaxWater / 2 && !this.isWaitingForBreeding && !this.canBreed) {
      this.isWaitingForBreeding = true;
      setTimeout(() => {
        this.canBreed = true;
      }, this.timeTillCanBreed)
    }

    if(this.angle > Math.PI*2 || this.angle < (Math.PI*2)*-1) {
      this.angle = 0;
    }

    this.exploration(creatureList, herbivoreCreatureList);


    this.draw()
  }
}