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
			console.log("%c AI tries moving... ","border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");
AItryMove();
		}
	},500);
}

function AItryMove(){
	var randomPiecePos = board[AIstupid.player].pieces[rifi(0,board[AIstupid.player].pieces.length-1)].split("_");
	AIstupid.randomPiece.x = randomPiecePos[0];
	AIstupid.randomPiece.y = randomPiecePos[1];
	window.addEventListener("pathsDone",AItryMoveCont,false);
	document.getElementById(AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y).click();
}

function AItryMoveCont(){
	var p = board.pieces[AIstupid.randomPiece.x][AIstupid.randomPiece.y];
	//console.log(p,"blah")
	if(p.landingCells.length != 0){
		var randomArrayValue = rifi(0,p.landingCells.length-1);
		if (board.currentPlayer == AIstupid.player){
			movePiece.call(document.getElementById(p.landingCells[randomArrayValue][rifi(0,p.landingCells[randomArrayValue].length-1)].split("_")[0]+"_"+p.landingCells[randomArrayValue][rifi(0,p.landingCells[randomArrayValue].length-1)].split("_")[1]));
		}
		console.log("%c AI moving "+AIstupid.randomPiece.x+"_"+AIstupid.randomPiece.y,"border-left:rgb(90,255,90) 3px solid;");
	} else if(p.simpleHits.length != 0) {
		if (board.currentPlayer == AIstupid.player){
			movePiece.call(document.getElementById(p.simpleHits[rifi(0,p.landingCells.length-1)].split("_")[0]+"_"+p.simpleHits[rifi(0,p.landingCells.length-1)].split("_")[1]));
		}
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