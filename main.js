/* Checkers by Zemanzo - 2014 */

var selected;
var board = {};
board.size = 10;				// Grid size (10 is default by international checkers rules)
board.currentPlayer = "white";	// Starting player (White is default by international checkers rules)
board.turns = 0;
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
	board.container.style.marginLeft = "-"+(board.cellSize*board.size)/2+"px"; // Center it
	
	// Fit header to board
	document.getElementById("header").style.width = (board.cellSize*board.size)+"px";
	document.getElementById("header").style.marginLeft = "-"+(board.cellSize*board.size)/2+"px"; // Center it
	
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
	startSetup(0,4,"black");
	startSetup(4,6,"null");
	startSetup(6,board.size,"white");
	
	// Place pieces on board
	for (x = 0; x < board.size; x++){
		for (y = 0; y < board.size; y++){
			if (board.pieces[x][y].type != "null" && typeof(board.pieces[x][y].type) != "undefined"){
				document.getElementById(x+'_'+y).innerHTML += '<div data-type="'+board.pieces[x][y].type+'" id="piece-'+x+'_'+y+'" class="'+board.pieces[x][y].type+'Piece checkersPiece">&nbsp;</div>';
				document.getElementById(x+'_'+y).addEventListener('click',function(){board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece()},false);
			}						
		}
	}

	// Indicate starting player
	document.getElementById("player").innerHTML = board.currentPlayer;
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
			board.pieces[rows][i].selectPiece = function(){
				//console.log(this);
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
					clearMoveset()
				} else if (type == board.currentPlayer) {														// Other piece is selected, previous will be deselected and new one will be selected
					document.getElementById(selected).style.border = "none";
					selected = selectedId;
					selectedPiece.style.border = "4px solid #f00";
					board.pieces[x][y].getMoveset();
				}
			};
			board.pieces[rows][i].getMoveset = function(){	// Function to get moveset
				console.log("%c Getting new moveset ","border-left:rgb(255,0,0) 3px solid; background-color:rgba(255,0,0,.5);");
				clearMoveset();
				var x = this.position.x;
				var y = this.position.y;
				var type = this.type;
				var caller = this;
				var possibleHits = [];
				var nextMove = [];
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
				
				function checkAround(p){
					colorCell(x,y,"#f90","debug");
					if (hitIteration > 0){
						console.log(nextMove[p])
						x = nextMove[p].x;
						y = nextMove[p].y;
					}
					//console.log(x,y,caller,hitIteration,caller.currentPaths,possibleHits);
					for (a = -1; a <= 1; a += 2){				// Look around the current piece
						for (b = -1; b <= 1; b += 2){			// for pieces of the other type
							if (typeof(board.pieces[x+a][y+b]) != "undefined"){					// Check if next position is not out of bounds
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
									console.log("Piece of other type is found at: ",(x+a),(y+b));
									colorCell(x+a,y+b,"#9f9","debug");							// Color it greenish to show where it checked
									if (typeof(board.pieces[x+a*2][y+b*2]) != "undefined"){			// Check if its not out of bounds (again)
										function addHitToList(){
											possibleHits.push((x+a)+"_"+(y+b));						// Add it to the array before treating it
											nextMove.push({											// Another array for the position of the next iteration
												x:(x+a*2),
												y:(y+b*2)
											});
										}
										//console.log("Check if cell is free to land on: ",board.pieces[x+a*2][y+b*2]);
										console.log("Checking for path: ",p," and for iteration: ",hitIteration);
										if (board.pieces[x+a*2][y+b*2].type == "null"){ // Check if "landing cell" is empty
											if (hitIteration == 0){	// First iteration, don't have to worry for dupes
												addHitToList();
											} else if (board.pieces[x+a*2][y+b*2].type == "null" && caller.currentPaths[p].indexOf((x+a)+"_"+(y+b)) == -1){ 	// Make sure the piece it's hitting is NOT already in the current path.
												addHitToList();
											}
										}
									}
								}
							}
						}
					}
					function nextCheckAround(){
						hitIteration++;
						console.log("%c ITERATION "+hitIteration,"border-left:rgb(90,90,255) 3px solid; background-color:rgba(90,90,255,.5);");
						if (possibleHits.length > 0){
							//console.log("Current paths: ",caller.currentPaths);
							for (p = 0; p < caller.currentPaths.length; p++){
								possibleHits = [];
								console.log("%c PATH "+p,"border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");
								checkAround(p);
							}
						} else {
							console.log("No new hits are found");
						}
					}
					if (hitIteration > 0){								// If more hits are found after the first one
						for (i = 0; i < possibleHits.length; i++){		// Treat hits
							if (i > 0){									// If there's more than one hit, a new path is found
								var temp = [];							// New path is found, so create a new array for it, and fill it with all previous hits
								for (u = 0; u < hitIteration; u++){
									temp.push(currentPaths[p][u]);
								}
								caller.currentPaths.push(temp);			// Add the new path to the full array
							} else {									// If only one hit is found, add it to the current path.
								caller.currentPaths[p][hitIteration] = possibleHits[i];
							}
						}
						nextCheckAround();
					} else {											// Only for the first hit
						for (i = 0; i < possibleHits.length; i++){		// Treat hits
							caller.currentPaths.push([]);
							caller.currentPaths[i][hitIteration] = possibleHits[i];	// On the first iteration, create a new path for every hit
						}
						/*hitIteration++;
						if (possibleHits.length > 0){
							console.log("Next iteration ("+hitIteration+")");
							for (p = 0; p < caller.currentPaths.length; p++){
								possibleHits = [];
								checkAround(p);
							}
						}*/
						nextCheckAround();
					}
				}
				checkAround();
			}
		}
	}
}

function clearMoveset(){
	// Clear previous preview
	hitAmount = 0;
	for (i = 0; i < coloredCells.length; i++){
		document.getElementById(coloredCells[i]).style.backgroundColor = "#630";
		document.getElementById(coloredCells[i]).style.cursor = "auto";
		document.getElementById(coloredCells[i]).removeEventListener("click", movePiece);
	}
}


var hitAmount;
hitAmount = 0;
function checkForHits(x,y,type,xprev,yprev){						// DEPRECATED -- USE board.pieces[x][y].getMoveset() INSTEAD
	if (board.pieces[x][y].type == "null"){
		document.getElementById(xprev+"_"+yprev).style.backgroundColor = "#f90";
		hitAmount += 1;
		var customColor = "#f"+(hitAmount*2)+""+(hitAmount*2);
		colorCell(x,y,customColor,"hit");
		for (beep = -1; beep < 1.1; beep += 2){
			for (boop = -1; boop < 1.1; boop += 2){
				if ((x+beep != xprev) || (y+boop != yprev)){
					//console.log(beep,boop)
					colorCell(x+beep,y+boop,"#9f9","debug"); // Check around for other possible hits [GREEN]
				}
				if ((board.pieces[x+beep][y+boop] == type) && (x+beep != xprev) || (y+boop != yprev) ){
					checkForHits(x+beep*2,y+boop*2,type,x+beep,y+boop);
					//console.log(x,y,beep,boop,x+beep,y+boop);
					//document.getElementById((x+beep)+"_"+(y+boop)).style.backgroundColor = "#9f9"; // Check around for other possible hits [GREEN]
				}
			}
		}
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
	} else if (type == "debug"){
		document.getElementById(x+"_"+y).style.backgroundColor = color;
	}
	coloredCells.push(x+"_"+y);
}

function movePiece(){
	var w = "white";
	var b = "black";
	if (board.currentPlayer == w){
		board.currentPlayer = b;
		move(w,this);
	} else if (board.currentPlayer == b){
		board.currentPlayer = w;
		move(b,this);
	}
	document.getElementById("player").innerHTML = board.currentPlayer;
}

function move(col,e){
		var s,m;
		s = selected.split("_");
		m = e.id.split("_");
		s[0] = s[0].substring(6);
		board.pieces[s[0]][s[1]].type = "null";
		board.pieces[m[0]][m[1]].type = col;
		document.getElementById(selected).parentElement.removeChild(document.getElementById(selected));
		document.getElementById(e.id).innerHTML += '<div data-type="'+col+'" id="piece-'+m[0]+'_'+m[1]+'" class="'+col+'Piece checkersPiece">&nbsp;</div>';
		document.getElementById(e.id).addEventListener('click',function(){board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece()},false);
		var movedPiece = document.getElementById('piece-'+m[0]+'_'+m[1]);
		if (m[0] == 0 || m[0] == 9){
			movedPiece.style.backgroundImage = "url('crown.png')";
			movedPiece.dataset.type = col+"King";
		} else {
			movedPiece.dataset.type = col;
		}
		clearMoveset();
		selected = "null";
		board.turns += 1;
		document.getElementById("turns").innerHTML = board.turns;
}

function isEven(number){
	if (number % 2 == 0){
		return 1;
	} else {
		return 0;
	}
}