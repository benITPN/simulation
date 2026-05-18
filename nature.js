import { TileSelect } from "./world.js";


const links = {
  plainsTree: "images/plains_Tree2.png",
  plainsTreeWithFruits: "images/plains_Tree2_1growth_stage.png",
  forestTree: "images/forest_tree.png",
  plainsBush_0berry: "images/plains_bush_0berry.png",
  plainsBush_1berry: "images/plains_bush_1berry.png",
  plainsBush_2berry: "images/plains_bush_2berry.png",
  plainsBush_3berry: "images/plains_bush_3berry.png",
  mushroom: "images/mushroom.png",
  cactus: "images/cactus.png",
  cactus_with_flower: "images/cactus_with_flower.png",
  grass_rock: "images/grass_rock.png",
};


function addNatureToTiles(world, row, column, biome, blueprintOfPlants, plantsArr, ctx, sizeMultiplier) {
    // blueprintOfPlants style [{name: tree, sprite: {link for each state}, size: 1, chance: 0.10},{name: bush, sprite: link, size: 0.3, chance: 0.10}]
    // console.log(world)
    let tiles = TileSelect.remakeBiome(biome,world);
    if(tiles.length == 0) return;

    tiles.forEach(tile => {
      const aroundTiles = TileSelect.getAroundTiles(
        world, row, column, tile.worldIndex_x, tile.worldIndex_y
      );


      blueprintOfPlants.forEach(plantBlueprint => {
        if(Math.random() < plantBlueprint.chance) {
          let plant = new Plant(
          ctx,
          plantBlueprint.name,
          tile,
          plantBlueprint.sprite,
          plantBlueprint.size,
          Math.floor(Math.random()*10*sizeMultiplier),
          Math.floor(Math.random()*10*sizeMultiplier),
          plantBlueprint.maxFruits,
          plantBlueprint.growDurationMs,
          plantBlueprint.fruitNutritionScore,
          plantBlueprint.needed_space,
          plantBlueprint.anchor
        );
          plantsArr.push(plant);
          tile.plant.push(plant);
        }
      })
    })

    // console.log(tiles);
}

export function addNatureToWorld(world,row,column,plantsArr,ctx,tileSize) {
    // console.log(world);
    let sizeMultiplier = tileSize/20;
  // plant blueprints in sprites put them in order 0 fruit 1 fruit and so on
    const plains_blueprintOfPlants = [
      {
        name: "plainsTree",
        sprite: [links.plainsTree,links.plainsTreeWithFruits],
        size: 0.8*sizeMultiplier,
        chance: 0.01,
        maxFruits: 1,
        growDurationMs: 15_000,
        fruitNutritionScore: 30,
        needed_space: 40,
        anchor: {x: 0, y: -25*sizeMultiplier}
      },
      {
        name: "plainsbush",
        sprite: [links.plainsBush_0berry, links.plainsBush_1berry, links.plainsBush_2berry, links.plainsBush_3berry],
        size: 0.8*sizeMultiplier,
        chance: 0.02,
        maxFruits: 3,
        growDurationMs: 7_000,
        fruitNutritionScore: 15,
        needed_space: 40,
        anchor: {x: 0, y: -50*sizeMultiplier}
      },
      {
        name: "grass_rock",
        sprite: [links.grass_rock],
        size: 0.3*sizeMultiplier,
        chance: 0.01,
        maxFruits: 0,
        growDurationMs: 0,
        fruitNutritionScore: 0,
        needed_space: 0,
        anchor: {x: 0, y: -25*sizeMultiplier}
      },
    ];

    const forest_blueprintOfPlants = [
      {
        name: "forestTree",
        sprite: [links.forestTree],
        size: 1*sizeMultiplier,
        chance: 0.70,
        maxFruits: 0,
        growDurationMs: 0,
        fruitNutritionScore: 0,
        needed_space: 0,
        anchor: {x: 0, y: -50*sizeMultiplier}
      },
      {
        name: "grass_rock",
        sprite: [links.grass_rock],
        size: 0.3*sizeMultiplier,
        chance: 0.02,
        maxFruits: 0,
        growDurationMs: 0,
        fruitNutritionScore: 0,
        needed_space: 0,
        anchor: {x: 0, y: -25*sizeMultiplier}
      },
    ];

    const desert_blueprintOfPlants = [
      {
        name: "cactus",
        sprite: [links.cactus,links.cactus_with_flower],
        size: 1*sizeMultiplier,
        chance: 0.03,
        maxFruits: 1,
        growDurationMs: 25_000,
        fruitNutritionScore: 60,
        needed_space: 100,
        anchor: {x: 0, y: -50*sizeMultiplier}
      },
    ];
    addNatureToTiles(world, row, column, "plains", plains_blueprintOfPlants, plantsArr, ctx, sizeMultiplier);
    addNatureToTiles(world, row, column, "forest", forest_blueprintOfPlants, plantsArr, ctx, sizeMultiplier);
    addNatureToTiles(world, row, column, "desert", desert_blueprintOfPlants, plantsArr, ctx, sizeMultiplier);
}

// one time eat
export function addRandomNatureToWorld(world,row,column,plantsArr,ctx,tileSize) {
  let sizeMultiplier = tileSize/20;
  // plant blueprints in sprites put them in order 0 fruit 1 fruit and so on
  // blueprints
    const forest_blueprintOfPlants = [
      {
        name: "mushroom",
        sprite: [links.mushroom],
        size: 0.3*sizeMultiplier,
        chance: 0.60,
        maxFruits: null,
        growDurationMs: null,
        fruitNutritionScore: 20,
        needed_space: 0,
        anchor: {x: 0, y: -10*sizeMultiplier}
      },
    ];

    // applies 
    let forest = TileSelect.remakeBiome("forest",world);
    forest_blueprintOfPlants.forEach(plantBlueprint => {
      if(plantBlueprint.chance < Math.random()) {
        return;
      }
      if(forest.length == 0) return;

      let tile = forest[Math.floor(Math.random()*forest.length)];
      let plant = new Plant(
        ctx,
        plantBlueprint.name,
        tile,
        plantBlueprint.sprite,
        plantBlueprint.size,
        Math.floor(Math.random()*10*sizeMultiplier),
        Math.floor(Math.random()*10*sizeMultiplier),
        plantBlueprint.maxFruits,
        plantBlueprint.growDurationMs,
        plantBlueprint.fruitNutritionScore,
        plantBlueprint.needed_space,
        plantBlueprint.anchor
      );      
      tile.plant.push(plant);
      plantsArr.push(plant);
    })

    
}

class Plant {
  constructor(ctx,name,tile,sprite,size = 1,offsetX = 0,offsetY = 0,maxFruits,growDurationMs,fruitNutritionScore,needed_space,anchor) {
    this.name = name;         // "tree", "appleTree", "bush"
    this.tile = tile;         // reference to Tile object
    this.sprite = sprite;     // array of paths
    this.size = size;         // scale multiplier
    this.offsetX = offsetX;   // fine positioning
    this.offsetY = offsetY;
    this.fruits = [];
    this.ctx = ctx;
    this.maxFruits = maxFruits;
    this.fruitNutritionScore = fruitNutritionScore
    this.needed_space = needed_space;
    this.anchor = anchor;

    // derived world position
    this.x = tile.x + offsetX;
    this.y = tile.y + offsetY;

    // fruit growing
    this.growthStartTime = null;     // when fruit growth started
    this.growDurationMs = growDurationMs + (Math.random()*4000)-2000;    // 10 seconds
    this.isGrowingFruit = false;

    this.flipX = Math.random() < 0.5;
    this.images = (this.sprite || []).map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }
  
  // fruit growing
  startFruitGrowth(now) {
    this.isGrowingFruit = true;
    this.growthStartTime = now;
  }

  finishFruitGrowth() {
    // spawn exactly one fruit
    this.fruits.push(this.fruitNutritionScore);

    this.isGrowingFruit = false;
    this.growthStartTime = null;
  }

  updateFruitCycle(now) {
    // max fruit
    if (this.fruits.length > this.maxFruits) this.fruits.length = this.maxFruits;

    // If fruit exists, do nothing (until it disappears)
    if (this.fruits.length === this.maxFruits) return;

    // No fruit exists:
    if (!this.isGrowingFruit) {
      this.startFruitGrowth(now);
      return;
    }

    // Fruit is growing:
    const elapsed = now - this.growthStartTime;
    if (elapsed >= this.growDurationMs) {
      this.finishFruitGrowth();
    }
  }

  // draw
  draw() {
    const idx = Math.min(this.fruits.length, this.images.length - 1);
    const img = this.images[idx];


    if (!img || !img.complete) return;

    this.ctx.imageSmoothingEnabled = false;

    const size = this.size;

    const scale = 1;
    const width = img.naturalWidth * scale * size;
    const height = img.naturalHeight * scale * size;

    const x = Math.round(this.x - width / 2 - this.anchor.x);
    const y = Math.round(this.y - height - this.anchor.y);

    this.ctx.save();



    if(this.flipX) {
      this.ctx.translate(x + width / 2, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(img, Math.round(-width / 2), y, width, height);
    } else{
      this.ctx.drawImage(img, x, y, width, height);

      // this.ctx.beginPath()
      // this.ctx.arc(this.x, this.y, 2, 0, Math.PI*2)
      // this.ctx.stroke()
      // this.ctx.fill();
      // this.ctx.closePath()     
    }
    this.ctx.restore();

    // this.ctx.beginPath()
    // this.ctx.arc(10, 10, 10, 0, Math.PI*2)
    // this.ctx.stroke()
    // this.ctx.fill();
    // this.ctx.closePath()
  }

  update(now) {
    this.updateFruitCycle(now);
    this.draw();
  }
}