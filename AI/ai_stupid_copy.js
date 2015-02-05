var AIstupidcopy = {
	player: "white",
	randomPiece: {
		x: undefined,
		y: undefined
	},
	AIMove: function(){
		//console.log(AIstupidcopy.player);
		setTimeout(function(){
			if(board.currentPlayer == AIstupidcopy.player){
				console.log("%c AI ("+AIstupidcopy.player+") tries moving... ","border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");
				AIstupidcopy.AItryMove();
			}
		},500);
	},
	AItryMove: function(){
		var randomPiecePos = board[AIstupidcopy.player].pieces[rifi(0,board[AIstupidcopy.player].pieces.length-1)].split("_");
		AIstupidcopy.randomPiece.x = randomPiecePos[0];
		AIstupidcopy.randomPiece.y = randomPiecePos[1];
		window.addEventListener("pathsDone",AIstupidcopy.AItryMoveCont,false);
		document.getElementById(AIstupidcopy.randomPiece.x+"_"+AIstupidcopy.randomPiece.y).click();
	},
	AItryMoveCont: function(){
		var p = board.pieces[AIstupidcopy.randomPiece.x][AIstupidcopy.randomPiece.y];
		//console.log(p,"blah")
		if(p.landingCells.length != 0){
			var randomArrayValue = rifi(0,p.landingCells.length-1);
			if (board.currentPlayer == AIstupidcopy.player && selected != "null"){
				movePiece.call(document.getElementById(p.landingCells[randomArrayValue][rifi(0,p.landingCells[randomArrayValue].length-1)].split("_")[0]+"_"+p.landingCells[randomArrayValue][rifi(0,p.landingCells[randomArrayValue].length-1)].split("_")[1]));
			}
			console.log("%c AI moving "+AIstupidcopy.randomPiece.x+"_"+AIstupidcopy.randomPiece.y,"border-left:rgb(90,255,90) 3px solid;");
		} else if(p.simpleHits.length != 0) {
			if (board.currentPlayer == AIstupidcopy.player && selected != "null"){
				movePiece.call(document.getElementById(p.simpleHits[rifi(0,p.landingCells.length-1)].split("_")[0]+"_"+p.simpleHits[rifi(0,p.landingCells.length-1)].split("_")[1]));
			}
			console.log("%c AI moving "+AIstupidcopy.randomPiece.x+"_"+AIstupidcopy.randomPiece.y,"border-left:rgb(90,255,90) 3px solid;");
		} else {
			setTimeout(function(){
				AIstupidcopy.AItryMove();
			},100);
		}
	}
}

console.log("%c AI loaded. AI will play as "+AIstupidcopy.player.toUpperCase()+" ","border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");

window.addEventListener("boardStarted",AIstupidcopy.AIMove,false);
window.addEventListener("playerSwitched",AIstupidcopy.AIMove,false);