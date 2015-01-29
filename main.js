/* Checkers by Zemanzo - 2014/2015 */

// Add extensions to this array to enable them!
var extensions = [
	//"editmode.js",
	"AI/ai_stupid.js",
	"AI/ai_stupid_copy.js"
];

var selected, timerInterval;

// Custom events
var doneSettingUp = new Event('setupDone');
var playerSwitch = new Event('playerSwitched');
var boardStart = new Event('boardStarted');
var pathsFound = new Event('pathsDone');

// Settings
var board = {
	size: 10,					// Grid size (10 is default by international checkers rules)
	currentPlayer: "white",		// Starting player (White is default by international checkers rules)
	turns: 0,
	started: false
};

board.black = {
	currentPieces: 0,
	lostPieces: 0,
	pieces: []
};

board.white = {
	currentPieces: 0,
	lostPieces: 0,
	pieces: []
};

board.cellSize = (window.innerHeight-70)/(board.size);	// Determine height and width for each board cell to support variable window sizes

function init(){
	// Create board
	board.container = document.getElementById("checkersContainer");
	board.container.style.width = (board.cellSize*board.size)+"px";
	board.container.style.marginLeft = "-"+(board.cellSize*board.size)/2+"px"; // Center it
	
	// Fit header to board
	document.getElementById("header").style.width = (board.cellSize*board.size)+"px";
	document.getElementById("header").style.marginLeft = "-"+(board.cellSize*board.size)/2+"px"; // Center it
	
	// Load extensions when done setting up
	window.addEventListener("setupDone",function(){
		for (i = 0;i < extensions.length; i++){
			var ex = document.createElement("script");
			ex.src = extensions[i];
			document.head.appendChild(ex);
		}
	},false);
	
	// Write custom style to support variable window sizes
	var customStyle = document.createElement("style");
	customStyle.id = "customStyle";
	customStyle.innerHTML = '.boardCell {\
		width: '+board.cellSize+'px;\
		height: '+board.cellSize+'px;\
	}\
	\
	.checkersPiece {\
		width: '+(board.cellSize-16)+'px;\
		height: '+(board.cellSize-16)+'px;\
		border-radius: '+((board.cellSize-16)/2)+'px;\
	}\
	\
	';
	document.head.appendChild(customStyle);
	
	// Create board cells
	for (x = 0; x < board.size; x++){
		for (y = 0; y < board.size; y++){
			board.container.innerHTML += '<div class="boardCell" id="'+x+'_'+y+'">'+x+'_'+y+'</div>';
		}
		board.container.innerHTML += '<br/>';
	}
	
	// Set up pieces
	board.pieces = {};	
	
	// syntax: startSetup(startingRow-1,endingRow,type);
	// This is default set to size 10, in case size changes, make sure to either change up this to do it automatically or at least do it manually!
	startSetup(0,4,"black");
	startSetup(4,6,"null");
	startSetup(6,board.size,"white");
	
	// Place pieces on board
	for (x = 0; x < board.size; x++){
		for (y = 0; y < board.size; y++){
			if (board.pieces[x][y].type != "null" && typeof(board.pieces[x][y].type) != "undefined"){
				board[board.pieces[x][y].type].pieces.push(x+"_"+y);
				document.getElementById(x+'_'+y).innerHTML += '<div data-type="'+board.pieces[x][y].type+'" id="piece-'+x+'_'+y+'" class="'+board.pieces[x][y].type+'Piece checkersPiece">&nbsp;</div>';
				document.getElementById(x+'_'+y).addEventListener('click',subSelect,false);
				if (x == board.size-1 && y == board.size-2){
					document.getElementById("piece-"+x+"_"+y).onload = window.dispatchEvent(doneSettingUp);
				}
			}						
		}
	}
}

function startSetup(rowStart,rowEnd,color){
	var offset;
	for (rows = rowStart; rows < rowEnd; rows++){
		board.pieces[rows] = {};
		offset = isEven(rows); // isEven(1) == 0 and isEven(2) == 1
		var pieceSet;
		for (i = 0; i < board.size; i++){
			if (offset == 1){	// If row is an even row
				pieceSet = ( (Math.abs(isEven(i)-1) == 1) ? color : "null"); // Place a piece where the cell is even where type is color, else place nothing
			} else {			// If row is NOT an even row
				pieceSet = ( ( isEven(i) == 1 ) ? color : "null"); // Place a piece where the cell is uneven where type is color, else place nothing
			}
			if (pieceSet != "null"){
				board[color].currentPieces += 1; // Add piece piececount per color.
			}
			
			/*
				Set up pieces in board.pieces object
				string -- Type
				object -- Position (for this.position);
					integer -- x
					integer -- y
				function -- selectPiece()
				function -- getMoveset()
				automatic function / listener -- Object.observe()
			*/
			board.pieces[rows][i] = {};
			board.pieces[rows][i].type = pieceSet;
			board.pieces[rows][i].position = {};
			board.pieces[rows][i].position.x = rows;
			board.pieces[rows][i].position.y = i;
			board.pieces[rows][i].currentPaths = [];
			board.pieces[rows][i].simpleHits = [];
			board.pieces[rows][i].landingCells = [];
			board.pieces[rows][i].selectPiece = function(){
				//console.log(selected);
				if (!board.started){	// On starting, change the header to display info
					board.started = true;
					window.dispatchEvent(boardStart);
					document.getElementById("header").style.fontSize = "20px";
					document.getElementById("header").innerHTML = '<div class="headerInfo" style="width:30%">Current player: <div id="player">White</div></div><div class="headerInfo" style="width:30%; font-size:.9em;">Turn: <span id="turns">0</span><br/>Time playing: <span id="time">00:00</span></div><div class="headerInfo" style="width:40%;">Info per player here</div>';
					// Simple timer (per second)
					toggleTimer(true);
				}
				var x = this.position.x;
				var y = this.position.y;
				var selectedId = "piece-"+x+"_"+y;
				var type = this.type;
				var selectedPiece = document.getElementById(selectedId);
				
				if ( (typeof(selected) == "undefined" || selected == "null") && type == board.currentPlayer) { // Nothing is selected, clicked one will be selected
					selected = selectedId;
					selectedPiece.style.border = "4px solid #f00";
					board.pieces[x][y].getMoveset();
				} else if (selected == selectedId) { // Same pieces is selected, thus a deselect is performed
					selected = "null";
					selectedPiece.style.border = "none";
					clearMoveset();
				} else if (type == board.currentPlayer) { // Other piece is selected, previous will be deselected and new one will be selected
					document.getElementById(selected).style.border = "none";
					selected = selectedId;
					selectedPiece.style.border = "4px solid #f00";
					board.pieces[x][y].getMoveset();
				} else {
					//alert("It's "+board.currentPlayer+"'s turn!");
				}
			};
			board.pieces[rows][i].getMoveset = function(){	// Function to get moveset
				clearMoveset(this);
				var x = this.position.x;
				var y = this.position.y;
				var type = this.type;
				console.log("%c Getting new moveset for "+x+","+y+" ("+type+") ","border-left:rgb(255,0,0) 3px solid; background-color:rgba(255,0,0,.5);");
				var caller = this;
				var possibleHits = [];
				var nextMove = [];
				var tempNext = []; // This is used to temporarily store coordinates for the next move. It is set up per path as following: [x,y,x,y,x,y] (Path 0, 1 and 2)
				var hitIteration = 0;
				
				function getType(){				// "black" returns true, "white" returns false, anything else returns "null"
					if (type == "black"){
						return true;
					} else if (type == "white") {
						return false;
					} else {
						return "null";
					}
				}
				
				function checkAround(p,fp){
					console.log("%c CHECKAROUND | PATH: "+p+" | ITERATION: "+hitIteration+" ","border-left:rgb(90,90,255) 3px solid; background-color:rgba(90,90,255,.5);");
					//console.log("%c PATH "+p,"border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");
					if (hitIteration > 0){ // On any iteration other than the first, look from another cell than the initial one!
						console.log("Next move is: ",nextMove[p]);
						x = nextMove[p].x;
						y = nextMove[p].y;
						console.log(x,y);
						caller.landingCells[p].push(x+"_"+y);
					}
					colorCell(x,y,"#f90","debug");
					//console.log(x,y,caller,hitIteration,caller.currentPaths,possibleHits);
					/*
						This entire for-loop checks for the possible moves. First it checks around the current piece to see if there's any simple spot to land on, or a piece of the other type (so a possible hit). If it's an empty spot, it adds a simple landing cell. If it's a piece of the other type, it starts looking if there's an empty spot behind it. If so, it's a confirmed hit. It adds both co-ordinates to two arrays: tempNext[], which will be used for landingCells[] later on (and for the next move obviously) and possibleHits[], which will be used to determine what pieces to remove when actually moving this piece.
						
						These arrays will then be used to further process paths and hits. This happens after the for-loop. 
					*/
					for (a = -1; a <= 1; a += 2){ // Look around the current piece
						for (b = -1; b <= 1; b += 2){ // for pieces of the other type
							if (isOOB((x+a),(y+b))){ // Check if next position is not out of bounds
								var antiType = ( ( getType() ) ? "white" : "black");
								if (board.pieces[x+a][y+b].type == "null" && hitIteration == 0){ // If an empty cell is found, color it blue (and addeventlistener etc. etc.)
									if (getType()){
										if (a > 0){
											colorCell(x+a,y+b,null,"moveSimple",x,y); // If type is black, moveSimple can only move DOWN
										}
									} else {
										if (a < 0){
											colorCell(x+a,y+b,null,"moveSimple",x,y); // If type is white, moveSimple can only move UP
										}
									}
								} else if (board.pieces[x+a][y+b].type == antiType){ // If a piece of the other type is found
									//console.log("Piece of other type is found at: ",(x+a),(y+b));
									//colorCell(x+a,y+b,"#9f9","debug"); // Color it greenish to show where it checked
									if (isOOB((x+(a*2)),(y+(b*2)))){
										function addHitToList(){ // NOTE: this is a function and will NOT be triggered immediately when parsing 
											//console.log("Adding ",x+a,y+b," to the current hits");
											possibleHits.push((x+a)+"_"+(y+b)); // Add it to the array before treating it
											console.log("Possible hits:",possibleHits);
											if (hitIteration == 0){
												tempNext.push(x+a*2);		
												tempNext.push(y+b*2);
											} else {
												tempNext[2*p+(possibleHits.length-1)*2] = x+(a*2);
												tempNext[2*p+(possibleHits.length-1)*2+1] = y+(b*2);
											}
											//console.log("(path ",p,") tempNext = ",tempNext);
										}
										//console.log("Check if cell is free to land on: ",board.pieces[x+a*2][y+b*2]);
										//console.log("Checking for path: ",p," and for iteration: ",hitIteration);
										if (board.pieces[x+a*2][y+b*2].type == "null"){ // Check if "landing cell" is empty
											if (hitIteration == 0){	// First iteration, don't have to worry for dupes
												addHitToList();
											} else if (board.pieces[x+a*2][y+b*2].type == "null" && caller.currentPaths[p].indexOf((x+a)+"_"+(y+b)) == -1 && typeof(p) != "undefined"){ 	// Make sure the piece it's hitting is NOT already in the current path.
												addHitToList();
											} else if (hitIteration != 0){
												//console.log("Found a dupe at ",(x+a),(y+b));
											}
										}
									}
								}
							}
						}
					}
					// Note that this is a separate function and is NOT called immediately!
					function nextCheckAround(fp){ // fp is used to check if its the final path in the loop we're checking until moving on to the next big cycle, where p is the current path we're checking
						//console.log(p,fp);
						if (p == fp){ // If this is the last path we're checking, add 1 to the hitIteration
							hitIteration++;
						}
						if (possibleHits.length > 0 /*&& hitIteration == 0*/){
							for (p = 0; p < caller.currentPaths.length; p++){	// For every current path
								//console.log("tempNext before nextMove (",p,") = ",tempNext);
								nextMove[p] = {									// Another array for the position of the next iteration
									x:tempNext[2*p],
									y:tempNext[2*p+1]
								};
								//console.log("nextMove[p] = ",nextMove[p]);
								if (!caller.landingCells[p]){
									caller.landingCells.push([]);
								}
								var fp = caller.currentPaths.length-1;
							}
							
							//tempNext = [];
							possibleHits = [];
							
							for (p = 0; p < caller.currentPaths.length; p++){
								if(caller.landingCells[p].indexOf(nextMove[p].x+"_"+nextMove[p].y) == -1){ // Make sure the landing cell isn't checked again (It's no use!)
									checkAround(p,fp);
								}
							}
						} else {
							console.log("No new hits are found");
							// Done processing
							// Add an eventlistener to all possible landing cells
							for (a = 0; a < caller.landingCells.length; a++){
								for (b = 0; b < caller.landingCells[a].length; b++){
									if (b == caller.landingCells[a].length-1){ // Make sure only the end of the paths are clickable
										document.getElementById(caller.landingCells[a][b]).style.cursor = "pointer";
										document.getElementById(caller.landingCells[a][b]).dataset.path = a;
										document.getElementById(caller.landingCells[a][b]).addEventListener("click", movePiece, false);
										//console.log("%c Landing cell created on path "+a+" found at "+caller.currentPaths[a][b].split("_")[0]+","+caller.currentPaths[a][b].split("_")[1],"border-left:rgb(255,128,0) 3px solid;");
									}
								}
							}
							// Color all hits dark red for debug purposes
							for (a = 0; a < caller.currentPaths.length; a++){
								for (b = 0; b < caller.currentPaths[a].length; b++){
									colorCell(caller.currentPaths[a][b].split("_")[0],caller.currentPaths[a][b].split("_")[1],"#b00","debug");
									console.log("%c Hit on path "+a+" found at "+caller.currentPaths[a][b].split("_")[0]+","+caller.currentPaths[a][b].split("_")[1],"border-left:rgb(128,0,0) 3px solid;");
								}
							}
							if (p == fp){
								window.dispatchEvent(pathsFound);
							}
						}
					}
					
					// Code continues processing here
					if (hitIteration > 0){ // If more hits are found after the first one
						for (i = 0; i < possibleHits.length; i++){ // Treat hits
							if (possibleHits.length > 1){ // If there's more than one hit, a new path is found
								if (i > 0){
									var temp = []; // New path is found, so create a new array for it, and fill it with all previous hits
									for (u = 0; u < hitIteration; u++){ // For each item in currentPaths[p], up until the current iteration.
										temp.push(caller.currentPaths[p][u]);
									}
									//console.log(temp);
									caller.currentPaths.push(temp); // Add the new path to the full array
									caller.currentPaths[p+i].push(possibleHits[i]);
								} else {
									caller.currentPaths[caller.currentPaths.length-1].push(possibleHits[i]);
								}
							} else { // If only one hit is found, add it to the current path.
								caller.currentPaths[p][hitIteration] = possibleHits[i];
							}
							//console.log(caller.currentPaths[1],caller.currentPaths[2]);
						}
						nextCheckAround(fp);
					} else { // ONLY ON THE FIRST HIT
						for (i = 0; i < possibleHits.length; i++){ // Treat hits
							caller.currentPaths.push([]);
							caller.currentPaths[i][hitIteration] = possibleHits[i];	// On the first iteration, create a new path for every hit
						}
						//console.log(caller.currentPaths);
						nextCheckAround(fp);
					}
				}
				if (hitIteration == 0){
					checkAround();
				}
			}
			/*
				Listen for changes with Object.observe().
				This allows us to only change the board.pieces arrays and make the rest (I.E. moving the actual pieces in the HTML) happen automatically!
				Object.observe() is still a very new function to JavaScript and DOES NOT WORK FOR FIREFOX, SAFARI AND IE or older browsers.
				No fall-back support is implemented in this script!
			*/
			Object.observe(board.pieces[rows][i],function(changes){
				changes.forEach(function(change) {
					if (change.name == "type"){
						console.log("%c Oop, stuff changed so lemme do that","border-left:rgb(255,0,255) 3px solid;",change);
						var x = change.object.position.x;
						var y = change.object.position.y;
						var t = change.object.type;
						var o = change.oldValue;
						var element = document.getElementById("piece-"+x+"_"+y);
						
						if (o == "white" || o == "black"){
							board[o].pieces.splice(board[o].pieces.indexOf(x+"_"+y),1); // Lovely
							board[o].currentPieces = (board[o].pieces.length);
							board[o].lostPieces = 20-(board[o].pieces.length); // 20 is default, make this a variable if board.size changes!!!!
							if (board[o].currentPieces == 0){
								document.getElementById("header").innerHTML = inverseColor(o)+" WINS!!!";
								document.getElementById("header").style.fontSize = "60px";
								alert(inverseColor(o).toUpperCase()+" WINS!!!");
								toggleTimer();
							}
						}
						if (o == "null"){
							board[t].pieces.push(x+"_"+y);
						}
						
						if (t == "null"){ // If the piece type is changed to null, it's removed.
							element.parentElement.removeChild(element);
							document.getElementById(x+"_"+y).removeEventListener('click',subSelect,false);
						} else if (t == "white" || t == "black"){ // If the piece type is a color, we have to update the cell to contain the piece.
							//console.log(element,x,y);
							var datatype;
							if (y == 0 || y == 9){
								dataType = t+"King";
							} else {
								dataType = t;
							}
							document.getElementById(x+"_"+y).innerHTML += '<div data-type="'+dataType+'" id="piece-'+x+'_'+y+'" class="'+t+'Piece checkersPiece">&nbsp;</div>'; // Add it to the dom
							function addev(){
								document.getElementById(x+"_"+y).addEventListener('click',subSelect,false);
							}
							if (exLoaded("editmode.js")){
								if(board.editMode.active){
									addev();
								}
							} else {
								addev();
							}
						}
					}
				});
			});
		}
	}
}

function clearMoveset(obj){
	// Clear previous preview
	//console.log("Cleared last moveset");
	if (obj){
		obj.currentPaths = [];
		obj.landingCells = [];
	}
	hitAmount = 0;
	for (i = 0; i < coloredCells.length; i++){
		document.getElementById(coloredCells[i]).style.backgroundColor = "#630";
		document.getElementById(coloredCells[i]).style.cursor = "auto";
		delete document.getElementById(coloredCells[i]).dataset.path;
		document.getElementById(coloredCells[i]).removeEventListener("click", movePiece);
	}
}

var coloredCells;
coloredCells = [];
function colorCell(x,y,color,type,sourceX,sourceY){
	var cell = document.getElementById(x+"_"+y);
	if (type == "hit"){
		cell.style.backgroundColor = color;
		cell.style.cursor = "pointer";
		cell.addEventListener("click", movePiece, false);
	} else if (type == "moveSimple"){
		cell.style.backgroundColor = "#99f";
		cell.style.cursor = "pointer";
		cell.addEventListener("click", movePiece, false);
		board.pieces[sourceX][sourceY].simpleHits.push(x+"_"+y);
		console.log("%c Simple hit found and created at "+x+","+y+" ("+type+")","border-left:rgb(0,0,255) 3px solid;");
	} else if (type == "debug"){
		cell.style.backgroundColor = color;
	}
	coloredCells.push(x+"_"+y);
}

// This function is called when the player clicks an empty spot to move its checkers piece to.
function movePiece(){
	console.log("yadayadayada",this);
	var pos = selected.substring(6).split("_");
	var movingPiece = document.getElementById(selected);
	var path = this.dataset.path;
	
	// In case a path was found in the data of the moved piece, remove all hit pieces.
	if (path){
		console.log("FOUND PATH, WILL REMOVE");
		console.log(board.pieces[pos[0]][pos[1]].currentPaths[path]);
		console.log(path);
		console.log(selected);
		for (i = 0; i < board.pieces[pos[0]][pos[1]].currentPaths[path].length; i++){
			var bleh = board.pieces[pos[0]][pos[1]].currentPaths[path][i];
			meerbleh = bleh.split("_");
			board.pieces[meerbleh[0]][meerbleh[1]].type = "null";
		}
	}
	move(board.currentPlayer,this);
}

function endTurn(){
	board.currentPlayer = inverseColor(board.currentPlayer);
	window.dispatchEvent(playerSwitch);
	console.log("%c It's "+board.currentPlayer+"'s turn.","border-left:rgb(255,0,255) 3px solid; background-color:rgba(255,0,255,.5);");
	document.getElementById("player").innerHTML = board.currentPlayer;
	for (x = 0; x < board.size; x++){
		for (y = 0; y < board.size; y++){
			if (board.pieces[x][y].type != "null"){
				board.pieces[x][y].currentPaths = [];
				board.pieces[x][y].landingCells = [];
			}
		}
	}
	clearMoveset();
	selected = "null";
	board.turns += 1;
	document.getElementById("turns").innerHTML = board.turns;
}

function move(col,e){
		var s,m;
		s = selected.split("_");
		m = e.id.split("_");
		s[0] = s[0].substring(6);
		console.log("%c Moving piece ("+s[0]+","+s[1]+") to ("+m[0]+","+m[1]+") ","border-left:rgb(255,128,0) 3px solid; background-color:rgba(255,128,0,.5);");
		board.pieces[s[0]][s[1]].type = "null"; // These call the Object.observe() we made earlier!
		board.pieces[m[0]][m[1]].type = col;
		// Clean up
		endTurn();
		if (exLoaded("editmode.js")){
			(!board.editMode.active ? document.getElementById("turns").innerHTML = board.turns : null);
		}
}

function subSelect(){
	board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece();
}

function isEven(number){
	if (number % 2 == 0){
		return 1;
	} else {
		return 0;
	}
}

function isOOB(c,d){ // Checks if there actually is a board cell there!
	if (typeof(board.pieces[c]) != "undefined"){					// Check if next position is not out of bounds
		if (typeof(board.pieces[c][d]) != "undefined"){
			return true;
		} else {
			return false;
		}
	} else {
		return false;
	}
}

function inverseColor(color){
	if (color == "white"){
		return "black";
	} else if (color == "black"){
		return "white";
	}
}

function toggleTimer(toggle){
	(toggle ? timerInterval = setInterval(function(){timer()},1000) : clearInterval(timerInterval));
}

var seconds = 0;
var minutes = 0;
var zMin,zSec;
function timer(){
	seconds += 1;
	minutes = Math.floor(seconds/60);
	if (seconds%60 < 10){
		zSec = "0";
	} else {
		zSec = "";
	}
	if (minutes%60 < 10){
		zMin = "0";
	} else {
		zMin = "";
	}
	document.getElementById("time").innerHTML = zMin+minutes+":"+zSec+(seconds%60);
}

function exLoaded(file){
	if (extensions.indexOf(file) != -1){
		return true;
	}
}