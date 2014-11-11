board.editMode = {
	active:false,
	currentType:"none",
	type:"remove",
	clearAll:function(){
		for (x = 0; x < board.size; x++){
			for (y = 0; y < board.size; y++){
				board.pieces[x][y].type = "null";					
			}
		}
	},
	applyType:function(elem){
		if (board.editMode.currentType != "none"){
			var x = elem.id.split("_")[0];
			var y = elem.id.split("_")[1];
			board.pieces[x][y].type = board.editMode.currentType;
		}
	},
	defaultSetup:function(){
		
	}
}
var style = document.createElement("link");
style.rel = "stylesheet";
style.type = "text/css";
style.href = "editmode.css";
document.head.appendChild(style);
document.getElementById("header").innerHTML += '<div style="position: absolute; cursor:pointer; top:0px; font-size:12px;" onclick="enableEdit()">Enable edit mode</div>';

function enableEdit(){
	board.editMode.active = true;
	clearInterval(timerInterval);
	document.getElementById("header").style.fontSize = '16px';
	document.getElementById("header").innerHTML = '<div class="editButton" id="editwhite" onclick="setType(\'white\')">Create white</div><div class="editButton" id="editblack" onclick="setType(\'black\')">Create black</div><div class="editButton" id="editnull" onclick="setType(\'null\')">Remove pieces</div><div class="editButton" onclick="board.editMode.clearAll()">Clear the board</div><div class="editButton" onclick="board.editMode.defaultSetup()">Default setup</div><div class="editButton" onclick="board.editMode.disableEditMode()">Disable editmode</div>';
	for (x = 0; x < board.size; x++){
		for (y = 0; y < board.size; y++){
			document.getElementById(x+"_"+y).addEventListener("click",function(){board.editMode.applyType(this);},false);
			document.getElementById(x+"_"+y).removeEventListener("click",function(){board.pieces[this.id.substring(0,1)][this.id.substring(2)].selectPiece()},false);
		}
	}
}

function setType(type){
	var selection = document.getElementById("edit"+type);
	if (board.editMode.currentType == type){
		board.editMode.currentType = "none";
		selection.style.color = "#000";
		selection.style.border = "#000 solid 3px";
	} else {
		if (board.editMode.currentType != "none"){
			document.getElementById("edit"+board.editMode.currentType).style.color = "#000";
			document.getElementById("edit"+board.editMode.currentType).style.border = "#000 solid 3px";
		}
		board.editMode.currentType = type;
		selection.style.color = "#f00";
		selection.style.border = "#f00 solid 3px";
	}
}

