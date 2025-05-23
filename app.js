const typeSelect = document.getElementById('typeSelect');
const abilitySelect = document.getElementById('abilitySelect');
const idInput = document.getElementById('idInput');
const resultsDiv = document.getElementById('results');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('errorMsg');
const toFavoritesBtn = document.getElementById('toFavorites');

let currentOffset = 0;
const limit = 52;
let isLoading = false;
let moreToLoad = true;
let infiniteScrollActive = false;
let currentSearch = { type: "", ability: "", id: "" };
let allCandidates = null; // array of URLs for filtered results

// אתחול סוגים ויכולות עם "All"
async function initFilters() {
  if (!typeSelect.querySelector('option')) typeSelect.innerHTML = `<option value="">All</option>`;
  if (!abilitySelect.querySelector('option')) abilitySelect.innerHTML = `<option value="">All</option>`;
  const typeData = await fetch('https://pokeapi.co/api/v2/type').then(r => r.json());
  typeData.results.forEach(t => {
    typeSelect.innerHTML += `<option value="${t.name}">${t.name}</option>`;
  });
  const abilityData = await fetch('https://pokeapi.co/api/v2/ability?limit=327').then(r => r.json());
  abilityData.results.forEach(a => {
    abilitySelect.innerHTML += `<option value="${a.name}">${a.name}</option>`;
  });
}

// איפוס משתנים עבור חיפוש חדש
function resetPagination() {
  currentOffset = 0;
  moreToLoad = true;
  isLoading = false;
  allCandidates = null;
}

// Infinite scroll handlers
function infiniteScrollHandler() {
  if (!moreToLoad || isLoading) return;
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 80)) {
    loadAndShowMore();
  }
}
function enableInfiniteScroll() {
  if (infiniteScrollActive) return;
  infiniteScrollActive = true;
  window.addEventListener('scroll', infiniteScrollHandler);
}
function disableInfiniteScroll() {
  if (!infiniteScrollActive) return;
  infiniteScrollActive = false;
  window.removeEventListener('scroll', infiniteScrollHandler);
}

// --- טעינת פוקימונים לפי המצב (עם אינפיניטי סקרול)
async function loadAndShowMore(isNewSearch = false) {
  if (isLoading || !moreToLoad) return;
  isLoading = true;
  loader.classList.remove('hidden');
  try {
    let type = (typeSelect.value && typeSelect.value !== "All") ? typeSelect.value : "";
    let ability = (abilitySelect.value && abilitySelect.value !== "All") ? abilitySelect.value : "";
    let id = idInput.value;

    let newSearch = (
      currentSearch.type !== type ||
      currentSearch.ability !== ability ||
      currentSearch.id !== id ||
      isNewSearch
    );
    if (newSearch) {
      resetPagination();
      resultsDiv.innerHTML = '';
      currentSearch = { type, ability, id };
      // עדכון URL
      const paramsArr = [];
      if (type) paramsArr.push(`type=${type}`);
      if (ability) paramsArr.push(`ability=${ability}`);
      if (id) paramsArr.push(`id=${id}`);
      //   שמירה גם במצב All-All (או ריק)
      let paramsStr = '';
      if (paramsArr.length) {
        paramsStr = '?' + paramsArr.join('&');
      } else {
        paramsStr = '?all=1';
      }
      history.replaceState(null, '', paramsStr);
      moreToLoad = true;
    }

    let resultsToShow = [];

    if (id) {
      // שלוף פוקימון לפי ID
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) throw new Error("pokemon not found");
      const poke = await res.json();

      // בדוק האם הוא תואם גם לסוג וגם ליכולת, אם יש
      let typeMatch = !type || poke.types.some(t => t.type.name === type);
      let abilityMatch = !ability || poke.abilities.some(a => a.ability.name === ability);

      if (typeMatch && abilityMatch) {
        resultsToShow = [poke];
      } else {
        resultsToShow = [];
      }
      moreToLoad = false; 
    } else if (type || ability) {
      // סינון: שלוף URLs של כל הפוקימונים המתאימים לקריטריונים
      if (allCandidates === null) {
        let sets = [];
        if (type) {
          const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
          if (!res.ok) throw new Error("type not found");
          const data = await res.json();
          sets.push(data.pokemon.map(p => p.pokemon.url));
        }
        if (ability) {
          const res = await fetch(`https://pokeapi.co/api/v2/ability/${ability}`);
          if (!res.ok) throw new Error("ability not found");
          const data = await res.json();
          sets.push(data.pokemon.map(p => p.pokemon.url));
        }
        let filtered = sets.length > 1 ? sets.reduce((a, b) => a.filter(url => b.includes(url))) : sets[0];
        allCandidates = filtered;
      }
      // פאגינציה מתוך המועמדים
      let slice = allCandidates.slice(currentOffset, currentOffset + limit);
      resultsToShow = await Promise.all(slice.map(url => fetch(url).then(r => r.json())));
      currentOffset += limit;
      if (currentOffset >= allCandidates.length) moreToLoad = false;
    } else {
      // All - שליפה לפי offset/limit
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${currentOffset}`);
      if (!res.ok) throw new Error("error fetch");
      const data = await res.json();
      let pokemons = await Promise.all(data.results.map(p => fetch(p.url).then(r => r.json())));
      resultsToShow = pokemons;
      currentOffset += limit;
      if (!data.next) moreToLoad = false;
    }

    showResults(resultsToShow, !newSearch && currentOffset > limit);

  } catch (err) {
    errorMsg.textContent = err.message;
    moreToLoad = false;
  } finally {
    loader.classList.add('hidden');
    isLoading = false;
  }
}

// טעינה ראשונית - כולל אינפיניטי סקרול
window.addEventListener('DOMContentLoaded', async () => {
  await initFilters();
  let params = location.search ? new URLSearchParams(location.search) : null;
  typeSelect.value = params?.get('type') || "";
  abilitySelect.value = params?.get('ability') || "";
  idInput.value = params?.get('id') || "";
  resetPagination();
  currentSearch = { type: typeSelect.value, ability: abilitySelect.value, id: idInput.value };
  allCandidates = null;
  await loadAndShowMore(true);
  enableInfiniteScroll();
});

// כל חיפוש חדש
document.getElementById('searchForm').onsubmit = async (e) => {
  e.preventDefault();
  resetPagination();
  currentSearch = { type: (typeSelect.value && typeSelect.value !== "All") ? typeSelect.value : "",
                    ability: (abilitySelect.value && abilitySelect.value !== "All") ? abilitySelect.value : "",
                    id: idInput.value };
  allCandidates = null;
  resultsDiv.innerHTML = '';
  errorMsg.textContent = '';
  await loadAndShowMore(true);
  enableInfiniteScroll();
};

function showResults(arr, append = false) {
  if (!arr.length) {
    if (!append) resultsDiv.innerHTML = '<div>pokemon not found</div>';
    return;
  }
  const html = arr.map(p => `
    <div class="poke-card">
      <img src="${p.sprites.front_default}" alt="${p.name}">
      <div>Name: ${p.name}</div>
      <div>ID: ${p.id}</div>
      <div>Type: ${p.types.map(t=>t.type.name).join(', ')}</div>
      <div>Ability: ${p.abilities.map(a=>a.ability.name).join(', ')}</div>
      <button onclick="window.handleAddFavorite(${p.id})">Add To Favorites</button>
    </div>
  `).join('');
  if (append)
    resultsDiv.innerHTML += html;
  else
    resultsDiv.innerHTML = html;
  if (!window._lastResults || !append) window._lastResults = [];
  window._lastResults = append ? window._lastResults.concat(arr) : arr;
}

// הוספה למועדפים
window.handleAddFavorite = function(id) {
  if (!window._lastResults) return;
  const poke = window._lastResults.find(p => p.id === id);
  if (!poke) return;
  window.addFavorite({
    id: poke.id,
    name: poke.name,
    img: poke.sprites.front_default,
    types: poke.types.map(t=>t.type.name),
    abilities: poke.abilities.map(a=>a.ability.name)
  });
  alert('Pokemon added to favorites!');
}

// מעבר למועדפים
toFavoritesBtn.onclick = () => {
  const params = location.search || '';
  location.href = 'favorites.html' + params;
};
