/** code that I don't need but worked too hard on to just delete */

//inside Character

	this.kanji = kanji;

//inside Character.protoype.moveTo
if (destination_tile.isLight) {
	this.onscreen_symbol.text(this.kanji);
} else {
	this.onscreen_symbol.text(this.emoji);
}

// the Chinese characters for the dummy characters

["日",
"月",
"链",
"云",
"飓",
"插"]

// getAttackable
		// This code below (commented out) I think does everything correctly
		// But Boolean algebra is weird so I rewrote this part.

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