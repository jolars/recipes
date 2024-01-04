function round(value, places) {
  var multiplier = Math.pow(10, places);
  return (Math.round(value * multiplier) / multiplier);
}

function convertIsoTimeToSwedish(isoDuration) {
  const match = isoDuration.match(/P(?<years>\d+Y)?(?<months>\d+M)?(?<weeks>\d+W)?(?<days>\d+D)?T?(?<hours>\d+H)?(?<minutes>\d+M)?(?<seconds>\d+S)?/).groups;
  let result = '';
  if (match.years) {
    const years = parseInt(match.years);
    result += `${years} år `;
  }
  if (match.months) {
    const months = parseInt(match.months);
    result += `${months} månader `;
  }
  if (match.weeks) {
    const weeks = parseInt(match.weeks);
    result += `${weeks} veckor `;
  }
  if (match.days) {
    const days = parseInt(match.days);
    result += `${days} dagar `;
  }
  if (match.hours) {
    const hours = parseInt(match.hours);
    result += `${hours} timmar `;
  }
  if (match.minutes) {
    const minutes = parseInt(match.minutes);
    result += `${minutes} minuter `;
  }
  if (match.seconds) {
    const seconds = parseInt(match.seconds);
    result += `${seconds} sekunder `;
  }
  return result.trim();
}

function extractServingsSize(str) {
  const match = str.match(/\d+/);
  return match ? parseFloat(match[0]) : null;
}

function extractServingsType(str) {
  const match = str.match(/\d+\s*(.*)/);
  return match ? match[1].trim() : null;
}

function updateIngredientAmount(ingredient, multiplier) {
  // Extract the numbers in the string
  const amounts = ingredient.match(/(\d+(\.\d+)?)/g);
  if (!amounts) {
    return ingredient; // If no amount is found, return the original string
  }

  // Multiply each amount by the multiplier and replace in the original string
  let updatedIngredient = ingredient;
  for (const amount of amounts) {
    const updatedAmount = parseFloat(amount) * multiplier;
    updatedIngredient = updatedIngredient.replace(amount, round(updatedAmount, 2));
  }

  return updatedIngredient;
}

window.addEventListener('load', (event) => {
  console.log("Page loaded.");
});


function modifyServings(direction) {
  var original_servings = parseInt(document.getElementById('servings').getAttribute('data-servings'));
  var servings_raw = document.getElementById('servings').innerHTML;
  var servings_type = extractServingsType(servings_raw);
  var servings_size = extractServingsSize(servings_raw);
  var ingredients = document.getElementsByClassName('ingredient');

  if (servings_size > 1 || direction == "up") {
    var new_servings = direction == 'down' ? servings_size - 1 : servings_size + 1;

    var mod = parseFloat(new_servings) / parseFloat(original_servings);
    document.getElementById('servings').innerHTML = new_servings + " " + servings_type;

    for (var i = 0; i <= ingredients.length; ++i) {
      var original_amount = ingredients[i].getAttribute('data-ingredient');
      ingredients[i].innerHTML = updateIngredientAmount(original_amount, mod);
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
