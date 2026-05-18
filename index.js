//                                      Ecosystem Simulation 
// =============================================
//
// This project is a real-time 2D ecosystem simulation built using pure JavaScript
// and HTML5 Canvas. It models interactions between two types of creatures:
// herbivores and carnivores, each with their own behaviors and survival mechanics.
//
// Overview:
// Creatures exist in a dynamic environment where they must manage their internal
// resources such as food and water. These values decrease over time, forcing each
// creature to actively search for resources in order to survive.
//
// Visual Indicators:
// - The blue bar above a creature represents its water level
// - The orange bar above a creature represents its food level
// - The green orb appears when a creature is searching for a partner
//
// Behavior:
// - Creatures move autonomously based on rules
// - They search for food and water when resources are low
// - They die if food or water reaches zero
// - When conditions are met, creatures search for a partner and reproduce
// - Each creature has attributes such as speed, sight range, size, and breed time
//
// Simulation:
// The simulation runs in a continuous update loop where all entities are processed
// and rendered every frame. The system tracks performance (FPS) and updates all
// creature states in real time.
//
// User Interaction:
// A control panel allows the user to easily adjust various parameters such as
// population size, resource limits, decay rates, movement speed, sight range,
// and reproduction timing. This makes it possible to experiment with different
// ecosystem configurations and observe how behavior changes.
//
// Purpose:
// The goal of this project is to explore rule-based behavior and real-time
// simulation using only vanilla JavaScript.
//
// =============================================


import { Tile, makeHexagonGrid, drawAllBorderPaths, TileSelect, BIOME_COLORS } from "./world.js";
import { addNatureToWorld } from "./nature.js";
import { addRandomNatureToWorld } from "./nature.js";
import { makeListOfCreatures } from "./creatures.js";
import { CREATURE_SETTINGS } from "./creatures.js";
import { updateCreatureSettingsFromHTML } from "./creatures.js";

const entities = document.getElementById("entities");
const terrain = document.getElementById("terrain");


const window_width = window.innerWidth;
const window_height = window.innerHeight;

let ctx = entities.getContext("2d");
let terrain_ctx = terrain.getContext("2d");

entities.width = window_width;
entities.height = window_height;
terrain.width = window_width;
terrain.height = window_height;

ctx.scale(1, 1);
ctx.imageSmoothingEnabled = false;



const worldLength = 100;
const worldHeight = 50;
const tileSize = 20;

entities.width = worldLength*tileSize*2;
entities.height = worldHeight*tileSize*2;
terrain.width = worldLength*tileSize*2;
terrain.height = worldHeight*tileSize*2;

let world = [];


for (let y = 0; y < worldLength; y++) {
    let row = [];

    for (let x = 0; x < worldHeight; x++) {
        row.push(undefined);
    }

    world.push(row);
}





makeHexagonGrid(worldLength, worldHeight, 10, 10, tileSize, world, 0.05, terrain_ctx);

for (let i = 0; i < world.length; i++) {
    for (let j = 0; j < world[i].length; j++) {
        world[i][j].finalColorSave = world[i][j].color;
    }
}

let plantsArr = [];
addNatureToWorld(world, worldLength, worldHeight, plantsArr,ctx,tileSize);

setInterval(() => {
    addRandomNatureToWorld(world,worldLength,worldHeight,plantsArr,ctx,tileSize);
    plantsArr.sort((a, b) => a.y - b.y);
},5_000)

const creatures = [[],[]]
const spawnBtn = document.getElementById("spawn-btn");

spawnBtn.addEventListener("click", () => {
    updateCreatureSettingsFromHTML();
    let newListOfCreatures = makeListOfCreatures(world, ctx, tileSize, worldLength, worldHeight);
    timeOfLastSpawn = performance.now();

    creatures[0].push(...newListOfCreatures[0]);
    creatures[1].push(...newListOfCreatures[1]);
})

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}m ${secs}s`;
}


const filteredPlants = [];

for (const plant of plantsArr) {

    const tooClose = filteredPlants.some(p => {
        const dx = plant.x - p.x;
        const dy = plant.y - p.y;
        return dx * dx + dy * dy < plant.needed_space * plant.needed_space;
    });

    if (tooClose) {
        let plantsArrOfTheTile = plant.tile.plant
        plantsArrOfTheTile.splice(plantsArrOfTheTile.indexOf(plant),1)

    } else {
        filteredPlants.push(plant);
    }
}

plantsArr = filteredPlants;

let objectsRenderedByYAxis = [];
// won't affect mushrooms
objectsRenderedByYAxis.push(...plantsArr);
objectsRenderedByYAxis.push(...creatures[0]);
objectsRenderedByYAxis.push(...creatures[1]);
objectsRenderedByYAxis.sort((a, b) => a.y - b.y);
// console.log(objectsRenderedByYAxis)



// draw background

for (let i = 0; i < world.length; i++) {
    for (let j = 0; j < world[i].length; j++) {
        if(world[i][j].biome === "noBiome") {
            // console.log(world[i][j])
            world[i][j].biome = "plains"
            world[i][j].color = BIOME_COLORS[world[i][j].biome];
        }
        world[i][j].update();
    }
}
drawAllBorderPaths(terrain_ctx, Tile.allBorderPathsSaved, 13);

let now = performance.now();
let start = performance.now();
let end = performance.now();
let timeOfLastSpawn;
let fps = 0;


                                                       // animate
function animate() {
    

    ctx.clearRect(
        -window_width,
        -window_height,
        window_width *tileSize*2,
        window_height *tileSize*2
    );
    objectsRenderedByYAxis = [];

    objectsRenderedByYAxis.push(...plantsArr);
    objectsRenderedByYAxis.push(...creatures[0]);
    objectsRenderedByYAxis.push(...creatures[1]);
    objectsRenderedByYAxis.sort((a, b) => a.y - b.y);
    // console.log(objectsRenderedByYAxis)
   



    

    now = performance.now()


    objectsRenderedByYAxis.forEach(obj => {
        if(obj.constructor.name == "Plant") {
            obj.update(now);
        } else if(obj.constructor.name == "CreatureHerbivore") {
            obj.update(plantsArr,world,creatures[0]);
        } else if(obj.constructor.name == "CreatureCarnivore") {
            obj.update(plantsArr,world,creatures[1], creatures[0]);
        } 
    })


    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.font = "40px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.textOutline = "black";

    ctx.strokeText(`herbivores: ${creatures[0].length}`, 70, 30);
    ctx.fillText(`herbivores: ${creatures[0].length}`, 70, 30);
    ctx.strokeText(`carnivores: ${creatures[1].length}`, 70, 80);
    ctx.fillText(`carnivores: ${creatures[1].length}`, 70, 80);
        
    creatures[0].forEach(creature => {
        creature.drawStats();
    })
    creatures[1].forEach(creature => {
        creature.drawStats();
    })


    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.font = "40px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.textOutline = "black";

    end = performance.now();

    if(Math.abs(fps - (1000/(end - start)).toFixed(2)) > fps*0.10) {
        fps = (1000/(end - start)).toFixed(0)
    }
    
    ctx.strokeText(`fps: ${fps}`, 70, 130);   
    ctx.fillText(`fps: ${fps}`, 70, 130);
    if(timeOfLastSpawn) {
        ctx.strokeText(`time from last spawn: ${formatTime((performance.now() - timeOfLastSpawn) / 1000)}`, 70, 180);
        ctx.fillText(`time from last spawn: ${formatTime((performance.now() - timeOfLastSpawn) / 1000)}`, 70, 180);
    } else {
        ctx.strokeText(`time from last spawn: 0s`, 70, 180);
        ctx.fillText(`time from last spawn: 0s`, 70, 180);
    }
    

    start = performance.now(); 

// ctx.beginPath();
// ctx.arc(100, 100, 10, 0, Math.PI * 2);
// ctx.fillStyle = "red";
// ctx.fill();
// ctx.closePath();

    requestAnimationFrame(animate)
}

// check if plants are sync

// let tempPlants = [];
// world.flat().forEach(tile => {
//     if(tile.plant.length > 0) {
//         tile.plant.forEach(plant => {
//             tempPlants.push(plant);
//         })
//     }
// })

// console.log(tempPlants);
// console.log(plantsArr);
animate();