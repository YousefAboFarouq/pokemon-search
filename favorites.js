// favorites.js

const favDiv = document.getElementById('favoritesList');

function showFavorites(sortBy = null) {
  let favs = window.getFavorites();
  if (sortBy === 'name') favs.sort((a,b)=>a.name.localeCompare(b.name));
  if (sortBy === 'id') favs.sort((a,b)=>a.id-b.id);

  if (!favs.length) {
    favDiv.innerHTML = '<div>No favorite Pokémons</div>';
    return;
  }
  favDiv.innerHTML = favs.map(fav => `
    <div class="poke-card">
      <img src="${fav.img}" alt="${fav.name}">
      <div>Name: ${fav.name}</div>
      <div>ID: ${fav.id}</div>
      <div>Type: ${fav.types.join(', ')}</div>
      <div>Ability: ${fav.abilities.join(', ')}</div>
      <button onclick="window.removeFavoriteAndRefresh(${fav.id})">Remove</button>
    </div>
  `).join('');
}

window.removeFavoriteAndRefresh = function(id) {
  window.removeFavorite(id);
  showFavorites(window._currentSort);
};

document.getElementById('sortByName').onclick = () => {
  window._currentSort = 'name';
  showFavorites('name');
};
document.getElementById('sortById').onclick = () => {
  window._currentSort = 'id';
  showFavorites('id');
};
document.getElementById('backToSearch').onclick = () => {
  // משמר את ה-query string מהכתובת של דף המועדפים
  const params = location.search || '';
  window.location = 'index.html' + params;
};
document.getElementById('downloadBtn').onclick = () => {
  const favs = window.getFavorites();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(favs, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', 'favorites.json');
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
};

showFavorites();
