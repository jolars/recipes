// let round = (n, p = 2) => (e => Math.round(n * e) / e)(Math.pow(10, p))
function round(value, places) {
  var multiplier = Math.pow(10, places);

  return (Math.round(value * multiplier) / multiplier);
}

window.addEventListener('load', (event) => {
  console.log("Page loaded.");
});


function modifyServings(direction) {
  var original_servings = parseInt(document.getElementById('servings').getAttribute('data-servings'));
  var servings = parseInt(document.getElementById('servings').innerHTML);
  var amounts = document.getElementsByClassName('amount');

  if (servings > 1 || direction == "up") {
    var new_servings = direction == 'down' ? servings - 1 : servings + 1;

    var mod = parseFloat(new_servings) / parseFloat(original_servings);
    document.getElementById('servings').innerHTML = new_servings;

    for (var i = 0; i <= amounts.length; ++i) {
      var original_amount = parseFloat(amounts[i].getAttribute('data-amount'));
      if (isFinite(original_amount)) {
        amounts[i].innerHTML = round(original_amount * mod, 2);
      }
    };
  }
}
