AIstupid = {
	player: "black",
	randomPiece: {
		x: undefined,
		y: undefined
	}
}

console.log("%c AI loaded. AI will play as "+AIstupid.player.toUpperCase()+" ","border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");

window.addEventListener("boardStarted",AIMove,false);
window.addEventListener("playerSwitched",AIMove,false);

function AIMove(){
	setTimeout(function(){
		if(board.currentPlayer == AIstupid.player){
			console.log("AI tries moving...");
			AItryMove();
		}
	},500);
}

function AItryMove(){
	var randomPiecePos = board[AIstupid.player].pieces[rifi(0,board[AIstupid.player].pieces.length)].split("_");
	AIstupid.randomPiece.x = randomPiecePos[0];
	AIstupid.randomPiece.y = randomPiecePos[1];
	window.addEventListener("pathsDone",AItryMoveCont,false);
	document.getElementById(AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y).click();
}

function AItryMoveCont(){
	var p = board.pieces[AIstupid.randomPiece.x][AIstupid.randomPiece.y];
	//console.log(p,"blah")
	if(p.landingCells.length != 0){
		var randomArrayValue = rifi(0,p.landingCells.length);
		movePiece.call(document.getElementById(AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y),p.landingCells[randomArrayValue][rifi(0,p.landingCells[randomArrayValue].length)]);
		console.log("%c AI moving "+AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y,"border-left:rgb(90,255,90) 3px solid;");
	} else if(p.simpleHits.length != 0) {
		movePiece.call(document.getElementById(AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y),p.simpleHits[rifi(0,p.landingCells.length)]);
		console.log("%c AI moving "+AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y,"border-left:rgb(90,255,90) 3px solid;");
	} else {
		setTimeout(function(){
			AItryMove();
		},100);
	}
}

// randomIntFromInterval, rifi sounds cooler and is easier to type.
function rifi(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}