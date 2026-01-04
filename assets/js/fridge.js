let recipes = [];
let selectedIngredients = [];
let currentResults = [];
let currentSort = 'best';

// Load recipes from JSON
async function loadRecipes() {
  try {
    const response = await fetch('/assets/data/recipes.json');
    recipes = await response.json();
  } catch (error) {
    console.error('Failed to load recipes:', error);
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  loadRecipes();
  setupIngredientInput();
});

function setupIngredientInput() {
  const input = document.getElementById('ingredient-input');
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      addIngredient(input.value.trim());
      input.value = '';
    }
  });
}

function addIngredient(ingredient) {
  const normalized = ingredient.toLowerCase();
  
  // Don't add duplicates
  if (selectedIngredients.includes(normalized)) {
    return;
  }
  
  selectedIngredients.push(normalized);
  renderChips();
  searchRecipes();
}

function removeIngredient(ingredient) {
  selectedIngredients = selectedIngredients.filter(i => i !== ingredient);
  renderChips();
  
  if (selectedIngredients.length === 0) {
    showEmptyState();
  } else {
    searchRecipes();
  }
}

function renderChips() {
  const container = document.getElementById('ingredient-chips');
  container.innerHTML = '';
  
  if (selectedIngredients.length === 0) {
    return;
  }
  
  const chipsWrapper = document.createElement('div');
  chipsWrapper.className = 'd-flex flex-wrap gap-2 mb-2';
  
  selectedIngredients.forEach(ingredient => {
    const chip = document.createElement('span');
    chip.className = 'badge bg-primary d-flex align-items-center gap-1';
    chip.style.fontSize = '0.9rem';
    chip.style.padding = '0.5rem 0.75rem';
    
    const text = document.createElement('span');
    text.textContent = ingredient;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-close btn-close-white';
    removeBtn.style.fontSize = '0.6rem';
    removeBtn.onclick = () => removeIngredient(ingredient);
    
    chip.appendChild(text);
    chip.appendChild(removeBtn);
    chipsWrapper.appendChild(chip);
  });
  
  container.appendChild(chipsWrapper);
}

function searchRecipes() {
  if (selectedIngredients.length === 0) {
    showEmptyState();
    return;
  }
  
  // Calculate matches for each recipe
  const results = recipes.map(recipe => {
    const allIngredients = Object.values(recipe.ingredients)
      .flat()
      .map(i => i.toLowerCase());
    
    // Count how many of the USER'S ingredients appear in this recipe
    let matchCount = 0;
    const matchedIngredients = [];
    
    selectedIngredients.forEach(userIngredient => {
      const found = allIngredients.some(recipeIngredient => 
        recipeIngredient.includes(userIngredient) || userIngredient.includes(recipeIngredient)
      );
      if (found) {
        matchCount++;
        matchedIngredients.push(userIngredient);
      }
    });
    
    // Focus on how many of YOUR ingredients are used
    const userIngredientsCount = selectedIngredients.length;
    const matchPercentage = (matchCount / userIngredientsCount) * 100;
    
    // Also track total recipe ingredients for secondary sorting
    const totalIngredients = allIngredients.length;
    const additionalNeeded = totalIngredients - matchCount;
    
    return {
      recipe,
      matchCount,
      userIngredientsCount,
      matchPercentage,
      totalIngredients,
      additionalNeeded,
      matchedIngredients
    };
  }).filter(result => result.matchCount > 0); // Only show recipes with at least one match
  
  currentResults = results;
  sortAndDisplayResults();
}

function sortResults(sortType) {
  currentSort = sortType;
  sortAndDisplayResults();
}

function sortAndDisplayResults() {
  const results = [...currentResults];
  
  // Sort results
  if (currentSort === 'best') {
    // Sort by percentage of YOUR ingredients used, then by absolute count
    results.sort((a, b) => b.matchPercentage - a.matchPercentage || b.matchCount - a.matchCount);
  } else {
    // Sort by fewest additional ingredients needed, then by match percentage
    results.sort((a, b) => a.additionalNeeded - b.additionalNeeded || b.matchPercentage - a.matchPercentage);
  }
  
  displayResults(results);
}

function displayResults(results) {
  const emptyState = document.getElementById('empty-state');
  const resultsInfo = document.getElementById('results-info');
  const sortDropdown = document.getElementById('sort-dropdown');
  const container = document.getElementById('results-container');
  const countSpan = document.getElementById('results-count');
  
  emptyState.classList.add('d-none');
  resultsInfo.classList.remove('d-none');
  sortDropdown.style.display = '';
  
  countSpan.textContent = results.length;
  container.innerHTML = '';
  
  if (results.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4">Inga recept hittades med dessa ingredienser</div>';
    return;
  }
  
  results.forEach(result => {
    const card = createResultCard(result);
    container.appendChild(card);
  });
}

function createResultCard(result) {
  const { recipe, matchCount, userIngredientsCount, matchPercentage, additionalNeeded } = result;
  
  const col = document.createElement('div');
  col.className = 'col';
  
  const card = document.createElement('div');
  card.className = 'card h-100';
  
  // Image with link
  if (recipe.img) {
    const link = document.createElement('a');
    link.href = recipe.url;
    link.className = 'stretched-link';
    
    const img = document.createElement('img');
    img.src = `/${recipe.img}`;
    img.alt = recipe.title;
    img.className = 'card-img-top';
    img.style.height = '180px';
    img.style.objectFit = 'cover';
    
    link.appendChild(img);
    card.appendChild(link);
  }
  
  // Card body
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  // Title
  const title = document.createElement('h6');
  title.className = 'card-title fw-bold';
  title.textContent = recipe.title;
  cardBody.appendChild(title);
  
  // Excerpt
  if (recipe.excerpt) {
    const excerpt = document.createElement('p');
    excerpt.className = 'card-text';
    excerpt.textContent = recipe.excerpt;
    cardBody.appendChild(excerpt);
  }
  
  // Match info - show how many of YOUR ingredients are used
  const matchInfo = document.createElement('div');
  matchInfo.className = 'text-body-secondary';
  
  const matchIcon = document.createElement('i');
  if (matchPercentage >= 70) {
    matchIcon.className = 'bi bi-check-circle-fill text-success';
  } else if (matchPercentage >= 40) {
    matchIcon.className = 'bi bi-check-circle text-warning';
  } else {
    matchIcon.className = 'bi bi-check-circle text-secondary';
  }
  
  const matchText = document.createElement('small');
  matchText.innerHTML = ` Använder ${matchCount}/${userIngredientsCount} ingredienser`;
  
  // Add info about additional ingredients needed
  if (additionalNeeded > 0) {
    matchText.innerHTML += ` <span class="text-muted">(+${additionalNeeded} till)</span>`;
  }
  
  matchInfo.appendChild(matchIcon);
  matchInfo.appendChild(matchText);
  cardBody.appendChild(matchInfo);
  
  card.appendChild(cardBody);
  col.appendChild(card);
  
  return col;
}

function showEmptyState() {
  const emptyState = document.getElementById('empty-state');
  const resultsInfo = document.getElementById('results-info');
  const sortDropdown = document.getElementById('sort-dropdown');
  const container = document.getElementById('results-container');
  
  resultsInfo.classList.add('d-none');
  emptyState.classList.remove('d-none');
  sortDropdown.style.display = 'none';
  container.innerHTML = '';
}
