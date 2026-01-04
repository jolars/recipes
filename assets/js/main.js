function round(value, places) {
  var multiplier = Math.pow(10, places);
  return Math.round(value * multiplier) / multiplier;
}

function convertIsoTimeToSwedish(isoDuration) {
  const match = isoDuration.match(
    /P(?<years>\d+Y)?(?<months>\d+M)?(?<weeks>\d+W)?(?<days>\d+D)?T?(?<hours>\d+H)?(?<minutes>\d+M)?(?<seconds>\d+S)?/,
  ).groups;
  let result = "";
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
    updatedIngredient = updatedIngredient.replace(
      amount,
      round(updatedAmount, 2),
    );
  }

  return updatedIngredient;
}

window.addEventListener("load", (_) => {
  console.log("Page loaded.");
});

function modifyServings(direction) {
  var original_servings = parseInt(
    document.getElementById("servings").getAttribute("data-servings"),
  );
  var servings_raw = document.getElementById("servings").innerHTML;
  var servings_type = extractServingsType(servings_raw);
  var servings_size = extractServingsSize(servings_raw);
  var ingredients = document.getElementsByClassName("ingredient");

  if (servings_size > 1 || direction == "up") {
    var new_servings =
      direction == "down" ? servings_size - 1 : servings_size + 1;

    var mod = parseFloat(new_servings) / parseFloat(original_servings);
    document.getElementById("servings").innerHTML =
      new_servings + " " + servings_type;

    for (var i = 0; i <= ingredients.length; ++i) {
      var original_amount = ingredients[i].getAttribute("data-ingredient");
      ingredients[i].innerHTML = updateIngredientAmount(original_amount, mod);
    }
  }
}

function filterSelection(category) {
  let cards = document.querySelectorAll(".recipe-card");
  for (var i = 0; i < cards.length; i++) {
    var cat = cards[i].getAttribute("data-category");
    if (cat == category || category == "allt") {
      cards[i].classList.remove("d-none");
    } else {
      cards[i].classList.add("d-none");
    }
  }
}

let cards = Array.from(document.querySelectorAll(".recipe-card"));
let cardData = cards.map((card, index) => ({
  text: card.innerText.toLowerCase(),
  ingredients: (card.getAttribute("data-ingredients") || "").toLowerCase(),
  element: card,
  col: card, // The .col element itself
  i: index,
}));

// Set up Fuse.js for fuzzy searching (title/excerpt only)
const fuse = new Fuse(cardData, {
  includeScore: true,
  threshold: 0.4,
  keys: ["text"],
});

function search() {
  let search_query = document.getElementById("searchbox").value.toLowerCase().trim();
  
  if (search_query === "") {
    // Show all cards in original order
    cards.forEach(card => card.classList.remove("d-none"));
    return;
  }
  
  // Collect matches with scores
  let matches = [];
  
  // Use Fuse.js for title/excerpt fuzzy search (lower score = better match)
  let fuseResults = fuse.search(search_query);
  fuseResults.forEach((result) => {
    matches.push({
      index: result.item.i,
      score: result.score, // 0.0 (perfect) to 1.0 (worst)
      type: 'title'
    });
  });
  
  // Simple substring search on ingredients
  cardData.forEach((data) => {
    if (data.ingredients.includes(search_query)) {
      // Check if already matched by title search
      const alreadyMatched = matches.find(m => m.index === data.i);
      if (!alreadyMatched) {
        // Ingredient matches get score of 0.5 (lower priority than good title matches)
        matches.push({
          index: data.i,
          score: 0.5,
          type: 'ingredient'
        });
      }
      // If already matched by title, keep the better (lower) score
    }
  });
  
  // Sort by score (lower is better)
  matches.sort((a, b) => a.score - b.score);
  
  // Create a set of matched indices for quick lookup
  const matchedIndices = new Set(matches.map(m => m.index));
  
  // Hide non-matching cards
  cards.forEach((card, i) => {
    if (!matchedIndices.has(i)) {
      card.classList.add("d-none");
    } else {
      card.classList.remove("d-none");
    }
  });
  
  // Reorder matching cards by score (best matches first)
  const container = cards[0].parentElement; // Get the .row container
  matches.forEach((match) => {
    container.appendChild(cardData[match.index].col);
  });
}

let typingTimer;
let typeInterval = 500;
let searchInput = document.getElementById("searchbox");

if (searchInput) {
  searchInput.addEventListener("keyup", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(search, typeInterval);
  });
}
