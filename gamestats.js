// Import the nature definitions used for stat modifiers and the type matchup
// table used to adjust damage.
import { natures, typeEffectiveness, } from "./gamedata.js";

// select and return one nature at random from the configured nature list.
export function getRandomNature() {
    // Math.random() gives a value from 0 up to (but not including) 1.
    // Multiplying by the lists length and rounding down gives a valid array index.
    const randomIndex = Math.floor(Math.random() * natures.length);
    return natures[randomIndex];
}

// Calculate maximum HP from the Pokemon's base HP, individual value (IV),
// effort value (EV), and level.
export function calculateHP(base, iv, ev, level) {
    // Divide EV by 4 and round down, then apply the HP stat formula.
    // The final additions account for the Pokemon's level and the HP base amount.
    return Math.floor(
        ((2 * base + iv + Math.floor(ev/ 4)) * level) / 100
    ) + level + 10;
}

// Calculate a non-HP stat using its base value, IV, EV, and level.
// Apply the nature multiplier after calculating the unmodified stat.
export function calculateStat(base, iv, ev, level, natureMultiplier){
    // Calculate the stat before applying a nature's bonus or penalty.
    const rawStat = Math.floor(
        ((2 * base + iv + Math.floor(ev / 4)) * level) / 100
    ) + 5;

    return Math.floor(rawStat * natureMultiplier);
}

// Return multiplier a nature gives to a particular stat:
// 1.1 for a boosted stat, 0.9 for a reduced stat, or 1.0 otherwise.
export function getNatureMultiplier(nature, stat){
    // Find the nature by its ID, ignoring letter case in the supplied vale.
    const selectedNature = natures.find(
        entry => entry.id === nature.toLowerCase()
    );

    // A nature ID must exist in the game data; fail clearly if it does not.
    if (!selectedNature) {
        throw new Error(`Unknown nature ${nature}`);
    }

    // Increase the stat that this nature boosts by 10%.
    if (selectedNature.buff === stat) {
        return 1.1;
    }

    // Decrease the stat that this nature lowers by 10%.
    if (selectedNature.drops === stat) {
        return 0.9;
    }

    // This nature does not modify the requested stat.
    return 1.0;
}

// Calculate and return all battle stats for a Pokemon, using its level,
// individual values, effort values, and nature.
export function calculatePokemonStats(pokemon) {
    // Reuse the same level for each of the Pokemon's stat calculations.
    const level = pokemon.level;

    return {
        // HP has its own formula and is not modified by nature here.
        maximumHitPoints: calculateHP(
            pokemon.maximumHitPoints,
            pokemon.ivs.hp,
            pokemon.evs.hp,
            level
        ),

        // For each remaining stat, calculate its value and apply the nature's
        // multiplier for that specific stat.
        attack: calculateStat(
            pokemon.attack,
            pokemon.ivs.attack,
            pokemon.evs.attack,
            level,
            getNatureMultiplier(pokemon.nature, "attack")
        ),
        defence: calculateStat(
            pokemon.defence,
            pokemon.ivs.defence,
            pokemon.evs.defence,
            level,
            getNatureMultiplier(pokemon.nature, "defence")
        ),
        sp_atk: calculateStat(
            pokemon.sp_atk,
            pokemon.ivs.sp_atk,
            pokemon.evs.sp_atk,
            level,
            getNatureMultiplier(pokemon.nature, "sp_atk")
        ),
        sp_def: calculateStat(
            pokemon.sp_def,
            pokemon.ivs.sp_def,
            pokemon.evs.sp_def,
            level,
            getNatureMultiplier(pokemon.nature, "sp_def")
        ),
        speed: calculateStat(
            pokemon.speed,
            pokemon.ivs.speed,
            pokemon.evs.speed,
            level,
            getNatureMultiplier(pokemon.nature, "speed")
        ),
    };
}

// Calculate damage from an attack using the attacker's level and relevant attack
// stat, the defender's matching defence stat, move power, and type effectiveness.
// Optinal arguments default to a physical move and the attacker's type
export function calculateDamage(attacker, defender, movePower, isSpecial, moveType) {

    // Treat an omitted special/physical flag as a physical move
    if (isSpecial === undefined) {
        isSpecial = false;
    }

    // If no move type was provided, use the attacker's type as the move type.
    if (moveType === undefined) {
        moveType = attacker.type;
    }

    let attackStat;

    // Special moves use Special Attack; physical moves use Attack.
    if (isSpecial) {
        attackStat = attacker.sp_atk;
    } else {
        attackStat = attacker.attack;
    }

    let defenceStat;

    // Special moves are resisted by Special Defence; physical moves by Defence.
    if (isSpecial) {
        defenceStat = defender.sp_def;
    } else {
        defenceStat = defender.defence;
    }

    // Calculate base damage using the combatans' stats' attacker's level,
    // and the move's power. Math.max prevents divistion by zero if Defence is 0.
    const baseDamage = Math.floor(
        (
            (
                (2 * attacker.level / 5 + 2)
                * movePower
                * attackStat
                / Math.max(1, defenceStat)
            ) / 50
        ) + 2
    );

    // Find how effective the move's type against the defender's type.
    const effectiveness = getTypeEffectiveness(
        moveType,
        defender.type
    );

    // Apply the matchup mukltiplier and round the final damage down.
    return Math.floor(baseDamage * effectiveness);
}

// Return the move's type-effectiveness multiplier against the defender's type
// or types. Dual-type matchups combine the multipliers for each type.
export function getTypeEffectiveness(moveType, defenderTypes) {
    // Start at neutral effectiveness. Unlisted matchups remain at 1.
    let multiplier = 1;

    // A defender with multiple types is checked against ech type.
    if (Array.isArray(defenderTypes)) {
        for (const type of defenderTypes) {
            let effectiveness;

            // Look up this move type's matchup against the current defender type.
            if (typeEffectiveness[moveType]) {
                effectiveness = typeEffectiveness[moveType][type]
            }

            // Multiply in a defined matchup. Missing entries leave the current
            // multipler unchanged, treating that matchup as neutral.
            if (effectiveness !== undefined) {
                multiplier *= effectiveness;
            }
        }
    } else {
        // For a single-type defender, look up its one matchup multiplier.
        let effectiveness;

        if (typeEffectiveness[moveType]) {
            effectiveness = typeEffectiveness[moveType][defenderTypes];
        }

        // Use the defined value if present; otherwise keep neutral effectiveness.
        if (effectiveness !== undefined) {
            multiplier = effectiveness;
        }
    }

    return multiplier;
}


// Generate and return a random integer from 1 through 2 for battle logic.
export function testMathRoll(){
    const roll = [1, 2];

    // Scale a random value to select one of the two outcomes.
    const random = Math.floor(Math.random() * roll.length + 1);
    return random;
}