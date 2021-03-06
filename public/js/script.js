// Dialog logic
// Get the dialog
var dialog = document.getElementById("add-dialog");
// Get the button that opens the dialog
var addDialogOpen = document.getElementById("add-dialog-open");
// When the user clicks on the button, open the dialog
if(addDialogOpen){
    addDialogOpen.onclick = function() {
        dialog.style.display = "block";
    }
}
// Get the <span> element that closes the dialog
var addDialogClose = document.getElementsByClassName("close")[0];
var addDialogClose2 = document.getElementsByClassName("close2")[0];
// When the user clicks on <span> (x), close the dialog
if(addDialogClose){
    addDialogClose.onclick = function() {
        dialog.style.display = "none";
    }
}
if(addDialogClose2){
    addDialogClose2.onclick = function() {
        dialog.style.display = "none";
    }
}

// When the user clicks anywhere outside of the dialog, close it
// window.onclick = function(event) {
//     if (event.target == dialog) {
//         dialog.style.display = "none";
//     }
// }

// If openDialog  property is passed in response, then the specified dialog is displayed
if(typeof openDialog !== 'undefined' && openDialog){
    let dialogToDisplay = document.getElementById(openDialog);
    dialogToDisplay.style.display = "block";
}