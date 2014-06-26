importScripts('agent.js');

var agent;
var running = false;

var bombLoc;
var optimalPath = [];
var pathWaiting = false;


function isCellEqual(a,b){
    return (a[0] === b[0] && a[1] === b[1]);
}

function isCellinArray(cell,array){
    for (var i = 0; i < array.length; i++) {
        if (isCellEqual(cell,array[i])) {
            return i;
        }
    }
    return -1;
}

function KnowsBombLoc(){
	var knownArea = agent.getknownArea();
	return knownArea[bombLoc[0]][bombLoc[1]];
}

function doProcessPath(){
	if (!running) {
		return;
	}
	postMessage({'cmd':'move','cid':agent.getId(),'cell':optimalPath[0]});
}

function loop(agentsloc){
	if (!running) {
		return;
	}
	var possibles = agent.getEligibleCells();
	var tmp = [];
	for (var i = 0; i < possibles.length; i++) {
		var pos = isCellinArray(possibles[i],agentsloc);
		if(pos < 0){
			tmp.push(possibles[i]);
			continue;
		}
		var area = agent.sendInfo(pos);
		if (area !== null)
			postMessage({'cmd':'sendACL', 'fromid':agent.getId(),'otherid':pos,'area': area});
	}
	if(pathWaiting)
		return;
	if(optimalPath.length){
		doProcessPath();
		return;
	}
	if (!agent.getId() && KnowsBombLoc() && !isCellEqual(possibles[0],bombLoc)) {
		pathWaiting = true;//data.startLoc,data.endLoc
		postMessage({cmd:'pathFind',knownArea: agent.getknownArea()});
		return;
	}
	if(tmp.length > 0)
		possibles = tmp;
	var k = Math.floor(possibles.length * Math.random());
	postMessage({'cmd':'move','cid':agent.getId(),'cell':possibles[k]});
}

onmessage = function(e){
	data = e.data;
	switch(data.cmd){
		case 'create':
			agent = new Agent(data.agentid,data.numAgents,data.initTable,data.bombLoc,data.startLocation);
			agent.init();
			bombLoc = data.bombLoc;
			break;
		case 'run':
			running = data.value;
			if (!running) {return;}
			loop(data.otherAgents);
			break;
		case 'loop':
			loop(data.otherAgents);
			break;
		case 'moveTo':
			if(optimalPath.length > 0 && isCellEqual(data.newLoc,optimalPath[0]))
				optimalPath.shift();
			agent.moveTo(data.newLoc);
			loop(data.otherAgents);
			break;
		case 'getKnownArea':
			postMessage({'cmd':'known','area':agent.getknownArea()});
			break;
		case 'ACLmessage':
			agent.updateInfo(data.otherarea);
			break;
		case 'pathFound':
			optimalPath = data.optPath;
			pathWaiting = false;
			doProcessPath();
			break;
	}
}