function parseText(txt){
	var bombloc = [];
	var AgentsLoc = [];
	var ZeroAgents = [];
	var initialTable = [];
	for (var i = 0; i < 10; i++) {
		AgentsLoc.push(null);
	};
	var lines = txt.split(/\r\n|\r|\n/);
	initialTable = [];
	var linelength = lines[0].length;
	for(var i=0;i<lines.length;i++){
		var line = lines[i].toUpperCase();
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
				case 'Β'://Ελληνικό
				case 'B':
					bombloc = [i,j];
					linearr.push(line[j]);
					break;
				case 'Α'://Ελληνικό
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
	var reader;
	if (FileReaderSync) { //O firefox δεν υποστηρίζει το FileReader σε Workers αλλά μόνο το FileReaderSync
		reader = new FileReaderSync();
		parseText(reader.readAsText(data.value));
		return;
	}
	reader = new FileReader();
	reader.onload = function (e) {
		parseText(e.target.result);
    }
    reader.readAsText(data.value);
	//parseText(data.value);
}