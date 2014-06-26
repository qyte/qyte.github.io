var RawLayout = [];
var AgentLocations = [];
var AgentMsgCount = [];
var AgentRcvMsgCount = [];
var AgentMoveCount = [];
var InitialAgentLocations = [];
var bombLocation = [];
var running = false;
var GridSize = 5;
var timeElapsed = 0;

var ticks;


var fps = 25;
var canvas;
var ctx;
var imgData = null;

var parseFileWorker;
var pathfindWorker;
var workers = [];


function isCellEqual(a,b){
    return (a[0] === b[0] && a[1] === b[1]);
}

function isCellinArray(cell,array){
    for (var i = 0; i < array.length; i++) {
        if (isCellEqual(cell,array[i])) {
            return true;
        }
    }
    return false;
}

function sumArray(array)
{
    var total = 0;
    for (var i = 0, l = array.length; i < l; i++)
    {
        total += array[i];
    }
    return total;
}

function readfile(filePath) {
    if(filePath.files && filePath.files[0]) {
        parseFileWorker = new Worker("js/parsefile.js");
        parseFileWorker.onmessage = parsefileMsg;
        parseFileWorker.postMessage({'cmd':'parse','value': filePath.files[0] });
    }
}

function parsefileMsg(e){
    parseFileWorker.terminate();
    var data = e.data;
    switch(data.cmd){
        case 'error':
            $('#run').hide();
            $('#pause').hide();
            $('#reset').hide();
            $('#labeledSelector').hide();
            $('.jumbotron').hide();
            $('#stats').hide();
            alert('Error: ' + data.value);
            break;
        case 'success': //initTable,agentsLoc,bombLoc
            RawLayout = data.initTable;
            InitialAgentLocations = data.agentsLoc.slice();
            AgentLocations = data.agentsLoc;
            bombLocation = data.bombLoc;
            SetupVariables();
            DrawCanvas();
    }
}

function pathfindMsg(e){
    data = e.data;
    switch(data.cmd){
        case 'pathFound':
            pathfindWorker.terminate();
            if(workers.length > 0)
                workers[0].postMessage({cmd:'pathFound',optPath:data.optPath});
            break;
    }
}

function processagentMsg(e) {
    var data = e.data;
    switch(data.cmd){
        case 'move':
            if (!running || isCellinArray(data.cell,AgentLocations)) {
                workers[data.cid].postMessage({'cmd':'loop','otherAgents':AgentLocations});
                return;
            }
            AgentLocations[data.cid] = data.cell;
            AgentMoveCount[data.cid]++;
            if (data.cid === 0 && isCellEqual(data.cell,bombLocation))
                finish();
            workers[data.cid].postMessage({'cmd':'moveTo','otherAgents':AgentLocations, 'newLoc':data.cell});
            break;
        case 'known':            
            if (imgData === null) {
                clearCanvas();
                drawObstacles();
                imgData=ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
            else {
                ctx.putImageData(imgData,0,0);
            }
            drawAgents();
            drawFog(data.area);
            if (running) {
                setTimeout(DrawCanvas,Math.floor(1000.0/fps));
            };
            break;
        case 'sendACL':
            AgentMsgCount[data.fromid]++;
            AgentRcvMsgCount[data.otherid]++;
            workers[data.otherid].postMessage({'cmd':'ACLmessage', 'fromid': data.fromid ,'otherarea':data.area});
            break;
        case 'pathFind':
            pathfindWorker.postMessage({cmd:'run',startLoc:AgentLocations[0],endLoc:bombLocation, knownArea:data.knownArea});
            break;
    }
}

function SetupVariables(){
    running = false;
    var probWidth = RawLayout[0].length;
    var probHeight = RawLayout.length;
    var optimizer = Math.min(Math.floor(800.0 / probHeight),Math.floor(1200.0 / probWidth));
    if (optimizer < 1) {
        optimizer = 1;
        //alert('Problem dimensions are too high to display');
    };
    if(optimizer > 20)
        optimizer = 20;
    GridSize = optimizer;
    canvas = document.getElementById('mainDisplay');
    canvas.width = optimizer*probWidth;
    canvas.height = optimizer*probHeight;
    ctx = canvas.getContext('2d');
    imgData = null;
    restart();
    $('#labeledSelector').show();
    $('.jumbotron').show();
}

function start(){
    if (running) {
        return;
    }
    ticks = (new Date()).getTime();
    $('#run').hide();
    $('#pause').show();
    $('#reset').hide();
    running = true;
    DrawCanvas();
    for (var i = 0; i < workers.length; i++) {
        workers[i].postMessage({'cmd':'run','value':true,'otherAgents':AgentLocations});
    }
}

function pause(){
    if (!running) {
        return;
    }
    timeElapsed += (new Date()).getTime() - ticks;
    $('#run').show();
    $('#pause').hide();
    $('#reset').show();
    running = false;
    for (var i = 0; i < workers.length; i++) {
        workers[i].postMessage({'cmd':'run','value':false});
    }
}

function finish(){
    pause();
    $('#run').hide();
    $('#resultsHeaderText').html('Run Statistics (Total Running Time: ' + timeElapsed + 'ms )');
    var output = '<thead><tr><th>#</th><th>Moves Made</th><th>Messages Sent</th><th>Messages Received</th></tr></thead><tbody>'
    output += '<tr><td>A</td><td>'+AgentMoveCount[0]+'</td><td>'+AgentMsgCount[0]+'</td><td>'+AgentRcvMsgCount[0]+'</td></tr>';
    for (var i = 1; i < AgentLocations.length; i++)
        output += '<tr><td>'+i+'</td><td>'+AgentMoveCount[i]+'</td><td>'+AgentMsgCount[i]+'</td><td>'+AgentRcvMsgCount[i]+'</td></tr>';
    output += '<tr><td>Sum</td><td>'+sumArray(AgentMoveCount)+'</td><td>'+sumArray(AgentMsgCount)+'</td><td>'+sumArray(AgentRcvMsgCount)+'</td></tr></tbody>';
    $('.table').html(output);
    $('#stats').show();
    $('#modalForm').modal('show');
}

function restart(){
    if (running) {
        return;
    };
    timeElapsed = 0;
    $('#run').show();
    $('#pause').hide();
    $('#reset').hide();
    $('#stats').hide();
    AgentMsgCount = [];
    AgentRcvMsgCount = [];
    AgentMoveCount = [];
    AgentLocations = InitialAgentLocations.slice();
    for (var i = 0; i < workers.length; i++) {
        workers[i].terminate();
    };
    workers = [];    
    pathfindWorker = new Worker('js/pathfinder.js');
    pathfindWorker.onmessage = pathfindMsg;
    pathfindWorker.postMessage({cmd:'create',grid:RawLayout});
    var options = [];
    options.push('<option selected="selected" value="0">None</option>');
    options.push('<option value="1">Agent A</option>');
    for (var i = 0; i < AgentLocations.length; i++) {
        var agentworker = new Worker('js/agentloop.js');
        agentworker.onmessage = processagentMsg;
        agentworker.postMessage({'cmd':'create','agentid':i,'numAgents':AgentLocations.length, 'initTable':RawLayout, 'bombLoc':bombLocation,'startLocation':AgentLocations[i]});
        workers.push(agentworker);
        AgentMsgCount.push(0);
        if ( i < 1 ) {continue;}
        options.push('<option value="',i+1,'">Agent ',i, '</option>');
    }
    $('#agentSelector').empty().html(options.join(''));
    AgentMoveCount = AgentMsgCount.slice();
    AgentRcvMsgCount = AgentMsgCount.slice();
    DrawCanvas();
}

function DrawCanvas(){
    var idx = document.getElementById("agentSelector").selectedIndex;
    if (idx > 0) {
        workers[idx-1].postMessage({'cmd':'getKnownArea'});
        return;
    }
    if (imgData === null) {
        clearCanvas();
        drawObstacles();
        imgData=ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    else {
        ctx.putImageData(imgData,0,0);
    }
    drawAgents();
    if (running) {
        setTimeout(DrawCanvas,Math.floor(1000.0/fps));
    };
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawObstacles() {
    for (var i = 0; i < RawLayout.length; i++) {
        for (var j = 0; j < RawLayout[i].length; j++) {
            if(RawLayout[i][j]==='*'){
                ctx.fillStyle = 'khaki';
                ctx.fillRect(j * GridSize, i * GridSize, GridSize, GridSize);
            }
            if(RawLayout[i][j]==='B'){
                ctx.fillStyle = 'crimson';
                ctx.fillRect(j * GridSize, i * GridSize, GridSize, GridSize);
            }
        }
    }
}

function drawAgents(){
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(AgentLocations[0][1] * GridSize, AgentLocations[0][0] * GridSize, GridSize, GridSize);
    var idx = document.getElementById("agentSelector").selectedIndex;
    idx--;
    for (var i = 1; i < AgentLocations.length; i++) {
        ctx.fillStyle = idx===i?'magenta':'blue';
        ctx.fillRect(AgentLocations[i][1] * GridSize, AgentLocations[i][0] * GridSize, GridSize, GridSize);
    };
}

function drawFog(area){
    ctx.fillStyle = 'rgba(0,0,0,0.61182)';
    for (var i = 0; i < area.length; i++)
        for (var j = 0; j < area[i].length; j++)
            if(!area[i][j])
                ctx.fillRect(j * GridSize, i * GridSize, GridSize, GridSize);
}

$(document).ready( function() {
    $('#run').hide();
    $('#pause').hide();
    $('#reset').hide();
    $('#stats').hide();
    $('#labeledSelector').hide();
    $('.jumbotron').hide();
    $('#falseinput').click(function(){
        $("#fileinput").click();
        return false;
    });
    $('#mainTitle').click(function(){return false;});
    $('#run').click(function(){ start(); return false;});
    $('#pause').click(function(){ pause(); return false;});
    $('#reset').click(function(){ restart(); return false;});
    $('#stats').click(function(){ $('#modalForm').modal('show'); return false;});
    $('#agentSelector').change(function(){
        if (running) {return}
        DrawCanvas();
    });
})