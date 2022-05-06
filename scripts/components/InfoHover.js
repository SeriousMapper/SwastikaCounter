let infoHover = document.getElementById('mouse-info-box')

window.addEventListener('mousemove', function(event){
    x = event.clientX;
    y = event.clientY;                    
    if ( typeof x !== 'undefined' ){
        infoHover.style.left = x + "px";
        infoHover.style.top = y + "px";
    }
}, false);

function displayText(head, body) {
    infoHover.style.opacity = 1
    infoHover.innerHTML = `<h3>${head}</h3> ${body}`
}
function hideBox() {
    infoHover.style.opacity = 0
}
hideBox()