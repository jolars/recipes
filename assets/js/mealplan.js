const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

let recipes = [];
let mealPlan = {};

// Load recipes from JSON
async function loadRecipes() {
  try {
    const response = await fetch('/assets/data/recipes.json');
    recipes = await response.json();
    initializeMealPlan();
  } catch (error) {
    console.error('Failed to load recipes:', error);
  }
}

function initializeMealPlan() {
  const planFromUrl = getPlanFromUrl();
  if (planFromUrl && Object.keys(planFromUrl).length > 0) {
    mealPlan = planFromUrl;
  } else {
    // Load from localStorage if no URL plan
    const saved = loadPlanFromLocalStorage();
    if (saved) {
      mealPlan = saved;
    }
  }
  
  renderDays();
}

function renderDays() {
  const container = document.getElementById('meal-plan');
  container.innerHTML = '';
  
  DAYS.forEach((dayName, index) => {
    const dayKey = DAY_KEYS[index];
    const dayCard = createDayCard(dayName, dayKey);
    container.appendChild(dayCard);
  });
}

function createDayCard(dayName, dayKey) {
  const card = document.createElement('div');
  card.className = 'card mb-3';
  card.setAttribute('data-day', dayKey);
  
  // Make card a drop target
  card.addEventListener('dragover', handleDragOver);
  card.addEventListener('drop', (e) => handleDrop(e, dayKey));
  card.addEventListener('dragleave', handleDragLeave);
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  const title = document.createElement('h5');
  title.className = 'card-title';
  title.textContent = dayName;
  
  const selectedRecipe = mealPlan[dayKey];
  
  if (selectedRecipe) {
    const recipe = recipes.find(r => r.slug === selectedRecipe.recipe);
    if (recipe) {
      cardBody.appendChild(title);
      cardBody.appendChild(createRecipeDisplay(recipe, selectedRecipe.servings, dayKey));
    }
  } else {
    cardBody.appendChild(title);
    cardBody.appendChild(createRecipeSelector(dayKey));
  }
  
  card.appendChild(cardBody);
  return card;
}

function createRecipeSelector(dayKey) {
  const container = document.createElement('div');
  
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.placeholder = 'Sök recept...';
  input.id = `search-${dayKey}`;
  input.setAttribute('list', `recipes-${dayKey}`);
  input.addEventListener('change', (e) => selectRecipe(dayKey, e.target.value));
  
  const datalist = document.createElement('datalist');
  datalist.id = `recipes-${dayKey}`;
  
  recipes.forEach(recipe => {
    const option = document.createElement('option');
    option.value = recipe.title;
    option.setAttribute('data-slug', recipe.slug);
    datalist.appendChild(option);
  });
  
  inputGroup.appendChild(input);
  container.appendChild(inputGroup);
  container.appendChild(datalist);
  
  return container;
}

function createRecipeDisplay(recipe, servings, dayKey) {
  const container = document.createElement('div');
  container.setAttribute('draggable', 'true');
  container.setAttribute('data-recipe-slug', recipe.slug);
  container.style.cursor = 'move';
  
  // Drag event listeners
  container.addEventListener('dragstart', (e) => handleDragStart(e, dayKey));
  container.addEventListener('dragend', handleDragEnd);
  
  const recipeInfo = document.createElement('div');
  recipeInfo.className = 'd-flex justify-content-between align-items-center mb-2';
  
  const recipeLink = document.createElement('a');
  recipeLink.href = recipe.url;
  recipeLink.textContent = recipe.title;
  recipeLink.className = 'text-decoration-none fw-bold';
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-sm btn-outline-danger';
  removeBtn.innerHTML = '<i class="bi bi-x"></i>';
  removeBtn.onclick = () => removeRecipe(dayKey);
  
  recipeInfo.appendChild(recipeLink);
  recipeInfo.appendChild(removeBtn);
  
  const servingsControl = document.createElement('div');
  servingsControl.className = 'input-group input-group-sm mt-2';
  
  const decreaseBtn = document.createElement('button');
  decreaseBtn.className = 'btn btn-outline-secondary';
  decreaseBtn.textContent = '-';
  decreaseBtn.onclick = () => adjustServings(dayKey, -1);
  
  const servingsDisplay = document.createElement('input');
  servingsDisplay.type = 'text';
  servingsDisplay.className = 'form-control text-center';
  servingsDisplay.value = servings;
  servingsDisplay.readOnly = true;
  servingsDisplay.style.maxWidth = '100px';
  
  const increaseBtn = document.createElement('button');
  increaseBtn.className = 'btn btn-outline-secondary';
  increaseBtn.textContent = '+';
  increaseBtn.onclick = () => adjustServings(dayKey, 1);
  
  servingsControl.appendChild(decreaseBtn);
  servingsControl.appendChild(servingsDisplay);
  servingsControl.appendChild(increaseBtn);
  
  container.appendChild(recipeInfo);
  container.appendChild(servingsControl);
  
  return container;
}

function selectRecipe(dayKey, recipeTitle) {
  const recipe = recipes.find(r => r.title === recipeTitle);
  if (!recipe) return;
  
  const servingsNum = extractServingsSize(recipe.servings);
  
  mealPlan[dayKey] = {
    recipe: recipe.slug,
    servings: servingsNum || 4
  };
  
  savePlanToLocalStorage();
  renderDays();
}

function removeRecipe(dayKey) {
  delete mealPlan[dayKey];
  savePlanToLocalStorage();
  renderDays();
}

function adjustServings(dayKey, delta) {
  if (!mealPlan[dayKey]) return;
  
  const newServings = mealPlan[dayKey].servings + delta;
  if (newServings < 1) return;
  
  mealPlan[dayKey].servings = newServings;
  savePlanToLocalStorage();
  renderDays();
}

function generateLink() {
  const planJson = JSON.stringify(mealPlan);
  const planEncoded = btoa(encodeURIComponent(planJson));
  const url = `${window.location.origin}${window.location.pathname}?plan=${planEncoded}`;
  
  document.getElementById('share-link').value = url;
  document.getElementById('link-section').classList.remove('d-none');
  
  window.history.pushState({}, '', `?plan=${planEncoded}`);
}

function copyLink() {
  const linkInput = document.getElementById('share-link');
  linkInput.select();
  navigator.clipboard.writeText(linkInput.value);
  
  const btn = event.target.closest('button');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check"></i> Kopierad!';
  setTimeout(() => {
    btn.innerHTML = originalHTML;
  }, 2000);
}

function toggleShoppingList() {
  const section = document.getElementById('shopping-list-section');
  
  if (section.classList.contains('d-none')) {
    generateShoppingList();
    section.classList.remove('d-none');
  } else {
    section.classList.add('d-none');
  }
}

function generateShoppingList() {
  const content = document.getElementById('shopping-list-content');
  content.innerHTML = '';
  
  if (Object.keys(mealPlan).length === 0) {
    content.innerHTML = '<p class="text-muted">Ingen recept valda än.</p>';
    return;
  }
  
  Object.entries(mealPlan).forEach(([dayKey, {recipe: recipeSlug, servings}]) => {
    const recipe = recipes.find(r => r.slug === recipeSlug);
    if (!recipe) return;
    
    const originalServings = extractServingsSize(recipe.servings);
    const multiplier = originalServings ? servings / originalServings : 1;
    
    const recipeSection = document.createElement('div');
    recipeSection.className = 'mb-3';
    
    const recipeTitle = document.createElement('h6');
    recipeTitle.className = 'fw-bold';
    recipeTitle.textContent = `${recipe.title} (${servings} portioner)`;
    recipeSection.appendChild(recipeTitle);
    
    const ingredientList = document.createElement('ul');
    ingredientList.className = 'mb-2';
    
    Object.values(recipe.ingredients).forEach(section => {
      section.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = updateIngredientAmount(ingredient, multiplier);
        ingredientList.appendChild(li);
      });
    });
    
    recipeSection.appendChild(ingredientList);
    content.appendChild(recipeSection);
  });
}

function getPlanFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');
  
  if (planParam) {
    try {
      const planJson = decodeURIComponent(atob(planParam));
      return JSON.parse(planJson);
    } catch (error) {
      console.error('Failed to decode plan from URL:', error);
    }
  }
  
  return null;
}

function savePlanToLocalStorage() {
  localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
}

function loadPlanFromLocalStorage() {
  const saved = localStorage.getItem('mealPlan');
  return saved ? JSON.parse(saved) : {};
}

function extractServingsSize(str) {
  const match = str.match(/\d+/);
  return match ? parseFloat(match[0]) : null;
}

function updateIngredientAmount(ingredient, multiplier) {
  const amounts = ingredient.match(/(\d+(\.\d+)?)/g);
  if (!amounts) {
    return ingredient;
  }
  
  let updatedIngredient = ingredient;
  for (const amount of amounts) {
    const updatedAmount = parseFloat(amount) * multiplier;
    updatedIngredient = updatedIngredient.replace(
      amount,
      Math.round(updatedAmount * 100) / 100
    );
  }
  
  return updatedIngredient;
}

// Drag and drop handlers
let draggedFromDay = null;
let draggedElement = null;

function handleDragStart(e, dayKey) {
  draggedFromDay = dayKey;
  draggedElement = e.currentTarget;
  draggedElement.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.style.opacity = '1';
    draggedElement = null;
  }
  
  // Remove all drag-over styling
  document.querySelectorAll('.card').forEach(card => {
    card.classList.remove('border-primary');
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('border-primary');
  
  return false;
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('border-primary');
}

function handleDrop(e, targetDayKey) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  e.preventDefault();
  e.currentTarget.classList.remove('border-primary');
  
  if (draggedFromDay === targetDayKey) {
    return false;
  }
  
  // Swap recipes between days
  const sourceRecipe = mealPlan[draggedFromDay];
  const targetRecipe = mealPlan[targetDayKey];
  
  if (sourceRecipe) {
    mealPlan[targetDayKey] = sourceRecipe;
    
    if (targetRecipe) {
      // Swap
      mealPlan[draggedFromDay] = targetRecipe;
    } else {
      // Just move
      delete mealPlan[draggedFromDay];
    }
    
    savePlanToLocalStorage();
    renderDays();
  }
  
  return false;
}

function addAllToBring() {
  if (Object.keys(mealPlan).length === 0) {
    alert('Lägg till recept först!');
    return;
  }
  
  // For each recipe in the meal plan, open Bring deeplink
  // Note: This will open multiple tabs/windows, one per recipe
  Object.entries(mealPlan).forEach(([dayKey, {recipe: recipeSlug, servings}]) => {
    const recipe = recipes.find(r => r.slug === recipeSlug);
    if (!recipe) return;
    
    const recipeUrl = `${window.location.origin}${recipe.url}`;
    const baseQuantity = extractServingsSize(recipe.servings);
    const bringUrl = `https://api.getbring.com/rest/bringrecipes/deeplink?url=${encodeURIComponent(recipeUrl)}&source=web&baseQuantity=${baseQuantity}`;
    
    window.open(bringUrl, '_blank');
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadRecipes);
