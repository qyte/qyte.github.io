var Agent = function(agentid,numAgents,initTable,bombLoc,startLocation){
	// private variables and methods
	var previousLoc = startLocation;
	var currLoc = startLocation;

	var bomberKnowsbombLoc = false;
	var KnownArea = [];

	var optimalPath = [];

	function populateArea(){
		for (var i = 0; i < initTable.length; i++) {
			var knownRow = [];
			for (var j = 0; j < initTable[i].length; j++) {
				knownRow.push(false);
			}
			KnownArea.push(knownRow);
		}
		KnownArea[currLoc[0]][currLoc[1]] = true;
	}
	var lastupdate = -1;
	var sentcurrentInfo = [];

	function clearsentInfo(){
		sentcurrentInfo = [];
		for (var i = 0; i < numAgents; i++) {
			sentcurrentInfo.push(false);
		}
	}

	var eligibleCells = [];
	var nearbyCells = [];

	function isCellEqual(a,b){
		return (a[0] === b[0] && a[1] === b[1]);
	}

	function isEligible(cell){		
		if (isCellEqual(previousLoc,cell)) { return false };
		if (initTable[cell[0]][cell[1]] === '*') { return false; }; // Αν είναι τοίχος δεν μπορεί να μετακινηθεί εκει
		if (initTable[cell[0]][cell[1]] === 'B' && agentid > 0) { return false; }; // Αν είναι η βόμβα μόνο ο Disarmer (agentid===0) μπορεί να μετακινηθεί εκει
		// 'Ελεγχος αν μπορεί να κινηθεί διάγώνια (θα πρέπει να μην περνάει μέσα απο τοίχο)
		var diffx = Math.abs(cell[0] - currLoc[0]);
		var diffy = Math.abs(cell[1] - currLoc[1]);
		var diffmult = diffx*diffy;
		if (diffmult === 0) { return true};
		if (initTable[cell[0]][currLoc[1]] === ' ' || initTable[currLoc[0]][cell[1]] === ' ') {return true};
		return false;
	}

	function calculateEligibleCells(){
		nearbyCells = [];
		eligibleCells = [];
		var x = currLoc[0];
		var y = currLoc[1];
		var maxWidth = initTable.length-1;
		var maxHeight = initTable[0].length-1;
		if (x > 0 && x < maxWidth) {
			if (y > 0 && y < maxHeight) {
				nearbyCells.push([x-1,y-1]);
				nearbyCells.push([x-1,y]);
				nearbyCells.push([x-1,y+1]);
				nearbyCells.push([x,y-1]);
				nearbyCells.push([x,y+1]);
				nearbyCells.push([x+1,y-1]);
				nearbyCells.push([x+1,y]);
				nearbyCells.push([x+1,y+1]);
			}
			if(y===0){
				nearbyCells.push([x-1,y]);
				nearbyCells.push([x-1,y+1]);
				nearbyCells.push([x,y+1]);
				nearbyCells.push([x+1,y]);
				nearbyCells.push([x+1,y+1]);
			}
			if (y === maxHeight) {
				nearbyCells.push([x-1,y-1]);
				nearbyCells.push([x-1,y]);
				nearbyCells.push([x,y-1]);
				nearbyCells.push([x+1,y-1]);
				nearbyCells.push([x+1,y]);
			}
		}
		if (x===0) {
			if (y > 0 && y < maxHeight) {
				nearbyCells.push([x,y-1]);
				nearbyCells.push([x,y+1]);
				nearbyCells.push([x+1,y-1]);
				nearbyCells.push([x+1,y]);
				nearbyCells.push([x+1,y+1]);
			}
			if(y===0){
				nearbyCells.push([x,y+1]);
				nearbyCells.push([x+1,y]);
				nearbyCells.push([x+1,y+1]);
			}
			if (y === maxHeight) {
				nearbyCells.push([x,y-1]);
				nearbyCells.push([x+1,y-1]);
				nearbyCells.push([x+1,y]);
			}
		}
		if (x === maxWidth) {
			if (y > 0 && y < maxHeight) {
				nearbyCells.push([x-1,y-1]);
				nearbyCells.push([x-1,y]);
				nearbyCells.push([x-1,y+1]);
				nearbyCells.push([x,y-1]);
				nearbyCells.push([x,y+1]);
			}
			if(y===0){
				nearbyCells.push([x-1,y]);
				nearbyCells.push([x-1,y+1]);
				nearbyCells.push([x,y+1]);
			}
			if (y === maxHeight) {
				nearbyCells.push([x-1,y-1]);
				nearbyCells.push([x-1,y]);
				nearbyCells.push([x,y-1]);
			}
		}
		for (var i = 0; i < nearbyCells.length; i++) {
			var tmpcell = nearbyCells[i];
			if (!isEligible(tmpcell)) {
				continue;
			}
			if (isCellEqual(tmpcell,bombLoc)) {
				eligibleCells = [];
				eligibleCells.push(tmpcell);
				break;
			}
			eligibleCells.push(nearbyCells[i]);
		}
		if(eligibleCells.length === 0)
			eligibleCells.push(previousLoc);
		var notKnownCells = [];
		for (var i = 0; i < eligibleCells.length; i++) {
			if (!KnownArea[eligibleCells[i][0]][eligibleCells[i][1]]) {
				notKnownCells.push(eligibleCells[i])
			}
		}
		if (notKnownCells.length > 0) {
			eligibleCells = notKnownCells.slice(); //κρατάμε μόνο τα άγνωστα κελιά για μετακίνηση.
		}
		var clearinfo = false;
		for (var i = 0; i < nearbyCells.length; i++) {
			var tmp = nearbyCells[i];
			if(!KnownArea[tmp[0]][tmp[1]])
				clearinfo = true;
			KnownArea[tmp[0]][tmp[1]] = true;
		}
		if(clearinfo)
			clearsentInfo();
	}

	// return class Public Members as Object
	return {
		init: function(){
			populateArea();
			clearsentInfo();
			calculateEligibleCells();
			optimalPath = [];
		},
		getId: function(){
			return agentid;
		},
		getCurrentPosition: function(){
			return currLoc;
		},
		moveTo: function(newLoc){
			previousLoc = currLoc;
			currLoc = newLoc;
			if (optimalPath.length > 0)
				optimalPath.shift();
			calculateEligibleCells();
		},
		getEligibleCells: function(){
			return eligibleCells;
		},
		getknownArea: function(){
			return KnownArea;
		},
		sendInfo: function(otherid){
			if (sentcurrentInfo[otherid]) {return null;}
			sentcurrentInfo[otherid] = true;
			if(!otherid && KnownArea[bombLoc[0]][bombLoc[1]]) //Σε περίπτωση που σταματήσει να κινήται όταν μάθει ο πυροτεχνουργός την θέση της βόμβας
				bomberKnowsbombLoc = true;
			return KnownArea;
			//postMessage({'cmd':'sendInfo','id':otherid, 'Area': KnownArea}); θα το αναλάβει το agentloop ως controller
		},
		updateInfo: function(otherKnownArea){
			var clearinfo = false;
			for (var i = 0; i < otherKnownArea.length; i++) {
				for (var j = 0; j < otherKnownArea[i].length; j++) {
					if (!KnownArea[i][j] && otherKnownArea[i][j]) {
						KnownArea[i][j] = true;
						clearinfo = true;
					}
				}
			}			
			if(clearinfo){
				clearsentInfo();
				calculateEligibleCells();
			}
		}
	}
}
