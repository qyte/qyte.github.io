importScripts('pathfinding-browser.min.js');

var grid;

onmessage = function(e){
	data = e.data;
	switch(data.cmd){
		case 'create':
			grid = new PF.Grid(data.grid[0].length, data.grid.length);
			for (var i = 0; i < data.grid.length; i++) {
				for (var j = 0; j < data.grid[i].length; j++) {
					if(data.grid[i][j] == '*')
					grid.setWalkableAt(j, i, false);
				}				
			}
			break;
		case 'run':
			//data.startLoc,data.endLoc, data.knownArea
			for (var i = 0; i < data.knownArea.length; i++) {
				for (var j = 0; j < data.knownArea[i].length; j++) {
					if(!data.knownArea[i][j])
					grid.setWalkableAt(j, i, false);
				}				
			}
			var finder = new PF.AStarFinder({allowDiagonal: true});
			var path = finder.findPath(data.startLoc[1], data.startLoc[0], data.endLoc[1], data.endLoc[0], grid);
			if(path.length > 0)
				path.shift(); // Βγάζουμε εκτός path την αρχική θέση
			var result = [];
			while(path.length > 0){
				var Node = path.shift();
				result.push([Node[1],Node[0]])
			}
			postMessage({cmd:'pathFound', optPath: result});
			break;
	}
}