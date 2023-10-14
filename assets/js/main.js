window.addEventListener('load', (event) => {
  console.log("Page loaded.");
});

function doMath() {
  var servings = parseFloat(document.getElementById('servings').innerHTML);
  var amounts = document.getElementsByClassName('amount');
  var mod = (servings + 1) / servings

  for (var i = 0; i <= amounts.length; ++i) {
    var val = parseFloat(amounts[i].innerHTML) * mod;
    amounts[i].innerHTML = val.toFixed(2);
  }
  document.getElementById('servings').innerHTML = "3";
}
