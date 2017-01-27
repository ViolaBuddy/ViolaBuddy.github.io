//GAME SETUP
//PLAYER TURN
  // 1. choose character -> show range to move to, show stats
    // 2. choose destination -> move character, show menu
     // 2.5 choose menu -> show menu ****
      // 3. choose attackable enemy -> show battle forecast
        // 4. choose to attack -> perform attack; have enemy die if necessary, go back to 1.
        // 4. choose another attackable enemy -> hide battle forecast, as in (3.)
      // 3. choose wait -> mark character as moved, go back to 1.
    // 2. cancel (choose empty square or same character) -> hide range to move to, hide stats, go back to 1.
  // 1. end turn -> mark all characters as unmoved and change to opponent
//ENEMY TURN
  //(repeat player turn, except current_turn = Alignment.ENEMY)
 "use strict";

function printDebug(str){
	var new_li = $("<li>").text(str);
	$("#debug_list").append(new_li);
}
function updateDebugState(){
	function charToString(char){
		if(char && "name" in char && "emoji" in char)
			return char.name + " " + char.emoji;
		else
			return char;
	}
	var theHTML = "";
	theHTML += "selected_char: " + charToString(selected_char) + "<br>";
	theHTML += "selected_char_from: " + selected_char_from + "<br>";
	theHTML += "attacked_tile: " + attacked_tile + "<br>";
	theHTML += "battle_lhs: " + charToString(battle_lhs) + "<br>";
	theHTML += "battle_rhs: " + charToString(battle_rhs) + "<br>";
	theHTML += "current_turn: " + current_turn + "<br>";
	theHTML += "game_phase: " + game_phase + "<br>";

	$("#debug_state").html(theHTML);
}
// $("#debug").css("display", "block"); // for debugging only; remove in final production
printDebug("This is the debug list!");

hideDropDownMenu();
hideBattle();
$("#fight_btn").click(function(event_){
	if (game_phase === GamePhase.CHOOSE_MENU_ITEM) //check the current game phase, just for safety
		nextGamePhase({"menuItem":MenuItem.FIGHT});
});
$("#wait_btn").click(function(event_){
	if (game_phase === GamePhase.CHOOSE_MENU_ITEM) //check the current game phase, just for safety
		nextGamePhase({"menuItem":MenuItem.WAIT});
});
$("#battle_confirm_btn").click(onBattleConfirm);
$("#battle_undo_btn").click(onBattleUndo);

var Y_TILES = 12;
var X_TILES = 15;
var Tiletype = {
	"EMPTY": "empty"
} //an enum
var GamePhase = {
	CHOOSE_CHARACTER: "CHOOSE_CHARACTER",
	CHOOSE_DESTINATION: "CHOOSE_DESTINATION",
	CHOOSE_MENU_ITEM: "CHOOSE_MENU_ITEM",
	CHOOSE_ENEMY: "CHOOSE_ENEMY",
	BATTLE_FORECAST: "BATTLE_FORECAST",
	BATTLE_ANIMATION: "BATTLE_ANIMATION",
	BATTLE_RESULTS: "BATTLE_RESULTS",
} //an enum
var MenuItem = {
	FIGHT: "Fight",
	WAIT: "Wait"
}
var SelectionType = {
	"UNSELECTED": "tile_unselected", //not actually a class right now, but it could be
	"SELECTED": "tile_selected",
	"ACCESSIBLE": "tile_accessible",
	"ATTACKABLE": "tile_attackable",
	"ATTACKED": "tile_attacked"
} //both an enum and a dict that converts to class name
var Alignment = {
	"PLAYER": "alignment_player",
	"ENEMY": "alignment_enemy"
} //both an enum and a dict that converts to class name
var Directionality = {
	"WAZIR": "wazir",
	"FERZ": "ferz",
	"DABBABA": "dabbaba",
	"ALFIL": "alfil"
} //an enum
var DIRECTIONALITY_FNC = {};
	DIRECTIONALITY_FNC[Directionality.WAZIR] = getOrthogonalNeighbors;
	DIRECTIONALITY_FNC[Directionality.FERZ] = getDiagonalNeighbors;
	DIRECTIONALITY_FNC[Directionality.DABBABA] = getDababbaNeighbors;
	DIRECTIONALITY_FNC[Directionality.ALFIL] = function(){throw "ALFIL Unimplemented"};
	//a dict that converts to functions

//internal representations of the map, accessed by map_XXX[y][x], where map_XXX[0][0] is the top left tile
var map_tile = []; //contains Tiles

//temporary internal state, for moving forwards and backwards through the game phases without locking in a decision
var selected_char = null;
var selected_char_from = [null, null];
var attacked_tile = [null, null];
var battle_lhs = null;
var battle_rhs = null;

var current_turn = Alignment.PLAYER;
var game_phase = GamePhase.CHOOSE_CHARACTER;

updateDebugState();

/** y and x are the tiles that this character starts on. If it does not start on
 * any time, they should both be null*/
function Character(name, emoji, stats, y, x, alignment, weapon) {
	// assert preconditions
	if ( (y === null && x !== null) || (x === null && y !== null) ) {
		throw "x and y must either both be null, or neither be null";
	}

	this.name = name;
	this.emoji = emoji;
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
	var onscreen_destination_tile = destination_tile.onscreen_td;
	onscreen_destination_tile.append(this.onscreen_div);

	// update click handlers and internal maps
	if (this.y !== null) {
		map_tile[this.y][this.x].contents = null;
		var source_tile = $("#tile_" + this.y + "_" + this.x);
		source_tile.unbind("click");
		var thisY = this.y;
		var thisX = this.x;
		source_tile.click(function(e){ emptyTileOnClick(thisY, thisX, e); });
	}
	var thisThis = this;
	map_tile[y][x].contents = this;
	onscreen_destination_tile.unbind("click");
	onscreen_destination_tile.click(function(e){ characterOnClick(thisThis, e); });

	// update the internals of the two tiles and this character
	this.y = y;
	this.x = x;
}
/* remove this character from the board, and maybe handle other conditions */
Character.prototype.die = function() {
	this.onscreen_div.remove();

	// update click handlers and internal maps
	if (this.y !== null) {
		map_tile[this.y][this.x].contents = null;
		var source_tile = $("#tile_" + this.y + "_" + this.x);
		source_tile.unbind("click");
		var thisY = this.y;
		var thisX = this.x;
		source_tile.click(function(e){ emptyTileOnClick(thisY, thisX, e); });
	}
}

function Tile(y, x, type){
	this.y = y;
	this.x = x;
	this.type = type;
	this.contents = null; //i.e. what character is standing on here?
	this.isLight = ( (x + y) % 2 === 0 );
	this.isSelected = SelectionType.UNSELECTED;


	this.onscreen_td = $("<td></td>").prop("id", "tile_" + y + "_" + x).click(function(e){ emptyTileOnClick(y, x, e); } );
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
function characterOnClick(character, event_) {
	switch(game_phase){
		case GamePhase.CHOOSE_CHARACTER:
			nextGamePhase({"selectCharacter": character});
			break;
		case GamePhase.CHOOSE_DESTINATION:
			if(selected_char === character) {
				//if you choose the same tile again, it's actually choosing the tile, not the character
				emptyTileOnClick(selected_char.y , selected_char.x, event_);
			}
			// else, do nothing
			break;
		case GamePhase.CHOOSE_ENEMY:
			if(map_tile[character.y][character.x].isSelected === SelectionType.ATTACKABLE) {
				nextGamePhase({"attacked_character": character});
			}
			break;
		case GamePhase.CHOOSE_MENU_ITEM:
		case GamePhase.BATTLE_FORECAST:
		case GamePhase.BATTLE_ANIMATION:
		case GamePhase.BATTLE_RESULTS:
		default:
			break;
	}
}

/** called when clicking on a tile [y, x] WITHOUT a character on it */
function emptyTileOnClick(y, x, event_) {
	switch(game_phase){
		case GamePhase.CHOOSE_DESTINATION:
			if(map_tile[y][x].isSelected === SelectionType.ACCESSIBLE ||
			   map_tile[y][x].isSelected === SelectionType.SELECTED) {
				nextGamePhase({
					"charLocation": {"y":y, "x":x},
					"event_": event_
				});
				return;

			} else {
				previousGamePhase();
			}
			break;
		case GamePhase.CHOOSE_MENU_ITEM:
			if(map_tile[y][x].isSelected === SelectionType.ACCESSIBLE ||
			   map_tile[y][x].isSelected === SelectionType.SELECTED) {
				//if chose a different accessible square, go there as if GamePhase.CHOOSE_DESTINATION
				previousGamePhase();
				emptyTileOnClick(y, x, event_);
			} else {
				previousGamePhase();
			}
			//if nonempty, do nothing
			break;
		case GamePhase.CHOOSE_ENEMY:
			previousGamePhase({"event_": event_});
			break;
		case GamePhase.CHOOSE_CHARACTER:
		case GamePhase.BATTLE_FORECAST:
		case GamePhase.BATTLE_ANIMATION:
		case GamePhase.BATTLE_RESULTS:
		default:
			break;
	}
}

function showDropDownMenu(event_){
	//TODO! Change to be position of tile, not position of click

	//http://stackoverflow.com/questions/4249648/jquery-get-mouse-position-within-an-element
	$("#dropdown")
		.css("display", "block")
		.css("top", event_.clientY - $("#left_inner").offset().top)
		.css("left", event_.clientX - $("#left_inner").offset().left);
}

function hideDropDownMenu(){
	$("#dropdown").css("display", "none");
}

function showBattle(lhs, rhs){
	battle_lhs = lhs;
	battle_rhs = rhs;

	//TODO: remove classes more correctly
	$("#battle_forecast_left>.character_container").removeClass("alignment_player alignment_enemy").addClass(lhs.alignment);
	$("#battle_forecast_left>.character_container>.character_symbol").text(lhs.emoji);
	$("#battle_forecast_left>.character_container>.character_name").text(lhs.name);

	$("#battle_forecast_right>.character_container").removeClass("alignment_player alignment_enemy").addClass(rhs.alignment);
	$("#battle_forecast_right>.character_container>.character_symbol").text(rhs.emoji);
	$("#battle_forecast_right>.character_container>.character_name").text(rhs.name);

	$("#battle_forecast_left .stat_dd_HP").text(lhs.currHP + "/" + lhs.maxHP);
	$("#battle_forecast_left .stat_dd_weapon").text(lhs.weapon.name);
	$("#battle_forecast_left .stat_dd_attack").text(lhs.weapon.power);

	$("#battle_forecast_right .stat_dd_HP").text(rhs.currHP + "/" + rhs.maxHP);
	$("#battle_forecast_right .stat_dd_weapon").text(rhs.weapon.name);
	$("#battle_forecast_right .stat_dd_attack").text(rhs.weapon.power);

	$("#battle_forecast").css("display", "block");
}

function hideBattle(){
	battle_lhs = null;
	battle_rhs = null;

	$("#battle_forecast").css("display", "none");
}

function onBattleConfirm(event_){
	switch(game_phase) {
		case GamePhase.BATTLE_FORECAST:
			nextGamePhase();			
			break;
		case GamePhase.BATTLE_RESULTS:
			nextGamePhase();
			break;
		case GamePhase.CHOOSE_CHARACTER:
		case GamePhase.CHOOSE_DESTINATION:
		case GamePhase.CHOOSE_ENEMY:
		case GamePhase.CHOOSE_MENU_ITEM:
		case GamePhase.BATTLE_ANIMATION:
		default:
			break;
	}
}
function onBattleUndo(event_){
	switch(game_phase) {
		case GamePhase.BATTLE_FORECAST:
			previousGamePhase();
			break;
		case GamePhase.CHOOSE_CHARACTER:
		case GamePhase.CHOOSE_DESTINATION:
		case GamePhase.CHOOSE_ENEMY:
		case GamePhase.CHOOSE_MENU_ITEM:
		case GamePhase.BATTLE_ANIMATION:
		case GamePhase.BATTLE_RESULTS:
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

	selected_tile.select(SelectionType.SELECTED);

	// update right info box
	$("#right_header").text(character.name);
	$("#right_info").html(
		character.emoji + 
		"<br>HP:" + character.currHP + "/" + character.maxHP +
		"<br>Weapon: " + character.weapon.name + " (range: " + character.weapon.directionality + ")");
	selected_char = character;
}
function deselectCharacter() {
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

/** switch the current game state so that if it's currently the player's phrase, make it the enemy's phase
 * and vice versa */
function endTurn(){
	switch(current_turn){
		case Alignment.PLAYER:
			current_turn = Alignment.ENEMY;
			break;
		case Alignment.ENEMY:
			current_turn = Alignment.PLAYER;
			break;
		default:
			throw new Error("Inexhaustive pattern match in endTurn")
	}
	printDebug("Now it's this player's turn: " + current_turn);
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
		var neighbors = getOrthogonalNeighbors(current[0], current[1]);
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
function getDiagonalNeighbors(y, x, includeEmpty=true, includeOccupied=false) {
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
		var neighbors = DIRECTIONALITY_FNC[directionality](item[0], item[1], true, true);
		// (y, x, includeEmpty=true, includeOccupied=false)

		neighbors.forEach(function(jtem){
			//go through all found neighbors and filter out anything unwanted
			// (we call it jtem because it's just an index item, but we already used i so we're at j)
			if (excluding && (jtem[0] === excluding[0] && jtem[1] === excluding[1]) ) {
				// do nothing if this is the tile we're excluding
			} else if (excludingAlignment && map_tile[jtem[0]][jtem[1]].contents &&
					map_tile[jtem[0]][jtem[1]].contents.alignment === excludingAlignment ) {
				// do nothing if this is a character-filled tile with alignment === excludingAlignment
			} else {
				// otherwise, remove duplicates by putting not-duplicates into toReturn
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




/* returns dict[key] if it's defined, but throws an Error if it's not */
Object.prototype.get = function(key) {
	if (key in this) {
		return this[key];
	} else {
		throw key + " is not in this dictionary!";
	}
}
/** change the game phase to the next phase */
function nextGamePhase(params) {
	var to_phase;
	switch (game_phase) {
		case GamePhase.CHOOSE_CHARACTER:
			selectCharacter(params.get("selectCharacter"));
			to_phase = GamePhase.CHOOSE_DESTINATION;
			break;
		case GamePhase.CHOOSE_DESTINATION:
			selected_char.moveTo(params["charLocation"]["y"], params["charLocation"]["x"]);

			showDropDownMenu(params["event_"]);
			to_phase = GamePhase.CHOOSE_MENU_ITEM;
			break;
		case GamePhase.CHOOSE_MENU_ITEM:
			if(params.get("menuItem") === MenuItem.FIGHT) {
				var attackable_tiles = getAttackable([[selected_char.y, selected_char.x]], selected_char.weapon.directionality, [selected_char.y, selected_char.x], selected_char.alignment);
				attackable_tiles.forEach(function(item){
					map_tile[item[0]][item[1]].select(SelectionType.ATTACKABLE);
				});

				hideDropDownMenu();
				to_phase = GamePhase.CHOOSE_ENEMY;
			} else if(params.get("menuItem") === MenuItem.WAIT){
				//TODO: mark character as already been moved
				hideDropDownMenu();
				deselectCharacter();
				to_phase = GamePhase.CHOOSE_CHARACTER;
			} else {
				throw "Unrecognized menu selection " + params.get("menuItem");
			}
			break;
		case GamePhase.CHOOSE_ENEMY:
			attacked_tile = [params.get("attacked_character").y, params.get("attacked_character").x];

			showBattle(selected_char, params.get("attacked_character"));
			$("#battle_confirm_btn").prop("disabled",false);
			$("#battle_undo_btn").prop("disabled",false);
			to_phase = GamePhase.BATTLE_FORECAST;
			break;
		case GamePhase.BATTLE_FORECAST:
			$("#battle_forecast_right .stat_dd_HP").text(battle_rhs.currHP + "→" + (battle_rhs.currHP - battle_lhs.weapon.power) + "/" + battle_rhs.maxHP); 
			$("#battle_confirm_btn").prop("disabled",true);
			$("#battle_undo_btn").prop("disabled",true);

			setTimeout(function(){
				battle_rhs.currHP -= battle_lhs.weapon.power;
				showBattle(battle_lhs, battle_rhs);

				if(battle_rhs.currHP <= 0) {
					battle_rhs.die();
				}
				nextGamePhase();
			}, 1000);
			to_phase = GamePhase.BATTLE_ANIMATION;
			break;
		case GamePhase.BATTLE_ANIMATION:
			$("#battle_confirm_btn").prop("disabled",false);
			to_phase = GamePhase.BATTLE_RESULTS;
			break;
		case GamePhase.BATTLE_RESULTS:
			hideBattle();
			deselectCharacter();
			to_phase = GamePhase.CHOOSE_CHARACTER;
			break;
		default:
			throw (to_phase + " is not a recognized phase in nextGamePhase");
	}
	game_phase = to_phase;
	updateDebugState();
}


/** change the game phase to the previous phase */
function previousGamePhase(params) {
	var to_phase;
	switch (game_phase) {
		case GamePhase.CHOOSE_CHARACTER:
			break;
		case GamePhase.CHOOSE_DESTINATION:
			deselectCharacter();
			to_phase = GamePhase.CHOOSE_CHARACTER;
			break;
		case GamePhase.CHOOSE_MENU_ITEM:
			hideDropDownMenu()
			selected_char.moveTo(selected_char_from[0], selected_char_from[1]);
			to_phase = GamePhase.CHOOSE_DESTINATION;
			break;
		case GamePhase.CHOOSE_ENEMY:
			showDropDownMenu(params.get("event_"));
			game_phase = GamePhase.CHOOSE_MENU_ITEM;
			// get rid of red attack square markings
			// TODO: there's got to be a better way of doing this, but for now:
			// save the current data, move the character back to its starting square, 
			// deselect and reselect the character, and move the character back to its current tentative square
			var temp = selected_char;
			var temp_from = [selected_char.y, selected_char.x];
			selected_char.moveTo(selected_char_from[0], selected_char_from[1]);
			deselectCharacter();
			selectCharacter(temp);
			selected_char.moveTo(temp_from[0], temp_from[1]);

			to_phase = GamePhase.CHOOSE_MENU_ITEM;
			break;
		case GamePhase.BATTLE_FORECAST:
			hideBattle();
			to_phase = GamePhase.CHOOSE_ENEMY;
			break;
		case GamePhase.BATTLE_ANIMATION:
			break;
		case GamePhase.BATTLE_RESULTS:
			break;
		default:
			throw (to_phase + " is not a recognized phase in previousGamePhase");
	}
	game_phase = to_phase;
	updateDebugState();
}