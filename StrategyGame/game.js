//GAME SETUP
//PLAYER TURN
  // 1. choose character -> show range to move to, show stats
    // 2. choose destination -> move character, show attackable enemies
      // 3. choose attackable enemy -> show battle forecast
        // 4. choose to attack -> perform attack; have enemy die if necessary, go back to 1.
        // 4. choose another attackable enemy -> hide battle forecast, as in (3.)
      // 3. choose wait -> mark character as moved, go back to 1.
    // 2. choose another character -> hide range to move to, hide stats, as in (1.)
    // 2. cancel (choose empty square or same character) -> hide range to move to, hide stats, go back to 1.
  // 1. end turn -> mark all characters as unmoved and change to opponent
//ENEMY TURN
  //(repeat player turn, except current_turn = Alignment.ENEMY)







Y_TILES = 8;
X_TILES = 8;
Tiletype = {
	"EMPTY": "empty"
} //an enum
GamePhase = {
	CHOOSE_CHARACTER: "choose a character to move",
	CHOOSE_DESTINATION: "choose destination to go to",
	CHOOSE_ENEMY: "choose an enemy to attack",
	CHOOSE_ATTACK: "confirm if you want to attack this enemy or not"
} //an enum
SelectionType = {
	"UNSELECTED": "tile_unselected", //not actually a class right now, but it could be
	"SELECTED": "tile_selected",
	"ACCESSIBLE": "tile_accessible",
	"ATTACKABLE": "tile_attackable"
} //both an enum and a dict that converts to class name
Alignment = {
	"PLAYER": "alignment_player",
	"ENEMY": "alignment_enemy"
} //both an enum and a dict that converts to class name
Directionality = {
	"WAZIR": "wazir",
	"FERZ": "ferz",
	"DABBABA": "dabbaba",
	"ALFIL": "alfil"
} //an enum
DIRECTIONALITY_FNC = {};
	DIRECTIONALITY_FNC[Directionality.WAZIR] = getOrthogonalNeighbors;
	DIRECTIONALITY_FNC[Directionality.FERZ] = getNeighbors;
	DIRECTIONALITY_FNC[Directionality.DABBABA] = getDababbaNeighbors;
	DIRECTIONALITY_FNC[Directionality.ALFIL] = function(){throw "ALFIL Unimplemented"};
	//a dict that converts to functions

//internal representations of the map, accessed by map_XXX[y][x], where map_XXX[0][0] is the top left tile
map_tile = []; //contains Tiles
selected_char = null;
selected_char_from = [null, null];
attacked_tile = [null, null];
current_turn = Alignment.PLAYER;
game_phase = GamePhase.CHOOSE_CHARACTER;

/** y and x are the tiles that this character starts on. If it does not start on
 * any time, they should both be null*/
function Character(name, emoji, kanji, stats, y, x, alignment, weapon) {
	// assert preconditions
	if ( (y === null && x !== null) || (x === null && y !== null) ) {
		throw "x and y must either both be null, or neither be null";
	}

	this.name = name;
	this.emoji = emoji;
	this.kanji = kanji;
	this.currHP = stats.HP;
	this.maxHP = stats.HP;
	this.movement = stats.movement;
	this.alignment = alignment;
	this.weapon = weapon;

	//set up div
	this.onscreen_div = $("<div>").addClass("character_container").addClass(alignment);
	this.onscreen_symbol = $("<div>").addClass("character_symbol").text(this.emoji);
	var name = $("<div>").addClass("character_name").text(this.name);
	this.onscreen_div.append(this.onscreen_symbol);
	this.onscreen_div.append(name);

	//make the div visible if necessary
	//it starts from nowhere, and then we put it where we need to
	this.y = null;
	this.x = null;

	if(y !== null && x !== null) {
		this.moveTo(y, x);
	}
}
/* move a character straight to the destination, overridding anything that may
 * be there and leaving a null where it used to be (arguments can't be null or undefined) */
Character.prototype.moveTo = function(y, x){
	if ( y === null || x === null || y === undefined || x === undefined) {
		throw "destination cannot be null or undefined in moveTo";
	}


	// update the display
	this.onscreen_div.detach();
	var destination_tile = map_tile[y][x];
	if (destination_tile.isLight) {
		this.onscreen_symbol.text(this.kanji);
	} else {
		this.onscreen_symbol.text(this.emoji);
	}
	var onscreen_destination_tile = destination_tile.onscreen_td;
	onscreen_destination_tile.append(this.onscreen_div);

	// update click handlers and internal maps
	if (this.y !== null) {
		map_tile[this.y][this.x].contents = null;
		var source_tile = $("#tile_" + this.y + "_" + this.x);
		source_tile.unbind("click");
		var thisY = this.y;
		var thisX = this.x;
		source_tile.click(function(e){ emptyTileOnClick(thisY, thisX); });
	}
	var thisThis = this;
	map_tile[y][x].contents = this;
	onscreen_destination_tile.unbind("click");
	onscreen_destination_tile.click(function(e){ characterOnClick(thisThis); });

	// update the internals of the two tiles and this character

	this.y = y;
	this.x = x;
}

function Tile(y, x, type){
	this.y = y;
	this.x = x;
	this.type = type;
	this.contents = null; //i.e. what character is standing on here?
	this.isLight = ( (x + y) % 2 === 0 );
	this.isSelected = SelectionType.UNSELECTED;


	this.onscreen_td = $("<td></td>").prop("id", "tile_" + y + "_" + x).click(function(e){ emptyTileOnClick(y, x); } );
	if( this.isLight ) {
		this.onscreen_td.addClass("tile_light");
	} else {
		this.onscreen_td.addClass("tile_dark");
	}

	var row = $("#row_" + y);
	row.append(this.onscreen_td);
}
Tile.prototype.select = function(selection_type){
	if (this.isSelected !== SelectionType.UNSELECTED) {
		this.deselect(); //remove any old selections
	}
	this.isSelected = selection_type;
	this.onscreen_td.addClass(selection_type);
}
Tile.prototype.deselect = function(){
	this.isSelected = SelectionType.UNSELECTED;
	this.onscreen_td.removeClass("tile_accessible tile_selected tile_attackable"); //TODO: loop through all SelectionTypes
}

function Weapon(name, power, directionality) {
	this.name = name;
	this.power = power;
	this.directionality = directionality;
}

/** called when clicking on a tile WITH a character on it (or on the character itself) */
function characterOnClick(character) {
	switch(game_phase){
		case GamePhase.CHOOSE_CHARACTER:
			selectCharacter(character);
			game_phase = GamePhase.CHOOSE_DESTINATION;
			break;
		case GamePhase.CHOOSE_DESTINATION:
			if(selected_char === character) {
				//if you choose the same tile again, it's actually choosing the tile, not the character
				emptyTileOnClick(selected_char.y , selected_char.x);
			}
			// else, do nothing
			break;
		case GamePhase.CHOOSE_ENEMY:
			if(map_tile[character.y][character.x].isSelected === SelectionType.ATTACKABLE) {
				game_phase = GamePhase.CHOOSE_ATTACK;
				attacked_tile = [character.y, character.x];
				console.log("Attack!");
				//TODO: setup attack confirmation screen
			} else if (selected_char === character) {
				//if you choose the same tile again, you are waiting here
				//TODO: mark character as already been moved
				deselectCharacter();
				game_phase = GamePhase.CHOOSE_CHARACTER;
			}
			break;
		case GamePhase.CHOOSE_ATTACK:
			if( character.y === attacked_tile[0] && character.x === attacked_tile[1]) {
				//TOOD: actually do the attack
				//TODO: mark character as already been moved
				deselectCharacter();
				attacked_tile = [null, null];
				game_phase = GamePhase.CHOOSE_CHARACTER;
			}
			break;
		default:
			break;
	}
}

/** called when clicking on a tile WITHOUT a character on it */
function emptyTileOnClick(y, x) {
	switch(game_phase){
		case GamePhase.CHOOSE_CHARACTER:
			// do nothing
			break;
		case GamePhase.CHOOSE_DESTINATION:
			if(map_tile[y][x].isSelected === SelectionType.ACCESSIBLE) {
				selected_char.moveTo(y, x);

				var attackable_tiles = getAttackable([[y, x]], selected_char.weapon.directionality, [selected_char.y, selected_char.x], selected_char.alignment);
				attackable_tiles.forEach(function(item){
					map_tile[item[0]][item[1]].select(SelectionType.ATTACKABLE);
				});
				game_phase = GamePhase.CHOOSE_ENEMY;
			} else {
				// choosing an empty tile cancels
				deselectCharacter();
				game_phase = GamePhase.CHOOSE_CHARACTER;
			}
			break;
		case GamePhase.CHOOSE_ENEMY:
			if(map_tile[y][x].isSelected === SelectionType.ACCESSIBLE) {
				// choosing a different accessible tile means move there as if it's still CHOOSE_DESTINATION
				game_phase = GamePhase.CHOOSE_DESTINATION;
				emptyTileOnClick(y, x);
			} else {
				// choosing an empty tile cancels
				selected_char.moveTo(selected_char_from[0], selected_char_from[1]);
				deselectCharacter();
				game_phase = GamePhase.CHOOSE_CHARACTER;
			}
			break;
		case GamePhase.CHOOSE_ATTACK:
			//if clicking on an empty tile, cancel attack

			//TODO: reset visual display

			attacked_tile = [null, null];
			console.log("canceled the attack");
			game_phase = GamePhase.CHOOSE_ENEMY;
		default:
			break;
	}
}

function selectCharacter(character) {
	if(selected_char !== null) {
		deselectCharacter();
	}
	var selected_tile = map_tile[character.y][character.x];
	selected_char_from = [character.y, character.x];

	var accessible_tiles = getAccessible(character.y, character.x, character.movement);
	accessible_tiles.forEach(function(item){
		map_tile[item[0]][item[1]].select(SelectionType.ACCESSIBLE);
	});

	// var attackable_tiles = getAttackable(accessible_tiles, character.weapon.directionality, [character.y, character.x], character.alignment);
	// attackable_tiles.forEach(function(item){
	// 	map_tile[item[0]][item[1]].select(SelectionType.ATTACKABLE);
	// });

	selected_tile.select(SelectionType.SELECTED);

	// update right info box
	$("#right_header").text(character.name);
	$("#right_info").html(
		character.emoji + "/" + character.kanji +
		"<br>HP:" + character.currHP + "/" + character.maxHP +
		"<br>Weapon: " + character.weapon.name + " (range: " + character.weapon.directionality + ")");
	selected_char = character;
}
function deselectCharacter() {
	//$("td").removeClass("tile_selected tile_accessible tile_attackable"); //deselect everything
	for (var y = 0; y < map_tile.length; y++) {
		var row = map_tile[y];
		for (var x = 0; x < row.length; x++) {
			row[x].deselect(); 
		};
	};
	selected_char = null;
	selected_char_from = [null, null];
	$("#right_header").text("");
	$("#right_info").html("");
}

/** return all [y, x] tiles that can be reached from the given tile within movement turns*/
function getAccessible(startY, startX, movement) {
	//BFS: see also http://www.redblobgames.com/pathfinding/a-star/introduction.html

	// tiles are encoded as [y, x] pairs
	var frontier = new Queue();
	frontier.enqueue([startY, startX])
	// in came_from, however, they are encoded as the string "y_x": {from: [y, x], movement_remaining: XXX}
	// note that the from field is currently useless, but can be used to animate or mark the path taken
	var came_from = {}
	came_from[startY + "_" + startX] = {from: null, movement_remaining: movement};

	while (!frontier.isEmpty()) {
		var current = frontier.dequeue();
		var current_movement = came_from[current[0] + "_" + current[1]].movement_remaining;
		var neighbors = getNeighbors(current[0], current[1]);
		neighbors.forEach(function(next){
			if(!came_from.hasOwnProperty(next[0] + "_" + next[1])) {
				came_from[next[0] + "_" + next[1]] = {from: current, movement_remaining: current_movement-1};

				if(current_movement-1 > 0) {
					frontier.enqueue(next); //only enqueue if we have movement left
				}
			}
		});
	}

	var came_from_array = Object.getOwnPropertyNames(came_from);
	//convert back from an object to an array
	for (var i = 0; i < came_from_array.length; i++) {
		came_from_array[i] = came_from_array[i].split("_");
		for (var j = 0; j < came_from_array[i].length; j++) {
			came_from_array[i][j] = +came_from_array[i][j];
		};
	};

	return came_from_array;
}
/** return all [y, x] tiles that are immediately adjacent to this one, assuming only diagonal movement */
function getNeighbors(y, x, includeEmpty=true, includeOccupied=false) {
	var toReturn = [];
	[[y+1, x+1], [y-1, x+1], [y+1, x-1], [y-1, x-1]].forEach(function(item){
		if(item[0] >= 0 && item[0] < Y_TILES && item[1] >= 0 && item[1] < X_TILES &&
			(
				(includeEmpty && map_tile[item[0]][item[1]].contents === null) ||
				(includeOccupied && map_tile[item[0]][item[1]].contents !== null)
			) ) {
			toReturn.push(item);
		}
	});
	return toReturn;
}
/** return all [y, x] tiles that are immediately adjacent to this one, assuming only orthogonal movement */
function getOrthogonalNeighbors(y, x, includeEmpty=true, includeOccupied=false) {
	var toReturn = [];
	[[y, x+1], [y, x-1], [y+1, x], [y-1, x]].forEach(function(item){
		if(item[0] >= 0 && item[0] < Y_TILES && item[1] >= 0 && item[1] < X_TILES &&
			(
				(includeEmpty && map_tile[item[0]][item[1]].contents === null) ||
				(includeOccupied && map_tile[item[0]][item[1]].contents !== null)
			) ) {
			toReturn.push(item);
		}
	});
	return toReturn;
}
/** return all [y, x] tiles that are a dababba's move away from this one */
function getDababbaNeighbors(y, x, includeEmpty=true, includeOccupied=false) {
	var toReturn = [];
	[[y, x+2], [y, x-2], [y+2, x], [y-2, x]].forEach(function(item){
		if(item[0] >= 0 && item[0] < Y_TILES && item[1] >= 0 && item[1] < X_TILES &&
			(
				(includeEmpty && map_tile[item[0]][item[1]].contents === null) ||
				(includeOccupied && map_tile[item[0]][item[1]].contents !== null)
			) ) {
			toReturn.push(item);
		}
	});
	return toReturn;
}


/** return all attackable [y,x] tiles from any tile in accessible_tiles, excluding the
 * excluding [y,x] pair and any characters in the excludingAlignment alignment */
function getAttackable(accessible_tiles, directionality, excluding, excludingAlignment){
	var toReturn = [];

	accessible_tiles.map(function(item) {
		var neighbors = DIRECTIONALITY_FNC[directionality](item[0], item[1], false, true);

		neighbors.forEach(function(jtem){
			//go through all found neighbors and filter out anything unwanted
			// (we call it jtem because it's just an index item, but we already used i so we're at j)
			if( (excluding && !(jtem[0] === excluding[0] && jtem[1] === excluding[1]) ) && 
				(excludingAlignment && map_tile[jtem[0]][jtem[1]].contents &&
					map_tile[jtem[0]][jtem[1]].contents.alignment !== excludingAlignment ) ) {
				//go through wanted neighbors and remove duplicates by putting not-duplicates into toReturn
				for (var i = 0; i < toReturn.length; i++) {
					if (toReturn[i][0] === jtem[0] && toReturn[i][1] === jtem[1]) {
						//we found this already; stop.
						return;
					};
				};
				toReturn.push(jtem);
			}
		});
	});

	return toReturn;
}
