// Import the game data used by this module to look up map tiles, terrain,
// starter Pokémon, and nature names.
import { mapTiles, terrainDefinitions, starterDefinitions, natures } from "./gamedata.js";

// Store the shared game state so other modules can read and update the
// trainer, map position, current encounter, and captured Pokémon.
export const state = {
    trainerName: "",
    starter: null,
    mapPosition: null,
    activeEncounter: null,
    caughtPokemon: [],
    statusMessage: document.querySelector("#game-status"),
    trainerMoveDirection: null,
};

// Cache the page elements used by the game. Keeping these reference here
// lets other modules update the interface without repeating DOM queries.
export const gameStartForm = document.querySelector("#game-start-form");
export const trainerNameInput = document.querySelector("#trainer-name-input");
export const trainerError = document.querySelector("#trainer-name-error");
export const starterChoiceOption = document.querySelector("#starter-choice-option");
export const starterError = document.querySelector("#starter-error");
export const trainerOutput = document.querySelector("#output-trainer");
export const starterOutput = document.querySelector("#output-starter");
export const hitPointsOutput = document.querySelector("#output-hp");
export const positionOutput = document.querySelector("#output-position");
export const encounterOutput = document.querySelector("#output-encounter");
export const caughtOutput = document.querySelector("#output-caught");
export const explorationSection = document.querySelector("#exploration");
export const overworldMap = document.querySelector("#overworld-map");
export const northButton = document.querySelector("#movement-north-button");
export const southButton = document.querySelector("#movement-south-button");
export const westButton = document.querySelector("#movement-west-button");
export const eastButton = document.querySelector("#movement-east-button");
export const encounterSection = document.querySelector("#encounter-section");
export const encounterHeading = document.querySelector("#wild-heading");
export const encounterImage = document.querySelector("#encounter-image");
export const outputEncounterName = document.querySelector("#encounter-name");
export const outputEncounterType = document.querySelector("#output-encounter-type");
export const outputEncounterHP = document.querySelector("#output-encounter-hp");
export const encounterStarterName = document.querySelector("#encounter-starter-name");
export const encounterStarterHP = document.querySelector("#encounter-starter-hp");
export const attackButton = document.querySelector("#battle-attack");
export const catchButton = document.querySelector("#battle-catch");
export const runButton = document.querySelector("#battle-run");
export const caughtPokemonList = document.querySelector("#caught-list");
export const starterBattleSprite = document.querySelector("#starter-image");

// Stop startup if any required page element is missing. This makes a broken
// or mismatched HTML page fail clearly instead of causing errors later.
if (
    !gameStartForm
    || !trainerNameInput
    || !trainerError
    || !starterChoiceOption
    || !starterError
    || !trainerOutput
    || !starterOutput
    || !hitPointsOutput
    || !positionOutput
    || !encounterOutput
    || !caughtOutput
    || !explorationSection
    || !overworldMap
    || !northButton
    || !southButton
    || !westButton
    || !eastButton
    || !encounterSection
    || !encounterHeading
    || !encounterImage
    || !outputEncounterName
    || !outputEncounterType
    || !outputEncounterHP
    || !encounterStarterName
    || !encounterStarterHP
    || !attackButton
    || !catchButton
    || !runButton
    || !caughtPokemonList
    || !starterBattleSprite
) {
    throw new Error("Required trainer setup elements are missing")
}

// Rebuild the captured-Pokémon list from the current game state. Show a
// placeholder message when the player has not caught anything yet.
export function renderCaughtPokemon() {
    // Remove the previous list contents so the display reflects the latest state.
    caughtPokemonList.replaceChildren();

    if (state.caughtPokemon.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No Pokémon caught yet.";
        caughtPokemonList.append(emptyItem);
    } else {

        for (const pokemon of state.caughtPokemon) {
            const listItem = document.createElement("li")

            listItem.textContent =
                `#${pokemon.pokedexNumber} - ${pokemon.name}`;

            caughtPokemonList.append(listItem);
        }
    }
}

// Find and return the map tile at the given row and column.
// Return null when there is no tile at that position.
export function findMapTile(row, column) {
    for (const mapTile of mapTiles){
        if (mapTile.row === row && mapTile.column === column) {
            return mapTile;
        }
    }

    return null;
}

// Look up a terrain deffinition by its ID.
// Return null if the ID does not match any known terrain.
export function findTerrainDefinition(terrainId) {
    for (const entry of terrainDefinitions){
        if (entry.id === terrainId) {
            return entry;
        }
    }

    return null;
}

// Look up a starter Pokémon definition by its ID.
// Return null if the ID does not match a known starter.
export function findStarterDefinition(starterId){
    for (const entry of starterDefinitions){
        if (entry.id === starterId) {
            return entry;
        }
    }

    return null;
}

// Fiind a captured Pokémon by its Pokédex number
// Return null if the player has not caught that Pokémon.
export function findCaughtPokemon(pokedexNumber) {
    for (const pokemon of state.caughtPokemon) {
        if (pokemon.pokedexNumber === pokedexNumber) {
            return pokemon;
        }
    }

    return null;
}

// Rebuild the map display using the current map data and trainer position.
// Each tile shows its terrain and accessible description; the trainer sprite
// is added to the tile where the trainer is standing
export function renderMap(){
    overworldMap.replaceChildren();

    for (const mapTile of mapTiles) {
        // Retrieve the display details for this tile's terrain.
        const terrainDefinition = findTerrainDefinition(mapTile.terrain);

        // Check whether the trainer's current corrdinatesd match this tile.
        const trainerHere =
            state.mapPosition !== null
            && mapTile.row == state.mapPosition.row
            && mapTile.column == state.mapPosition.column;
        
        // A map tile must refer to a known terrain; fail clearly if the data is invalid.
        if (terrainDefinition === null){
            throw new Error(`Unknown terrain value: ${mapTile.terrain}`);
        }

        const tileElement = document.createElement("li");
        const visibleRow = mapTile.row + 1;
        const visibleColumn = mapTile.column + 1;

        const terrainModifierClass = terrainDefinition.name
            .toLowerCase()
            .replace(/\s+/g, "-");

        tileElement.setAttribute(
            "class",
            `map-tile map-tile--${terrainModifierClass}`
        );

        // Use one-based coordinates in the label because people generally count map
        // rows and columns starting at 1, even though the game starts at 0.
        let accessibleName =
            `Row ${visibleRow}, column ${visibleColumn}: ${terrainDefinition.name} terrain.`;

        if (trainerHere) {
            accessibleName += " Trainer here.";
        }

        tileElement.setAttribute("aria-label", accessibleName);

        tileElement.textContent = terrainDefinition.symbol;

        // Add the trainer sprite only to the tile where the trainer is currently located.
        if (trainerHere) {
            const trainerImage = document.createElement("img");

            trainerImage.setAttribute("src", "assets/trainer.png");
            trainerImage.setAttribute("class", "trainer-sprite");
            trainerImage.setAttribute("alt", "");
            if (state.trainerMoveDirection !== null) {
                trainerImage.classList.add(
                    `trainer-sprite--${state.trainerMoveDirection}`
                );
            }

            tileElement.append(trainerImage);
        }

        overworldMap.append(tileElement);
        // The movement direction is only needed for this render, so clear it afterward.
    }

    state.trainerMoveDirection = null;
}

// Update the game interface to match the current state, including the trainer,
// starter, map position, encounter controls, and captured-Pokémon list.
export function renderGame() {
    // Always refresh the capture list. The remaining game display needs a chosen
    // starter and a valid map position, so leave it unchanged until both exist.
    renderCaughtPokemon();

    // The rest of the display requires both a selected starter and map position.
    if (state.starter === null || state.mapPosition === null){
        return;
    }

    // Use the encounter state to decide whether battle controls or exploration
    // should be available.
    const encounterActive = state.activeEncounter !== null;

    // Enable battle actions only when an encounters is active.
    attackButton.disabled = !encounterActive;
    catchButton.disabled = !encounterActive;
    runButton.disabled = !encounterActive;

    // Show the appropriate section for exploration or battle.
    explorationSection.hidden = encounterActive;
    encounterSection.hidden = !encounterActive;

    // Display the trainer and starter details, including the starter's nature.
    trainerOutput.textContent = state.trainerName;

    starterOutput.textContent = `${state.starter.name} (${state.starter.type}) - ${natures.find(
        (nature) => nature.id === state.starter.nature
    ).name} Nature`;

    // Display the starter's current and maximum hit points.
    hitPointsOutput.textContent =
        `${state.starter.currentHitPoints}/${state.starter.maximumHitPoints}`;

    // Find the tile under the trainer so the interface can show its terrain.
    const currentMapTile = findMapTile(
        state.mapPosition.row,
        state.mapPosition.column
    );

    // A trainer position must correspond to an existing tile on the map.
    if (currentMapTile === null) {
        throw new Error(
            `Invalid map position: row ${state.mapPosition.row}, column ${state.mapPosition.column}`
        );
    }

    // Get the terrain details for the trainer's current tile.
    const terrainDefinition = findTerrainDefinition(currentMapTile.terrain);

    // Stop if the current tile refers to an unknown terrain.
    if (terrainDefinition === null) {
        throw new Error(`Unknown terrain value: ${currentMapTile.terrain}`);
    }

    // Convert the map coordinates to one-based values for display.
    const visibleRow = state.mapPosition.row + 1;
    const visibleColumn = state.mapPosition.column + 1 ;

    // Display the current terrain and the trainer's position.
    positionOutput.textContent =
        `${terrainDefinition.name} - row ${visibleRow}, column ${visibleColumn}`;

    // Display a placeholder when there is no encounter.
    if (state.activeEncounter === null) {
        encounterOutput.textContent = "No active encounters";
    } else {

        // Find the name of the wild Pokémon's nature. 
        const encounterNatureName = natures.find(
            nature => nature.id === state.activeEncounter.nature
        ).name;

        // Display the wild Pokémon's name and nature.
        encounterOutput.textContent = 
            `${state.activeEncounter.name} - ${encounterNatureName} Nature`;

            // Display both types when type is an array, otherwise display its single type.
            if (Array.isArray(state.activeEncounter.type)) {
                outputEncounterType.textContent =
                    state.activeEncounter.type.join(" / ");
            } else {
                outputEncounterType.textContent =
                    state.activeEncounter.type;
            }

        // Display the wil Pokémon's name and current/max HP.
        outputEncounterName.textContent = state.activeEncounter.name;

        outputEncounterHP.textContent = 
            `${state.activeEncounter.currentHitPoints}/${state.activeEncounter.maximumHitPoints}`;

        // Calculate the wild Pokémon's remaining HP as a percentage.
        // Clamp the value to 0-100 so the health bar width stays in range.
        const wildHpPercent = Math.max(
            0,
            Math.min(
                100,
                (state.activeEncounter.currentHitPoints /
                    state.activeEncounter.maximumHitPoints) * 100
            )
        );

        // Calculate the starter's remaining HP percentage and clamp it to 0-100
        const starterHpPercent = Math.max(
            0,
            Math.min(
                100,
                (state.starter.currentHitPoints /
                    state.starter.maximumHitPoints) * 100
            )
        );

        // Set the wild Pokémon's health-bar width to match its HP percentage.
        const encounterBar = document.querySelector("#encounter-hp-fill");
        encounterBar.style.width = `${wildHpPercent}%`;
        
        // Use a color that indicates how much HP the wild Pokémon has left 
        if (wildHpPercent <= 20) {
            encounterBar.style.backgroundColor = "red";
        } else if (wildHpPercent <= 50) {
            encounterBar.style.backgroundColor = "yellow";
        } else {
            encounterBar.style.backgroundColor = "green";
        }

        // Set the starter's health-bar width to match its HP percentage. 
        const starterBar = document.querySelector("#starter-hp-fill");
        starterBar.style.width = `${starterHpPercent}%`;

        // Use a color that indicates how much HP the starter has left
        if (starterHpPercent <= 20) {
            starterBar.style.backgroundColor = "red";
        } else if (starterHpPercent <= 50) {
            starterBar.style.backgroundColor = "yellow";
        } else {
            starterBar.style.backgroundColor = "green";
        }
        
        // Display the starter's name and current/max HP in the battle section.
        encounterStarterName.textContent = state.starter.name;

        encounterStarterHP.textContent = 
            `${state.starter.currentHitPoints}/${state.starter.maximumHitPoints}`;
        
        // Set the wild Pokémon image and provide its name as alternative text
        encounterImage.src = 
            `assets/${state.activeEncounter.name}.png`;

        encounterImage.alt = state.activeEncounter.name;

        // Display the starter's back-facing battle sprite.
        starterBattleSprite.src =
            `assets/${state.starter.name}-back.png`;
    }

    // Display how many Pokémon the player has caught.
    caughtOutput.textContent = state.caughtPokemon.length

    // This assigns the current status text back to itself
    state.statusMessage.textContent = state.statusMessage.textContent;

    // Redraw the map so its display reflects the latest game state.
    renderMap();

    // Prevent movement while an encounter is active.
    northButton.disabled = encounterActive;
    southButton.disabled = encounterActive;
    westButton.disabled = encounterActive;
    eastButton.disabled = encounterActive;
}