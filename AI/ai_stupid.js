AIstupid = {
	player: "black"
}

console.log("%c AI loaded. AI will play as "+AIstupid.player.toUpperCase()+" ","border-left:rgb(90,255,90) 3px solid; background-color:rgba(90,255,90,.5);");

window.addEventListener("boardStarted",AIMove,false);
window.addEventListener("playerSwitched",AIMove,false);

function AIMove(){
	setTimeout(function(){
		if(board.currentPlayer == AIstupid.player){
			console.log("AI tries moving...");
			function tryMove(){
				var randomPiece = board[AIstupid.player].pieces[randomIntFromInterval(0,board[AIstupid.player].pieces.length)];
				console.log(document.getElementById(randomPiece));
				document.getElementById(randomPiece).click();
			}
			tryMove();
		}
	},500);
}

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}