/* Checkers by Zemanzo - 2014 */

// Add extensions to this array to enable them!
var extensions = [
	//"editmode.js"
];

var selected, timerInterval;
var doneSettingUp = new Event('setupDone');
var board = {};
board.size = 10;				// Grid size (10 is default by international checkers rules)
board.currentPlayer = "white";	// Starting player (White is default by international checkers rules)
board.turns = 0;
board.started = false;
board.black = {};
board.white = {};
board.black.currentPieces = 0;
board.white.currentPieces = 0;
board.black.lostPieces = 0;
board.white.lostPieces = 0;
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
				document.getElementById(x+'_'+y).innerHTML += '<div data-type="'+board.pieces[x][y].type+'" id="piece-'+x+'_'+y+'" class="'+board.pieces[x][y].type+'Piece checkersPiece">&nbsp;</div>';
				document.getElementById(x+'_'+y).addEventListener('click',function(){board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece()},false);
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
			*/
			board.pieces[rows][i] = {};
			board.pieces[rows][i].type = pieceSet;
			board.pieces[rows][i].position = {};
			board.pieces[rows][i].position.x = rows;
			board.pieces[rows][i].position.y = i;
			board.pieces[rows][i].currentPaths = [];
			board.pieces[rows][i].landingCells = [];
			board.pieces[rows][i].selectPiece = function(){
				//console.log(this);
				if (!board.started){	// On starting, change the header to display info
					board.started = true;
					document.getElementById("header").style.fontSize = "20px";
					document.getElementById("header").innerHTML = '<div class="headerInfo" style="width:30%">Current player: <div id="player">White</div></div><div class="headerInfo" style="width:30%; font-size:.9em;">Turn: <span id="turns">0</span><br/>Time playing: <span id="time">00:00</span></div><div class="headerInfo" style="width:40%;">Info per player here</div>';
					// Simple timer (per second)
					toggleTimer(true)
				}
				var x = this.position.x;
				var y = this.position.y;
				var selectedId = "piece-"+x+"_"+y;
				var type = this.type;
				var selectedPiece = document.getElementById(selectedId);
				
				if ( (typeof(selected) == "undefined" || selected == "null") && type == board.currentPlayer) {	// Nothing is selected, clicked one will be selected
					selected = selectedId;
					selectedPiece.style.border = "4px solid #f00";
					board.pieces[x][y].getMoveset();
				} else if (selected == selectedId) {															// Same pieces is selected, thus a deselect is performed
					selected = "null";
					selectedPiece.style.border = "none";
					clearMoveset();
				} else if (type == board.currentPlayer) {														// Other piece is selected, previous will be deselected and new one will be selected
					document.getElementById(selected).style.border = "none";
					selected = selectedId;
					selectedPiece.style.border = "4px solid #f00";
					board.pieces[x][y].getMoveset();
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
				var tempNext = [];
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
					if (hitIteration > 0){			// On any iteration other than the first, look from another cell than the initial one!
						console.log("Next move is: ",nextMove[p]);
						x = nextMove[p].x;
						y = nextMove[p].y;
						console.log(x,y);
						caller.landingCells[p].push(x+"_"+y);
					}
					colorCell(x,y,"#f90","debug");
					//console.log(x,y,caller,hitIteration,caller.currentPaths,possibleHits);
					for (a = -1; a <= 1; a += 2){				// Look around the current piece
						for (b = -1; b <= 1; b += 2){			// for pieces of the other type
							if (isOOB((x+a),(y+b))){ // Check if next position is not out of bounds
								var antiType = ( ( getType() ) ? "white" : "black");
								if (board.pieces[x+a][y+b].type == "null" && hitIteration == 0){			// If an empty cell is found, color it blue (and addeventlistener etc. etc.)
									if (getType()){
										if (a > 0){
											colorCell(x+a,y+b,null,"moveSimple");	// If type is black, moveSimple can only move DOWN
										}
									} else {
										if (a < 0){
											colorCell(x+a,y+b,null,"moveSimple");	// If type is white, moveSimple can only move UP
										}
									}
								} else if (board.pieces[x+a][y+b].type == antiType){				// If a piece of the other type is found
									//console.log("Piece of other type is found at: ",(x+a),(y+b));
									//colorCell(x+a,y+b,"#9f9","debug");								// Color it greenish to show where it checked
									if (isOOB((x+(a*2)),(y+(b*2)))){
										function addHitToList(){
											//console.log("Adding ",x+a,y+b," to the current hits");
											possibleHits.push((x+a)+"_"+(y+b));						// Add it to the array before treating it
											if (hitIteration == 0){
												tempNext.push(x+a*2);		
												tempNext.push(y+b*2);
											} else {
												tempNext[2*p] = x+(a*2);
												tempNext[2*p+1] = y+(a*2);
											}
											console.log("(path ",p,") tempNext = ",tempNext);
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
								console.log("tempNext before nextMove (",p,") = ",tempNext);
								nextMove[p] = {									// Another array for the position of the next iteration
									x:tempNext[2*p],
									y:tempNext[2*p+1]
								};
								console.log("nextMove[p] = ",nextMove[p]);
								if (!caller.landingCells[p]){
									caller.landingCells.push([]);
								}
								var fp = caller.currentPaths.length-1;
							}
							
							//tempNext = [];
							possibleHits = [];
							
							for (p = 0; p < caller.currentPaths.length; p++){
								checkAround(p,fp);
							}
						}/* else if (possibleHits.length > 0 && hitIteration > 0){
							console.log("tempNext before nextMove (",p,") = ",tempNext);
							nextMove[p] = {									// Another array for the position of the next iteration
								x:tempNext[0],
								y:tempNext[1]
							};
							console.log("nextMove[p] = ",nextMove[p]);
							if (!caller.landingCells[p]){
								caller.landingCells.push([]);
							}
							var fp = caller.currentPaths.length-1;
							tempNext = [];
							possibleHits = [];
							checkAround(p,fp);
						}*/ else {
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
						}
					}
					
					// Code continues processing here
					if (hitIteration > 0){								// If more hits are found after the first one
						for (i = 0; i < possibleHits.length; i++){		// Treat hits
							if (i > 0){									// If there's more than one hit, a new path is found
								var temp = [];							// New path is found, so create a new array for it, and fill it with all previous hits
								for (u = 0; u < hitIteration; u++){
									temp.push(caller.currentPaths[p][u]);
								}
								caller.currentPaths.push(temp);			// Add the new path to the full array
							} else {									// If only one hit is found, add it to the current path.
								caller.currentPaths[p][hitIteration] = possibleHits[i];
							}
							console.log(caller.currentPaths);
						}
						nextCheckAround(fp);
					} else {											// ONLY ON THE FIRST HIT
						for (i = 0; i < possibleHits.length; i++){		// Treat hits
							caller.currentPaths.push([]);
							caller.currentPaths[i][hitIteration] = possibleHits[i];	// On the first iteration, create a new path for every hit
						}
						console.log(caller.currentPaths);
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
				Object.observe() is still a rather new function to default JavaScript and thus might not work on older browsers.
				No fall-back support is implemented in this script!
			*/
			Object.observe(board.pieces[rows][i],function(changes){
				changes.forEach(function(change) {
					if (change.name == "type"){
						console.log(change);
						var x = change.object.position.x;
						var y = change.object.position.y;
						var element = document.getElementById("piece-"+x+"_"+y);
						if (change.object.type == "null"){ // If the piece type is changed to null, its removed.
							element.parentElement.removeChild(element);
							document.getElementById(element).removeEventListener('click',function(){
								board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece();
							},false); // UNTESTED!!!
						} else if (change.object.type == "white"|| change.object.type == "black"){
							console.log(element);
							document.getElementById(x+"_"+y).innerHTML += '<div data-type="'+change.object.type+'" id="piece-'+x+'_'+y+'" class="'+change.object.type+'Piece checkersPiece">&nbsp;</div>';
							document.getElementById(x+"_"+y).addEventListener('click',function(){
								board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece();
							},false);
							if (y == 0 || y == 9){
								movedPiece.style.backgroundImage = "url('crown.png')";
								element.dataset.type = col+"King";
							} else {
								element.dataset.type = col;
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
	if (obj){
		obj.currentPaths = [];
		obj.landingCells = [];
	}
	hitAmount = 0;
	for (i = 0; i < coloredCells.length; i++){
		document.getElementById(coloredCells[i]).style.backgroundColor = "#630";
		document.getElementById(coloredCells[i]).style.cursor = "auto";
		document.getElementById(coloredCells[i]).removeEventListener("click", movePiece);
	}
}

var coloredCells;
coloredCells = [];
function colorCell(x,y,color,type){
	if (type == "hit"){
		document.getElementById(x+"_"+y).style.backgroundColor = color;
		document.getElementById(x+"_"+y).style.cursor = "pointer";
		document.getElementById(x+"_"+y).addEventListener("click", movePiece, false);
	} else if (type == "moveSimple"){
		document.getElementById(x+"_"+y).style.backgroundColor = "#99f";
		document.getElementById(x+"_"+y).style.cursor = "pointer";
		document.getElementById(x+"_"+y).addEventListener("click", movePiece, false);
		console.log("%c Simple hit found and created at "+x+","+y+" ("+type+")","border-left:rgb(0,0,255) 3px solid;");
	} else if (type == "debug"){
		document.getElementById(x+"_"+y).style.backgroundColor = color;
	}
	coloredCells.push(x+"_"+y);
}

// This function is called when the player clicks an empty spot to move its checkers piece to.
function movePiece(){
	var w = "white";
	var b = "black";
	var path = this.dataset.path;
	if (board.currentPlayer == w){
		board.currentPlayer = b;
		move(w,this);
	} else if (board.currentPlayer == b){
		board.currentPlayer = w;
		move(b,this);
	}
	// In case a path was found in the data of the moved piece, remove all hit pieces.
	if (path){
		var pos = this.id.split("_");
		console.log(board.pieces[pos[0]][pos[1]]);
		console.log(path);
		for (i = 0; i < board.pieces[pos[0]][pos[1]].currentPaths[path].length; i++){
			board.pieces[pos[0]][pos[1]].type = "null";
		}
	}
	document.getElementById("player").innerHTML = board.currentPlayer;
}

function move(col,e){
		var s,m;
		s = selected.split("_");
		m = e.id.split("_");
		s[0] = s[0].substring(6);
		console.log("%c Moving piece ("+s[0]+","+s[1]+") to ("+m[0]+","+m[1]+") ","border-left:rgb(255,128,0) 3px solid; background-color:rgba(255,128,0,.5);");
		board.pieces[s[0]][s[1]].type = "null"; // These call the Object.observe() we made earlier!
		board.pieces[m[0]][m[1]].type = col;
		//document.getElementById(selected).parentElement.removeChild(document.getElementById(selected));
		//document.getElementById(e.id).innerHTML += '<div data-type="'+col+'" id="piece-'+m[0]+'_'+m[1]+'" class="'+col+'Piece checkersPiece">&nbsp;</div>';
		
		/*var movedPiece = document.getElementById('piece-'+m[0]+'_'+m[1]);
		if (m[0] == 0 || m[0] == 9){
			movedPiece.style.backgroundImage = "url('crown.png')";
			movedPiece.dataset.type = col+"King";
		} else {
			movedPiece.dataset.type = col;
		}*/
		// Clean up
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
		if (exLoaded("editmode.js")){
			(!board.editMode.active ? document.getElementById("turns").innerHTML = board.turns : null);
		}
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