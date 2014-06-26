var bombloc = [];
var AgentsLoc = [];
var ZeroAgents = [];
var initialTable = [];
var curagent;

//var reader = new FileReader();

function parseText(txt){
	AgentsLoc = [];
	for (var i = 0; i < 10; i++) {
		AgentsLoc.push(null);
	};
	var lines = txt.split(/\r\n|\n/);
	/*if (lines[0].lastIndexOf('\r') === lines[0].length-1) { // σε περίπτωση που το NewLine = '\r\n'
		for (var i = 0; i < lines.length; i++) {
			lines[i] = lines[i].substring(0,lines[i].length-1)
		}
	}*/
	initialTable = [];
	var linelength = lines[0].length;
	for(var i=0;i<lines.length;i++){
		var line = lines[i];
		if (lines[i].length != linelength) {  //Έλεγχος αν όλες οι γραμμές είναι ισομηκείς
			postMessage({'cmd':'error','value':'Incompatible File'});
			return;
		}
		var linearr = [];
		for (var j = 0; j < line.length; j++) {
			switch(line[j]){
				case ' ':
				case '*':
					linearr.push(line[j]);
					break;
				case 'B':
					bombloc = [i,j];
					linearr.push(line[j]);
					break;
				case 'A':
					linearr.push(' ');
					AgentsLoc[0] = [i,j];
					break;
				default :
					linearr.push(' ');
					var k = parseInt(line[j]);
					if (isNaN(k) || k > 9 ) {
						postMessage({'cmd':'error','value':'File containts invalid characters'});
						return;
					}
					if(k===0) // το 0 συμβολίζει αόριστου id πράκτορα που θα του δώσει το σύστημα δηλαδή id
						ZeroAgents.push([i,j]);
					else
						AgentsLoc[k] = [i,j];
					break;
			}
		}
		initialTable.push(linearr);
	}
	while(AgentsLoc.length > 0 && AgentsLoc.lastIndexOf(null) > -1) //Εαν λείπει κάποιο νούμερο στην σειρά 'καίγεται'
		AgentsLoc.pop();
	if (AgentsLoc.length < 1) {
		postMessage({'cmd':'error','value':'Bomb Disarm Agent not included'});
		return;
	}
	for (var i = 0; i < ZeroAgents.length; i++) {
		AgentsLoc.push(ZeroAgents[i])
	};
	if(bombloc.length < 1 || AgentsLoc.length < 2){
		postMessage({'cmd':'error','value':'Bomb or Agents not included'});
		return;
	}
	postMessage({'cmd':'success','initTable':initialTable, 'agentsLoc':AgentsLoc, 'bombLoc':bombloc });
}

onmessage = function(e){
	data = e.data;
	var reader = new FileReader();
	reader.onload = function (e) {
		parseText(e.target.result);
        /*output = e.target.result;
        displayContents(output);*/
    }
    reader.readAsText(data.value);
	parseText(data.value);
}