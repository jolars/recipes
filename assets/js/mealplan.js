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
  
  // Recipe card with image
  const recipeCard = document.createElement('div');
  recipeCard.className = 'd-flex gap-3 mb-2';
  
  // Recipe image
  if (recipe.img) {
    const imgContainer = document.createElement('div');
    imgContainer.style.minWidth = '80px';
    imgContainer.style.width = '80px';
    imgContainer.style.height = '80px';
    
    const img = document.createElement('img');
    img.src = `/${recipe.img}`;
    img.alt = recipe.title;
    img.className = 'rounded';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    imgContainer.appendChild(img);
    recipeCard.appendChild(imgContainer);
  }
  
  // Recipe info
  const recipeInfo = document.createElement('div');
  recipeInfo.className = 'flex-grow-1';
  
  const titleRow = document.createElement('div');
  titleRow.className = 'd-flex justify-content-between align-items-start mb-2';
  
  const recipeLink = document.createElement('a');
  recipeLink.href = recipe.url;
  recipeLink.textContent = recipe.title;
  recipeLink.className = 'text-decoration-none fw-bold';
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-sm btn-outline-danger';
  removeBtn.innerHTML = '<i class="bi bi-x"></i>';
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    removeRecipe(dayKey);
  };
  
  titleRow.appendChild(recipeLink);
  titleRow.appendChild(removeBtn);
  recipeInfo.appendChild(titleRow);
  
  // Add excerpt if available
  if (recipe.excerpt) {
    const excerpt = document.createElement('p');
    excerpt.className = 'text-muted small mb-2';
    excerpt.textContent = recipe.excerpt;
    recipeInfo.appendChild(excerpt);
  }
  
  // Servings control
  const servingsControl = document.createElement('div');
  servingsControl.className = 'input-group input-group-sm';
  servingsControl.style.maxWidth = '200px';
  
  const decreaseBtn = document.createElement('button');
  decreaseBtn.className = 'btn btn-outline-secondary';
  decreaseBtn.innerHTML = '<i class="bi bi-dash"></i>';
  decreaseBtn.onclick = (e) => {
    e.stopPropagation();
    adjustServings(dayKey, -1);
  };
  
  const servingsDisplay = document.createElement('input');
  servingsDisplay.type = 'text';
  servingsDisplay.className = 'form-control text-center';
  const servingsType = extractServingsType(recipe.servings);
  servingsDisplay.value = `${servings} ${servingsType}`;
  servingsDisplay.readOnly = true;
  
  const increaseBtn = document.createElement('button');
  increaseBtn.className = 'btn btn-outline-secondary';
  increaseBtn.innerHTML = '<i class="bi bi-plus"></i>';
  increaseBtn.onclick = (e) => {
    e.stopPropagation();
    adjustServings(dayKey, 1);
  };
  
  servingsControl.appendChild(decreaseBtn);
  servingsControl.appendChild(servingsDisplay);
  servingsControl.appendChild(increaseBtn);
  
  recipeInfo.appendChild(servingsControl);
  recipeCard.appendChild(recipeInfo);
  
  container.appendChild(recipeCard);
  
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

function extractServingsType(str) {
  const match = str.match(/\d+\s*(.*)/);
  return match ? match[1].trim() : '';
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

function printMealPlan() {
  if (Object.keys(mealPlan).length === 0) {
    alert('Lägg till recept först!');
    return;
  }
  
  // Create a new window with printable content
  const printWindow = window.open('', '_blank');
  
  let printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Veckomeny</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 900px;
          margin: 20px auto;
          padding: 20px;
        }
        h1 {
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }
        .day {
          page-break-inside: avoid;
          margin-bottom: 40px;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        .day-title {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 15px;
          color: #2c5282;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .recipe-header {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .recipe-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .recipe-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .recipe-title {
          font-size: 1.3em;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .recipe-excerpt {
          font-style: italic;
          color: #666;
          margin-bottom: 10px;
        }
        .servings {
          color: #666;
          font-weight: 500;
        }
        .recipe-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 20px;
        }
        .ingredients, .instructions {
          min-width: 0;
        }
        .ingredients h3, .instructions h3 {
          font-size: 1.1em;
          margin-top: 0;
          margin-bottom: 8px;
          color: #2d3748;
        }
        .ingredients ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        .ingredients li {
          margin-bottom: 4px;
        }
        .instructions ol {
          margin: 0;
          padding-left: 20px;
        }
        .instructions li {
          margin-bottom: 10px;
          line-height: 1.6;
        }
        .instructions p {
          margin: 0;
        }
        .shopping-list {
          page-break-before: always;
          margin-top: 40px;
        }
        .shopping-list h1 {
          margin-bottom: 20px;
        }
        .shopping-item {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        .shopping-item h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #2d3748;
        }
        .shopping-item ul {
          margin: 0;
          padding-left: 20px;
          column-count: 2;
          column-gap: 20px;
        }
        @media print {
          body { margin: 0; padding: 10mm; }
          .day { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
  `;
  
  // Add each day's recipe
  DAYS.forEach((dayName, index) => {
    const dayKey = DAY_KEYS[index];
    const selectedRecipe = mealPlan[dayKey];
    
    if (selectedRecipe) {
      const recipe = recipes.find(r => r.slug === selectedRecipe.recipe);
      if (!recipe) return;
      
      const servingsType = extractServingsType(recipe.servings);
      const originalServings = extractServingsSize(recipe.servings);
      const multiplier = originalServings ? selectedRecipe.servings / originalServings : 1;
      
      printContent += `
        <div class="day">
          <div class="day-title">${dayName}</div>
          
          <div class="recipe-header">
            ${recipe.img ? `<img src="${window.location.origin}/${recipe.img}" alt="${recipe.title}" class="recipe-image">` : '<div></div>'}
            <div class="recipe-info">
              <div class="recipe-title">${recipe.title}</div>
              ${recipe.excerpt ? `<div class="recipe-excerpt">${recipe.excerpt}</div>` : ''}
              <div class="servings">🍽️ ${selectedRecipe.servings} ${servingsType}</div>
            </div>
          </div>
          
          <div class="recipe-content">
            <div class="ingredients">
              <h3>Ingredienser</h3>
      `;
      
      // Add ingredients
      Object.entries(recipe.ingredients).forEach(([section, items]) => {
        if (section !== 'main') {
          printContent += `<h3>${section}:</h3>`;
        }
        printContent += '<ul>';
        items.forEach(ingredient => {
          const adjustedIngredient = updateIngredientAmount(ingredient, multiplier);
          printContent += `<li>${adjustedIngredient}</li>`;
        });
        printContent += '</ul>';
      });
      
      printContent += `
          </div>
          <div class="instructions">
            <h3>Instruktioner</h3>
            <div>${recipe.instructions}</div>
          </div>
        </div>
        </div>
      `;
    }
  });
  
  // Add shopping list
  printContent += `
      <div class="shopping-list">
        <h1>Inköpslista</h1>
  `;
  
  Object.entries(mealPlan).forEach(([dayKey, {recipe: recipeSlug, servings}]) => {
    const recipe = recipes.find(r => r.slug === recipeSlug);
    if (!recipe) return;
    
    const originalServings = extractServingsSize(recipe.servings);
    const multiplier = originalServings ? servings / originalServings : 1;
    
    printContent += `
      <div>
        <h3>${recipe.title} (${servings} ${extractServingsType(recipe.servings)})</h3>
        <ul class="shopping-ingredients">
    `;
    
    Object.values(recipe.ingredients).forEach(section => {
      section.forEach(ingredient => {
        printContent += `<li>${updateIngredientAmount(ingredient, multiplier)}</li>`;
      });
    });
    
    printContent += `
        </ul>
      </div>
    `;
  });
  
  printContent += `
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = function() {
    printWindow.print();
  };
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadRecipes);
