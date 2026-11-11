"use strict";

// Find the Pokedex filter region and the controls it contains. The page uses
// these elements to let the plauer filter Pokemon cards by type and display the
// current visible count.
const filterRegion = document.querySelector("#pokedex-filter");
const typeFilter = document.querySelector("#type-filter");
const filterStatus = document.querySelector("#filter-status");
const pokemonEntries = document.querySelectorAll(".pokemonbox");

// Check that all required Pokedex elements exit before running the filter logic.
// If any are missing, fail immediately so the developer can fix the markup.
if (
    !filterRegion
    || !typeFilter
    || !filterStatus
    || pokemonEntries.length === 0
) {
    throw new Error("Required Pokédex filter elements are missing.");
}

// Update the visible Pokemon cards based on the selected type.
// The selected type is compared against each card's `data-types` attribute.
function updatePokedex() {
    // Read the user-selected type filter "all" means no filtering.
    const selectedType = typeFilter.value;

    // Track how many Pokemon cards are currently visble.
    let visibleCount = 0;

    // Loop through every Pokemon card and decide whether it matches the filter.
    for (const entry of pokemonEntries) {
        // The card stores multiple types as a space-separated string, like:
        // "grass fire" or "steel rock"
        const entryTypes = entry.dataset.types.split(" ");

        // Match the card when the filter is "all" or the selected type is one of
        // the card's listed types.
        const matchesType = selectedType === "all" || entryTypes.includes(selectedType);

        // Hide cards that do not match, and show cards that do.
        entry.hidden = !matchesType;

        // Count the visible entries so the status text can report the total.
        if (matchesType) {
            visibleCount += 1;
        }
    }

    // Update the visible count in the status paragraph.
    filterStatus.textContent = `Showing ${visibleCount} of ${pokemonEntries.length} Pokémon.`;
}

// Start the filter in the "all types" mode when the page loads.
typeFilter.value = "all";

// Re-run the filter whenever the user changes the selected type.
typeFilter.addEventListener("change", updatePokedex);

// Render initial filtered state immediately when the script loads.
updatePokedex();

// Reveal the Pokedex filter section now that it has been initialized.
filterRegion.hidden = false;