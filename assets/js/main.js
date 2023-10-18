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

function filterSelection(category) {
  let cards = document.querySelectorAll('.recipe-card')
  for (var i = 0; i < cards.length; i++) {
    var cat = cards[i].getAttribute('data-category');
    if (cat == category || category == 'allt') {
      cards[i].classList.remove("d-none");
    } else {
      cards[i].classList.add("d-none");
    }
  }
}

function search() {
  let cards = document.querySelectorAll('.recipe-card')
  let search_query = document.getElementById("searchbox").value;
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].innerText.toLowerCase().includes(search_query.toLowerCase())) {
      cards[i].classList.remove("d-none");
    } else {
      cards[i].classList.add("d-none");
    }
  }
}

let typingTimer;
let typeInterval = 500;
let searchInput = document.getElementById('searchbox');

searchInput.addEventListener('keyup', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(search, typeInterval);
});
