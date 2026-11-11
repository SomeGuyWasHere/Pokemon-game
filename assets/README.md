All information comes from the site pokemondb and all the pictures for the pokemon comes from pokemon.com and the battle background comes from spriters-resource
pokemondb.net www.pokemon.com www.spriters-resource.com

Starter option: Treecko #0252 Grass, picture downloaded 28/09/2026
Starter option: Torchic #0255 Fire, picture downloaded 28/09/2026
Starter option: Mudkip  #0258 Water, picture downloaded 28/09/2026
Wild encounter: Poochyena #0261 Dark, picture downloaded 28/09/2026
Wild encounter: Ralts   #0280 Psychic, Fairy, picture downloaded 28/09/2026
Wild encounter: Slakoth #0287 Normal, picture downloaded 28/09/2026
Wild encounter: Aron    #0304 Steel, Rock, picture downloaded 28/09/2026
Wild encounter: Trapinch #0328 Ground, picture downloaded 28/09/2026
Wild encounter: Beldum   #0374 Steel Psychic, picture downloaded 28/09/2026

Encounter percentage and decimal threshold: 25%; 0.25
Chance values that succeed: 13, 10, 2
Encounter-list length: 3
Valid indexes: 0, 1, 2
Known test species: #0280, #0374, #0304

Battle rules:
Player attack damage: 6 hp.
Wild Pokémon damage: 3 hp.
Capture threshold: 10 hp.
Minimum wild HP: 0 hp.
Starter HP after fainting: 100%.
Recovery position: Center.

Important rules:
The player attacks first.
If the wild pokémon reaches 0 hp, the encounter ends immediately. It must not retaliate.
If it survives, it responds with one attack.
if the starter faints, return to the Center and fully heal it.
A PokéBall succeeds when wild HP is 10 or lower including exactly 10.
Running ends the encounter wihtout changing either Pokémon's HP or the caught collection.
A successfull capture saves the Pokémon's Pokédex number and name as a pending handoff.

Interactive Battle Test Report

Fixed Battle Rules:
    Player damage: 6 HP
    Wild Pokémon damage: 3 HP
    Capture Threshold: 14 HP
    Wild HP cannot fall below 0.
    A defeated wild Pokémon does not retaliate.
    A fainted starter returns to Center and is fully healed.

Transition Table:

Test Route:      Before decisive action:                                      Expected result:
Ralts, 28 HP     Four attacks puts it to 4 HP; fifth Attack removes 4         Wild HP becomes exactly 0; encounter ends; no fifth wild response
Beldum, 40 HP    six attacks puts it to 4 HP; seventh Attack removes 8        Wild HP clamped to 0; encounter ends; no seventh wild response
Aron, 50 HP      six attacks puts it to 14                                    Capture succeeds at the threshold
Ralts, 28 HP     five attacks puts it to 4 HP                                 Capture succeeds below the threshold
Beldum, 40 HP    no attacks yet; wild HP is 30                                Capture fails above the threshold; HP and collection remain unchanged
Beldum, 40 HP    starter HP is set 6 before the first attack                  Mareep survives; responds once; starter faints, returns to Center, and is fully healed

Additional Action Checks:
    Successful Attack that leaves the wild Pokémon alive: both HP values update, and Attack retauns focus.
    Failed PokéBall: Throw PokéBall retains focus.
    Successful capture: Pokémon name and Pokédex number are saved; encounter ends; North receives focus.
    Run: encounter ends without changing HP or collection; North receives focus.
    Starter fainting: position resets to Center, starter HP is restored, encounter ends, and North receives focus.

Controlled Fainting Test:
    1. Start a fresh trainer.
    2. Start a known Beldum encounter.
    3. In DevTools, set the changing starter record's currentHitPoints to 6.
    4. Call renderGame().
    5. Activate Attack through the normal UI.
    6. Verify Beldum responds once and the starter faints and recovers.
    7. Reload and start a fresh trainer after the test.

Results:
Record each test as Pass or FAIL after running it. Note any unexpected status message, HP change, collection change, or focus destination.

Collection before the catch:            Confirmed species:      Collection after the catch:     Visible result:
Empty                                   First number            One record                      One entry, total(1), added status
Contains the first number               Different number        Two records                     Two entries, total(2) added status
Contains the first and second numbers   First number again      The same two records            Two entries, total(2) already-recorded status



MISC:

hardcode base stats: done
battle screen layout: done
damage formulars: done
priority mechanic: done
catch procentage: done
speed mechanic: done
add moves: done



moves to add:

tackle: priority = 0
peck: priority = 0
pound: priority = 0
quick attack: priority = +1
ember: priority = 0
razor leaf: priority = 0
mud-slap: priority = 0
water-gun: priority = 0
pursuit: priority = 0
bite: priority = 0
ice fang: priority = 0
confusion: priority = 0
mystical fire: priority = 0
aerial ace: priority = 0
dragonbreath: priority = 0
rock-tomb: priority = 0
shadow ball: priority = 0
hyper voice: priority = 0
disarming voice: priority = 0
thunder punch: priority = 0
headbutt: priority = 0
Brick Break: priority = 0
Flamethrower: priority = 0
Shadow Claw: priority = 0
metal claw: priority = 0
iron tail: priority = 0
Earth Power: priority = 0
Earthquake: priority = 0
fissure: priority = 0
Crunch: priority = 0
Superpower: priority = 0
Steel Beam: priority = 0
Iron Head: priority = 0
Facade: priority = 0

moves to pokemon:
torchic: peck, ember, quick attack, aerial ace,
treecko: pound, razor leaf, pursuit, dragon breath
mudkip: tackle, mud-slap, water gun, rock-tomb
poochyena: bite, ice fang, shadow ball, hyper voice
ralts: confusion, mystical fire, thunder punch, disarming voice
slakoth: headbutt, Brick Break, Flamethrower, Shadow Claw
aron: metal claw, iron tail, Earthquake, Earth Power
trapinch: fissure, crunch, Superpower, mud-slap
beldum: Steel Beam, tackle, Iron Head, Facade

