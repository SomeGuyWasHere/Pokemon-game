// Import the shared state, map lookup and rendering functions, and the battle
// elements needed to display and focus a new encounter.
import { state, findMapTile, renderGame, encounterHeading, encounterSection } from "./shared.js";

// Import the encounter configuration and Pokemon data used to create wild
// Pokemon and their available move.
import { encounterTestMode, encounterDefinitions, 
        knownEncounterPokedexNumber, pokemonMovePools } from "./gamedata.js";

// Import helpers for assigning a nature and calculating a Pokemon's battle stats.
import { getRandomNature, calculatePokemonStats } from "./gamestats.js";

// Play the visual entrance for a new encounter by temporarily adding the CSS
// class that triggers its animation.
function playBattleEntrance() {
    // Add the class that starts the entrance animation.
    encounterSection.classList.add("battle-entering");

    // Remove the class so the animation can play for the next encounter.
    setTimeout(function () {
        encounterSection.classList.remove("battle-entering");
    }, 1200);
}

// Move the trainer by the requested row and column offsets. Movement is ignored
// before the game starts and during an encounter. Valid destinations may be
// ordinary terrain, a Pokemon Center, or grass where an encounter can occur.
export function moveTrainer(directionName, rowChange, columnChange) {
    // A trainer cannot move until the game has initialized their position.
    if (state.mapPosition === null){
        return;
    }

    // Prevent movement while the player is in a battle encounter.
    if (state.activeEncounter !== null){
        return;
    }

    // Calculate the proposed destination using using the current position and the
    // row/column offset associated with the selected direction.
    const destinationRow = state.mapPosition.row + rowChange;
    const destinationColumn = state.mapPosition.column + columnChange;

    // Look up the map tile at the propsed destination.
    const destinationTile = findMapTile(
        destinationRow,
        destinationColumn
    );
    
    // If there is no tile at these coordinates, the destination is outside
    // the map. Show a message and redraw the interface.
    if (destinationTile === null) {
        state.statusMessage.textContent =
            `Cannot move ${directionName}: that destination is outside the map.`;
        renderGame();
        return;
    }

    // Block movement onto tiles whose terrain ID is "X".
    if (destinationTile.terrain === "X") {
        state.statusMessage.textContent =
            `Cannot move ${directionName}: that destination is blocked`;
        renderGame();
        return;
    }

    // Save the direction so the map renderer can apply the matching movement
    // animation to the trainer sprite.
    state.trainerMoveDirection = directionName;

    // A "C" tile represents the Pokemon Center. Move there and heal the starter
    // if its current HP is below its maximum.
    if (destinationTile.terrain === "C"){
        state.mapPosition = {
            row: destinationRow,
            column: destinationColumn,
        };

        // Restore full HP only when the starter needs healing
        if (state.starter.currentHitPoints !== state.starter.maximumHitPoints) {
            state.starter.currentHitPoints = state.starter.maximumHitPoints;
            
            state.statusMessage.textContent = `Your ${state.starter.name} is now fully healed`;
            renderGame();
            return;
        }

        // If the starter was already at the full HP, report that instead.
        state.statusMessage.textContent = `Your ${state.starter.name} is already fully healed`;
        renderGame();
        return;
    }

    // A "G" tile represents grass. Move onto it and determaine whether a wild
    // Pokemon encounter occurs
    if (destinationTile.terrain === "G") {
        state.mapPosition = {
            row: destinationRow,
            column: destinationColumn,
        };

        // Return a wild Pokemon definition or null when no encounter occurs.
        const encounterDefinition = encounterRoll();

        // No encounter occurred, so leave the encounter state empty and update
        // the status and display.
        if (encounterDefinition === null) {
            state.activeEncounter = null;
            state.statusMessage.textContent = "no encounters";
            
            renderGame();
        } else {
            // Give the wild pokemon a randomly selected nature for this encounter.
            const encounterNature = getRandomNature();

            // Copy the encounter's base data and add its nature and randomly
            // selected moves before calculating its final battle stats.
            const wildPokemonData = {
                id: encounterDefinition.id,
                name: encounterDefinition.name,
                pokedexNumber: encounterDefinition.pokedexNumber,
                type: encounterDefinition.type,
                maximumHitPoints: encounterDefinition.maximumHitPoints,
                attack: encounterDefinition.attack,
                defence: encounterDefinition.defence,
                sp_atk: encounterDefinition.sp_atk,
                sp_def: encounterDefinition.sp_def,
                speed: encounterDefinition.speed,
                level: encounterDefinition.level,
                ivs: encounterDefinition.ivs,
                evs: encounterDefinition.evs,
                nature: encounterNature.id,
                moves: rollEncounterMoves(encounterDefinition.id),
            };

            // Calculate HP and other battle stats from the Pokemon's base
            // attributes, level, IVs, EVs, and randomly assigned nature.
            const calculateWildStats = calculatePokemonStats(wildPokemonData);

            // Store the active encounter with calculated stats and full HP
            // This object is used by the battle system and game display.
            state.activeEncounter = {
                id: wildPokemonData.id,
                name: wildPokemonData.name,
                pokedexNumber: wildPokemonData.pokedexNumber,
                type: wildPokemonData.type,
                level: wildPokemonData.level,
                nature: wildPokemonData.nature,
                maximumHitPoints: calculateWildStats.maximumHitPoints,
                attack: calculateWildStats.attack,
                defence: calculateWildStats.defence,
                sp_atk: calculateWildStats.sp_atk,
                sp_def: calculateWildStats.sp_def,
                speed: calculateWildStats.speed,
                ivs: wildPokemonData.ivs,
                evs: wildPokemonData.evs,
                currentHitPoints: calculateWildStats.maximumHitPoints,
                moves: wildPokemonData.moves,
            };
            
            // Display an additional message when the wild Pokemon is faster.
            // Then refresh the display, start the entrance animation, and focus
            // the encounter heading for keyboard and screen reader users.
            if (state.activeEncounter.speed > state.starter.speed){
                state.statusMessage.textContent = 
                `A wild ${encounterDefinition.name} appeared!` +
                `They have a higher speed so they make the first move`;
                
                renderGame();
                playBattleEntrance();
                encounterHeading.focus();
            } else {
                // Display the standard encounter message when the wild Pokemon
                // is not faster than the starter
                state.statusMessage.textContent = 
                `A wild ${encounterDefinition.name} appeared!`;

                renderGame();
                playBattleEntrance();
                encounterHeading.focus();
            }
        }

        // Grass movement has finished processing, whether or not an encounter
        // occurred, so do not continue into the ordinary movement code below.
        return;


    }

    // For ordinary walkable terrain, update the trainer's position.
    state.mapPosition = {
        row: destinationRow,
        column: destinationColumn,
    };

    // Report the destination using one-based coordinates for player-friendly
    // display, then redraw the map and other game information.
    state.statusMessage.textContent = `${directionName} destination proposed: row ${destinationRow + 1}, column ${destinationColumn + 1}.`;

    renderGame();
}

// Choose a random subset of the moves available to this species. Each selected
// move is removed from a temporary copy so the same move is not chosen twice.
function rollEncounterMoves(pokemonId) {
    // Find this Pokemon's configured move pool.
    const movePool = pokemonMovePools[pokemonId];

    // Encounter data must reference a Pokemon with at least one avaliable move.
    if (!movePool || movePool.length === 0) {
        throw new Error(`No moves found for ${pokemonId}`);
    }

    // Copy the pool so selection does not modify the original game data.
    const availableMoves = movePool.slice();

    // Choose a move count from one up to the number available in the pool.
    const numberOfMoves = Math.floor(Math.random() * availableMoves.length) + 1;

    // Collect the randomly selected move IDs here.
    const selectedMoves = [];

    // Selected the requested number of moves without replecement.
    for (let i = 0; i < numberOfMoves; i++) {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        selectedMoves.push(availableMoves[randomIndex]);
        availableMoves.splice(randomIndex, 1);
    }

    return selectedMoves;
}

// Determine whetther a wild encounter occurs and, if so, return its definition.
// The configured test mode can disable encounters, force a specific Pokemon,
// or use the normal random encounter chance and selection.
function encounterRoll(){
    // In normal mode, grass has a 25% chance of producing an encounter.
    const encounterChance = 25;

    // This test mode always prevents a wild encounter.
    if (encounterTestMode === "no-encounter"){
        return null;
    }

    // This text mode always selects the congfigured Pokedex entry.
    if (encounterTestMode === "known-encounter") {
        const matchingEncounters = encounterDefinitions.filter(
            (entry) =>
                entry.pokedexNumber === knownEncounterPokedexNumber
        );

        // Require exactly one match so the test encounter is unambiguous.
        if (matchingEncounters.length !== 1) {
            throw new Error(
                `Expected exactly one encounter with Pokédex number${knownEncounterPokedexNumber}, but found ${matchingEncounters.length}.`
            );
        }

        return matchingEncounters[0];
    }

    // Reject unsupported configuration values instead of silently using an
    // unintended encounter behavior.
    if (encounterTestMode !== "normal") {
        throw new Error(
            `Invalid encounter test mode: ${encounterTestMode}`
        );
    }

    // Roll once to decide whether an encounter happens.
    const chanceRoll = Math.random();

    // Value at or above the configured chance mean no encounter this time.
    if (chanceRoll >= encounterChance / 100){
        return null;
    }

    // Once an encounter occurs, choose one of the configured Pokemon at random
    const encounterIndex = Math.floor(
        Math.random() * encounterDefinitions.length
    );

    return encounterDefinitions[encounterIndex];
}