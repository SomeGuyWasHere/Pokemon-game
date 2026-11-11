// Import the configured starting location and each starter Pokémon's move pool.
import { startingPosition, pokemonMovePools } from './gamedata.js'

// Import helpers for choosing a nature and calculating a Pokémon's battle.
import { getRandomNature, calculatePokemonStats } from './gamestats.js';

// Import the shared game state, functions that update the page, and the HTML
// elements this module needs to handle form submission and player actions.
import { state, findStarterDefinition, renderMap, renderGame,
        gameStartForm, trainerNameInput, trainerError, starterChoiceOption, starterError, 
        northButton, southButton, westButton, eastButton, attackButton,
        catchButton, runButton, } from './shared.js';

// Importthe function that moves the trainer on the overworld map.
import { moveTrainer } from './gamemap.js';

// Import the function that handle the three available battle action.
import { attack, tryToCatch, run } from './gamebattle.js';

// Handle the submission of the trainer setup form. Validate the entered name and
// starter, create the starter with a random nature and calculated stats,
// initialize game state, then update the page and move keyboard focus.
function handleStartButton(event){
    // Prevent the form's default page-roload behavior so the game can start
    // without navigating away form the current page.
    event.preventDefault();

    // Remove speces from the beginning and end before validating the name.
    const trainerName = trainerNameInput.value.trim();

    // Require a name containing at least one non-whitespace character.
    // Mark the field invalid, explain the problem, fous it and stop setup
    if (trainerName === "") {
        trainerNameInput.setAttribute("aria-invalid", "true");
        trainerError.textContent = "Enter a fictional name.";
        trainerNameInput.focus();
        return;
    }

    // Clear the invalid state and previous message after the name is valid.
    trainerNameInput.removeAttribute("aria-invalid");
    trainerError.textContent = "";

    // Read the starter ID selected in the form.
    const starterChoice = starterChoiceOption.value;

    // Require the player to choose a starter before starting game.
    if (starterChoice === "") {
        starterChoiceOption.setAttribute("aria-invalid", "true");
        starterError.textContent = "Choose a starter Pokémon.";
        starterChoiceOption.focus();
        return;
    }

    // Clear the invalid state and previous error message after a choice is made.
    starterChoiceOption.removeAttribute("aria-invalid");
    starterError.textContent = "";

    // Look up the selected starter's base information in the game data.
    const selectedStarter = findStarterDefinition(starterChoice);

    // Handle an invalid or unknown starter ID without initializing incomplete data.
    if (selectedStarter === null) {
        starterError.textContent = "That starter doesn't exist.";
        return;
    }

    // Save the validated trainer name in the shared game state.
    state.trainerName = trainerName.trim();

    // Give the starter a randomly selected nature for this game.
    const randomNature = getRandomNature();

    // Copy the starter's base data and include its selected nature.
    // These values are used to calculate the starter's actual battle stats.
    const starterWithNature = {
        id: selectedStarter.id,
        name: selectedStarter.name,
        type: selectedStarter.type,
        maximumHitPoints: selectedStarter.maximumHitPoints,
        attack: selectedStarter.attack,
        defence: selectedStarter.defence,
        sp_atk: selectedStarter.sp_atk,
        sp_def: selectedStarter.sp_def,
        speed: selectedStarter.speed,
        level: selectedStarter.level,
        ivs: selectedStarter.ivs,
        evs: selectedStarter.evs,
        nature: randomNature.id,
    };

    // Calculate the starter's maximum HP and other battle stats using its
    // base stats, level, IVs, EVs, and nature.
    const calculateStats = calculatePokemonStats(starterWithNature);

    // Create the live starter object used by the game. Store its calculated
    // stats, a separate copy of its move list, and full HP at the start.
    state.starter = {
        id: starterWithNature.id,
        name: starterWithNature.name,
        type: starterWithNature.type,
        level: starterWithNature.level,
        nature: starterWithNature.nature,
        maximumHitPoints: calculateStats.maximumHitPoints,
        attack: calculateStats.attack,
        defence: calculateStats.defence,
        sp_atk: calculateStats.sp_atk,
        sp_def: calculateStats.sp_def,
        speed: calculateStats.speed,
        moves: pokemonMovePools[starterWithNature.id].slice(),
        currentHitPoints: calculateStats.maximumHitPoints,
    };

    // Place the trainer at the configured starting row and column.
    state.mapPosition = {
        row: startingPosition.row,
        column: startingPosition.column,
    };

    // Ensure the new game starts without an active wild Pokémon encounter.
    state.activeEncounter = null;

    // Starts the new game with an empty list of caught Pokémon.
    state.caughtPokemon = [];

    // Announce that the trainer and starter are ready to explore.
    state.statusMessage.textContent = 
        `${state.trainerName} and ${state.starter.name} are ready to explore`;

    // Refresh all displayed game information, then focus the first movement
    // control so the player can continue using the keyboard.
    renderGame();
    northButton.focus()
}

// Start a new game when the trainer setup is submitted.
gameStartForm.addEventListener("submit", handleStartButton);

// Connect each movement button to the trainer movement function.
// The direction nmame is used iun messages and animation; the numeric offsets
// determine the destination tile.
northButton.addEventListener("click", () => {
    moveTrainer("north", 0, -1);
});
southButton.addEventListener("click", () => {
    moveTrainer("south", 0, +1);
});
westButton.addEventListener("click", () => {
    moveTrainer("west", -1, 0);
});
eastButton.addEventListener("click", () => {
    moveTrainer("east", +1, 0);
});

// Connect the battle button to their respective action handlers.
attackButton.addEventListener("click", attack);
catchButton.addEventListener("click", tryToCatch);
runButton.addEventListener("click", run);

// Draw the map and initial game display when this module loads.
renderMap();
renderGame();