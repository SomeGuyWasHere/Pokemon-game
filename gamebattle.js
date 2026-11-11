// Import the shared battle state, controls, rendering and lookup functions,
// and the battle images needed to update the interface.
import { state, attackButton, catchButton, runButton, 
        renderGame, findCaughtPokemon, northButton,
        encounterImage, starterBattleSprite } from "./shared.js";

// Import the trainer's starting position and the lookup table for move details.
import { startingPosition, moveDefinitions } from "./gamedata.js";

// Import the random test roll, damage formula, and type matchup calculation
import { testMathRoll, calculateDamage, getTypeEffectiveness } from "./gamestats.js";

// Choose one move at random from a Pokémon's move IDs and return its full
// definition, which contians details such as name, power, type, and category.
export function getRandomMove(pokemon) {
    const randomIndex = Math.floor(Math.random() * pokemon.moves.length);
    const moveId = pokemon.moves[randomIndex];
    return moveDefinitions[moveId];
}

// Convert the move's type-effectiveness multiplier into a message for the
// battle status. Neutral effectiveness does not add an extra message.
function getEffectivenessMessage(move, target) {
    const effectiveness = getTypeEffectiveness(move.type, target.type);

    if (effectiveness > 1) {
        return " It was super effective";
    }

    if (effectiveness === 0) {
        return " It had no effect!";
    }

    if (effectiveness < 1) {
        return " It was not very effective.";
    }

    return "";
}

// Resolve one Turn of attacks between the starter and the wild Pokémon.
// Stop if no encounter is active, otherwise choose both moves, animate attacks,
// apply damage in sequence, and handle fainting or return control to the player.
export function attack() {
    // Do nothing if there is no wild Pokémon to battle.
    if (state.activeEncounter === null) {
        return;
    }

    // Keep references to both combatants for the duration of this turn.
    const wildPokemon = state.activeEncounter;
    const starterPokemon = state.starter;
    let battleMessage = "";

    // Disabble actions while the attack sequence is underway to prevent another
    // battle action from being started during the animations and delays.
    attackButton.disabled = true;
    catchButton.disabled = true;
    runButton.disabled = true;

    // Choose a move for each Pokemon before starting the attack sequence
    const starterMove = getRandomMove(starterPokemon);
    const wildMove = getRandomMove(wildPokemon);

    // Read each move's priority, treating a missing or zero-like priority as 0.
    const starterPriority = starterMove.priority || 0;
    const wildPriority = wildMove.priority || 0;

    // This value is set below to indicate which Pokemon should attack first.
    let starterGoesFirst;

    // Compare move priorities. The speed checks bleow also assign this value.
    if (starterPriority > wildPriority) {
        starterGoesFirst = true;
    } else if (wildPriority > starterPriority) {
        starterGoesFirst = false
    } 

    // Compare the Pokemon's speeds to choose attack order when their speeds differ.
    if (starterPokemon.speed > wildPokemon.speed) {
        starterGoesFirst = true;
    } else if (wildPokemon.speed > starterPokemon.speed) {
        starterGoesFirst = false;
    } else {
        // When speeds tie, this expression determines who acts first.
        starterGoesFirst = testMathRoll === 1;
    }

    // Perform one attack. Choose the attacker and target, play the attack
    // animation, calculate and apply damage,  update the status, then call nextStep
    function doAttack(starterIsAttacking, move, nextStep) {
        let attacker;
        let target;
        let image;
        let className;

        // Select the correct combatant, target, image, and animation class.
        if (starterIsAttacking) {
            attacker = starterPokemon;
            target = wildPokemon;
            image = starterBattleSprite;
            className = "starter-attacking";
        } else {
            attacker = wildPokemon;
            target = starterPokemon;
            image = encounterImage;
            className = "encounter-attacking";
        }

        // Add the CSS class that plays this Pokemon's attack animation.
        image.classList.add(className);

        // Wait for the 0.4-seconds animation to finish before applying damage.
        setTimeout(function () {
            // Remove the animation class so it can play again on a future turn.
            image.classList.remove(className);

            let damage;
            
            // One-hit-KO moves remove all remaining HP; other moves use the
            // normal damage formula with the move's category and type.
            if (move.oneHitKO) {
                damage = target.currentHitPoints;
            } else {
                damage = calculateDamage(
                    attacker,
                    target,
                    move.power,
                    move.category === "special",
                    move.type
                );
            }

            // Reduce HP without allowing it to fall blew zero.
            target.currentHitPoints = Math.max(
                0,
                target.currentHitPoints - damage
            );

            // Add this attack's to the message for the current turn.
            battleMessage +=
                `${attacker.name} used ${move.name} and dealt ${damage} damage. ` +
                getEffectivenessMessage(move, target) + " " +
                `${target.name} has ${target.currentHitPoints} HP remaining. `;
            
            // Show the latest battle message and redraw the Pokemon and health bars.
            state.statusMessage.textContent = battleMessage;
            renderGame();

            // Keep the action buttons disabled while this turn is in progress.
            attackButton.disabled = true;
            catchButton.disabled = true;
            runButton.disabled = true;

            // Continue with the next attack or the end-of-turn check
            nextStep();
        }, 400);
    }

    // Check whether either Pokemon fainted after the attacks. If the battle
    // continues, redraw the page and truen focus to the attack control.
    function finishBattle() {
        // End the encountewr if the wild Pokemon has been defeated.
        if (wildPokemon.currentHitPoints <= 0) {
            wildPokemon.currentHitPoints = 0;
            state.statusMessage.textContent =
            `${battleMessage}${wildPokemon.name} fainted!`;
            
            // Delay the fanting animation, then remove the encounter and redraw.
            setTimeout(function () {
                encounterImage.classList.add("fainting");

                setTimeout(function () {
                    encounterImage.classList.remove("fainting");
                    state.activeEncounter = null;
                    renderGame();
                }, 600);
            }, 900)

            return;
        }

        // If the starter fainted, animate it, heal it, return to the start, and
        // close the encounter after the animation finishes.
        if (starterPokemon.currentHitPoints <= 0) {
            starterPokemon.currentHitPoints = 0
            state.statusMessage.textContent = 
                `${battleMessage}${starterPokemon.name} fainted! ` +
                "You return to the Pokémon Center and were healed";
            
            setTimeout(function () {
                starterBattleSprite.classList.add("fainting");
                setTimeout(function () {
                    starterBattleSprite.classList.remove("fainting");
                    starterPokemon.currentHitPoints =
                        starterPokemon.maximumHitPoints;
                    
                    state.mapPosition = {
                        row: startingPosition.row,
                        column: startingPosition.column,
                    };

                    state.activeEncounter = null;
                    renderGame();
                }, 600);
            }, 900);

            return;
        }

        // If neither pokemon fainted, refresh the battle display and focus Attack.
        renderGame();
        attackButton.focus();
    }

    // Arrange the selected moves according to the chosen turn order.
    let firstMove;
    let secondMove;

    if (starterGoesFirst) {
        firstMove = starterMove;
        secondMove = wildMove;
    } else {
        firstMove = wildMove;
        secondMove = starterMove;
    }

    // Perfrom the first attack. if the both pokemon are still standing, wait briefly
    // and let the other Pokemon attack before finishing the turn.
    doAttack(starterGoesFirst, firstMove, function () {
        if (
            wildPokemon.currentHitPoints <= 0 ||
            starterPokemon.currentHitPoints <= 0
        ) {
            finishBattle();
            return;
        }

        //Pause briefly before the other Pokémon attacks.
        setTimeout(function () {
            doAttack(!starterGoesFirst, secondMove, finishBattle);
        }, 300);
    });
}

// Try to catch the active wild Pokemon. the catch chance increases as its HP
// decreases. If the attempt fails, the wild Pokemon attacks; if it succeeds,
// add it to the caught list unless it has already been caught.
export function tryToCatch() {
    // Do noting if noo wild Pokemon is currently active.
    if (state.activeEncounter === null) {
        return;
    }

    // Keep references to the Pokemon involved in this encounter. 
    const wildPokemon = state.activeEncounter;
    const starterPokemon = state.starter;

    // Calculate the wild Pokemon's remaining HP ratio. A lower ratio increases
    // the catch chance, which ranges from 20% at full HP to 100% at zero HP 
    const hpPercent =
        wildPokemon.currentHitPoints / wildPokemon.maximumHitPoints;
    const catchChance = 20 + (1 - hpPercent) * 80;
    const catchRoll = Math.random() * 100;

    // If the roll is too high, the catch fails.
    if (catchRoll >= catchChance) {
        const move = getRandomMove(wildPokemon);

        let damage

        // Apply all remaining HP as damage for a one-hit-KO move; otherwise
        // calculate damage using the move's power, category, and type.
        if (move.oneHitKO) {
            damage = starterPokemon.currentHitPoints;
        } else {
            damage = calculateDamage(
                wildPokemon,
                starterPokemon,
                move.power,
                move.category === "special",
                move.type
            );
        }

        // Reduce the starter's HP without allowing it to become negative.
        starterPokemon.currentHitPoints = Math.max(
            0,
            starterPokemon.currentHitPoints - damage
        );

        // Explain the failed catch, the wild Pokemon's counterattack and the
        // starter's remaining HP in the status message.
        state.statusMessage.textContent =
            `The catch failed (${catchChance.toFixed(0)}% chance). ` +
            `${wildPokemon.name} used ${move.name} and dealt ${damage} damage.` +
            getEffectivenessMessage(move, starterPokemon) + " " +
            `${starterPokemon.name} has ${starterPokemon.currentHitPoints} HP remaining. `;
        

        // If the starter fainted, heal it, return the trainer to the starting
        // position, and end the encounter.
        if (starterPokemon.currentHitPoints <= 0) {
            state.mapPosition = {
                row: startingPosition.row,
                column: startingPosition.column,
            };

            state.activeEncounter = null;
            starterPokemon.currentHitPoints = starterPokemon.maximumHitPoints;

            // Append the fainting and healing outcome to the existing message.
            state.statusMessage.textContent +=
                ` ${starterPokemon.name} fainted and was healed at the Pokémon Center.`;
        }

        // Refresh the display, then focus the next relevant control:
        // Catch again if battle continues, or North if the encounter ended.
        renderGame();

        if (state.activeEncounter !== null) {
            catchButton.focus();
        } else {
            northButton.focus();
        }

        return;
    }

    // The catch succeeded, Store only the information needed for the caught list.
    const caughtRecord = {
        pokedexNumber: wildPokemon.pokedexNumber,
        name: wildPokemon.name,
    };

    // Check whether this Pokedex entry is already in the player's caught list.
    const existingPokemon = findCaughtPokemon(
        caughtRecord.pokedexNumber
    );

    // Add a new Pokemon to the list, or report that it was already caught.
    if (existingPokemon === null) {
        state.caughtPokemon.push(caughtRecord);
        state.statusMessage.textContent =
            `${caughtRecord.name} was caught!`;
    } else {
        state.statusMessage.textContent =
            `You encountered ${caughtRecord.name}, but you've already caught it before.`;
    }

    // Close the encounter, refresh the display, and return focus to movement.
    state.activeEncounter = null;

    renderGame();
    northButton.focus();
}

// Try to escape the current encounter. A speed advantage allows immediate escape;
// otherwise the random test decides whether escape succeeds. If it fails, the
// wild Pokemon attacks and the result is reported.
export function run(){
    // There is nothing to run from if no encounter is active.
    if (state.activeEncounter === null) {
        return;
    }
    
    // Keep references to the combatants to their stats and HP can be updated.
    const wildPokemon = state.activeEncounter;
    const starterPokemon = state.starter;

    // If the wild Pokemon  is no faster than the starter, escape succeeds directly.
    if (wildPokemon.speed <= starterPokemon.speed) {
        state.activeEncounter = null;
        state.statusMessage.textContent = "You got away safely";

        renderGame();
        northButton.focus();
        return;
    }

    // When the wild Pokemon is faster, use the random run check.
    const runCheck = testMathRoll();

    // A successful roll ends the encounter and restores focus to movement.
    if (runCheck === 2) {
        state.activeEncounter = null;
        state.statusMessage.textContent = "You got away safely";

        renderGame();
        northButton.focus();
        return;
    }

    // Escape failed, so the wild Pokemon selectes a move and counterattacks.
    const move = getRandomMove(wildPokemon);

    let damage;

    // A one-hit-KO move uses all of the starter's remaining HP as damage;
    // other moves use the standard damage calculation.
    if (move.oneHitKO) {
        damage = starterPokemon.currentHitPoints;
    } else {
        damage = calculateDamage(
            wildPokemon,
            starterPokemon,
            move.power,
            move.category === "special",
            move.type
        );  
    }

    // Reduce starter's HP, keeping the value at zero or higher.
    starterPokemon.currentHitPoints = Math.max(
        0,
        starterPokemon.currentHitPoints - damage
    );

    // If the starter faints, heal it, return to the starting position, and end
    // the encounter. Otherwise, report the failed escape and remaining HP.
    if (starterPokemon.currentHitPoints <= 0) {
        starterPokemon.currentHitPoints = starterPokemon.maximumHitPoints;

        state.mapPosition = {
            row: startingPosition.row,
            column: startingPosition.column,
        };

        state.activeEncounter = null;

        state.statusMessage.textContent =
            `${wildPokemon.name} used ${move.name} and dealt ${damage} damage. ` +
            getEffectivenessMessage(move, starterPokemon) + " " +
            `${starterPokemon.name} fainted and was healed at the Pokémon Center.`;
    } else {
        state.statusMessage.textContent =
            `You couldn't get away! ${wildPokemon.name} used ${move.name} and dealt ${damage} damage. ` +
            getEffectivenessMessage(move, starterPokemon) + " " +
            `${starterPokemon.name} has ${starterPokemon.currentHitPoints} HP remaining.`;
    }

    // Update the display, then focus Run if the encounter contiunues or North
    // if the encounter ended.
    renderGame();

    if (state.activeEncounter !== null) {
        runButton.focus();
    } else {
        northButton.focus();
    }
}